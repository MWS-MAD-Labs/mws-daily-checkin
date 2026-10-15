const PERMISSIONS = Object.freeze({
    CHECKIN_SELF_READ: 'checkin.self.read',
    CHECKIN_SELF_SUBMIT: 'checkin.self.submit',
    CHECKIN_STUDENT_SUBMIT: 'checkin.student.submit',
    SUPPORT_CONTACTS_READ: 'support.contacts.read',
    NOTIFICATIONS_SELF_MANAGE: 'notifications.self.manage',
    NOTIFICATIONS_CREATE: 'notifications.create',
    ASSISTANT_USE: 'assistant.use',
    ASSISTANT_AUTOMATION_EXECUTE: 'assistant.automation.execute',
    STUDENT_CHECKINS_READ: 'student_checkins.read',
    STUDENT_CHECKINS_SCOPE_UNIT: 'student_checkins.scope.unit',
    STUDENT_CHECKINS_SCOPE_ALL: 'student_checkins.scope.all',
    DASHBOARD_READ: 'dashboard.read',
    DASHBOARD_EXPORT: 'dashboard.export',
    DASHBOARD_SCOPE_UNIT: 'dashboard.scope.unit',
    DASHBOARD_SCOPE_ALL: 'dashboard.scope.all',
    SUPPORT_REQUESTS_MANAGE: 'support_requests.manage',
    USERS_READ: 'users.read',
    SYNC_READ: 'sync.read',
    DEV_TOPOLOGY_READ: 'dev_topology.read',
    HUB_SUPPORT_ACCESS: 'hub.support.access',
});

// What Central shows next to each permission. `requires` keeps a role from carrying a permission without the
// ones it cannot work without.
const PERMISSION_DETAILS = Object.freeze({
    [PERMISSIONS.CHECKIN_SELF_READ]: { description: 'See my own check-ins, results and history' },
    [PERMISSIONS.CHECKIN_SELF_SUBMIT]: { description: 'Submit my own staff check-in', requires: [PERMISSIONS.CHECKIN_SELF_READ] },
    [PERMISSIONS.CHECKIN_STUDENT_SUBMIT]: { description: 'Submit my own student check-in', requires: [PERMISSIONS.CHECKIN_SELF_READ] },
    [PERMISSIONS.SUPPORT_CONTACTS_READ]: { description: 'See the support contacts available to me' },
    [PERMISSIONS.NOTIFICATIONS_SELF_MANAGE]: { description: 'See and manage my own notifications' },
    [PERMISSIONS.NOTIFICATIONS_CREATE]: { description: 'Send notifications to other people' },
    [PERMISSIONS.ASSISTANT_USE]: { description: 'Use the AI assistant' },
    [PERMISSIONS.ASSISTANT_AUTOMATION_EXECUTE]: {
        description: 'Let the AI assistant run actions for me, such as opening pages and filling filters',
        requires: [PERMISSIONS.ASSISTANT_USE],
    },
    [PERMISSIONS.STUDENT_CHECKINS_READ]: {
        description: 'Open the student check-in dashboard. Without a scope permission it shows only the students in my assigned classes',
    },
    [PERMISSIONS.STUDENT_CHECKINS_SCOPE_UNIT]: {
        description: 'Student dashboard: show every student in my unit, filtered by class',
        requires: [PERMISSIONS.STUDENT_CHECKINS_READ],
    },
    [PERMISSIONS.STUDENT_CHECKINS_SCOPE_ALL]: {
        description: 'Student dashboard: show every student in the school, filtered by unit and class',
        requires: [PERMISSIONS.STUDENT_CHECKINS_READ],
    },
    [PERMISSIONS.DASHBOARD_READ]: {
        description: 'Open the staff emotional dashboard. It needs a scope permission below to show anyone',
    },
    [PERMISSIONS.DASHBOARD_EXPORT]: { description: 'Export dashboard data', requires: [PERMISSIONS.DASHBOARD_READ] },
    [PERMISSIONS.DASHBOARD_SCOPE_UNIT]: {
        description: 'Staff dashboard: show every staff member in my unit',
        requires: [PERMISSIONS.DASHBOARD_READ],
    },
    [PERMISSIONS.DASHBOARD_SCOPE_ALL]: {
        description: 'Staff dashboard: show every staff member in the school',
        requires: [PERMISSIONS.DASHBOARD_READ],
    },
    [PERMISSIONS.SUPPORT_REQUESTS_MANAGE]: {
        description: 'Confirm and handle support requests raised by check-ins',
        requires: [PERMISSIONS.DASHBOARD_READ],
    },
    [PERMISSIONS.USERS_READ]: { description: 'Open User Management and see the people synced from Central' },
    [PERMISSIONS.SYNC_READ]: { description: 'See when Daily last synced with Central and whether it hit a problem' },
    [PERMISSIONS.DEV_TOPOLOGY_READ]: { description: 'See the development topology' },
    [PERMISSIONS.HUB_SUPPORT_ACCESS]: { description: 'Show the Support Hub link in the quick menu' },
});

const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));
const PERMISSION_SET = new Set(PERMISSION_VALUES);

module.exports = { PERMISSIONS, PERMISSION_DETAILS, PERMISSION_VALUES, PERMISSION_SET };
