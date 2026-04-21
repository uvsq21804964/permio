#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOC_DIR = path.join(ROOT, "doc", "dependency-cruiser");
const APP_DIR = path.join(ROOT, "app");
const API_DIR = path.join(APP_DIR, "api");

const OUTPUT_AI_JSON = path.join(DOC_DIR, "dependency-api-summary.json");
const OUTPUT_AI_MD = path.join(DOC_DIR, "dependency-api-summary.md");

const CODE_EXT_RE = /\.(ts|tsx|js|jsx)$/i;
const ROUTE_FILE_RE = /[\\/]route\.(ts|tsx|js|jsx)$/i;
const API_PATH_RE = /\/api(?:\/[A-Za-z0-9_\-.[\]()%]+)*/g;

function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".next" ||
        entry.name === "dist" ||
        entry.name === "build" ||
        entry.name === "coverage"
      ) {
        continue;
      }
      results.push(...walk(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function toPosixRelative(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join("/");
}

function listFrontendFiles() {
  return [
    ...walk(path.join(ROOT, "app", "[locale]")),
    ...walk(path.join(ROOT, "components")),
    ...walk(path.join(ROOT, "src", "emails")),
  ].filter((p) => CODE_EXT_RE.test(p));
}

function listApiRouteFiles() {
  return walk(API_DIR).filter((p) => ROUTE_FILE_RE.test(p));
}

function normalizeApiPath(url) {
  if (!url) return null;

  const clean = String(url)
    .split("?")[0]
    .split("#")[0]
    .trim()
    .replace(/[\])'",`;]+$/g, "");

  const apiIndex = clean.indexOf("/api");
  if (apiIndex === -1) return null;

  const sliced = clean.slice(apiIndex);

  if (!sliced.startsWith("/api/") && sliced !== "/api") return null;
  if (sliced === "/api/js") return null;

  return sliced.length > 4 ? sliced.replace(/\/+$/, "") : sliced;
}

function routeFileToApiPath(routeFileRel) {
  let p = routeFileRel.replace(/^app\/api/, "/api");
  p = p.replace(/\/route\.(ts|tsx|js|jsx)$/i, "");
  return p || "/api";
}

function buildApiIndex() {
  const index = new Map();

  for (const abs of listApiRouteFiles()) {
    const rel = toPosixRelative(abs);
    const apiPath = routeFileToApiPath(rel);
    index.set(apiPath, rel);
  }

  return index;
}

function stripCommentsPreserveStrings(code) {
  let out = "";
  let i = 0;
  const n = code.length;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  while (i < n) {
    const ch = code[i];
    const next = i + 1 < n ? code[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        out += ch;
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
      } else {
        if (ch === "\n") out += "\n";
        i++;
      }
      continue;
    }

    if (inSingle) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "'") inSingle = false;
      i++;
      continue;
    }

    if (inDouble) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    if (inTemplate) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "`") inTemplate = false;
      i++;
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      out += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inDouble = true;
      out += ch;
      i++;
      continue;
    }

    if (ch === "`") {
      inTemplate = true;
      out += ch;
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

function extractApiCalls(fileAbs) {
  const rawContent = fs.readFileSync(fileAbs, "utf8");
  const content = stripCommentsPreserveStrings(rawContent);
  const found = [];

  let match;
  API_PATH_RE.lastIndex = 0;

  while ((match = API_PATH_RE.exec(content)) !== null) {
    const apiPath = normalizeApiPath(match[0]);
    if (apiPath) {
      found.push({ apiPath, kind: "api-occurrence" });
    }
  }

  const seen = new Set();
  return found.filter((item) => {
    const key = `${item.kind}::${item.apiPath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectApiEdges() {
  const apiIndex = buildApiIndex();
  const edges = [];
  const unmatched = [];

  for (const fileAbs of listFrontendFiles()) {
    const fromRel = toPosixRelative(fileAbs);
    const apiCalls = extractApiCalls(fileAbs);

    for (const call of apiCalls) {
      const toRel = apiIndex.get(call.apiPath);
      if (toRel) {
        edges.push({
          from: fromRel,
          to: toRel,
          apiPath: call.apiPath,
          kind: call.kind,
        });
      } else {
        unmatched.push({
          from: fromRel,
          apiPath: call.apiPath,
          kind: call.kind,
        });
      }
    }
  }

  return { edges, unmatched };
}

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function apiPathColor(apiPath) {
  const hash = hashString(apiPath);
  const hue = hash % 360;
  const saturation = 68 + (hash % 12);
  const lightness = 42 + (hash % 8);
  return hslToHex(hue, saturation, lightness);
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort();
}

function groupEdgesByApi(edges) {
  const map = new Map();

  for (const edge of edges) {
    if (!map.has(edge.apiPath)) {
      map.set(edge.apiPath, {
        apiPath: edge.apiPath,
        routeFile: edge.to,
        color: apiPathColor(edge.apiPath),
        callers: [],
      });
    }

    map.get(edge.apiPath).callers.push({
      file: edge.from,
      kind: edge.kind,
    });
  }

  return [...map.values()]
    .map((item) => ({
      ...item,
      callers: item.callers.sort((a, b) => a.file.localeCompare(b.file)),
    }))
    .sort((a, b) => a.apiPath.localeCompare(b.apiPath));
}

function groupEdgesBySource(edges) {
  const map = new Map();

  for (const edge of edges) {
    if (!map.has(edge.from)) {
      map.set(edge.from, {
        file: edge.from,
        apiCalls: [],
      });
    }

    map.get(edge.from).apiCalls.push({
      apiPath: edge.apiPath,
      routeFile: edge.to,
      color: apiPathColor(edge.apiPath),
      kind: edge.kind,
    });
  }

  return [...map.values()]
    .map((item) => ({
      ...item,
      apiCalls: item.apiCalls.sort((a, b) => a.apiPath.localeCompare(b.apiPath)),
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

function buildAiSummary(edges, unmatched) {
  return {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    summary: {
      mappedOccurrences: edges.length,
      unmatchedOccurrences: unmatched.length,
      uniqueApiPaths: uniqueSorted(edges.map((e) => e.apiPath)).length,
      uniqueRouteFiles: uniqueSorted(edges.map((e) => e.to)).length,
      uniqueSourceFiles: uniqueSorted(edges.map((e) => e.from)).length,
    },
    apiRoutes: groupEdgesByApi(edges),
    sourceFiles: groupEdgesBySource(edges),
    unmatched: unmatched
      .slice()
      .sort((a, b) => a.from.localeCompare(b.from) || a.apiPath.localeCompare(b.apiPath)),
  };
}

function buildAiMarkdown(aiSummary) {
  const lines = [];

  lines.push("# API call summary");
  lines.push("");
  lines.push(`Generated at: ${aiSummary.generatedAt}`);
  lines.push("");
  lines.push("## Overview");
  lines.push("");
  lines.push(`- mappedOccurrences: ${aiSummary.summary.mappedOccurrences}`);
  lines.push(`- unmatchedOccurrences: ${aiSummary.summary.unmatchedOccurrences}`);
  lines.push(`- uniqueApiPaths: ${aiSummary.summary.uniqueApiPaths}`);
  lines.push(`- uniqueRouteFiles: ${aiSummary.summary.uniqueRouteFiles}`);
  lines.push(`- uniqueSourceFiles: ${aiSummary.summary.uniqueSourceFiles}`);
  lines.push("");

  lines.push("## API routes");
  lines.push("");

  for (const route of aiSummary.apiRoutes) {
    lines.push(`### ${route.apiPath}`);
    lines.push("");
    lines.push(`- routeFile: \`${route.routeFile}\``);
    lines.push(`- color: \`${route.color}\``);
    lines.push(`- callers: ${route.callers.length}`);
    lines.push("");

    for (const caller of route.callers) {
      lines.push(`  - \`${caller.file}\` (${caller.kind})`);
    }

    lines.push("");
  }

  lines.push("## Source files");
  lines.push("");

  for (const file of aiSummary.sourceFiles) {
    lines.push(`### ${file.file}`);
    lines.push("");

    for (const call of file.apiCalls) {
      lines.push(`- \`${call.apiPath}\` -> \`${call.routeFile}\` (${call.kind}, ${call.color})`);
    }

    lines.push("");
  }

  lines.push("## Unmatched");
  lines.push("");

  if (!aiSummary.unmatched.length) {
    lines.push("None.");
    lines.push("");
  } else {
    for (const item of aiSummary.unmatched) {
      lines.push(`- \`${item.from}\` -> \`${item.apiPath}\` (${item.kind})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const { edges, unmatched } = collectApiEdges();
  const aiSummary = buildAiSummary(edges, unmatched);
  const aiMarkdown = buildAiMarkdown(aiSummary);

  fs.writeFileSync(OUTPUT_AI_JSON, JSON.stringify(aiSummary, null, 2), "utf8");
  fs.writeFileSync(OUTPUT_AI_MD, aiMarkdown, "utf8");

  console.log(`JSON écrit : ${OUTPUT_AI_JSON}`);
  console.log(`Markdown écrit : ${OUTPUT_AI_MD}`);
  console.log(`Occurrences mappées : ${edges.length}`);
  console.log(`Occurrences non mappées : ${unmatched.length}`);
}

main();