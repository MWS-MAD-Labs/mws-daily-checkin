// Tells Central which permissions this application's code understands, so roles in Central can only use these.
//   npm run permissions:sync [-- --confirm-removals --retries 5 --wait 20]
//   npm run permissions:check [-- --allow-removals]   (changes nothing, exits 1 on a mismatch)
//   --soft: a failure is only a warning and the exit code stays 0, for "predev" so a Central that is off does not stop dev.
// It runs by hand, from "predev" and in the deploy workflow, with the same .env names the rest of the app reads.
require('dotenv').config();
const axios = require('axios');
const { PERMISSION_VALUES } = require('../constants/permissions');

// What each permission is for, shown to whoever builds roles in Central.
const DESCRIPTIONS = {
    'checkin.self.read': 'See my own check-ins',
    'checkin.self.submit': 'Submit my own check-in',
    'support.contacts.read': 'See the support contacts available to me',
    'notifications.self.manage': 'Manage my own notifications',
    'assistant.use': 'Use the AI assistant',
    'student_checkins.read': 'See the check-ins of students',
    'dashboard.read': 'Open the dashboard',
    'dashboard.export': 'Export dashboard data',
    'support_requests.manage': 'Handle support requests',
    'users.read': 'See users',
    'users.manage': 'Create and edit users',
    'users.deactivate': 'Deactivate users',
    'organizations.manage': 'Manage organizations',
    'notifications.create': 'Send notifications to others',
    'sync.read': 'See the status of syncs',
    'sync.run': 'Run syncs',
    'dev_topology.read': 'See the development topology',
    'attendance.self.read': 'See my own attendance',
    'attendance.self.submit': 'Record my own attendance at the morning gathering point',
    'attendance.staff.read': 'See staff attendance records',
    'attendance.export': 'Export staff attendance records',
    'attendance.settings.manage': 'Configure attendance location and time windows',
    'attendance.corrections.request': 'Request a correction to my attendance',
    'attendance.corrections.manage': 'Review and decide attendance corrections',
};

const humanize = (key) => {
    const text = key.replace(/[._]/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};

// The permissions of the code, as Central takes them.
function buildManifest(values = PERMISSION_VALUES) {
    return values.map((key) => ({ key, description: DESCRIPTIONS[key] || humanize(key) }));
}

// Same names as the data center client, the old ones first so an environment that still has them keeps working.
function connection(env = process.env) {
    const base = env.MWS_DATA_CENTER_API_URL || env.CENTRAL_API_BASE_URL;
    const token = env.MWS_DATA_CENTER_API_TOKEN || env.CENTRAL_API_TOKEN;
    if (!base || !token) {
        throw new Error('CENTRAL_API_BASE_URL and CENTRAL_API_TOKEN must be set');
    }
    return { url: `${base.replace(/\/+$/, '')}/application-permissions/me`, token };
}

function flagNumber(flags, name, fallback) {
    const index = flags.indexOf(name);
    const value = index >= 0 ? Number(flags[index + 1]) : NaN;
    return Number.isFinite(value) && value >= 0 ? value : fallback;
}

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

// Central may be starting while a deploy runs, so a missing answer is asked again. A no from Central is final.
async function withRetries(call, { retries, wait }) {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await call();
        } catch (error) {
            const unreachable = !error.response || error.response.status >= 500 || error.response.status === 429;
            if (!unreachable || attempt >= retries) throw error;
            console.warn(`attempt ${attempt + 1} failed (${error.message}), asking again in ${wait}s`);
            await sleep(wait);
        }
    }
}

function explain(error) {
    const answer = error.response?.data?.errors || error.response?.data?.message;
    return error.response ? `Central said ${error.response.status}${answer ? `: ${typeof answer === 'string' ? answer : JSON.stringify(answer)}` : ''}` : error.message;
}

async function sync(flags) {
    const { url, token } = connection();
    const body = { permissions: buildManifest(), confirm_removals: flags.includes('--confirm-removals') || undefined };
    const { data } = await withRetries(
        () => axios.put(url, body, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }),
        { retries: flagNumber(flags, '--retries', 0), wait: flagNumber(flags, '--wait', 20) },
    );
    const result = data.data || {};
    console.log(`permissions published: ${result.total ?? body.permissions.length} total, ${result.added ?? 0} new`);
    if ((result.deprecated || []).length > 0) console.warn(`dropped from the list: ${result.deprecated.join(', ')}`);
    for (const role of result.affected_roles || []) {
        console.warn(`role ${role.role} still carries a dropped permission: ${(role.permissions || []).join(', ')}`);
    }
}

async function check(flags) {
    const { url, token } = connection();
    const { data } = await withRetries(
        () => axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }),
        { retries: flagNumber(flags, '--retries', 0), wait: flagNumber(flags, '--wait', 20) },
    );
    const registered = (data.data || []).filter((row) => !row.deprecated).map((row) => row.key);
    const inCode = new Set(PERMISSION_VALUES);
    const notRegistered = PERMISSION_VALUES.filter((key) => !registered.includes(key));
    const wouldDrop = registered.filter((key) => !inCode.has(key));
    // Not registered yet is expected before a deploy. Registered but gone from the code is what to look at.
    if (notRegistered.length > 0) console.warn(`not registered in Central yet (a sync adds them): ${notRegistered.join(', ')}`);
    if (wouldDrop.length > 0) console.warn(`registered but gone from the code (a sync drops them): ${wouldDrop.join(', ')}`);
    if (wouldDrop.length > 0 && !flags.includes('--allow-removals')) {
        console.error('permissions do not match Central');
        process.exit(1);
    }
    console.log('permissions match Central');
}

async function main() {
    const flags = process.argv.slice(2);
    try {
        if (flags.includes('--check')) await check(flags);
        else await sync(flags);
    } catch (error) {
        if (flags.includes('--soft')) {
            console.warn(`permissions not sent, continuing: ${explain(error)}`);
            return;
        }
        console.error(explain(error));
        process.exit(1);
    }
}

if (require.main === module) main();

module.exports = { buildManifest, connection, flagNumber, withRetries, DESCRIPTIONS };
