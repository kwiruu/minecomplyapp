const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const easPath = path.join(projectRoot, "eas.json");

function fail(message) {
  console.error(`EAS managed build check failed: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Could not read ${path.relative(projectRoot, filePath)}: ${error.message}`);
  }
}

for (const nativeDir of ["android", "ios"]) {
  const nativeDirPath = path.join(projectRoot, nativeDir);
  if (fs.existsSync(nativeDirPath)) {
    fail(
      `${nativeDir}/ exists. Remove committed native folders so EAS can run managed prebuild.`
    );
  }
}

const eas = readJson(easPath);
const previewAndroid = eas?.build?.preview?.android;

if (!previewAndroid) {
  fail("Missing build.preview.android in eas.json.");
}

if (previewAndroid.buildType !== "apk") {
  fail('preview android.buildType must be "apk" for internal APK builds.');
}

if (Object.prototype.hasOwnProperty.call(previewAndroid, "gradleCommand")) {
  fail("preview android.gradleCommand should be omitted for managed prebuild.");
}

if (Object.prototype.hasOwnProperty.call(previewAndroid, "applicationArchivePath")) {
  fail(
    "preview android.applicationArchivePath should be omitted for managed prebuild."
  );
}

console.log("EAS managed build guard passed.");
