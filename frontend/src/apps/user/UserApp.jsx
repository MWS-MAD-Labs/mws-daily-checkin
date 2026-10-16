import { Suspense, lazy, memo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import PageTransition from "@/components/app/PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import RootRedirect from "@/components/app/RootRedirect";
import { PERSON_TYPE } from "@/constants/enums";
import { PERMISSIONS as P } from "@/constants/permissions";

const AccountNotFoundPage = lazy(() => import("@/apps/user/desktop/pages/AccountNotFoundPage"));
const EmotionalCheckinFaceScanPage = lazy(
  () => import("@/apps/user/desktop/pages/VerificationPage"),
);
const ProfilePage = lazy(() => import("@/apps/user/desktop/pages/ProfilePage"));
const NotificationPage = lazy(() => import("@/apps/user/desktop/pages/NotificationPage"));
const NotificationSettingsPage = lazy(
  () => import("@/apps/user/desktop/pages/NotificationSettingsPage"),
);
const RoleSelectionPage = lazy(() => import("@/apps/user/desktop/pages/RoleSelectionPage"));
const RatingPage = lazy(() => import("@/apps/user/desktop/pages/RatingPage"));
const EmotionalCheckinPage = lazy(() => import("@/apps/user/desktop/pages/EmotionalCheckinPage"));
const EmotionalCheckinStaffPage = lazy(
  () => import("@/apps/user/desktop/pages/EmotionalCheckinStaffPage"),
);
const PersonalStatsPage = lazy(() => import("@/apps/user/desktop/pages/PersonalStatsPage"));
const EmotionalHistoryPage = lazy(() => import("@/apps/user/desktop/pages/EmotionalHistoryPage"));
const EmotionalPatternsPage = lazy(
  () => import("@/apps/user/desktop/pages/EmotionalPatternsPage"),
);
const StudentEmotionalCheckinPage = lazy(
  () => import("@/apps/user/desktop/pages/StudentEmotionalCheckinPage"),
);
const StudentFaceScanPage = lazy(() => import("@/apps/user/desktop/pages/StudentFaceScanPage"));
const StudentManualCheckinPage = lazy(
  () => import("@/apps/user/desktop/pages/StudentManualCheckinPage"),
);
const StudentAICheckinPage = lazy(() => import("@/apps/user/desktop/pages/StudentAICheckinPage"));
const StudentSupportHubPage = lazy(
  () => import("@/apps/user/desktop/pages/StudentSupportHubPage"),
);
const NotFound = lazy(() => import("@/pages/NotFound"));

const Page = memo(({ children }) => (
  <PageTransition>{children}</PageTransition>
));
Page.displayName = "UserPageTransition";

const UserApp = memo(() => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/account-not-found"
        element={
          <Page>
            <AccountNotFoundPage />
          </Page>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute personType={PERSON_TYPE.EMPLOYEE}>
            <Page>
              <RoleSelectionPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route path="/select-role" element={<Navigate to="/home" replace />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Page>
              <ProfilePage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute anyPermission={[P.NOTIFICATIONS_SELF_MANAGE]}>
            <Page>
              <NotificationPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/settings"
        element={
          <ProtectedRoute anyPermission={[P.NOTIFICATIONS_SELF_MANAGE]}>
            <Page>
              <NotificationSettingsPage />
            </Page>
          </ProtectedRoute>
        }
      />

      <Route
        path="/emotional-checkin"
        element={
          <ProtectedRoute
            anyPermission={[P.CHECKIN_SELF_SUBMIT, P.CHECKIN_STUDENT_SUBMIT]}
          >
            <Page>
              <EmotionalCheckinPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-checkin/staff"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_SUBMIT]}>
            <Page>
              <EmotionalCheckinStaffPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-checkin/face-scan"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_SUBMIT]}>
            <Page>
              <EmotionalCheckinFaceScanPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-checkin/rate"
        element={
          <ProtectedRoute
            anyPermission={[P.CHECKIN_SELF_SUBMIT, P.CHECKIN_STUDENT_SUBMIT]}
          >
            <Page>
              <RatingPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-checkin/rate/:checkinId"
        element={
          <ProtectedRoute
            anyPermission={[P.CHECKIN_SELF_SUBMIT, P.CHECKIN_STUDENT_SUBMIT]}
          >
            <Page>
              <RatingPage />
            </Page>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/personal-stats"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <PersonalStatsPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/personal-stats/:userId"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <PersonalStatsPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/emotional-history"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <EmotionalHistoryPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/emotional-history/:userId"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <EmotionalHistoryPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/emotional-patterns"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <EmotionalPatternsPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/emotional-patterns/:userId"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <EmotionalPatternsPage />
            </Page>
          </ProtectedRoute>
        }
      />

      <Route path="/support-hub" element={<Navigate to="/home" replace />} />
      <Route
        path="/student/support-hub"
        element={
          <ProtectedRoute
            personType={PERSON_TYPE.STUDENT}
            anyPermission={[P.SUPPORT_CONTACTS_READ]}
          >
            <Page>
              <StudentSupportHubPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/emotional-checkin"
        element={
          <ProtectedRoute
            personType={PERSON_TYPE.STUDENT}
            anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}
          >
            <Page>
              <StudentEmotionalCheckinPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/emotional-checkin/face-scan"
        element={
          <ProtectedRoute
            personType={PERSON_TYPE.STUDENT}
            anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}
          >
            <Page>
              <StudentFaceScanPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/emotional-checkin/manual"
        element={
          <ProtectedRoute
            personType={PERSON_TYPE.STUDENT}
            anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}
          >
            <Page>
              <StudentManualCheckinPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/emotional-checkin/ai"
        element={
          <ProtectedRoute
            personType={PERSON_TYPE.STUDENT}
            anyPermission={[P.CHECKIN_STUDENT_SUBMIT]}
          >
            <Page>
              <StudentAICheckinPage />
            </Page>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Page>
            <NotFound />
          </Page>
        }
      />
    </Routes>
  </Suspense>
));

UserApp.displayName = "UserApp";

export default UserApp;
