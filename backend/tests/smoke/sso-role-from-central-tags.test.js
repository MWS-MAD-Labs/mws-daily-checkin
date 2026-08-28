const { deriveRoleFromCentralTags } = require('../../src/utils/jobLevelRoleMapping');

describe('deriveRoleFromCentralTags', () => {
    test('director tag always wins, regardless of job level', () => {
        expect(deriveRoleFromCentralTags(['director'], 'Teacher')).toBe('directorate');
    });

    test('head-unit tag maps to head_unit', () => {
        expect(deriveRoleFromCentralTags(['head-unit'], 'Staff')).toBe('head_unit');
    });

    test('principal tag also maps to head_unit (no separate principal role here)', () => {
        expect(deriveRoleFromCentralTags(['principal'], 'Staff')).toBe('head_unit');
    });

    test('admin tag maps to admin', () => {
        expect(deriveRoleFromCentralTags(['admin'], 'Staff')).toBe('admin');
    });

    test.each([
        ['Teacher', 'teacher'],
        ['SE Teacher', 'se_teacher'],
        ['Support Staff', 'support_staff'],
        ['Staff', 'staff'],
    ])('teacher tag + job level %s resolves to %s', (jobLevel, expectedRole) => {
        expect(deriveRoleFromCentralTags(['teacher'], jobLevel)).toBe(expectedRole);
    });

    test('unrecognized job level under the teacher tag falls back to teacher, not staff', () => {
        expect(deriveRoleFromCentralTags(['teacher'], 'Intern')).toBe('teacher');
    });

    test('baseline "staff" tag (every active employee gets this) also resolves via job level', () => {
        expect(deriveRoleFromCentralTags(['staff'], 'SE Teacher')).toBe('se_teacher');
    });

    test('no recognized tag at all returns null - caller decides the fallback', () => {
        expect(deriveRoleFromCentralTags([], 'Teacher')).toBeNull();
        expect(deriveRoleFromCentralTags(undefined, 'Teacher')).toBeNull();
    });
});
