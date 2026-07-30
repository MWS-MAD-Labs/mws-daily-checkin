const winston = require('winston');
const User = require('../models/User');
const { listActiveEmployees } = require('../services/mwsDataCenterClient');

// authenticate() (middleware/auth.js) only checks the local isActive flag,
// never mws-data-center directly - it only gets re-synced from central at
// OAuth login, and even then centralFields never carries isActive, so
// Object.assign(user, centralFields) never flips it either way. A user who
// was already logged in when their employee record went inactive in
// mws-data-center keeps full access until this job catches up, and a
// rehired employee never gets reactivated automatically. This job mirrors
// the full active roster from central in both directions.

// Managed directly in this app, not sourced from mws-data-center's Employee
// table - never auto-deactivated (or reactivated) here. Mirrors the same
// exclusion in scripts/syncLatestUserRoster.js, so a central API hiccup or a
// missing employee record can't lock out an admin.
const EXEMPT_ROLES = ['admin', 'superadmin'];

const DEFAULT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes - cheap now that this
// is 1-3 bulk HTTP calls per run instead of one per user.

const normalizeEmail = (value = '') => value.toLowerCase().trim();

function buildFieldsFromCentral(employee) {
    return {
        name: employee.full_name,
        employeeId: employee.employee_id,
        jobPosition: employee.job_position,
        jobLevel: employee.job_level,
        employmentStatus: employee.employment_type,
        department: employee.unit,
        unit: employee.unit,
        isActive: true
    };
}

function hasChanges(user, nextFields) {
    return Object.entries(nextFields).some(([key, value]) => user[key] !== value);
}

async function syncEmployeeRoster() {
    let roster;
    try {
        roster = await listActiveEmployees();
    } catch (error) {
        winston.warn(`employeeRosterSync: failed to fetch active roster, skipping this run: ${error.message}`);
        return { checked: 0, updated: 0, deactivated: 0, skipped: true };
    }

    const rosterByEmail = new Map(roster.map((employee) => [normalizeEmail(employee.email), employee]));

    const candidates = await User.find({
        employeeId: { $exists: true, $ne: '' },
        role: { $nin: EXEMPT_ROLES }
    });

    let updated = 0;
    let deactivated = 0;

    for (const user of candidates) {
        const employee = rosterByEmail.get(normalizeEmail(user.email));
        const nextFields = employee ? buildFieldsFromCentral(employee) : { isActive: false };

        if (!hasChanges(user, nextFields)) continue;

        Object.assign(user, nextFields);
        user.updatedAt = new Date();
        await user.save();

        if (employee) {
            updated += 1;
        } else {
            deactivated += 1;
            winston.info(`employeeRosterSync: deactivated ${user.email} (no longer active in mws-data-center)`);
        }
    }

    winston.info(`employeeRosterSync: checked ${candidates.length}, updated ${updated}, deactivated ${deactivated}`);
    return { checked: candidates.length, updated, deactivated, skipped: false };
}

let intervalHandle = null;
let isRunning = false;

function start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (intervalHandle) return;

    const tick = async () => {
        if (isRunning) return; // previous run still in progress - skip this tick
        isRunning = true;
        try {
            await syncEmployeeRoster();
        } catch (error) {
            winston.error('employeeRosterSync: run failed:', error);
        } finally {
            isRunning = false;
        }
    };

    intervalHandle = setInterval(tick, intervalMs);
    // Also run shortly after startup, so a status change that happened while
    // the server was down gets caught without waiting a full interval.
    setTimeout(tick, 30 * 1000);
    winston.info(`employeeRosterSync: scheduled every ${Math.round(intervalMs / 60000)} minutes`);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}

module.exports = { syncEmployeeRoster, start, stop };
