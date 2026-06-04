const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const timeoutMs = 5000;

loadDotEnv(envPath);

const baseUrl = sanitizeBaseUrl(process.env.EXPO_PUBLIC_LOCAL_API_BASE_URL);

if (!baseUrl) {
  console.error("Local API check failed: EXPO_PUBLIC_LOCAL_API_BASE_URL is not set.");
  console.error(`Create ${envPath} and set EXPO_PUBLIC_LOCAL_API_BASE_URL=http://<your-pc-ip>:3000/api`);
  process.exit(1);
}

const healthUrl = `${baseUrl}/health`;

checkHealth(healthUrl)
  .then(() => {
    console.log(`Local API check passed: ${healthUrl}`);
  })
  .catch((error) => {
    console.error(`Local API check failed: ${healthUrl}`);
    console.error(`Reason: ${formatError(error)}`);
    console.error("");
    console.error("Start the backend first:");
    console.error("  cd E:\\FREELANCE\\minecomplyapi");
    console.error("  npm run start:dev");
    console.error("");
    console.error("Then verify from PowerShell:");
    console.error(`  Invoke-RestMethod ${healthUrl}`);
    console.error(`  Test-NetConnection ${new URL(healthUrl).hostname} -Port ${new URL(healthUrl).port || 80}`);
    console.error("");
    console.error("If PowerShell succeeds but Expo Go times out, check Windows Firewall and that the phone and PC are on the same network.");
    process.exit(1);
  });

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const source = fs.readFileSync(filePath, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function formatError(error) {
  const message = error?.message || String(error);
  const cause = error?.cause;
  if (cause?.code) {
    return `${message} (${cause.code})`;
  }
  return message;
}

function sanitizeBaseUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

async function checkHealth(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error(`timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
