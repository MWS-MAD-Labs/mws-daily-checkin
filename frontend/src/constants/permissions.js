// Same keys as backend/src/constants/permissions.js. Central decides who holds them.
export const PERMISSIONS = Object.freeze({
    CHECKIN_SELF_READ: 'checkin.self.read',
    CHECKIN_SELF_SUBMIT: 'checkin.self.submit',
    CHECKIN_STUDENT_SUBMIT: 'checkin.student.submit',
    SUPPORT_CONTACTS_READ: 'support.contacts.read',
    NOTIFICATIONS_SELF_MANAGE: 'notifications.self.manage',
    ASSISTANT_USE: 'assistant.use',
    ASSISTANT_AUTOMATION_EXECUTE: 'assistant.automation.execute',
    STUDENT_CHECKINS_READ: 'student_checkins.read',
    DASHBOARD_READ: 'dashboard.read',
    DASHBOARD_EXPORT: 'dashboard.export',
    USERS_READ: 'users.read',
    SYNC_READ: 'sync.read',
    HUB_SUPPORT_ACCESS: 'hub.support.access',
});
