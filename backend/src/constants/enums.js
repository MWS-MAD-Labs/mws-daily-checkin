// Values the code compares against. Keep them here so no gate or filter writes a string by hand.

// How much of the dashboard a person may see.
const SCOPE_MODE = Object.freeze({
    ALL: 'all',
    UNIT: 'unit',
    ASSIGNED: 'assigned',
    NONE: 'none',
});

// Same words as person_type in Central.
const PERSON_TYPE = Object.freeze({
    EMPLOYEE: 'employee',
    STUDENT: 'student',
});

module.exports = { SCOPE_MODE, PERSON_TYPE };
