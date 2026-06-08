const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const scanRoots = [
  "App.tsx",
  "index.ts",
  "components",
  "contexts",
  "hooks",
  "lib",
  "navigation",
  "screens",
  "store",
  "theme",
  "types",
  "utils",
];
const extensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const booleanProps = [
  "disabled",
  "editable",
  "multiline",
  "secureTextEntry",
  "autoCorrect",
  "scrollEnabled",
  "showsVerticalScrollIndicator",
  "showsHorizontalScrollIndicator",
  "bounces",
  "horizontal",
  "pagingEnabled",
  "nestedScrollEnabled",
  "removeClippedSubviews",
  "collapsable",
  "accessible",
  "allowFontScaling",
  "adjustsFontSizeToFit",
  "selectable",
  "focusable",
  "showSoftInputOnFocus",
  "caretHidden",
  "contextMenuHidden",
  "blurOnSubmit",
  "enablesReturnKeyAutomatically",
  "transparent",
  "visible",
  "animated",
  "useNativeDriver",
  "allowsEditing",
  "multiple",
  "copyToCacheDirectory",
  "idempotent",
  "upsert",
  "cancelable",
  "headerShown",
  "gestureEnabled",
  "animationEnabled",
  "freezeOnBlur",
  "detachPreviousScreen",
  "detachInactiveScreens",
  "lazy",
  "unmountOnBlur",
  "swipeEnabled",
  "tabBarHideOnKeyboard",
  "isVisible",
  "checked",
  "selected",
];

const files = [];
const failures = [];

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function walk(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      if (["node_modules", ".expo", ".git", "android", "ios", "dist", "web-build"].includes(entry)) {
        continue;
      }
      walk(path.join(target, entry));
    }
    return;
  }
  if (extensions.has(path.extname(target))) files.push(target);
}

for (const entry of scanRoots) walk(path.join(root, entry));

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);

  const reactNativeNamedImport = /import\s*\{[^}]*\}\s*from\s*["']react-native["']\s*;/g;
  for (const match of source.matchAll(reactNativeNamedImport)) {
    if (/\bSafeAreaView\b/.test(match[0])) {
      failures.push(
        `${rel}:${lineNumberForIndex(source, match.index)} imports SafeAreaView from react-native; use react-native-safe-area-context.`
      );
    }
  }

  lines.forEach((line, index) => {
    if (/@react-navigation\/stack/.test(line)) {
      failures.push(`${rel}:${index + 1} imports @react-navigation/stack; use @react-navigation/native-stack.`);
    }

    if (/\bkeyboardShouldPersistTaps\s*=\s*["'][^"']+["']/.test(line)) {
      failures.push(
        `${rel}:${index + 1} passes a string to keyboardShouldPersistTaps; use keyboardShouldPersistTapsForFabric.`
      );
    }

    if (/\bkeyboardShouldPersistTaps\s*=\s*\{\s*["'][^"']+["']\s*\}/.test(line)) {
      failures.push(
        `${rel}:${index + 1} passes a braced string to keyboardShouldPersistTaps; use keyboardShouldPersistTapsForFabric.`
      );
    }

    for (const prop of booleanProps) {
      const stringBoolean = new RegExp(`\\b${prop}\\s*=\\s*["'](?:true|false)["']`);
      if (stringBoolean.test(line)) {
        failures.push(`${rel}:${index + 1} passes string boolean to ${prop}; use {true} or {false}.`);
      }
    }

    if (/<[A-Z][A-Za-z0-9_.]*Provider\b[^>]*\bclassName\s*=/.test(line)) {
      failures.push(`${rel}:${index + 1} passes className to a Provider component; use style or explicit NativeWind interop.`);
    }
  });
}

if (failures.length > 0) {
  console.error("Native runtime prop guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Native runtime prop guard passed.");
