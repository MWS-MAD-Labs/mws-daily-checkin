const winston = require('winston');
const SyncStatus = require('../models/SyncStatus');
const { syncStudentRoster } = require('../jobs/studentRosterSync');
const { syncEmployeeRoster } = require('../jobs/employeeRosterSync');
const { sendSuccess, sendError } = require('../utils/response');

const DOC_ID = 'manual-sync';
const COOLDOWN_MS = 5 * 60 * 1000;

const cooldownRemainingSeconds = (doc) => {
    if (!doc || !doc.lastTriggeredAt) return 0;
    const remainingMs = COOLDOWN_MS - (Date.now() - doc.lastTriggeredAt.getTime());
    return Math.max(0, Math.ceil(remainingMs / 1000));
};

const toStatusPayload = (doc) => ({
    isRunning: Boolean(doc?.isRunning),
    lastTriggeredAt: doc?.lastTriggeredAt || null,
    lastTriggeredBy: doc?.lastTriggeredBy || null,
    lastResult: doc?.lastResult || null,
    cooldownRemainingSeconds: cooldownRemainingSeconds(doc)
});

// Runs every roster sync job this app owns, exactly the same functions the
// scheduled interval calls - no behavioral drift between "waited for it"
// and "clicked the button". Neither job throws on a Central fetch failure
// (both catch internally and resolve with skipped: true), so this never
// needs to treat a settled promise as a partial failure.
async function runAllSyncJobs() {
    const [student, employee] = await Promise.allSettled([
        syncStudentRoster(),
        syncEmployeeRoster()
    ]);

    return {
        studentRoster: student.status === 'fulfilled'
            ? student.value
            : { skipped: true, error: student.reason?.message || 'unknown error' },
        employeeRoster: employee.status === 'fulfilled'
            ? employee.value
            : { skipped: true, error: employee.reason?.message || 'unknown error' }
    };
}

const getSyncStatus = async (req, res) => {
    const doc = await SyncStatus.findById(DOC_ID);
    return sendSuccess(res, 'Sync status retrieved', toStatusPayload(doc));
};

const triggerSync = async (req, res) => {
    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - COOLDOWN_MS);

    // Ensure the singleton document exists first, separately from the
    // conditional claim below - combining upsert:true with a filter that an
    // *existing* document can fail (still cooling down / already running)
    // makes Mongo try to insert a second document with the same _id and
    // throw a duplicate-key error instead of just reporting "no match".
    try {
        await SyncStatus.create({ _id: DOC_ID });
    } catch (error) {
        if (error.code !== 11000) throw error; // already exists - fine
    }

    // Atomic claim: only succeeds if no run is in progress and the last
    // trigger (if any) is older than the cooldown window. Any number of
    // concurrent clicks from any number of users collapse into at most one
    // real run per window - everyone else just sees this run's result.
    const claimed = await SyncStatus.findOneAndUpdate(
        {
            _id: DOC_ID,
            isRunning: { $ne: true },
            $or: [
                { lastTriggeredAt: { $exists: false } },
                { lastTriggeredAt: { $lte: cooldownCutoff } }
            ]
        },
        {
            $set: {
                isRunning: true,
                lastTriggeredAt: now,
                lastTriggeredBy: req.user?.email || 'unknown'
            }
        },
        { new: true }
    );

    if (!claimed) {
        const current = await SyncStatus.findById(DOC_ID);
        return sendError(res, 'A sync already ran recently. Please wait for the cooldown to finish.', 429, toStatusPayload(current));
    }

    try {
        const result = await runAllSyncJobs();
        winston.info(`manual sync triggered by ${claimed.lastTriggeredBy}: ${JSON.stringify(result)}`);

        const updated = await SyncStatus.findByIdAndUpdate(
            DOC_ID,
            { $set: { isRunning: false, lastResult: result } },
            { new: true }
        );

        return sendSuccess(res, 'Sync completed', toStatusPayload(updated));
    } catch (error) {
        winston.error('manual sync run failed unexpectedly:', error);
        await SyncStatus.findByIdAndUpdate(DOC_ID, { $set: { isRunning: false } });
        return sendError(res, 'Sync failed to complete', 500);
    }
};

module.exports = { getSyncStatus, triggerSync };
