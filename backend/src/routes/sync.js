const express = require('express');
const router = express.Router();
const { getSyncStatus, triggerSync } = require('../controllers/syncController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');

// Viewing and triggering a sync each need their own Central permission.
// The shared cooldown (syncController.js) still limits how often one can run.
router.use(authenticate);

router.get('/status', requirePermission(PERMISSIONS.SYNC_READ), getSyncStatus);
router.post('/trigger', requirePermission(PERMISSIONS.SYNC_RUN), triggerSync);

module.exports = router;
