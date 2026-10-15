const express = require('express');
const router = express.Router();
const { getSyncStatus } = require('../controllers/syncController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');

// The sync with Central runs by itself, so there is only a status to read.
router.use(authenticate);

router.get('/status', requirePermission(PERMISSIONS.SYNC_READ), getSyncStatus);

module.exports = router;
