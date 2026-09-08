const winston = require('winston');
const User = require('../models/User');
const { listClassTeacherAssignments } = require('../services/mwsDataCenterClient');

// Keeps User.classes in sync with Central's real ClassTeacherAssignment
// data. Previously this only ever got set via scripts/seedUserClassAssignments.js
// - a manual, name-matched script against a hardcoded roster in
// scripts/data/classAssignments.js - so a newly (re-)provisioned teacher
// account had classes: [] until someone remembered to re-run it by hand,
// leaving the daily check-in dashboard showing zero students for a real
// homeroom/subject teacher. Central is the source of truth here - this job
// always overwrites classes with whatever Central currently says, including
// clearing it back to [] for a teacher Central no longer shows any active
// assignment for. Mirrors mws-mtss-system's teacherClassAssignmentSync.js
// exactly, including matching by email (not name, which the seed script
// used and which breaks on any name change/typo).
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const ROLE_LABELS = {
    HOMEROOM: 'Homeroom Teacher',
    SUPPORTING_HOMEROOM: 'Homeroom Teacher',
    SUBJECT_TEACHER: 'Subject Teacher',
};

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const sameClasses = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const key = (entry) => `${entry.grade || ''}|${entry.className || ''}|${entry.subject || ''}|${entry.role || ''}`;
    const sortedA = a.map(key).sort();
    const sortedB = b.map(key).sort();
    return sortedA.every((value, index) => value === sortedB[index]);
};

async function syncClassAssignments() {
    let assignments;
    try {
        assignments = await listClassTeacherAssignments();
    } catch (error) {
        winston.warn(`classAssignmentSync: failed to fetch Central assignments, skipping this run: ${error.message}`);
        return { checked: 0, updated: 0, skipped: true };
    }

    const classesByEmail = new Map();
    assignments.forEach((assignment) => {
        const email = normalizeEmail(assignment.employee_email);
        if (!email) return;
        if (!classesByEmail.has(email)) classesByEmail.set(email, []);
        // A mixed-age room genuinely holds students at more than one grade
        // - one classes[] entry per grade this class teaches (primary +
        // every additional), all sharing the same className/subject/role.
        const roomGrades = [
            assignment.grade_name,
            ...(assignment.additional_grade_names || []),
        ].filter(Boolean);
        roomGrades.forEach((grade) => {
            classesByEmail.get(email).push({
                grade,
                className: assignment.class_name || undefined,
                subject: assignment.subject || undefined,
                role: ROLE_LABELS[assignment.role] || undefined,
            });
        });
    });

    const users = await User.find({ email: { $exists: true, $ne: '' } }).select('email classes');

    let updated = 0;
    for (const user of users) {
        const nextClasses = classesByEmail.get(normalizeEmail(user.email)) || [];
        if (sameClasses(user.classes || [], nextClasses)) continue;

        await User.findByIdAndUpdate(user._id, { classes: nextClasses }, { runValidators: true });
        updated += 1;
        winston.info(`classAssignmentSync: updated ${user.email} - ${nextClasses.length} class(es)`);
    }

    winston.info(`classAssignmentSync: checked ${users.length}, updated ${updated}`);
    return { checked: users.length, updated, skipped: false };
}

let intervalHandle = null;
let isRunning = false;

function start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (intervalHandle) return;

    const tick = async () => {
        if (isRunning) return; // previous run still in progress - skip this tick
        isRunning = true;
        try {
            await syncClassAssignments();
        } catch (error) {
            winston.error('classAssignmentSync: run failed:', error);
        } finally {
            isRunning = false;
        }
    };

    intervalHandle = setInterval(tick, intervalMs);
    // Also run shortly after startup, so a class change that happened while
    // the server was down (or a fresh account with classes: []) gets caught
    // without waiting a full interval.
    setTimeout(tick, 30 * 1000);
    winston.info(`classAssignmentSync: scheduled every ${Math.round(intervalMs / 60000)} minutes`);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}

module.exports = { syncClassAssignments, start, stop };
