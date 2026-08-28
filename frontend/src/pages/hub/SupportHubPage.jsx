import { memo, useEffect } from "react";
import PageLoader from "@/components/PageLoader";

// This used to be a full app-picker (search, categories, app cards) - a
// second, duplicate copy of Hub's own catalog. Hub is the single place
// people launch apps from now (see mws-hub), so staff landing here (it's
// still getDefaultPostLoginPath's default for most staff roles - see
// utils/authRedirect.js) get sent straight there instead of into a stale
// copy of the same list.
const SupportHubPage = memo(() => {
    useEffect(() => {
        const hubBaseUrl = import.meta.env.VITE_HUB_BASE_URL || "http://localhost:5175";
        window.location.href = hubBaseUrl.replace(/\/$/, "");
    }, []);

    return <PageLoader />;
});

SupportHubPage.displayName = "SupportHubPage";
export default SupportHubPage;
