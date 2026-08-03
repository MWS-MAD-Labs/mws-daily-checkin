const mongoose = require('mongoose');
const winston = require('winston');

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 60000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A single failed attempt at boot (e.g. host reboot racing DNS/network
// readiness) used to leave the app permanently wedged with no DB connection,
// since mongoose.connect() only gets called once. Retry with backoff so a
// transient failure at startup self-heals instead of needing a manual restart.
const connectDB = async () => {
    let attempt = 0;
    let delay = INITIAL_RETRY_DELAY_MS;

    while (true) {
        attempt += 1;
        try {
            winston.info(`Attempting to connect to MongoDB... (attempt ${attempt}/${MAX_RETRIES})`);

            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 15000, // Timeout after 15s
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
            });

            winston.info(`✅ MongoDB Connected successfully: ${conn.connection.host}`);

            // Handle connection events
            mongoose.connection.on('error', (err) => {
                winston.error('❌ MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                winston.warn('⚠️ MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                winston.info('🔄 MongoDB reconnected');
            });

            return conn;
        } catch (error) {
            winston.error(`❌ Database connection failed (attempt ${attempt}/${MAX_RETRIES}):`, {
                error: error.message,
                code: error.code,
                codeName: error.codeName,
                mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
            });

            if (attempt >= MAX_RETRIES) {
                throw error; // Let the app handle the exit
            }

            winston.warn(`Retrying MongoDB connection in ${delay / 1000}s...`);
            await sleep(delay);
            delay = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
        }
    }
};

module.exports = connectDB;