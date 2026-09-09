import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasEmotionalDashboardAccess } from '@/utils/accessControl';
import { storePendingRedirect } from '@/utils/authRedirect';
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

    // Show loading while checking authentication - same branded PageLoader
    // the route-level Suspense fallback uses, so the sequence of loading
    // moments right after an SSO login (chunk download -> auth check) reads
    // as one continuous loading screen instead of switching between two
    // different-looking spinners.
    if (loading) {
        return <PageLoader />;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        storePendingRedirect(`${location.pathname}${location.search}${location.hash}`);
        return <Navigate to="/" replace />;
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
