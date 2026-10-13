const mongoose = require('mongoose');
const EmotionalCheckin = require('../../src/models/EmotionalCheckin');
const { emotionalCheckinSchema } = require('../../src/utils/validationSchemas');

const payload = {
    schemaVersion: 3,
    instrumentVersion: 'mws-daily-field-pulse-v3',
    source: 'self_report',
    localDate: '2026-10-13',
    timezone: 'Asia/Jakarta',
    responses: {
        energyLevel: 3,
        focusLevel: 4,
        stressLevel: 2,
        capacityLevel: 3,
        recoveryLevel: 4,
        emotions: [],
        contextTags: ['sleep'],
        contextQuestionId: 'sleep_quality',
        contextResponse: 4,
        supportNeed: 'no',
        note: ''
    },
    responseMetadata: {
        startedAt: '2026-10-13T01:00:00.000Z',
        completedAt: '2026-10-13T01:01:00.000Z'
    },
    weatherType: 'partly-cloudy',
    selectedMoods: [],
    details: '',
    presenceLevel: 6,
    capacityLevel: 6,
    supportContactUserId: null
};

describe('Daily Field Pulse V3 validation', () => {
    it('accepts five readiness dimensions with optional emotions', () => {
        const result = emotionalCheckinSchema.validate(payload);
        expect(result.error).toBeUndefined();
        expect(result.value.responses.focusLevel).toBe(4);
        expect(result.value.responses.emotions).toEqual([]);
    });

    it('persists V3 response fields in Mongoose', () => {
        const validated = emotionalCheckinSchema.validate(payload).value;
        const document = new EmotionalCheckin({
            ...validated,
            userId: new mongoose.Types.ObjectId()
        });
        expect(document.validateSync()).toBeUndefined();
        expect(document.responses.recoveryLevel).toBe(4);
        expect(document.responses.contextQuestionId).toBe('sleep_quality');
    });

    it('requires focus, recovery, and daily context evidence', () => {
        const responses = { ...payload.responses };
        delete responses.focusLevel;
        delete responses.recoveryLevel;
        delete responses.contextResponse;
        const result = emotionalCheckinSchema.validate({ ...payload, responses });
        expect(result.error).toBeDefined();
        expect(result.error.details.map((detail) => detail.path.join('.'))).toEqual(expect.arrayContaining([
            'responses.focusLevel',
            'responses.recoveryLevel',
            'responses.contextResponse'
        ]));
    });

    it('rejects a V2 response shape labelled as V3', () => {
        const result = emotionalCheckinSchema.validate({
            ...payload,
            responses: {
                moodValence: 5,
                energyLevel: 5,
                stressLevel: 1,
                capacityLevel: 5,
                emotions: ['happy'],
                contextTags: [],
                supportNeed: 'no',
                note: ''
            }
        });
        expect(result.error).toBeDefined();
    });
});
