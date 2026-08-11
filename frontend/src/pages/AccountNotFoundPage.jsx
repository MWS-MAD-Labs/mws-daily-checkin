import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { UserX } from "lucide-react";
import { StatusMessagePage } from "mws-central-auth-ui";
import AnimatedPage from "@/components/AnimatedPage";

// Fallback only - confirm the real support inbox with the team before relying on this.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "admin@millennia21.id";

// Matches this app's shadcn/ui CSS variables so the page looks native here
// (dark-mode aware). StatusMessagePage itself makes no assumption about
// these variables existing - other apps can pass their own theme or none.
const THEME = {
    cardBackground: "hsl(var(--card) / 0.6)",
    cardBorder: "hsl(var(--border) / 0.4)",
    primary: "hsl(var(--primary))",
    primaryForeground: "hsl(var(--primary-foreground))",
    foreground: "hsl(var(--foreground))",
    mutedForeground: "hsl(var(--muted-foreground))",
};

export default function AccountNotFoundPage() {
    const navigate = useNavigate();

    const actions = [
        { label: "Back to Sign In", onClick: () => navigate("/") },
        { label: "Contact Administrator", href: `mailto:${SUPPORT_EMAIL}` },
    ];

    return (
        <AnimatedPage>
            <Helmet>
                <title>Account Not Found — Kerjain</title>
            </Helmet>
            <StatusMessagePage
                icon={<UserX className="h-10 w-10" />}
                title="Account Not Found"
                message="This account isn't registered in our system. If that's a mistake, please contact the administrator."
                actions={actions}
                theme={THEME}
                // Matches AnimatedPage's own 0.5s fade duration above, so this
                // component's entrance animation isn't masked underneath it.
                startDelay={0.5}
            />
        </AnimatedPage>
    );
}
