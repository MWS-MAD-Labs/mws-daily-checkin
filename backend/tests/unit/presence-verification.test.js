const {
    calculateDistanceMeters,
    verifyStaffLocation
} = require('../../src/services/presenceVerificationService');
const { emotionalCheckinSchema } = require('../../src/utils/validationSchemas');

const ENV_KEYS = [
    'CHECKIN_STAFF_LOCATION_REQUIRED',
    'CHECKIN_SITE_LATITUDE',
    'CHECKIN_SITE_LONGITUDE',
    'CHECKIN_SITE_RADIUS_METERS',
    'CHECKIN_MAX_ACCURACY_METERS',
    'CHECKIN_EDGE_TOLERANCE_METERS',
    'CHECKIN_LOCATION_MAX_AGE_SECONDS'
];

describe('presence verification', () => {
    const originalEnv = {};

    beforeAll(() => {
        ENV_KEYS.forEach((key) => { originalEnv[key] = process.env[key]; });
    });

    beforeEach(() => {
        process.env.CHECKIN_STAFF_LOCATION_REQUIRED = 'true';
        process.env.CHECKIN_SITE_LATITUDE = '-6.2';
        process.env.CHECKIN_SITE_LONGITUDE = '106.8';
        process.env.CHECKIN_SITE_RADIUS_METERS = '75';
        process.env.CHECKIN_MAX_ACCURACY_METERS = '35';
        process.env.CHECKIN_EDGE_TOLERANCE_METERS = '10';
        process.env.CHECKIN_LOCATION_MAX_AGE_SECONDS = '45';
    });

    afterAll(() => {
        ENV_KEYS.forEach((key) => {
            if (originalEnv[key] === undefined) delete process.env[key];
            else process.env[key] = originalEnv[key];
        });
    });

    it('calculates zero distance for the same coordinate', () => {
        expect(calculateDistanceMeters(
            { latitude: -6.2, longitude: 106.8 },
            { latitude: -6.2, longitude: 106.8 }
        )).toBeCloseTo(0, 5);
    });

    it('accepts fresh accurate evidence inside the field', () => {
        const now = new Date();
        const result = verifyStaffLocation({
            method: 'browser_geolocation',
            latitude: -6.2,
            longitude: 106.8,
            accuracyMeters: 8,
            positionTimestamp: now,
            capturedAt: now,
            sampleCount: 2,
            acquisitionDurationMs: 1200
        });
        expect(result.decision.status).toBe('accepted');
        expect(result.decision.distanceMeters).toBe(0);
    });

    it('rejects inaccurate evidence', () => {
        const now = new Date();
        expect(() => verifyStaffLocation({
            method: 'browser_geolocation',
            latitude: -6.2,
            longitude: 106.8,
            accuracyMeters: 60,
            positionTimestamp: now,
            capturedAt: now
        })).toThrow('Location accuracy must be within 35 meters.');
    });

    it('rejects a stale reading', () => {
        const stale = new Date(Date.now() - 60000);
        expect(() => verifyStaffLocation({
            method: 'browser_geolocation',
            latitude: -6.2,
            longitude: 106.8,
            accuracyMeters: 8,
            positionTimestamp: stale,
            capturedAt: stale
        })).toThrow('Location reading is stale.');
    });

    it('keeps location and classroom evidence in the validated payload', () => {
        const base = {
            weatherType: 'sunny',
            selectedMoods: ['calm'],
            presenceLevel: 6,
            capacityLevel: 6
        };
        const location = emotionalCheckinSchema.validate({
            ...base,
            locationEvidence: {
                method: 'browser_geolocation',
                latitude: -6.2,
                longitude: 106.8,
                accuracyMeters: 10,
                positionTimestamp: new Date().toISOString(),
                capturedAt: new Date().toISOString()
            }
        });
        const session = emotionalCheckinSchema.validate({
            ...base,
            sessionEvidence: { sessionCode: '123456' }
        });
        expect(location.error).toBeUndefined();
        expect(location.value.locationEvidence.method).toBe('browser_geolocation');
        expect(session.error).toBeUndefined();
        expect(session.value.sessionEvidence.sessionCode).toBe('123456');
    });
});
