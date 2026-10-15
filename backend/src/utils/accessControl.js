const MTSS_NATIVE_ADMIN_ROLES = new Set(['directorate', 'superadmin', 'admin']);
const MTSS_NATIVE_LEADER_ROLES = new Set(['head_unit', 'principal']);
const MTSS_NATIVE_TEACHER_ROLES = new Set(['teacher', 'se_teacher', 'staff', 'support_staff', 'counselor']);
// Used to be two hardcoded allowlists (4 emails for leader, 1 for observer).
// Both removed - Central's job_level already produces the right Hub-relayed
// tag on every login ("Head Unit" -> head-unit -> role 'head_unit' -> MTSS
// leader; "Director" -> director -> role 'directorate' -> MTSS admin), so
// deriveRoleFromCentralTags (jobLevelRoleMapping.js) already lands everyone
// in MTSS_NATIVE_LEADER_ROLES/MTSS_NATIVE_ADMIN_ROLES below with no
// allowlist needed. The observer allowlist used to specifically cap
// mahrukh@millennia21.id (Academic Director) down to read-only despite her
// Director-level native role - removed by explicit request, so she now gets
// full MTSS admin access matching her actual Central position like every
// other directorate-level user.

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const normalizeRole = (role) => (typeof role === 'string' ? role.trim().toLowerCase() : '');

const getMtssAccessLevelConfig = (level = '', user = {}) => {
    const normalizedLevel = String(level || '').trim().toLowerCase();
    const normalizedRole = normalizeRole(user?.role);

    switch (normalizedLevel) {
        case 'observer':
            return {
                hasAccess: true,
                isReadOnly: true,
                canAccessAdmin: false,
                canManageConfig: false,
                effectiveRole: 'observer',
                accessLevel: 'observer'
            };
        case 'teacher':
            return {
                hasAccess: true,
                isReadOnly: false,
                canAccessAdmin: false,
                canManageConfig: false,
                effectiveRole: MTSS_NATIVE_TEACHER_ROLES.has(normalizedRole) ? normalizedRole : 'teacher',
                accessLevel: 'teacher'
            };
        case 'leader':
            return {
                hasAccess: true,
                isReadOnly: false,
                canAccessAdmin: true,
                canManageConfig: true,
                effectiveRole: MTSS_NATIVE_LEADER_ROLES.has(normalizedRole) ? normalizedRole : 'head_unit',
                accessLevel: 'leader'
            };
        case 'admin':
            return {
                hasAccess: true,
                isReadOnly: false,
                canAccessAdmin: true,
                canManageConfig: true,
                effectiveRole: MTSS_NATIVE_ADMIN_ROLES.has(normalizedRole) ? normalizedRole : 'admin',
                accessLevel: 'admin'
            };
        default:
            return null;
    }
};

const buildMtssAccessProfile = (user) => {
    if (!user) {
        return {
            hasAccess: false,
            isReadOnly: false,
            canAccessAdmin: false,
            canManageConfig: false,
            accessLevel: null,
            effectiveRole: null,
            source: 'none',
            reason: null
        };
    }

    const normalizedRole = normalizeRole(user.role);
    const overrideEnabled = user?.mtssAccess && typeof user.mtssAccess.enabled === 'boolean'
        ? user.mtssAccess.enabled
        : null;
    const overrideLevel = user?.mtssAccess?.accessLevel || null;

    if (overrideEnabled === false) {
        return {
            hasAccess: false,
            isReadOnly: false,
            canAccessAdmin: false,
            canManageConfig: false,
            accessLevel: null,
            effectiveRole: null,
            source: 'user_override',
            reason: 'MTSS access disabled by individual override'
        };
    }

    if (overrideEnabled === true) {
        const overrideProfile = getMtssAccessLevelConfig(overrideLevel, user) || getMtssAccessLevelConfig('observer', user);
        return {
            ...overrideProfile,
            source: 'user_override',
            reason: user?.mtssAccess?.note || 'MTSS access granted by individual override'
        };
    }

    if (MTSS_NATIVE_ADMIN_ROLES.has(normalizedRole)) {
        return {
            ...getMtssAccessLevelConfig('admin', user),
            effectiveRole: normalizedRole,
            source: 'native_role',
            reason: 'Native MTSS admin role'
        };
    }

    if (MTSS_NATIVE_LEADER_ROLES.has(normalizedRole)) {
        return {
            ...getMtssAccessLevelConfig('leader', user),
            effectiveRole: normalizedRole,
            source: 'native_role',
            reason: 'Native MTSS leader role'
        };
    }

    if (MTSS_NATIVE_TEACHER_ROLES.has(normalizedRole)) {
        return {
            ...getMtssAccessLevelConfig('teacher', user),
            effectiveRole: normalizedRole,
            source: 'native_role',
            reason: 'Native MTSS teacher role'
        };
    }

    return {
        hasAccess: false,
        isReadOnly: false,
        canAccessAdmin: false,
        canManageConfig: false,
        accessLevel: null,
        effectiveRole: null,
        source: 'role_blocked',
        reason: 'Role is not allowed to access MTSS by default'
    };
};

const hasMtssAccess = (user) => {
    if (!user) return false;
    const profile = user.mtssAccess || buildMtssAccessProfile(user);
    return profile.hasAccess === true;
};

const hasMtssAdminAccess = (user) => {
    if (!user) return false;
    const profile = user.mtssAccess || buildMtssAccessProfile(user);
    return profile.hasAccess === true && profile.canAccessAdmin === true;
};

const hasMtssWriteAccess = (user) => {
    if (!user) return false;
    const profile = user.mtssAccess || buildMtssAccessProfile(user);
    return profile.hasAccess === true && profile.isReadOnly !== true;
};

module.exports = {
    buildMtssAccessProfile,
    hasMtssAccess,
    hasMtssAdminAccess,
    hasMtssWriteAccess
};
