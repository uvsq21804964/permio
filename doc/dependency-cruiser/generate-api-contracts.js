#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOC_DIR = path.join(ROOT, "doc", "dependency-cruiser");
const APP_DIR = path.join(ROOT, "app");
const API_DIR = path.join(APP_DIR, "api");

const OUTPUT_API_CONTRACTS_JSON = path.join(DOC_DIR, "dependency-api-contracts.json");

const CODE_EXT_RE = /\.(ts|tsx|js|jsx)$/i;
const ROUTE_FILE_RE = /[\\/]route\.(ts|tsx|js|jsx)$/i;
const API_PATH_RE = /\/api(?:\/[A-Za-z0-9_\-.[\]()%]+)*/g;
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

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
      }
    }
  }

  return edges;
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort();
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

function extractImports(routeContent) {
  const imports = [];
  const importRe = /^\s*import\s+[\s\S]*?\s+from\s+["']([^"']+)["'];?/gm;

  let match;
  while ((match = importRe.exec(routeContent)) !== null) {
    imports.push(match[1]);
  }

  return uniqueSorted(imports);
}

function extractMethods(routeContent) {
  const methods = [];

  for (const method of HTTP_METHODS) {
    const re = new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${method}\\b|\\bexport\\s+const\\s+${method}\\s*=`, "g");
    if (re.test(routeContent)) methods.push(method);
  }

  return methods;
}

function extractSearchParams(routeContent) {
  const names = [];
  const patterns = [
    /\.searchParams\.get\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\.searchParams\.has\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\.searchParams\.getAll\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const re of patterns) {
    let match;
    while ((match = re.exec(routeContent)) !== null) {
      names.push(match[1]);
    }
  }

  return uniqueSorted(names);
}

function extractDynamicParams(routeContent) {
  const names = [];

  const re1 = /\bparams\.(\w+)\b/g;
  let match;
  while ((match = re1.exec(routeContent)) !== null) {
    names.push(match[1]);
  }

  const re2 = /\bcontext\.params\.(\w+)\b/g;
  while ((match = re2.exec(routeContent)) !== null) {
    names.push(match[1]);
  }

  return uniqueSorted(names);
}

function extractBodyReads(routeContent) {
  const reads = [];
  const patterns = [
    { label: "json", re: /\b(?:req|request)\.json\s*\(/g },
    { label: "formData", re: /\b(?:req|request)\.formData\s*\(/g },
    { label: "text", re: /\b(?:req|request)\.text\s*\(/g },
    { label: "arrayBuffer", re: /\b(?:req|request)\.arrayBuffer\s*\(/g },
  ];

  for (const item of patterns) {
    if (item.re.test(routeContent)) reads.push(item.label);
  }

  return reads;
}

function extractServerApiCalls(routeContent) {
  const found = [];
  const patterns = [
    /\bfetch\s*\(\s*["'`]([^"'`]*\/api\/[^"'`]*)["'`]/g,
    /\bnew\s+URL\s*\(\s*["'`]([^"'`]*\/api\/[^"'`]*)["'`]/g,
  ];

  for (const re of patterns) {
    let match;
    while ((match = re.exec(routeContent)) !== null) {
      const apiPath = normalizeApiPath(match[1]);
      if (apiPath) found.push(apiPath);
    }
  }

  return uniqueSorted(found);
}

function extractServerDependencies(routeContent, routeFileRel) {
  const imports = extractImports(routeContent);
  const localImports = imports.filter((imp) => imp.startsWith(".") || imp.startsWith("@/"));
  const serverApiCalls = extractServerApiCalls(routeContent);

  const services = [];
  const checks = [
    { label: "db", re: /\bdb\.\w+/g },
    { label: "prisma", re: /\bprisma\.\w+/g },
    { label: "supabase", re: /\bsupabase\.\w+/g },
    { label: "stripe", re: /\bstripe\.\w+/g },
    { label: "clerk", re: /\b(?:auth|currentUser|getAuth)\s*\(/g },
  ];

  for (const item of checks) {
    if (item.re.test(routeContent)) services.push(item.label);
  }

  return {
    routeFile: routeFileRel,
    imports: localImports,
    serverApiCalls,
    services: uniqueSorted(services),
  };
}

function buildRouteCallersMap(edges) {
  const map = new Map();

  for (const edge of edges) {
    if (!map.has(edge.to)) map.set(edge.to, []);
    map.get(edge.to).push({
      file: edge.from,
      apiPath: edge.apiPath,
      kind: edge.kind,
      color: apiPathColor(edge.apiPath),
    });
  }

  for (const [key, arr] of map.entries()) {
    map.set(
      key,
      arr.sort((a, b) => a.file.localeCompare(b.file) || a.apiPath.localeCompare(b.apiPath))
    );
  }

  return map;
}

function analyzeRouteFile(routeAbs, callersMap) {
  const routeRel = toPosixRelative(routeAbs);
  const apiPath = routeFileToApiPath(routeRel);
  const rawContent = fs.readFileSync(routeAbs, "utf8");
  const content = stripCommentsPreserveStrings(rawContent);

  return {
    apiPath,
    routeFile: routeRel,
    color: apiPathColor(apiPath),
    methods: extractMethods(content),
    reads: {
      searchParams: extractSearchParams(content),
      params: extractDynamicParams(content),
      bodyReads: extractBodyReads(content),
    },
    serverDependencies: extractServerDependencies(content, routeRel),
    callers: callersMap.get(routeRel) || [],
  };
}

function buildApiContracts(edges) {
  const callersMap = buildRouteCallersMap(edges);
  const routeFiles = listApiRouteFiles();

  const routes = routeFiles
    .map((routeAbs) => analyzeRouteFile(routeAbs, callersMap))
    .sort((a, b) => a.apiPath.localeCompare(b.apiPath));

  return {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    summary: {
      totalRoutes: routes.length,
      routesWithCallers: routes.filter((r) => r.callers.length > 0).length,
      routesWithoutCallers: routes.filter((r) => r.callers.length === 0).length,
    },
    routes,
  };
}

function main() {
  const edges = collectApiEdges();
  const contracts = buildApiContracts(edges);

  fs.writeFileSync(OUTPUT_API_CONTRACTS_JSON, JSON.stringify(contracts, null, 2), "utf8");

  console.log(`JSON écrit : ${OUTPUT_API_CONTRACTS_JSON}`);
  console.log(`Routes totales : ${contracts.summary.totalRoutes}`);
  console.log(`Routes avec callers : ${contracts.summary.routesWithCallers}`);
  console.log(`Routes sans callers : ${contracts.summary.routesWithoutCallers}`);
}

main();