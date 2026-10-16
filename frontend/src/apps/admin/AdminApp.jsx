import { Suspense, lazy, memo } from "react";
import { Route, Routes } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import PageTransition from "@/components/app/PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DASHBOARD } from "@/constants/enums";
import { PERMISSIONS as P } from "@/constants/permissions";

const EmotionalCheckinDashboard = lazy(
  () => import("@/apps/admin/pages/EmotionalCheckinDashboard"),
);
const EmotionalCheckinTeacherDashboard = lazy(
  () => import("@/apps/admin/pages/EmotionalCheckinTeacherDashboard"),
);
const NotSubmittedUsersPage = lazy(
  () => import("@/apps/admin/pages/NotSubmittedUsersPage"),
);
const EmotionalWellnessPage = lazy(
  () => import("@/apps/admin/pages/IndividualDashboard"),
);
const UserManagementDashboard = lazy(
  () => import("@/apps/admin/pages/UserManagementDashboard"),
);
const NotFound = lazy(() => import("@/pages/NotFound"));

const ADMIN_PATHS = [
  "/emotional-checkin/dashboard",
  "/emotional-checkin/teacher-dashboard",
  "/emotional-checkin/not-submitted",
  "/emotional-wellness",
  "/user-management",
];

export const ownsAdminPath = (pathname) =>
  ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

const Page = memo(({ children }) => (
  <PageTransition>{children}</PageTransition>
));
Page.displayName = "AdminPageTransition";

const AdminApp = memo(() => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route
        path="/emotional-checkin/dashboard"
        element={
          <ProtectedRoute dashboard={DASHBOARD.STAFF}>
            <Page>
              <EmotionalCheckinDashboard />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-checkin/teacher-dashboard"
        element={
          <ProtectedRoute dashboard={DASHBOARD.STUDENT}>
            <Page>
              <EmotionalCheckinTeacherDashboard />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-checkin/not-submitted"
        element={
          <ProtectedRoute dashboard={DASHBOARD.STAFF}>
            <Page>
              <NotSubmittedUsersPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-wellness"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <EmotionalWellnessPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emotional-wellness/:userId"
        element={
          <ProtectedRoute anyPermission={[P.CHECKIN_SELF_READ]}>
            <Page>
              <EmotionalWellnessPage />
            </Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management"
        element={
          <ProtectedRoute anyPermission={[P.USERS_READ]}>
            <Page>
              <UserManagementDashboard />
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

AdminApp.displayName = "AdminApp";

export default AdminApp;
