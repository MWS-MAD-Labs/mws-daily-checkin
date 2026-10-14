import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasEmotionalDashboardAccess, hasAnyPermission } from '@/utils/accessControl';
import { sendToHub } from '@/utils/hubSession';
import PageLoader from '@/components/PageLoader';

const normalizeRole = (role = '') => String(role || '').trim().toLowerCase();

const ProtectedRoute = ({
    children,
    allowedRoles = [],
    allowedDepartments = [],
    allowedPermissions = [],
    requireDirectorateAcademic = false,
    accessMatch = 'all',
}) => {
    const { user, isAuthenticated, loading, noAccess } = useSelector((state) => state.auth);
    const userRole = normalizeRole(user?.role);

    // Role-aware fallback: students -> student hub, everyone else -> home
    // (/home, which has its own link out to the real Hub)
    const fallbackPath = userRole === 'student' ? '/student/support-hub' : '/home';

    const shouldBounceToHub = !loading && !isAuthenticated && !noAccess;

    // No Hub session: the Hub gives it back when the person still has one, or shows its front page.
    useEffect(() => {
        if (shouldBounceToHub) sendToHub();
    }, [shouldBounceToHub]);

    // The Hub knows the person but Central gave them no access to this application.
    if (!loading && !isAuthenticated && noAccess) {
        return <Navigate to="/account-not-found" replace />;
    }

    if (loading || shouldBounceToHub) {
        return <PageLoader />;
    }

    // Special check for dashboard access (directorate + academic department + head_unit)
    if (requireDirectorateAcademic) {
        if (!hasEmotionalDashboardAccess(user)) {
            return <Navigate to={fallbackPath} replace />;
        }
    }

    if (allowedPermissions.length > 0 && !hasAnyPermission(user, allowedPermissions)) {
        return <Navigate to={fallbackPath} replace />;
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
