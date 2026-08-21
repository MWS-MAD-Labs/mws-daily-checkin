const { lookupEmployeeByEmail, lookupEmployeeByEmployeeId } = require('../services/mwsDataCenterClient');

// email is included so callers can tell when a live login email has drifted
// from what's on file centrally (see syncEmployeeFromCentralWithFallback).
function mapCentralEmployee(centralEmployee) {
    return {
        name: centralEmployee.full_name,
        email: centralEmployee.email,
        employeeId: centralEmployee.employee_id,
        jobPosition: centralEmployee.job_position,
        jobLevel: centralEmployee.job_level,
        employmentStatus: centralEmployee.employment_type,
        department: centralEmployee.unit,
        unit: centralEmployee.unit
    };
}

// Returns the User fields to sync from mws-data-center, or null if the
// email has no active employee record there (caller should reject login).
// mws-data-center is the source of truth for unit naming — synced as-is,
// no local enum gatekeeping it.
async function syncEmployeeFromCentral(email) {
    const centralEmployee = await lookupEmployeeByEmail(email);
    if (!centralEmployee) return null;
    return mapCentralEmployee(centralEmployee);
}

// Same as syncEmployeeFromCentral, but for an already-linked local account
// (existingEmployeeId) whose live Google login email no longer matches what
// mws-data-center has on file - e.g. someone updated their email centrally
// and their Google Workspace primary address hasn't caught up yet. Retries
// by employee_id, the stable identifier, before giving up. Only meaningful
// when existingEmployeeId is present - a brand new account has nothing to
// fall back to.
async function syncEmployeeFromCentralWithFallback(email, existingEmployeeId) {
    const byEmail = await syncEmployeeFromCentral(email);
    if (byEmail) return byEmail;
    if (!existingEmployeeId) return null;

    const centralEmployee = await lookupEmployeeByEmployeeId(existingEmployeeId);
    if (!centralEmployee) return null;
    return mapCentralEmployee(centralEmployee);
}

module.exports = { syncEmployeeFromCentral, syncEmployeeFromCentralWithFallback };
