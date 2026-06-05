const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const backendEnvPath =
  process.env.MINECOMPLY_BACKEND_ENV ||
  path.resolve(projectRoot, "..", "minecomplyapi", ".env");
const frontendEnvPath = path.join(projectRoot, ".env");
const easPreviewEnvPath =
  process.env.EAS_PREVIEW_ENV_FILE ||
  path.join(projectRoot, ".env.eas-preview");

function fail(message) {
  console.error(`EAS runtime config check failed: ${message}`);
  process.exit(1);
}

function parseEnv(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(
      `Missing ${label} at ${filePath}. For EAS preview values, run: npx eas-cli@latest env:pull --environment preview --path .env.eas-preview`
    );
  }

  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function getRequired(env, key, label) {
  const value = env[key];
  if (!value) fail(`${label} is missing ${key}.`);
  if (value === "*****") {
    fail(
      `${label} has masked ${key}. Pull a readable EAS value or change its EAS visibility from secret to sensitive/plaintext.`
    );
  }
  return value;
}

function firstDefined(env, keys) {
  for (const key of keys) {
    if (env[key]) return { key, value: env[key] };
  }
  return null;
}

function normalizeUrl(value, label) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    fail(`${label} is not a valid URL.`);
  }
}

function hostOf(value, label) {
  try {
    return new URL(value).host;
  } catch {
    fail(`${label} is not a valid URL.`);
  }
}

function assertSame(label, values) {
  const entries = Object.entries(values);
  const [, expected] = entries[0];
  for (const [name, value] of entries.slice(1)) {
    if (value !== expected) {
      fail(
        `${label} mismatch. ${entries[0][0]} does not match ${name}. Expected all ${label} values to agree.`
      );
    }
  }
}

function assertDuplicateAgreement(label, env, keys) {
  const values = {};
  for (const key of keys) {
    if (env[key]) values[key] = env[key];
  }
  if (Object.keys(values).length > 1) {
    assertSame(label, values);
  }
}

function readExpoConfig() {
  const expoCli = path.join(projectRoot, "node_modules", "expo", "bin", "cli");
  const result = spawnSync(
    process.execPath,
    [expoCli, "config", "--type", "introspect", "--json"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: process.env,
    }
  );

  if (result.status !== 0) {
    fail(
      `Could not resolve Expo config. ${result.stderr || result.stdout || ""}`.trim()
    );
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`Could not parse Expo config JSON: ${error.message}`);
  }
}

const frontendEnv = parseEnv(frontendEnvPath, "frontend .env");
const backendEnv = parseEnv(backendEnvPath, "backend .env");
const easPreviewEnv = parseEnv(easPreviewEnvPath, ".env.eas-preview");
const expoConfig = readExpoConfig();

assertDuplicateAgreement("frontend production API duplicate variables", frontendEnv, [
  "EXPO_PUBLIC_PRODUCTION_API_BASE_URL",
  "PRODUCTION_API_BASE_URL",
]);
assertDuplicateAgreement("EAS production API duplicate variables", easPreviewEnv, [
  "EXPO_PUBLIC_PRODUCTION_API_BASE_URL",
  "PRODUCTION_API_BASE_URL",
]);

const frontendSupabaseUrl = getRequired(
  frontendEnv,
  "EXPO_PUBLIC_SUPABASE_URL",
  "frontend .env"
);
const backendSupabaseUrl = getRequired(backendEnv, "SUPABASE_URL", "backend .env");
const easSupabaseUrl = getRequired(
  easPreviewEnv,
  "EXPO_PUBLIC_SUPABASE_URL",
  ".env.eas-preview"
);
const resolvedSupabaseUrl = expoConfig.extra?.supabaseUrl;
if (!resolvedSupabaseUrl) fail("Resolved Expo config is missing extra.supabaseUrl.");

assertSame("Supabase URL", {
  "frontend .env": normalizeUrl(frontendSupabaseUrl, "frontend Supabase URL"),
  "backend .env": normalizeUrl(backendSupabaseUrl, "backend Supabase URL"),
  ".env.eas-preview": normalizeUrl(easSupabaseUrl, "EAS preview Supabase URL"),
  "expo config": normalizeUrl(resolvedSupabaseUrl, "resolved Expo Supabase URL"),
});

assertSame("Supabase anon key", {
  "frontend .env": getRequired(
    frontendEnv,
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "frontend .env"
  ),
  "backend .env": getRequired(backendEnv, "SUPABASE_ANON_KEY", "backend .env"),
  ".env.eas-preview": getRequired(
    easPreviewEnv,
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    ".env.eas-preview"
  ),
});

const frontendProductionApi = firstDefined(frontendEnv, [
  "EXPO_PUBLIC_PRODUCTION_API_BASE_URL",
  "PRODUCTION_API_BASE_URL",
]);
const easProductionApi = firstDefined(easPreviewEnv, [
  "EXPO_PUBLIC_PRODUCTION_API_BASE_URL",
  "PRODUCTION_API_BASE_URL",
]);
if (!frontendProductionApi) fail("frontend .env is missing production API URL.");
if (!easProductionApi) fail(".env.eas-preview is missing production API URL.");
if (!expoConfig.extra?.productionApiBaseUrl) {
  fail("Resolved Expo config is missing extra.productionApiBaseUrl.");
}
assertSame("production API URL", {
  [`frontend .env ${frontendProductionApi.key}`]: normalizeUrl(
    frontendProductionApi.value,
    "frontend production API URL"
  ),
  [`.env.eas-preview ${easProductionApi.key}`]: normalizeUrl(
    easProductionApi.value,
    "EAS preview production API URL"
  ),
  "expo config": normalizeUrl(
    expoConfig.extra.productionApiBaseUrl,
    "resolved Expo production API URL"
  ),
});

const frontendRedirect = getRequired(
  frontendEnv,
  "EXPO_PUBLIC_CONFIRMATION_REDIRECT_URL",
  "frontend .env"
);
const easRedirect = getRequired(
  easPreviewEnv,
  "EXPO_PUBLIC_CONFIRMATION_REDIRECT_URL",
  ".env.eas-preview"
);
assertSame("confirmation redirect URL", {
  "frontend .env": normalizeUrl(frontendRedirect, "frontend redirect URL"),
  ".env.eas-preview": normalizeUrl(easRedirect, "EAS preview redirect URL"),
  "expo config": normalizeUrl(
    expoConfig.extra?.confirmationRedirectUrl,
    "resolved Expo redirect URL"
  ),
});

const permissions =
  expoConfig._internal?.modResults?.android?.manifest?.manifest?.[
    "uses-permission"
  ] || [];
const permissionNames = permissions
  .map((permission) => permission?.$?.["android:name"])
  .filter(Boolean);
if (!permissionNames.includes("android.permission.INTERNET")) {
  fail("Generated Android manifest is missing android.permission.INTERNET.");
}

console.log("EAS runtime config guard passed.");
console.log(
  JSON.stringify(
    {
      supabaseHost: hostOf(frontendSupabaseUrl, "frontend Supabase URL"),
      productionApiHost: hostOf(
        frontendProductionApi.value,
        "frontend production API URL"
      ),
      confirmationRedirectHost: hostOf(frontendRedirect, "frontend redirect URL"),
      androidInternetPermission: true,
    },
    null,
    2
  )
);
