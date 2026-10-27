const { PERMISSION_VALUES } = require('../../src/constants/permissions');
const { buildManifest, DESCRIPTIONS, permissionManifest } = require('../../src/constants/permissionManifest');

// The sync command is the one in mws-central-auth (its own tests cover retries, flags and messages). What belongs to
// this app is the list it sends and that the script keeps working through the old environment names and --soft.
describe('permission sync', () => {
    it('sends every permission of the code, each with a description, and nothing else', () => {
        const manifest = buildManifest();
        expect(manifest.map((entry) => entry.key)).toEqual(PERMISSION_VALUES);
        expect(manifest.every((entry) => entry.description.length > 3)).toBe(true);
        expect(permissionManifest).toEqual(manifest);
        // A new permission without a written description still goes out, with one made from its name.
        expect(buildManifest(['reports.export'])).toEqual([{ key: 'reports.export', description: 'Reports export' }]);
        // No description is kept for a permission the code no longer has.
        expect(Object.keys(DESCRIPTIONS).every((key) => PERMISSION_VALUES.includes(key))).toBe(true);
    });

    // All four names are set (empty when unused) so the developer's own .env, which dotenv would load, is never read:
    // dotenv leaves a name alone when the environment already has it. Nothing here may reach a real Central.
    const NOTHING = { CENTRAL_API_BASE_URL: '', CENTRAL_API_TOKEN: '', MWS_DATA_CENTER_API_URL: '', MWS_DATA_CENTER_API_TOKEN: '' };
    const OFF = 'http://127.0.0.1:1/api/internal';
    const run = (args, env) => {
        const { spawnSync } = require('child_process');
        return spawnSync('node', ['src/scripts/syncPermissions.js', ...args], {
            cwd: require('path').resolve(__dirname, '../..'),
            env: { PATH: process.env.PATH, ...NOTHING, ...env },
            encoding: 'utf8',
        });
    };

    it('reads the older environment names when the new ones are empty', () => {
        // Nothing listens on that address, so the call fails the way a Central that is off does.
        const result = run([], { MWS_DATA_CENTER_API_URL: OFF, MWS_DATA_CENTER_API_TOKEN: 't' });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Could not reach Central');
    });

    it('does not stop dev when Central is off: --soft only warns', () => {
        const soft = run(['--soft'], { CENTRAL_API_BASE_URL: OFF, CENTRAL_API_TOKEN: 't' });
        expect(soft.status).toBe(0);
        expect(soft.stderr).toContain('Could not reach Central');
        // With nothing configured, dev still starts.
        expect(run(['--soft'], {}).status).toBe(0);
        expect(run([], {}).status).toBe(1);
    });
});
