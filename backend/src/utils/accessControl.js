const DEFAULT_DASHBOARD_ROLES = new Set(['directorate', 'superadmin', 'admin', 'head_unit', 'counselor']);
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

// Centralized list of delegated dashboard access rules - for genuinely
// one-off individual exceptions only. The school psychologist case that
// used to live here (wina@millennia21.id) is now derived automatically from
// Central's job_position ("School's Psychologist" -> role 'counselor', see
// jobLevelRoleMapping.js's JOB_POSITION_TO_ROLE + DEFAULT_DASHBOARD_ROLES
// above), so whoever holds that position gets access without a code change.
const DASHBOARD_DELEGATIONS = [];

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const normalizeRole = (role) => (typeof role === 'string' ? role.trim().toLowerCase() : '');

const findDelegation = (email) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    return DASHBOARD_DELEGATIONS.find((entry) => entry.email === normalized) || null;
};

const buildDashboardAccessProfile = (user) => {
    if (!user) {
        return {
            hasDelegatedAccess: false,
            effectiveRole: null,
            scope: [],
            delegatedFromEmail: null,
            delegatedFromName: null,
            description: null,
            reason: null,
            label: null
        };
    }

    const baseRole = user.role || null;
    const delegation = findDelegation(user.email);

    if (!delegation) {
        return {
            hasDelegatedAccess: false,
            effectiveRole: baseRole,
            scope: [],
            delegatedFromEmail: null,
            delegatedFromName: null,
            description: null,
            reason: null,
            label: null
        };
    }

    return {
        hasDelegatedAccess: true,
        effectiveRole: delegation.delegatedRole || baseRole,
        scope: Array.isArray(delegation.scope) && delegation.scope.length > 0
            ? delegation.scope
            : ['emotional_dashboard'],
        delegatedFromEmail: delegation.delegatedFromEmail || null,
        delegatedFromName: delegation.delegatedFromName || null,
        description: delegation.description || 'Delegated emotional dashboard access',
        reason: delegation.reason || null,
        label: delegation.label || 'Delegated Dashboard Access'
    };
};

const userHasNativeDashboardRole = (role) => DEFAULT_DASHBOARD_ROLES.has(role);

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

const hasDashboardAccess = (user) => {
    if (!user) return false;

    if (userHasNativeDashboardRole(user.role)) {
        return true;
    }

    const profile = user.dashboardAccess || buildDashboardAccessProfile(user);
    return profile.hasDelegatedAccess && profile.scope.includes('emotional_dashboard');
};

const getEffectiveDashboardRole = (user) => {
    if (!user) return null;
    if (user.dashboardRole) {
        return user.dashboardRole;
    }
    if (user.dashboardAccess?.effectiveRole) {
        return user.dashboardAccess.effectiveRole;
    }
    const profile = buildDashboardAccessProfile(user);
    return profile.effectiveRole || user.role || null;
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
    DEFAULT_DASHBOARD_ROLES: Array.from(DEFAULT_DASHBOARD_ROLES),
    buildDashboardAccessProfile,
    hasDashboardAccess,
    getEffectiveDashboardRole,
    buildMtssAccessProfile,
    hasMtssAccess,
    hasMtssAdminAccess,
    hasMtssWriteAccess
};
