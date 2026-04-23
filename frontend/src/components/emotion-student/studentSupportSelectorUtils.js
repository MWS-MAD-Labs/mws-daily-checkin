export const categoryConfig = {
    classTeacher: {
        label: "Homeroom Teachers",
        icon: "GraduationCap",
        gradient: "from-sky-400 to-blue-500",
        bgLight: "bg-sky-50 dark:bg-sky-900/20",
        borderLight: "border-sky-200 dark:border-sky-700/40"
    },
    seTeacher: {
        label: "SE Teachers",
        icon: "UserCircle",
        gradient: "from-emerald-400 to-teal-500",
        bgLight: "bg-emerald-50 dark:bg-emerald-900/20",
        borderLight: "border-emerald-200 dark:border-emerald-700/40"
    },
    gradeTeacher: {
        label: "Grade Teachers",
        icon: "GraduationCap",
        gradient: "from-indigo-400 to-violet-500",
        bgLight: "bg-indigo-50 dark:bg-indigo-900/20",
        borderLight: "border-indigo-200 dark:border-indigo-700/40"
    },
    principal: {
        label: "Your Principal",
        icon: "School",
        gradient: "from-amber-400 to-orange-500",
        bgLight: "bg-amber-50 dark:bg-amber-900/20",
        borderLight: "border-amber-200 dark:border-amber-700/40"
    },
    psychologist: {
        label: "School Psychologist",
        icon: "Heart",
        gradient: "from-pink-400 to-rose-500",
        bgLight: "bg-pink-50 dark:bg-pink-900/20",
        borderLight: "border-pink-200 dark:border-pink-700/40"
    }
};

export function groupContactsByCategory(supportContacts = []) {
    const groups = { classTeacher: [], seTeacher: [], gradeTeacher: [], principal: [], psychologist: [], other: [] };
    const noNeedOption = supportContacts.find((c) => c.id === "no-need");

    supportContacts.forEach((contact) => {
        if (contact.id === "no-need") return;
        let cat = "other";
        if (contact.isClassTeacher) {
            cat = "classTeacher";
        } else if (contact.isSETeacher || contact.contactCategory === "seTeacher") {
            cat = "seTeacher";
        } else if (contact.isGradeTeacher || contact.contactCategory === "gradeTeacher") {
            cat = "gradeTeacher";
        } else if (contact.contactCategory) {
            cat = contact.contactCategory;
        }

        if (groups[cat]) {
            groups[cat].push(contact);
        } else {
            groups.other.push(contact);
        }
    });

    return { groups, noNeedOption };
}

export function isSelectedContact(contact, supportContact) {
    if (contact.id === "no-need") return supportContact === "No Need";
    return supportContact === contact.name || supportContact === contact.id;
}

export function getDisplayName(contact) {
    const name = contact.displayName || contact.preferredName || contact.name || "";
    if (contact.gender === "female" && !name.startsWith("Ms.") && !name.startsWith("Mrs.")) {
        return `Ms. ${name.split(" ")[0]}`;
    }
    if (contact.gender === "male" && !name.startsWith("Mr.")) {
        return `Mr. ${name.split(" ")[0]}`;
    }
    return name;
}
