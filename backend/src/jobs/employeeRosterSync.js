const winston = require('winston');
const User = require('../models/User');
const { listActiveEmployees } = require('../services/mwsDataCenterClient');
const { deriveRoleFromCentralTags } = require('../utils/jobLevelRoleMapping');

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

// Mirrors mws-hub's normalizeAccessToken (apps-service.ts) so the
// reconstructed tags below match what Hub would actually relay at login,
// for the job_level/job_position-derived part of it.
const normalizeAccessToken = (value = '') => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9:]+/g, '-')
    .replace(/^-+|-+$/g, '');

// DRY-RUN ONLY - see the role-drift-detection comment in syncEmployeeRoster.
// Reconstructs the subset of Hub's relayed tags that's a pure function of
// Central's own employee fields: the baseline "employee" tag Hub always
// attaches for user.source === "employee", plus job_level/job_position/unit
// each as a single whole-string tag (Hub adds these with splitTokens:
// false - see mws-hub's getUserAccessTags). Deliberately does NOT and
// cannot reconstruct tags coming from a Hub-side manual permission grant
// (user.role/roles/permissions in Hub's own model) - Central's employee API
// never exposes those, so any role this job derives from these tags alone
// is only trustworthy for the "does job_level/job_position support this"
// question, never a "does this account have some extra Hub grant" one.
function reconstructTagsFromEmployee(employee) {
    // deriveRoleFromCentralTags expects an array (Array.isArray gate), not
    // a Set - a Set here would silently look empty to it and every derived
    // role would come back null.
    return ['employee', employee.job_level, employee.job_position, employee.unit, employee.employment_type]
        .map(normalizeAccessToken)
        .filter(Boolean);
}

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
    let roleDriftDetected = 0;

    for (const user of candidates) {
        const employee = rosterByEmail.get(normalizeEmail(user.email));
        // role itself deliberately isn't WRITTEN here - it's derived fresh
        // from Hub's relayed access tags at login time
        // (ssoUserResolution.js). This job talks to Central directly, so it
        // can only reconstruct the job_level/job_position-driven part of
        // those tags, never a Hub-side manual permission grant - applying a
        // role this job derived could silently strip someone's Hub-granted
        // access every 2 minutes. See reconstructTagsFromEmployee().
        //
        // DRY-RUN role-drift check: log (never apply) whenever the derived
        // role disagrees with what's stored, so a real Central-driven
        // access change (e.g. someone demoted off Head Unit) is visible
        // within minutes instead of only at next login - without risking a
        // false downgrade for someone whose role includes a Hub-side grant
        // this job can't see.
        if (employee) {
            const reconstructedTags = reconstructTagsFromEmployee(employee);
            const derivedRole = deriveRoleFromCentralTags(reconstructedTags, employee.job_level, employee.job_position);
            if (derivedRole && derivedRole !== user.role) {
                roleDriftDetected += 1;
                winston.warn(`employeeRosterSync: role drift (dry-run, not applied) - ${user.email} stored='${user.role}' derived='${derivedRole}' (job_level='${employee.job_level}', job_position='${employee.job_position}')`);
            }
        }

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

    winston.info(`employeeRosterSync: checked ${candidates.length}, updated ${updated}, deactivated ${deactivated}, roleDriftDetected ${roleDriftDetected}`);
    return { checked: candidates.length, updated, deactivated, roleDriftDetected, skipped: false };
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
