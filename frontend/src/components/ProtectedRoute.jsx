import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasAnyPermission, hasDashboard, isStudent } from '@/utils/accessControl';
import { PERSON_TYPE } from '@/constants/enums';
import { sendToHub } from '@/utils/hubSession';
import PageLoader from '@/components/PageLoader';

// What a route asks for, all from Central:
//   anyPermission: the person must hold at least one of these permissions
//   dashboard:     the person must have a dashboard scope that shows somebody (DASHBOARD.STAFF or .STUDENT)
//   personType:    PERSON_TYPE.STUDENT or PERSON_TYPE.EMPLOYEE, for pages built for one kind of person
const ProtectedRoute = ({
    children,
    anyPermission = [],
    dashboard = null,
    personType = null,
}) => {
    const { user, isAuthenticated, loading, noAccess, leaving } = useSelector((state) => state.auth);

    // Students -> student hub, everyone else -> home (/home, which has its own link out to the real Hub)
    const fallbackPath = isStudent(user) ? '/student/support-hub' : '/home';

    const shouldBounceToHub = !loading && !isAuthenticated && !noAccess && !leaving;

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

    if (dashboard && !hasDashboard(user, dashboard)) {
        return <Navigate to={fallbackPath} replace />;
    }

    if (anyPermission.length > 0 && !hasAnyPermission(user, anyPermission)) {
        return <Navigate to={fallbackPath} replace />;
    }

    if (personType && (isStudent(user) ? PERSON_TYPE.STUDENT : PERSON_TYPE.EMPLOYEE) !== personType) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
