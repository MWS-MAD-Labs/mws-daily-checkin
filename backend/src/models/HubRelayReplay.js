const mongoose = require('mongoose');

const hubRelayReplaySchema = new mongoose.Schema({
    jti: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model('HubRelayReplay', hubRelayReplaySchema);
