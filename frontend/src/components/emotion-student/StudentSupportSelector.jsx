import React, { memo, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSupportContacts } from "@/store/slices/supportSlice";
import { motion } from "framer-motion";
import { UserCircle, GraduationCap, Heart, CheckCircle2, School } from "lucide-react";
import StudentSupportContactCard from "@/components/emotion-student/StudentSupportContactCard";
import {
    categoryConfig,
    getDisplayName,
    groupContactsByCategory,
    isSelectedContact,
} from "@/components/emotion-student/studentSupportSelectorUtils";

const GROUP_ICON_MAP = {
    UserCircle,
    GraduationCap,
    Heart,
    School,
};

const StudentSupportSelector = memo(({ supportContact, onSupportChange }) => {
    const dispatch = useDispatch();
    const { contacts: supportContacts, loading } = useSelector((state) => state.support);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (supportContacts.length === 0 && isAuthenticated) {
            dispatch(fetchSupportContacts());
        }
    }, [dispatch, isAuthenticated, supportContacts.length]);

    const handleSelect = useCallback((contact) => {
        if (contact.id === "no-need") {
            onSupportChange?.("No Need");
            return;
        }
        onSupportChange?.(contact.name || contact.id);
    }, [onSupportChange]);

    const groupedContacts = useMemo(
        () => groupContactsByCategory(supportContacts),
        [supportContacts]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl p-4 sm:p-5"
        >
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
                    <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h4 className="text-base font-bold text-foreground">Need Support?</h4>
                    <p className="text-xs text-muted-foreground">Choose someone to talk to</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-6 text-sm text-muted-foreground">Loading your support team...</div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedContacts.groups).map(([category, contacts]) => {
                        if (contacts.length === 0) return null;
                        const config = categoryConfig[category];

                        if (!config) {
                            return contacts.map((contact) => (
                                <StudentSupportContactCard
                                    key={contact.id}
                                    contact={contact}
                                    selected={isSelectedContact(contact, supportContact)}
                                    onSelect={handleSelect}
                                    displayName={getDisplayName(contact)}
                                />
                            ));
                        }

                        const GroupIcon = GROUP_ICON_MAP[config.icon] || UserCircle;
                        return (
                            <div key={category}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                                        <GroupIcon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{config.label}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {contacts.map((contact) => (
                                        <StudentSupportContactCard
                                            key={contact.id}
                                            contact={contact}
                                            selected={isSelectedContact(contact, supportContact)}
                                            onSelect={handleSelect}
                                            displayName={getDisplayName(contact)}
                                            categoryConfig={config}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {groupedContacts.noNeedOption && (
                        <button
                            onClick={() => handleSelect(groupedContacts.noNeedOption)}
                            className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${isSelectedContact(groupedContacts.noNeedOption, supportContact)
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 shadow-sm"
                                : "bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 hover:bg-white/60"
                                }`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelectedContact(groupedContacts.noNeedOption, supportContact) ? "bg-emerald-100 dark:bg-emerald-800/30" : "bg-gray-100 dark:bg-gray-800/30"}`}>
                                <CheckCircle2 className={`w-4.5 h-4.5 ${isSelectedContact(groupedContacts.noNeedOption, supportContact) ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`} />
                            </div>
                            <div className="text-left">
                                <p className={`text-sm font-semibold ${isSelectedContact(groupedContacts.noNeedOption, supportContact) ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                                    I'm feeling supported
                                </p>
                                <p className="text-xs text-muted-foreground">No support needed right now</p>
                            </div>
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
});

StudentSupportSelector.displayName = "StudentSupportSelector";

export default StudentSupportSelector;
