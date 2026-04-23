import { memo, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSupportContacts } from "../../store/slices/supportSlice";
import {
    mapSupportContacts,
    isNoNeedSelection,
} from "./supportSelectorUtils";
import {
    SupportHeader,
    SupportSelect,
    SelectedSupportPersonCard,
    NoNeedSupportCard,
    SupportEmptyState,
    TeamAvailableBadge,
} from "./SupportSelectorParts";

const buildFallbackPerson = (internalSelection) => ({
    name: internalSelection,
    displayValue: internalSelection,
    value: internalSelection,
    role: "Support Contact",
    department: "N/A",
    jobLevel: "N/A",
    unit: "N/A",
    jobPosition: "N/A",
    avatar: internalSelection ? internalSelection.charAt(0).toUpperCase() : "?",
});

const SupportSelector = memo(({ supportContact, onSupportChange }) => {
    const dispatch = useDispatch();
    const { contacts, loading } = useSelector((state) => state.support);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (contacts.length === 0 && isAuthenticated && !loading) {
            const timer = setTimeout(() => {
                dispatch(fetchSupportContacts());
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [dispatch, contacts.length, isAuthenticated, loading]);

    const supportContacts = useMemo(
        () => mapSupportContacts(contacts),
        [contacts]
    );

    const internalSelection = useMemo(() => {
        if (!supportContact) return "";
        const match = supportContacts.find(
            (c) => c.name === supportContact || c.value === supportContact
        );
        return match ? match.value : supportContact;
    }, [supportContact, supportContacts]);

    const selectedPerson = useMemo(() => {
        const found = supportContacts.find((c) => c.value === internalSelection || c.name === internalSelection);
        return found || buildFallbackPerson(internalSelection);
    }, [internalSelection, supportContacts]);

    const hasSelection = !!internalSelection;
    const isNoNeed = isNoNeedSelection(internalSelection);

    const handleInternalChange = (value) => {
        onSupportChange?.(value);
    };

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />
            <div className="relative z-10 p-5 md:p-6 space-y-5 md:space-y-4">
                <SupportHeader />

                <SupportSelect
                    value={internalSelection}
                    onChange={handleInternalChange}
                    hasSelection={hasSelection}
                    supportContacts={supportContacts}
                    loading={loading}
                />

                {hasSelection && !isNoNeed && selectedPerson?.id !== "no-need" && (
                    <SelectedSupportPersonCard selectedPerson={selectedPerson} />
                )}

                {isNoNeed && <NoNeedSupportCard />}
                {!hasSelection && <SupportEmptyState />}
                <TeamAvailableBadge />
            </div>
        </div>
    );
});

SupportSelector.displayName = "SupportSelector";

export default SupportSelector;
