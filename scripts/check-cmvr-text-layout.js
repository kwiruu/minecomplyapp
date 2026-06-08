const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const scanRoots = [
  "components/CheckBox.tsx",
  "components/RadioButton.tsx",
  "screens/CMVRPAGE",
];
const extensions = new Set([".ts", ".tsx"]);
const failures = [];

function walk(target, files = []) {
  if (!fs.existsSync(target)) return files;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      if (["node_modules", ".expo", ".git", "android", "ios"].includes(entry)) {
        continue;
      }
      walk(path.join(target, entry), files);
    }
    return files;
  }
  if (extensions.has(path.extname(target))) {
    files.push(target);
  }
  return files;
}

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function findStyleBlock(source, startIndex) {
  const openIndex = source.indexOf("{", startIndex);
  if (openIndex === -1) return null;

  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex + 1, index);
      }
    }
  }
  return null;
}

const files = scanRoots.flatMap((entry) => walk(path.join(root, entry)));

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (/[âÂð]/.test(line)) {
      failures.push(`${rel}:${index + 1} contains mojibake text; replace it with valid UTF-8 or ASCII.`);
    }

    if (/numberOfLines\s*=\s*(?:\{\s*1\s*\}|["']1["'])/.test(line)) {
      const nearby = lines.slice(Math.max(0, index - 2), index + 3).join("\n");
      if (/\b(?:checkboxLabel|radioLabel|optionLabel|radioText)\b/.test(nearby)) {
        failures.push(`${rel}:${index + 1} forces an option label to one line; allow wrapping.`);
      }
    }
  });

  const styleNamePattern = /\b(checkboxLabel|radioLabel|optionLabel|radioText)\s*:\s*\{/g;
  for (const match of source.matchAll(styleNamePattern)) {
    const block = findStyleBlock(source, match.index);
    if (!block) continue;

    const hasFlexibleText = /\bflex(?:Shrink)?\s*:\s*1\b/.test(block);
    if (!hasFlexibleText) continue;

    const line = lineNumberForIndex(source, match.index);
    if (!/\bminWidth\s*:\s*0\b/.test(block)) {
      failures.push(`${rel}:${line} ${match[1]} can shrink without minWidth: 0.`);
    }
    if (!/\blineHeight\s*:/.test(block)) {
      failures.push(`${rel}:${line} ${match[1]} can shrink without a stable lineHeight.`);
    }
  }
}

if (failures.length > 0) {
  console.error("CMVR text layout guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("CMVR text layout guard passed.");
