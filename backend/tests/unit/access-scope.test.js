const { resolveStudentScope, resolveStaffScope, staffInScope } = require('../../src/utils/accessScope');
const { PERMISSIONS } = require('../../src/constants/permissions');
const { SCOPE_MODE } = require('../../src/constants/enums');

const person = (permissions, extra = {}) => ({ permissions, unit: 'Elementary', classes: [], ...extra });

describe('student dashboard scope', () => {
    it('is closed without the read permission, whatever else they hold', () => {
        expect(resolveStudentScope(person([PERMISSIONS.STUDENT_CHECKINS_SCOPE_ALL])).mode).toBe(SCOPE_MODE.NONE);
    });

    it('is the assigned classes by default, and closed for a teacher with no class', () => {
        const classes = [{ grade: 'Grade 4', className: 'Cheetah' }];
        expect(resolveStudentScope(person([PERMISSIONS.STUDENT_CHECKINS_READ], { classes })).mode).toBe(SCOPE_MODE.ASSIGNED);
        expect(resolveStudentScope(person([PERMISSIONS.STUDENT_CHECKINS_READ])).mode).toBe(SCOPE_MODE.NONE);
    });

    it('widens to the unit and to the whole school, the wider one winning', () => {
        const read = PERMISSIONS.STUDENT_CHECKINS_READ;
        expect(resolveStudentScope(person([read, PERMISSIONS.STUDENT_CHECKINS_SCOPE_UNIT]))).toEqual({ mode: SCOPE_MODE.UNIT, unit: 'Elementary' });
        expect(resolveStudentScope(person([read, PERMISSIONS.STUDENT_CHECKINS_SCOPE_UNIT, PERMISSIONS.STUDENT_CHECKINS_SCOPE_ALL])).mode).toBe(SCOPE_MODE.ALL);
        expect(resolveStudentScope(person([read, PERMISSIONS.STUDENT_CHECKINS_SCOPE_UNIT], { unit: '' })).mode).toBe(SCOPE_MODE.NONE);
    });
});

describe('staff dashboard scope', () => {
    it('stays closed with the read permission alone', () => {
        expect(resolveStaffScope(person([PERMISSIONS.DASHBOARD_READ])).mode).toBe(SCOPE_MODE.NONE);
    });

    it('shows the unit or everyone when a scope permission says so', () => {
        const read = PERMISSIONS.DASHBOARD_READ;
        expect(resolveStaffScope(person([read, PERMISSIONS.DASHBOARD_SCOPE_UNIT]))).toEqual({ mode: SCOPE_MODE.UNIT, unit: 'Elementary' });
        expect(resolveStaffScope(person([read, PERMISSIONS.DASHBOARD_SCOPE_ALL])).mode).toBe(SCOPE_MODE.ALL);
        expect(resolveStaffScope(person([PERMISSIONS.DASHBOARD_SCOPE_ALL])).mode).toBe(SCOPE_MODE.NONE);
    });

    it('checks one person against the scope', () => {
        const target = { unit: 'Junior High', department: 'Junior High' };
        expect(staffInScope({ mode: SCOPE_MODE.ALL }, target)).toBe(true);
        expect(staffInScope({ mode: SCOPE_MODE.UNIT, unit: 'Junior High' }, target)).toBe(true);
        expect(staffInScope({ mode: SCOPE_MODE.UNIT, unit: 'Elementary' }, target)).toBe(false);
        expect(staffInScope({ mode: SCOPE_MODE.NONE }, target)).toBe(false);
    });
});
