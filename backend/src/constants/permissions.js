const PERMISSIONS = Object.freeze({
    CHECKIN_SELF_READ: 'checkin.self.read',
    CHECKIN_SELF_SUBMIT: 'checkin.self.submit',
    SUPPORT_CONTACTS_READ: 'support.contacts.read',
    NOTIFICATIONS_SELF_MANAGE: 'notifications.self.manage',
    ASSISTANT_USE: 'assistant.use',
    STUDENT_CHECKINS_READ: 'student_checkins.read',
    DASHBOARD_READ: 'dashboard.read',
    DASHBOARD_EXPORT: 'dashboard.export',
    SUPPORT_REQUESTS_MANAGE: 'support_requests.manage',
    USERS_READ: 'users.read',
    USERS_MANAGE: 'users.manage',
    USERS_DEACTIVATE: 'users.deactivate',
    ORGANIZATIONS_MANAGE: 'organizations.manage',
    NOTIFICATIONS_CREATE: 'notifications.create',
    SYNC_READ: 'sync.read',
    SYNC_RUN: 'sync.run',
    DEV_TOPOLOGY_READ: 'dev_topology.read',
    ATTENDANCE_SELF_READ: 'attendance.self.read',
    ATTENDANCE_SELF_SUBMIT: 'attendance.self.submit',
    ATTENDANCE_STAFF_READ: 'attendance.staff.read',
    ATTENDANCE_EXPORT: 'attendance.export',
    ATTENDANCE_SETTINGS_MANAGE: 'attendance.settings.manage',
    ATTENDANCE_CORRECTIONS_REQUEST: 'attendance.corrections.request',
    ATTENDANCE_CORRECTIONS_MANAGE: 'attendance.corrections.manage',
});

const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));
const PERMISSION_SET = new Set(PERMISSION_VALUES);

module.exports = { PERMISSIONS, PERMISSION_VALUES, PERMISSION_SET };
