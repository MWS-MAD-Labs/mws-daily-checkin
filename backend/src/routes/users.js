const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getOrganizationStructure,
    assignUserToOrganization,
    getOrganizationMembers,
    getUserOrganizations,
    createOrganization
} = require('../controllers/userController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');
const { validate, validateQuery } = require('../middleware/validation');
const { userCreateSchema, userUpdateSchema, paginationSchema } = require('../utils/validationSchemas');

// All routes require authentication
router.use(authenticate);

// Get organization structure (available to directorate and above)
router.get('/organization', requirePermission(PERMISSIONS.USERS_READ), getOrganizationStructure);

// Get all users with filtering and pagination (allow directorate access)
router.get('/', requirePermission(PERMISSIONS.USERS_READ), validateQuery(paginationSchema), getUsers);

// Get user by ID
router.get('/:id', requirePermission(PERMISSIONS.USERS_READ), getUserById);

// Create new user (admin only)
router.post('/', requirePermission(PERMISSIONS.USERS_MANAGE), validate(userCreateSchema), createUser);

// Update user
router.put('/:id', requirePermission(PERMISSIONS.USERS_MANAGE), validate(userUpdateSchema), updateUser);

// Delete user (soft delete)
router.delete('/:id', requirePermission(PERMISSIONS.USERS_DEACTIVATE), deleteUser);

// Assign user to organization
router.post('/assign-organization', requirePermission(PERMISSIONS.ORGANIZATIONS_MANAGE), assignUserToOrganization);

// Get organization members
router.get('/organization/:organizationId/members', requirePermission(PERMISSIONS.USERS_READ), getOrganizationMembers);

// Get user's organizations
router.get('/:userId/organizations', requirePermission(PERMISSIONS.USERS_READ), getUserOrganizations);

// Create organization
router.post('/organization', requirePermission(PERMISSIONS.ORGANIZATIONS_MANAGE), createOrganization);

module.exports = router;
