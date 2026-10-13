const { resolveAttendanceWindow } = require('../../src/services/attendanceService');
const { attendanceCheckinSchema, attendanceSiteSchema, emotionalCheckinSchema, supportRequestCreateSchema } = require('../../src/utils/validationSchemas');

const site = {
    timezone: 'Asia/Jakarta',
    checkinOpenTime: '06:30',
    presentUntilTime: '07:15',
    lateUntilTime: '08:00',
    activeWeekdays: [1, 2, 3, 4, 5]
};

describe('attendance service', () => {
    it('marks staff present before the present cutoff', () => {
        const result = resolveAttendanceWindow(site, new Date('2026-10-13T00:00:00.000Z'));
        expect(result.localDate).toBe('2026-10-13');
        expect(result.status).toBe('present');
    });

    it('marks staff late after the present cutoff', () => {
        const result = resolveAttendanceWindow(site, new Date('2026-10-13T00:30:00.000Z'));
        expect(result.status).toBe('late');
    });

    it('closes attendance after the late cutoff', () => {
        const result = resolveAttendanceWindow(site, new Date('2026-10-13T01:30:00.000Z'));
        expect(result.status).toBe('closed');
        expect(result.reasonCode).toBe('window_closed');
    });

    it('validates attendance site and GPS payloads', () => {
        expect(attendanceSiteSchema.validate({
            name: 'Main field', description: '', latitude: -6.2, longitude: 106.8,
            radiusMeters: 75, maxAccuracyMeters: 35, edgeToleranceMeters: 10,
            timezone: 'Asia/Jakarta', checkinOpenTime: '06:30', presentUntilTime: '07:15',
            lateUntilTime: '08:00', activeWeekdays: [1, 2, 3, 4, 5], status: 'active'
        }).error).toBeUndefined();
        expect(attendanceCheckinSchema.validate({ locationEvidence: {
            method: 'browser_geolocation', latitude: -6.2, longitude: 106.8, accuracyMeters: 10,
            positionTimestamp: new Date().toISOString(), capturedAt: new Date().toISOString()
        } }).error).toBeUndefined();
    });

    it('accepts the three-question cultural pulse without support or GPS fields', () => {
        const result = emotionalCheckinSchema.validate({
            schemaVersion: 4,
            instrumentVersion: 'mws-cultural-pulse-v1',
            source: 'self_report',
            localDate: '2026-10-13',
            timezone: 'Asia/Jakarta',
            responses: {
                currentState: 3,
                energyFocus: 4,
                currentLoad: 2,
                contextTags: ['sleep'],
                emotions: [],
                note: ''
            },
            responseMetadata: {
                startedAt: '2026-10-13T00:01:00.000Z',
                completedAt: '2026-10-13T00:01:35.000Z'
            },
            weatherType: 'cultural-pulse',
            selectedMoods: [],
            presenceLevel: 8,
            capacityLevel: 8,
            details: ''
        });
        expect(result.error).toBeUndefined();
    });

    it('validates a separate post-check-in support request', () => {
        const result = supportRequestCreateSchema.validate({
            checkinId: '507f1f77bcf86cd799439011',
            urgency: 'today',
            preferredContactId: null,
            note: 'I would like someone to check in with me.'
        });
        expect(result.error).toBeUndefined();
    });
});
