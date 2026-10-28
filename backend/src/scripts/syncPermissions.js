// Tells Central which permissions this application's code understands, so roles in Central can only use these.
//   npm run permissions:sync [-- --confirm-removals --retries 5 --wait 20]
//   npm run permissions:check [-- --allow-removals]   (changes nothing, exits 1 on a mismatch)
//   --soft: a failure is only a warning and the exit code stays 0, for "predev" so a Central that is off does not stop dev.
// The command itself is the shared one from mws-central-auth. "me" is Central's name for the application of the token.
require("dotenv").config();
const { runPermissionsCli } = require("mws-central-auth/access/cli");
const { buildManifest } = require("../constants/permissionManifest");

// The older names are read when the ones Central writes in its block are empty.
const env = {
  ...process.env,
  CENTRAL_API_BASE_URL: process.env.CENTRAL_API_BASE_URL || process.env.MWS_DATA_CENTER_API_URL,
  CENTRAL_API_TOKEN: process.env.CENTRAL_API_TOKEN || process.env.MWS_DATA_CENTER_API_TOKEN,
};

if (require.main === module) {
  runPermissionsCli({ application: "me", manifest: buildManifest(), env }).then((code) => process.exit(code));
}
