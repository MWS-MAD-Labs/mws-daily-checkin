const express = require('express');
const router = express.Router();
const { getSupportContacts } = require('../controllers/supportController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');

// Get support contacts (directorates)
router.get('/contacts', authenticate, requirePermission(PERMISSIONS.SUPPORT_CONTACTS_READ), getSupportContacts);

module.exports = router;