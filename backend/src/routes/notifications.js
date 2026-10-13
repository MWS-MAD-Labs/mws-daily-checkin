const express = require('express');
const router = express.Router();
const {
    getUserNotifications,
    getNotificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createSystemNotification,
    createSupportRequestNotification
} = require('../controllers/notificationController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');
const { validateQuery } = require('../middleware/validation');

// Get user's notifications with pagination and filtering
router.get('/', authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_SELF_MANAGE), validateQuery({
    page: 'number',
    limit: 'number',
    isRead: 'boolean',
    category: 'string',
    priority: 'string'
}), getUserNotifications);

// Get notification statistics for the authenticated user
router.get('/stats', authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_SELF_MANAGE), getNotificationStats);

// Mark a specific notification as read
router.patch('/:notificationId/read', authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_SELF_MANAGE), markAsRead);

// Mark all notifications as read for the authenticated user
router.patch('/read-all', authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_SELF_MANAGE), markAllAsRead);

// Delete a notification
router.delete('/:notificationId', authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_SELF_MANAGE), deleteNotification);

// Admin-only routes for creating notifications
router.post('/system', authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_CREATE), createSystemNotification);
router.post('/support-request', authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_CREATE), createSupportRequestNotification);

module.exports = router;
