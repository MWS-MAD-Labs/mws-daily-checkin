import { memo } from "react";
import { CheckCircle2, ChevronDown, UserCheck, Users } from "lucide-react";

export const SupportHeader = memo(() => (
    <header className="space-y-2">
        <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald/20 via-emerald/10 to-primary/10 border border-emerald/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald" />
            </div>
            <div className="space-y-0.5">
                <h3 className="text-base md:text-lg font-semibold text-foreground">
                    Need Support?
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                    Choose someone to check in with you today.
                </p>
            </div>
        </div>
    </header>
));

export const SupportSelect = memo(({ value, onChange, hasSelection, supportContacts, loading }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading || supportContacts.length === 0}
            className={`w-full rounded-xl border px-4 py-3 pr-10 text-sm bg-card/70 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald/25 ${
                hasSelection
                    ? "border-emerald/35 text-foreground"
                    : "border-border text-muted-foreground hover:border-emerald/25"
            } ${loading || supportContacts.length === 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <option value="">
                {loading
                    ? "Loading support contacts..."
                    : supportContacts.length === 0
                        ? "No contacts available"
                        : "Choose a support contact"}
            </option>
            {supportContacts.map((contact) => (
                <option key={contact.id} value={contact.value}>
                    {contact.displayValue}
                </option>
            ))}
        </select>

        <ChevronDown className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${hasSelection ? "text-emerald" : "text-muted-foreground"}`} />
    </div>
));

export const SelectedSupportPersonCard = memo(({ selectedPerson }) => (
    <div className="rounded-xl border border-emerald/28 bg-emerald/10 p-3.5 md:p-4">
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald/20 border border-emerald/28 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald">
                    {selectedPerson.avatar}
                </span>
            </div>
            <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald flex-shrink-0" />
                    <p className="text-sm font-semibold text-foreground truncate">
                        {selectedPerson.displayValue || selectedPerson.displayName || selectedPerson.name}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    We will route your check-in so this person can connect with you today.
                </p>
            </div>
        </div>
    </div>
));

export const NoNeedSupportCard = memo(() => (
    <div className="rounded-xl border border-emerald/30 bg-emerald/10 p-3.5 md:p-4">
        <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald/20 border border-emerald/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                    Great, you're feeling supported.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    You can still submit this check-in and update support preference later.
                </p>
            </div>
        </div>
    </div>
));

export const SupportEmptyState = memo(() => (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3.5 md:p-4">
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Select a contact if you want follow-up support, or choose <span className="font-semibold text-foreground">No Need</span> when you're okay for today.
        </p>
    </div>
));

export const TeamAvailableBadge = memo(() => (
    <div className="flex items-center justify-center gap-2 pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gold to-emerald" />
        <p className="text-xs text-muted-foreground">
            Support team availability is active today.
        </p>
    </div>
));

SupportHeader.displayName = "SupportHeader";
SupportSelect.displayName = "SupportSelect";
SelectedSupportPersonCard.displayName = "SelectedSupportPersonCard";
NoNeedSupportCard.displayName = "NoNeedSupportCard";
SupportEmptyState.displayName = "SupportEmptyState";
TeamAvailableBadge.displayName = "TeamAvailableBadge";
