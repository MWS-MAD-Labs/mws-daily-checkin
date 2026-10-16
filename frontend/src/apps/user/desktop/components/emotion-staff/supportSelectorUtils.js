export const getHonorific = (gender) => {
    if (!gender) return "";
    const normalized = String(gender).toLowerCase();
    if (normalized === "f" || normalized === "female") return "Ms.";
    if (normalized === "m" || normalized === "male") return "Mr.";
    return "";
};

export const buildDisplayName = (contact) => {
    if (contact?.displayName) return contact.displayName;
    const honorific = getHonorific(contact?.gender);
    const base = contact?.username || contact?.name || "";
    return `${honorific ? `${honorific} ` : ""}${base}`.trim();
};

export const mapSupportContacts = (contacts = []) => {
    if (!contacts.length) return [];
    return contacts.map((contact) => {
        const displayValue = buildDisplayName(contact);
        return {
            ...contact,
            displayValue,
            value: displayValue,
            avatar: contact.avatar || displayValue.charAt(0).toUpperCase(),
        };
    });
};

export const isNoNeedSelection = (selection) => selection === "No Need";
