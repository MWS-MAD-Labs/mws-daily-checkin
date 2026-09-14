const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sendError } = require('../utils/response');

// Backend-for-Frontend proxy for the AI chat feature, which is actually
// served by mws-mtss-system's backend. The browser only ever talks to this
// app's own backend (authenticated via its own session) - it never sees a
// credential it could use to call MTSS directly.
//
// daily-checkin and MTSS have separate MongoDBs (split 2026-09-08), so a
// user's ObjectId in this app's database means nothing in MTSS's. Each
// forwarded call is signed with a short-lived service token carrying only
// an email claim - the one identifier guaranteed to resolve to the same
// person in both databases. See mws-mtss-system's authenticateServiceRelay
// (middleware/auth.js) for the receiving side of this handshake.
router.use(authenticate);

const mtssBaseUrl = (process.env.MTSS_API_BASE_URL || '').replace(/\/+$/, '');
const mtssClient = axios.create({
    baseURL: mtssBaseUrl,
    timeout: 45000,
});

function mintServiceToken(email) {
    const secret = process.env.AI_CHAT_PROXY_SECRET;
    if (!secret) {
        throw new Error('AI_CHAT_PROXY_SECRET is not configured');
    }
    return jwt.sign({ email, source: 'daily-checkin' }, secret, { expiresIn: '2m' });
}

// A single generic forwarder covers every ai-chat endpoint (message,
// conversations, conversations/new, conversations/:sessionId,
// conversations/:sessionId/archive, assistant-profile GET/PATCH,
// execute-operation, feedback) - method, path (relative to this router's
// own /v1/ai-chat mount, identical to MTSS's own mount point), query and
// body all pass through unchanged, only the auth changes.
router.use(async (req, res) => {
    if (!mtssBaseUrl) {
        console.error('aiChatProxy: MTSS_API_BASE_URL is not configured');
        return sendError(res, 'AI chat is not available right now', 503);
    }

    try {
        const serviceToken = mintServiceToken(req.user.email);
        const response = await mtssClient.request({
            method: req.method,
            url: `/ai-chat${req.path}`,
            params: req.query,
            data: req.body,
            headers: { Authorization: `Bearer ${serviceToken}` },
            validateStatus: () => true, // forward MTSS's own status/body as-is, don't throw
        });

        // A 401/403 here means MTSS didn't recognize this email on ITS side
        // (e.g. never SSO-provisioned into MTSS yet) - it says nothing about
        // whether THIS app's own session is valid, since router.use(authenticate)
        // above already confirmed that. Forwarding it verbatim used to let the
        // frontend's shared axios interceptor (authService.js) misread it as
        // "my own session is dead" and force a logout/redirect on a user who
        // was never actually logged out - remapped so it can't be confused
        // for that.
        if (response.status === 401 || response.status === 403) {
            return sendError(res, 'AI chat is not available for this account yet', 424);
        }

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('aiChatProxy: forwarding to MTSS failed:', error.message);
        sendError(res, 'AI chat is temporarily unavailable', 502);
    }
});

module.exports = router;
