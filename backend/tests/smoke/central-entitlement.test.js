const { validateEntitlement, applyEntitlementProjection } = require('../../src/utils/centralEntitlement');
const { requirePermission, requireAnyPermission } = require('../../src/middleware/auth');
const { validateBackfillRecord, assertNoEntitlementRollback } = require('../../src/scripts/backfillCentralEntitlements');

const valid = {
    id: 'ent-1',
    application_id: 'daily-checkin',
    organization_id: 'org-1',
    role: 'student',
    permissions: ['checkin.self.read', 'checkin.self.submit'],
    version: 2,
};

describe('Central entitlement authorization', () => {
    test('validates and canonicalizes a strict entitlement', () => {
        expect(validateEntitlement(valid, 'org-1').permissions).toEqual(['checkin.self.read', 'checkin.self.submit']);
    });

    test.each([
        [{ ...valid, application_id: 'other' }],
        [{ ...valid, organization_id: 'other' }],
        [{ ...valid, extra: true }],
    ])('rejects invalid entitlement %#', (value) => {
        expect(() => validateEntitlement(value, 'org-1')).toThrow();
    });

    test('leaves out a permission the code does not know instead of rejecting the role', () => {
        const result = validateEntitlement({ ...valid, permissions: ['checkin.self.read', 'attendance.self.read'] }, 'org-1');
        expect(result.permissions).toEqual(['checkin.self.read']);
    });

    test('updates projection without overwriting HR role and increments existing sessions', () => {
        const user = {
            isNew: false,
            role: 'teacher',
            sessionVersion: 4,
            centralEntitlementPermissions: [],
        };
        expect(applyEntitlementProjection(user, valid)).toBe(true);
        expect(user.role).toBe('teacher');
        expect(user.centralEntitlementRole).toBe('student');
        expect(user.sessionVersion).toBe(5);
        expect(applyEntitlementProjection(user, valid)).toBe(false);
        expect(user.sessionVersion).toBe(5);
    });

    test('backfill rejects missing or unknown source and entitlement rollback', () => {
        expect(() => validateBackfillRecord({ central_person_id: 'person-1', entitlement: valid })).toThrow(/source/);
        expect(() => validateBackfillRecord({ central_person_id: 'person-1', source: 'guardian', entitlement: valid })).toThrow(/source/);
        expect(() => assertNoEntitlementRollback({ centralPersonId: 'person-1', centralEntitlementId: valid.id, centralEntitlementVersion: 3 }, valid)).toThrow(/rollback/);
        expect(() => assertNoEntitlementRollback({ centralPersonId: 'person-1', centralEntitlementId: valid.id, centralEntitlementVersion: 2 }, valid)).not.toThrow();
        // Versions only compare within one entitlement: another id (a group's timestamp vs a personal counter) is not a rollback.
        expect(() => assertNoEntitlementRollback({ centralPersonId: 'person-1', centralEntitlementId: 'group:other', centralEntitlementVersion: 1791852898 }, valid)).not.toThrow();
    });

    test('permission middleware allows exact or any permissions', () => {
        const next = jest.fn();
        const send = jest.fn();
        const res = { status: jest.fn(() => ({ json: send })) };
        requirePermission('dashboard.read')({ user: { permissions: ['dashboard.read'] } }, res, next);
        requireAnyPermission('users.manage', 'users.read')({ user: { permissions: ['users.read'] } }, res, next);
        expect(next).toHaveBeenCalledTimes(2);
    });
});
