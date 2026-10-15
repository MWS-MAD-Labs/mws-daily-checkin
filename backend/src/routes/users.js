const express = require('express');
const router = express.Router();
const { getUsers, getUserById, getOrganizationStructure } = require('../controllers/userController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');
const { validateQuery } = require('../middleware/validation');
const { paginationSchema } = require('../utils/validationSchemas');

// Users and organizations are managed in Central, so this is read-only.
router.use(authenticate);

// Filter options and headcount stats
router.get('/organization', requirePermission(PERMISSIONS.USERS_READ), getOrganizationStructure);

router.get('/', requirePermission(PERMISSIONS.USERS_READ), validateQuery(paginationSchema), getUsers);

router.get('/:id', requirePermission(PERMISSIONS.USERS_READ), getUserById);

module.exports = router;
