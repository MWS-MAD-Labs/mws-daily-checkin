const HubRelayReplay = require('../models/HubRelayReplay');

// Both stores use the package's atomic `consume`: true only for the first caller of a jti within the TTL.
class AtomicInMemoryReplayStore {
    constructor() {
        this.seenUntil = new Map();
    }

    consume(jti, ttlSeconds) {
        const now = Date.now();
        for (const [key, expiresAt] of this.seenUntil) {
            if (expiresAt <= now) this.seenUntil.delete(key);
        }
        if (this.seenUntil.has(jti)) return false;
        this.seenUntil.set(jti, now + ttlSeconds * 1000);
        return true;
    }
}

class MongoReplayStore {
    async consume(jti, ttlSeconds) {
        try {
            await HubRelayReplay.create({
                jti,
                expiresAt: new Date(Date.now() + ttlSeconds * 1000),
            });
            return true;
        } catch (error) {
            if (error?.code === 11000) return false;
            throw error;
        }
    }
}

const inMemoryStore = new AtomicInMemoryReplayStore();
const mongoStore = new MongoReplayStore();

function getHubReplayStore() {
    const adapter = String(process.env.HUB_REPLAY_STORE || 'mongo').trim().toLowerCase();
    if (adapter === 'memory') return inMemoryStore;
    if (adapter === 'mongo') return mongoStore;
    throw new Error(`Unsupported HUB_REPLAY_STORE adapter: ${adapter}`);
}

async function ensureHubReplayIndexes() {
    if (String(process.env.HUB_REPLAY_STORE || 'mongo').trim().toLowerCase() !== 'mongo') return;
    await HubRelayReplay.createIndexes();
}

module.exports = { AtomicInMemoryReplayStore, MongoReplayStore, getHubReplayStore, ensureHubReplayIndexes };
