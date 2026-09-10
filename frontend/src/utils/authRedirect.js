const PENDING_AUTH_REDIRECT_KEY = "pending_auth_redirect";

// React Router's basename ('/daily-checkin', main.jsx) already strips the
// app prefix off location.pathname, so a legitimate value here never starts
// with another app's own path segment. A stray '/mtss/...' (or similar)
// only shows up when the browser previously loaded a sibling app's page
// under this origin - e.g. nginx's /mtss/ fallback proxy serving this
// container's own index.html when its upstream is unreachable - and
// ProtectedRoute captured that foreign pathname as a pending redirect.
const FOREIGN_APP_PREFIXES = ["/mtss", "/daily-checkin"];

export const sanitizeRedirectPath = (value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
        return null;
    }

    if (trimmed.startsWith("/auth/callback")) {
        return null;
    }

    if (FOREIGN_APP_PREFIXES.some((prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`))) {
        return null;
    }

    return trimmed;
};

export const storePendingRedirect = (value) => {
    if (typeof window === "undefined") return;

    const sanitized = sanitizeRedirectPath(value);
    if (!sanitized || sanitized === "/") return;

    window.sessionStorage.setItem(PENDING_AUTH_REDIRECT_KEY, sanitized);
};

export const peekPendingRedirect = () => {
    if (typeof window === "undefined") return null;
    return sanitizeRedirectPath(window.sessionStorage.getItem(PENDING_AUTH_REDIRECT_KEY));
};

export const consumePendingRedirect = () => {
    if (typeof window === "undefined") return null;

    const redirect = peekPendingRedirect();
    window.sessionStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);
    return redirect;
};

export const getDefaultPostLoginPath = (userOrRole) => {
    const user = userOrRole && typeof userOrRole === "object" ? userOrRole : null;
    const normalizedRole = String(user?.role || userOrRole || "").trim().toLowerCase();

    if (normalizedRole === "student") {
        return "/student/support-hub";
    }

    // Every staff/teacher role lands on /home - the real home page (final
    // URL /daily-checkin/home via the app's own basename, main.jsx), which
    // has its own link out to the real Hub for launching other apps.
    return "/home";
};
