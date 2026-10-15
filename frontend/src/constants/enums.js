// Same values as backend/src/constants/enums.js.
export const SCOPE_MODE = Object.freeze({
    ALL: 'all',
    UNIT: 'unit',
    ASSIGNED: 'assigned',
    NONE: 'none',
});

export const PERSON_TYPE = Object.freeze({
    EMPLOYEE: 'employee',
    STUDENT: 'student',
});

// What the AI assistant treats a person as, worked out from their permissions (utils/accessControl.js).
export const ASSISTANT_PROFILE = Object.freeze({
    STUDENT: 'student',
    ADMIN: 'admin',
    LEADER: 'principal',
    TEACHER: 'teacher',
    STAFF: 'staff',
});

// The dock may run actions only for people holding assistant.automation.execute.
export const AUTOMATION_PROFILE = 'automation';

// Which dashboard a route or card belongs to.
export const DASHBOARD = Object.freeze({
    STAFF: 'staff',
    STUDENT: 'student',
});
