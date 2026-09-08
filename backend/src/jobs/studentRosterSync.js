const winston = require('winston');
const UserStudent = require('../models/UserStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');
const { deriveUnitFromGrade } = require('../utils/studentUserHelpers');

// Mirrors employeeRosterSync.js's shape for students: authenticate()
// (middleware/auth.js) only checks the local isActive flag, never
// mws-data-center directly - it only gets re-synced from central at
// login. A student who was already logged in when their enrollment ended
// keeps full access until this job catches up, and a re-enrolled student
// never gets reactivated automatically without it.
//
// REGISTERED and ACTIVE both count as "still enrolled" - Central has no
// single status that means that unambiguously (REGISTERED = enrolled but
// not yet assigned a class). Everything else (GRADUATED, TRANSFERRED,
// WITHDRAWN, ARCHIVED, INACTIVE) means deactivate.
const ENROLLED_STATUSES = ['REGISTERED', 'ACTIVE'];

const DEFAULT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes, same cadence as employeeRosterSync.js

const normalizeEmail = (value = '') => value.toLowerCase().trim();

async function fetchEnrolledRoster() {
    const byEmail = new Map();
    for (const status of ENROLLED_STATUSES) {
        const students = await listStudentsByStatus(status);
        students.forEach((student) => {
            const email = normalizeEmail(student.email);
            if (email) byEmail.set(email, student);
        });
    }
    return byEmail;
}

function buildFieldsFromCentral(student) {
    const currentGrade = student.current_grade;
    const className = student.current_class;
    const unitInfo = deriveUnitFromGrade(currentGrade, className);

    return {
        name: student.full_name,
        nickname: student.nick_name,
        currentGrade,
        className,
        unit: unitInfo.unit,
        department: unitInfo.department,
        isActive: true
    };
}

function hasChanges(student, nextFields) {
    return Object.entries(nextFields).some(([key, value]) => value !== undefined && student[key] !== value);
}

async function syncStudentRoster() {
    let rosterByEmail;
    try {
        rosterByEmail = await fetchEnrolledRoster();
    } catch (error) {
        winston.warn(`studentRosterSync: failed to fetch enrolled roster, skipping this run: ${error.message}`);
        return { checked: 0, updated: 0, deactivated: 0, skipped: true };
    }

    const candidates = await UserStudent.find({});

    let updated = 0;
    let deactivated = 0;

    for (const student of candidates) {
        const central = rosterByEmail.get(normalizeEmail(student.email));
        // role/account fields (password, ssoProvisioned, googleId) are
        // deliberately untouched here, same reasoning as
        // employeeRosterSync.js - this job's only job is isActive plus the
        // identity fields Central owns, not anything account-related.
        const nextFields = central ? buildFieldsFromCentral(central) : { isActive: false };

        if (!hasChanges(student, nextFields)) continue;

        Object.assign(student, nextFields);
        student.updatedAt = new Date();
        await student.save();

        if (central) {
            updated += 1;
        } else if (student.isActive === false) {
            deactivated += 1;
            winston.info(`studentRosterSync: deactivated ${student.email} (no longer enrolled in Central)`);
        }
    }

    winston.info(`studentRosterSync: checked ${candidates.length}, updated ${updated}, deactivated ${deactivated}`);
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
            await syncStudentRoster();
        } catch (error) {
            winston.error('studentRosterSync: run failed:', error);
        } finally {
            isRunning = false;
        }
    };

    intervalHandle = setInterval(tick, intervalMs);
    // Also run shortly after startup, so a status change that happened while
    // the server was down gets caught without waiting a full interval.
    setTimeout(tick, 30 * 1000);
    winston.info(`studentRosterSync: scheduled every ${Math.round(intervalMs / 60000)} minutes`);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}

module.exports = { syncStudentRoster, start, stop };
