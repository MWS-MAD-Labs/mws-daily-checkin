const { lookupEmployeeByEmail } = require('../services/mwsDataCenterClient');

// Returns the User fields to sync from mws-data-center, or null if the
// email has no active employee record there (caller should reject login).
// mws-data-center is the source of truth for unit naming — synced as-is,
// no local enum gatekeeping it.
async function syncEmployeeFromCentral(email) {
    const centralEmployee = await lookupEmployeeByEmail(email);
    if (!centralEmployee) return null;

    return {
        name: centralEmployee.full_name,
        employeeId: centralEmployee.employee_id,
        jobPosition: centralEmployee.job_position,
        jobLevel: centralEmployee.job_level,
        employmentStatus: centralEmployee.employment_type,
        department: centralEmployee.unit,
        unit: centralEmployee.unit
    };
}

module.exports = { syncEmployeeFromCentral };
