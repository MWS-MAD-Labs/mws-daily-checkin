// RouteConfig.jsx — mws-daily-checkin
import { Suspense, lazy, memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import PageTransition from "./PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DASHBOARD, PERSON_TYPE } from "@/constants/enums";
import { PERMISSIONS as P } from "@/constants/permissions";
import RootRedirect from "./RootRedirect";

const AccountNotFoundPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/AccountNotFoundPage'));
const EmotionalCheckinFaceScanPage = lazy(() => import('@/pages/VerificationPage'));
const ProfilePage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/ProfilePage'));
const NotificationPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/NotificationPage'));
const NotificationSettingsPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/NotificationSettingsPage'));
const RoleSelectionPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/RoleSelectionPage'));
const RatingPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/RatingPage'));
const EmotionalCheckinPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/EmotionalCheckinPage'));
const EmotionalCheckinStaffPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/EmotionalCheckinStaffPage'));
const EmotionalCheckinDashboard = lazy(() => import(/* webpackPrefetch: true */ '@/pages/EmotionalCheckinDashboard'));
const EmotionalCheckinTeacherDashboard = lazy(() => import(/* webpackPrefetch: true */ '@/pages/EmotionalCheckinTeacherDashboard'));
const NotSubmittedUsersPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/dashboard/NotSubmittedUsersPage'));
const EmotionalWellnessPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/dashboard/IndividualDashboard'));
const PersonalStatsPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/PersonalStatsPage'));
const EmotionalHistoryPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/EmotionalHistoryPage'));
const EmotionalPatternsPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/EmotionalPatternsPage'));
const UserManagementDashboard = lazy(() => import(/* webpackPrefetch: true */ '@/pages/UserManagementDashboard'));
const StudentEmotionalCheckinPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/StudentEmotionalCheckinPage'));
const StudentFaceScanPage = lazy(() => import('@/pages/StudentFaceScanPage'));
const StudentManualCheckinPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/StudentManualCheckinPage'));
const StudentAICheckinPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/StudentAICheckinPage'));
const StudentSupportHubPage = lazy(() => import(/* webpackPrefetch: true */ '@/pages/StudentSupportHubPage'));
const NotFound = lazy(() => import(/* webpackPrefetch: true */ '@/pages/NotFound'));

const MemoizedPageTransition = memo(({ children }) => (
    <PageTransition>{children}</PageTransition>
));
MemoizedPageTransition.displayName = 'MemoizedPageTransition';

const publicRoutes = [
    <Route key="landing" path="/" element={<RootRedirect />} />,
    <Route key="account-not-found" path="/account-not-found" element={<MemoizedPageTransition><AccountNotFoundPage /></MemoizedPageTransition>} />,
    <Route key="face-scan" path="/emotional-checkin/face-scan" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_SUBMIT]}><MemoizedPageTransition><EmotionalCheckinFaceScanPage /></MemoizedPageTransition></ProtectedRoute>} />,
    // This is now nested inside the app-level /daily-checkin basename
    // (main.jsx), so its own path can't also be "/daily-checkin" - that
    // would collide with the landing page's own path="/" once combined
    // (both would resolve to the app's bare root). Also can't be bare "/"
    // itself, since that's the public LandingPage route above. "/home" is
    // the actual final URL /daily-checkin/home.
    <Route key="daily-checkin-home" path="/home" element={<ProtectedRoute personType={PERSON_TYPE.EMPLOYEE}><MemoizedPageTransition><RoleSelectionPage /></MemoizedPageTransition></ProtectedRoute>} />,
    // Old URLs kept working as redirects, not 404s, for anyone with a bookmark/link from before the rename.
    <Route key="select-role-redirect" path="/select-role" element={<Navigate to="/home" replace />} />,
    <Route key="profile" path="/profile" element={<ProtectedRoute><MemoizedPageTransition><ProfilePage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="notifications" path="/notifications" element={<ProtectedRoute anyPermission={[P.NOTIFICATIONS_SELF_MANAGE]}><MemoizedPageTransition><NotificationPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="notifications-settings" path="/notifications/settings" element={<ProtectedRoute anyPermission={[P.NOTIFICATIONS_SELF_MANAGE]}><MemoizedPageTransition><NotificationSettingsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-checkin" path="/emotional-checkin" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_SUBMIT, P.CHECKIN_STUDENT_SUBMIT]}><MemoizedPageTransition><EmotionalCheckinPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-checkin-staff" path="/emotional-checkin/staff" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_SUBMIT]}><MemoizedPageTransition><EmotionalCheckinStaffPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="rate" path="/emotional-checkin/rate" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_SUBMIT, P.CHECKIN_STUDENT_SUBMIT]}><MemoizedPageTransition><RatingPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="rate-with-id" path="/emotional-checkin/rate/:checkinId" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_SUBMIT, P.CHECKIN_STUDENT_SUBMIT]}><MemoizedPageTransition><RatingPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-checkin-dashboard" path="/emotional-checkin/dashboard" element={<ProtectedRoute dashboard={DASHBOARD.STAFF}><MemoizedPageTransition><EmotionalCheckinDashboard /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route
        key="emotional-checkin-teacher-dashboard"
        path="/emotional-checkin/teacher-dashboard"
        element={
            <ProtectedRoute dashboard={DASHBOARD.STUDENT}>
                <MemoizedPageTransition>
                    <EmotionalCheckinTeacherDashboard />
                </MemoizedPageTransition>
            </ProtectedRoute>
        }
    />,
    <Route key="emotional-checkin-not-submitted" path="/emotional-checkin/not-submitted" element={<ProtectedRoute dashboard={DASHBOARD.STAFF}><MemoizedPageTransition><NotSubmittedUsersPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-wellness" path="/emotional-wellness" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><EmotionalWellnessPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-wellness-user" path="/emotional-wellness/:userId" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><EmotionalWellnessPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="personal-stats" path="/profile/personal-stats" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><PersonalStatsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="personal-stats-user" path="/profile/personal-stats/:userId" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><PersonalStatsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-history" path="/profile/emotional-history" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><EmotionalHistoryPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-history-user" path="/profile/emotional-history/:userId" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><EmotionalHistoryPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-patterns" path="/profile/emotional-patterns" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><EmotionalPatternsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="emotional-patterns-user" path="/profile/emotional-patterns/:userId" element={<ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}><MemoizedPageTransition><EmotionalPatternsPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="user-management" path="/user-management" element={<ProtectedRoute anyPermission={[P.USERS_READ]}><MemoizedPageTransition><UserManagementDashboard /></MemoizedPageTransition></ProtectedRoute>} />,
    // /support-hub used to render its own mocked clone of Hub's app-launcher
    // UI - removed as a duplicate of the real Hub (a separate domain/app).
    // Kept as a redirect, not a 404, for anyone with an old bookmark/link.
    <Route key="support-hub" path="/support-hub" element={<Navigate to="/home" replace />} />,
    <Route key="student-emotional-checkin" path="/student/emotional-checkin" element={<ProtectedRoute personType={PERSON_TYPE.STUDENT} anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}><MemoizedPageTransition><StudentEmotionalCheckinPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-face-scan" path="/student/emotional-checkin/face-scan" element={<ProtectedRoute personType={PERSON_TYPE.STUDENT} anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}><MemoizedPageTransition><StudentFaceScanPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-manual-checkin" path="/student/emotional-checkin/manual" element={<ProtectedRoute personType={PERSON_TYPE.STUDENT} anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}><MemoizedPageTransition><StudentManualCheckinPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-ai-checkin" path="/student/emotional-checkin/ai" element={<ProtectedRoute personType={PERSON_TYPE.STUDENT} anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}><MemoizedPageTransition><StudentAICheckinPage /></MemoizedPageTransition></ProtectedRoute>} />,
    <Route key="student-support-hub" path="/student/support-hub" element={<ProtectedRoute personType={PERSON_TYPE.STUDENT} anyPermission={[P.SUPPORT_CONTACTS_READ]}><MemoizedPageTransition><StudentSupportHubPage /></MemoizedPageTransition></ProtectedRoute>} />,
];

const RouteConfig = memo(() => (
    <Suspense fallback={<PageLoader />}>
        <Routes>
            {publicRoutes}
            <Route path="*" element={<MemoizedPageTransition><NotFound /></MemoizedPageTransition>} />
        </Routes>
    </Suspense>
));
RouteConfig.displayName = 'RouteConfig';
export default RouteConfig;
