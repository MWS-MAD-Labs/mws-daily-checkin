const { z } = require('zod');
const { PERMISSION_SET } = require('../constants/permissions');

const APP_ID = 'daily-checkin';

const entitlementSchema = z.object({
    id: z.string().trim().min(1),
    application_id: z.literal(APP_ID),
    organization_id: z.string().trim().min(1),
    role: z.string().trim().min(1),
    permissions: z.array(z.string().trim().min(1)).max(100),
    version: z.number().int().nonnegative(),
}).strict();

// The organization this deployment is for. CENTRAL_ORGANIZATION_ID is the name every application gets from Central,
// the older name is still read until the .env is replaced.
function expectedOrganizationId() {
    return process.env.CENTRAL_ORGANIZATION_ID || process.env.CENTRAL_ENTITLEMENT_ORGANIZATION_ID;
}

function validateEntitlement(input, expectedOrganizationIdValue = expectedOrganizationId()) {
    if (!expectedOrganizationIdValue) {
        throw new Error('CENTRAL_ORGANIZATION_ID is not configured');
    }

    const entitlement = entitlementSchema.parse(input);
    if (entitlement.organization_id !== expectedOrganizationIdValue) {
        throw new Error('Entitlement organization does not match this deployment');
    }

    const unknown = entitlement.permissions.filter((permission) => !PERMISSION_SET.has(permission));
    if (unknown.length > 0) {
        throw new Error(`Entitlement contains unknown permissions: ${unknown.join(', ')}`);
    }

    return {
        ...entitlement,
        permissions: [...new Set(entitlement.permissions)].sort(),
    };
}

function entitlementProjection(entitlement) {
    return {
        centralEntitlementId: entitlement.id,
        centralEntitlementApplicationId: entitlement.application_id,
        centralEntitlementOrganizationId: entitlement.organization_id,
        centralEntitlementRole: entitlement.role,
        centralEntitlementPermissions: entitlement.permissions,
        centralEntitlementVersion: entitlement.version,
        centralEntitlementUpdatedAt: new Date(),
    };
}

function projectionChanged(user, projection) {
    return user.centralEntitlementId !== projection.centralEntitlementId
        || user.centralEntitlementApplicationId !== projection.centralEntitlementApplicationId
        || user.centralEntitlementOrganizationId !== projection.centralEntitlementOrganizationId
        || user.centralEntitlementRole !== projection.centralEntitlementRole
        || Number(user.centralEntitlementVersion ?? -1) !== projection.centralEntitlementVersion
        || JSON.stringify([...(user.centralEntitlementPermissions || [])].sort()) !== JSON.stringify(projection.centralEntitlementPermissions);
}

function applyEntitlementProjection(user, entitlement) {
    const projection = entitlementProjection(entitlement);
    const changed = projectionChanged(user, projection);
    Object.assign(user, projection);
    if (changed && !user.isNew) user.sessionVersion = (user.sessionVersion || 0) + 1;
    return changed;
}

module.exports = {
    APP_ID,
    entitlementSchema,
    validateEntitlement,
    expectedOrganizationId,
    entitlementProjection,
    projectionChanged,
    applyEntitlementProjection,
};
