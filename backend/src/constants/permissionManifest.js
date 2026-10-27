// What Central is told about this application's permissions, built from constants/permissions.js.
const { PERMISSION_VALUES, PERMISSION_DETAILS } = require("./permissions");

// What each permission is for, shown to whoever builds roles in Central.
const DESCRIPTIONS = Object.fromEntries(
  Object.entries(PERMISSION_DETAILS).map(([key, detail]) => [
    key,
    detail.description,
  ]),
);

const humanize = (key) => {
  const text = key.replace(/[._]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// The permissions of the code, as Central takes them.
function buildManifest(values = PERMISSION_VALUES) {
  return values.map((key) => {
    const requires = PERMISSION_DETAILS[key]?.requires;
    return {
      key,
      description: DESCRIPTIONS[key] || humanize(key),
      ...(requires ? { requires } : {}),
    };
  });
}

module.exports = { buildManifest, DESCRIPTIONS, permissionManifest: buildManifest() };
