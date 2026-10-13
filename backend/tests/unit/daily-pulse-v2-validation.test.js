const { emotionalCheckinSchema } = require('../../src/utils/validationSchemas');
const EmotionalCheckin = require('../../src/models/EmotionalCheckin');
const mongoose = require('mongoose');

const validPayload = {
    schemaVersion: 2,
    instrumentVersion: 'mws-daily-pulse-v2',
    source: 'self_report',
    localDate: '2026-10-08',
    timezone: 'Asia/Jakarta',
    responses: {
        moodValence: 4,
        energyLevel: 3,
        stressLevel: 2,
        capacityLevel: 3,
        emotions: ['calm', 'tired'],
        contextTags: ['workload'],
        supportNeed: 'no',
        note: '',
    },
    weatherType: 'rainbow',
    selectedMoods: ['calm', 'tired'],
    details: '',
    presenceLevel: 6,
    capacityLevel: 6,
    supportContactUserId: null,
};

describe('Daily Pulse V2 validation', () => {
    it('accepts a complete versioned self-report', () => {
        const result = emotionalCheckinSchema.validate(validPayload);
        expect(result.error).toBeUndefined();
        expect(result.value.localDate).toBe('2026-10-08');
    });

    it('preserves the date key through Mongoose validation', () => {
        const validated = emotionalCheckinSchema.validate(validPayload).value;
        const document = new EmotionalCheckin({
            ...validated,
            userId: new mongoose.Types.ObjectId(),
        });
        expect(document.validateSync()).toBeUndefined();
        expect(document.localDate).toBe('2026-10-08');
    });

    it('rejects unanchored out-of-range scale values', () => {
        const result = emotionalCheckinSchema.validate({
            ...validPayload,
            responses: { ...validPayload.responses, stressLevel: 8 },
        });
        expect(result.error).toBeDefined();
    });

    it('rejects arbitrary emotion strings', () => {
        const result = emotionalCheckinSchema.validate({
            ...validPayload,
            responses: { ...validPayload.responses, emotions: ['kind-of-bad'] },
        });
        expect(result.error).toBeDefined();
    });
});
