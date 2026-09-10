import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasEmotionalDashboardAccess } from '@/utils/accessControl';
import { storePendingRedirect } from '@/utils/authRedirect';
import { isHubRedirectInFlight } from '@/services/authService';
import PageLoader from '@/components/PageLoader';

const normalizeRole = (role = '') => String(role || '').trim().toLowerCase();

const ProtectedRoute = ({
    children,
    allowedRoles = [],
    allowedDepartments = [],
    requireDirectorateAcademic = false,
    accessMatch = 'all',
}) => {
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
    const location = useLocation();
    const userRole = normalizeRole(user?.role);

    // Role-aware fallback: students -> student hub, everyone else -> home
    // (/home, which has its own link out to the real Hub)
    const fallbackPath = userRole === 'student' ? '/student/support-hub' : '/home';

    const shouldBounceToLanding = !loading && !isAuthenticated;

    // A real navigation (import.meta.env.BASE_URL, same source AuthCallback.jsx
    // and authService.js's 401 handler already use) instead of <Navigate to="/">
    // - under this app's basename (main.jsx), react-router resolves bare "/" to
    // the base path WITHOUT a trailing slash, which Vite's dev server (and a
    // strict-prefix static host) rejects on a fresh reload before the SPA ever
    // loads. BASE_URL is guaranteed to already end in "/".
    useEffect(() => {
        if (!shouldBounceToLanding) return;
        // An explicit logout already has its own cross-origin navigate to
        // Hub underway (authService.js's logout()) at the exact moment this
        // fires too - isAuthenticated flipping false is what both of them
        // react to. This same-origin assign is fast to commit; that one
        // needs a fresh cross-origin connection and reliably loses the race
        // if both fire, stranding the user back on this app's own landing
        // page instead of Hub. Trust the in-flight navigate instead.
        if (isHubRedirectInFlight()) return;
        storePendingRedirect(`${location.pathname}${location.search}${location.hash}`);
        window.location.assign(import.meta.env.BASE_URL);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldBounceToLanding]);

    // Show loading while checking authentication - same branded PageLoader
    // the route-level Suspense fallback uses, so the sequence of loading
    // moments right after an SSO login (chunk download -> auth check) reads
    // as one continuous loading screen instead of switching between two
    // different-looking spinners.
    if (loading || shouldBounceToLanding) {
        return <PageLoader />;
    }

    // Special check for dashboard access (directorate + academic department + head_unit)
    if (requireDirectorateAcademic) {
        if (!hasEmotionalDashboardAccess(user)) {
            return <Navigate to={fallbackPath} replace />;
        }
    }

    const hasRoleRule = allowedRoles.length > 0;
    const hasDepartmentRule = allowedDepartments.length > 0;
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    const roleAllowed = !hasRoleRule || normalizedAllowedRoles.includes(userRole);
    const departmentAllowed = !hasDepartmentRule || allowedDepartments.includes(user?.department);

    if (accessMatch === 'any' && (hasRoleRule || hasDepartmentRule)) {
        const passesAnyRule =
            (hasRoleRule && roleAllowed) ||
            (hasDepartmentRule && departmentAllowed);

        if (!passesAnyRule) {
            return <Navigate to={fallbackPath} replace />;
        }
    } else {
        if (!roleAllowed || !departmentAllowed) {
            return <Navigate to={fallbackPath} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
