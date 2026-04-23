import React, { memo } from "react";
import { CheckCircle2, UserCircle } from "lucide-react";

const StudentSupportContactCard = memo(({ contact, selected, onSelect, displayName, categoryConfig }) => {
    const avatarInitials = (contact.name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const roleLabel = contact.displayRole || contact.classInfo || contact.jobPosition || contact.role;

    return (
        <button
            onClick={() => onSelect(contact)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 text-left ${selected
                ? `${categoryConfig?.bgLight || "bg-purple-50 dark:bg-purple-900/20"} ${categoryConfig?.borderLight || "border-purple-200 dark:border-purple-700/40"} shadow-sm`
                : "bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 hover:bg-white/60"
                }`}
        >
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${selected
                ? `bg-gradient-to-br ${categoryConfig?.gradient || "from-purple-400 to-pink-500"} text-white`
                : "bg-gray-100 dark:bg-gray-800/50 text-muted-foreground"
                }`}>
                {contact.avatar && contact.avatar !== "✓" ? contact.avatar : avatarInitials || <UserCircle className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{roleLabel}</p>
            </div>
            {selected && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
        </button>
    );
});

StudentSupportContactCard.displayName = "StudentSupportContactCard";

export default StudentSupportContactCard;
