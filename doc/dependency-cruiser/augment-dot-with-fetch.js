#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'app');
const API_DIR = path.join(APP_DIR, 'api');
const DOC_DIR = path.join(ROOT, 'doc', 'dependency-cruiser');

const INPUT_DOT = path.join(DOC_DIR, 'dependency-graph.dot');
const OUTPUT_DOT = path.join(DOC_DIR, 'dependency-graph.with-fetch.dot');

// Sorties API
const OUTPUT_AI_JSON = path.join(DOC_DIR, 'dependency-api-summary.json');
const OUTPUT_AI_MD = path.join(DOC_DIR, 'dependency-api-summary.md');

// Sorties front -> lib (+ API)
const OUTPUT_FRONT_LIB_DOT = path.join(
  DOC_DIR,
  'dependency-graph.front-lib.dot',
);
const OUTPUT_FRONT_LIB_JSON = path.join(
  DOC_DIR,
  'dependency-front-lib-summary.json',
);
const OUTPUT_FRONT_LIB_MD = path.join(
  DOC_DIR,
  'dependency-front-lib-summary.md',
);

const CODE_EXT_RE = /\.(ts|tsx|js|jsx)$/i;
const ROUTE_FILE_RE = /[\\/]route\.(ts|tsx|js|jsx)$/i;
const CODE_NODE_RE = /\.(ts|tsx|js|jsx)$/i;

// Détecte toute occurrence textuelle de /api/... dans le contenu
const API_PATH_RE = /\/api(?:\/[A-Za-z0-9_\-.[\]()%]+)*/g;

// Pages / fichiers front à considérer dans app/[locale]
const FRONT_PAGE_FILE_RE =
  /^app\/\[locale\]\/.*\/(page|layout|loading|error|template|not-found|default)\.(ts|tsx|js|jsx)$/i;

function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function toPosixRelative(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

function listSourceFiles() {
  return [
    ...walk(path.join(ROOT, 'app')),
    ...walk(path.join(ROOT, 'components')),
    ...walk(path.join(ROOT, 'src')),
    ...walk(path.join(ROOT, 'lib')),
  ].filter((p) => CODE_EXT_RE.test(p));
}

function listApiRouteFiles() {
  return walk(API_DIR).filter((p) => ROUTE_FILE_RE.test(p));
}

function isFrontPageNode(node) {
  return FRONT_PAGE_FILE_RE.test(node);
}

function isLibNode(node) {
  return /^lib\/.+\.(ts|tsx|js|jsx)$/i.test(node);
}

function normalizeApiPath(url) {
  if (!url) return null;

  const clean = String(url).split('?')[0].split('#')[0].trim();

  const apiIndex = clean.indexOf('/api');
  if (apiIndex === -1) return null;

  const sliced = clean.slice(apiIndex);

  if (!sliced.startsWith('/api/') && sliced !== '/api') return null;

  return sliced.length > 4 ? sliced.replace(/\/+$/, '') : sliced;
}

function routeFileToApiPath(routeFileRel) {
  let p = routeFileRel.replace(/^app\/api/, '/api');
  p = p.replace(/\/route\.(ts|tsx|js|jsx)$/i, '');
  return p || '/api';
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
  let out = '';
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
    const next = i + 1 < n ? code[i + 1] : '';

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        out += ch;
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
      } else {
        if (ch === '\n') out += '\n';
        i++;
      }
      continue;
    }

    if (inSingle) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === "'") inSingle = false;
      i++;
      continue;
    }

    if (inDouble) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    if (inTemplate) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '`') inTemplate = false;
      i++;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (ch === '/' && next === '*') {
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

    if (ch === '`') {
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
  const rawContent = fs.readFileSync(fileAbs, 'utf8');
  const content = stripCommentsPreserveStrings(rawContent);
  const found = [];

  let match;
  API_PATH_RE.lastIndex = 0;

  while ((match = API_PATH_RE.exec(content)) !== null) {
    const raw = match[0];
    const apiPath = normalizeApiPath(raw);

    if (apiPath && apiPath !== '/api/js') {
      found.push({ apiPath, kind: 'api-occurrence' });
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

function readDotFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.includes('digraph')) return text;

  text = fs.readFileSync(filePath, 'utf16le');
  if (text.includes('digraph')) return text;

  throw new Error('Impossible de lire le DOT en utf8 ou utf16le.');
}

function collectFetchEdges() {
  const apiIndex = buildApiIndex();
  const edges = [];
  const unmatched = [];

  for (const fileAbs of listSourceFiles()) {
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

function escapeDotValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, '\\n');
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
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Même route API => même couleur, quelle que soit la source
function apiPathColor(apiPath) {
  const hash = hashString(apiPath);

  const hue = hash % 360;
  const saturation = 68 + (hash % 12);
  const lightness = 42 + (hash % 8);

  return hslToHex(hue, saturation, lightness);
}

function edgeColor(edge) {
  return apiPathColor(edge.apiPath);
}

function extractQuotedPaths(line) {
  return [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function buildKeptNodeSet(fetchEdges) {
  const kept = new Set();
  for (const edge of fetchEdges) {
    kept.add(edge.from);
    kept.add(edge.to);
  }
  return kept;
}

function parseDependencyEdges(dotText) {
  const edges = [];
  const lines = dotText.split(/\r?\n/);

  for (const line of lines) {
    const m = line.match(
      /"([^"]+\.(?:ts|tsx|js|jsx))"\s*->\s*"([^"]+\.(?:ts|tsx|js|jsx))"/,
    );
    if (!m) continue;

    edges.push({ from: m[1], to: m[2] });
  }

  return edges;
}

function buildOriginalNodeIndex(dotText) {
  const index = new Map();
  const lines = dotText.split(/\r?\n/);

  for (const line of lines) {
    const quoted = extractQuotedPaths(line).filter((p) => CODE_NODE_RE.test(p));
    if (quoted.length === 1 && line.includes('[') && !line.includes('->')) {
      index.set(quoted[0], line.trim());
    }
  }

  return index;
}

function labelFromFile(filePath) {
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}

function buildNodeLine(node, originalNodeIndex) {
  const original = originalNodeIndex.get(node);
  if (original) return `  ${original}`;

  const label = escapeDotValue(labelFromFile(node));
  const tooltip = escapeDotValue(node);

  const isApi = node.startsWith('app/api/');
  const isFront = isFrontPageNode(node);
  const isLib = isLibNode(node);

  let fill = '#bbfeff';
  let extra = '';

  if (isApi) {
    fill = '#ccffcc';
    extra = ' fontcolor="orange" color="orange"';
  } else if (isFront) {
    fill = '#d8ebff';
    extra = ' color="#2f6feb"';
  } else if (isLib) {
    fill = '#efe3ff';
    extra = ' color="#7a3ff2"';
  }

  return `  "${node}" [label=<${label}>, tooltip="${tooltip}", URL="${escapeDotValue(node)}", fillcolor="${fill}"${extra}];`;
}

function buildTooltipLines(fetchEdges, apiNodes) {
  const frontendMap = new Map();

  for (const edge of fetchEdges) {
    if (!frontendMap.has(edge.from)) frontendMap.set(edge.from, []);
    frontendMap.get(edge.from).push(`${edge.kind}: ${edge.apiPath}`);
  }

  const frontendLines = [...frontendMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([node, calls]) => {
      const tooltip = escapeDotValue([node, '', ...new Set(calls)].join('\n'));
      return `  "${node}" [tooltip="${tooltip}"];`;
    });

  const apiLines = [...apiNodes].sort().map((node) => {
    const apiPath = routeFileToApiPath(node);
    const color = apiPathColor(apiPath);
    const tooltip = escapeDotValue(
      [node, '', `route: ${apiPath}`, `color: ${color}`].join('\n'),
    );
    return `  "${node}" [tooltip="${tooltip}"];`;
  });

  return { frontendLines, apiLines };
}

function buildTree(nodes) {
  const root = { children: new Map(), files: [] };

  for (const node of [...nodes].sort()) {
    const parts = node.split('/');
    let cur = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (!cur.children.has(seg)) {
        cur.children.set(seg, { children: new Map(), files: [] });
      }
      cur = cur.children.get(seg);
    }

    cur.files.push(node);
  }

  return root;
}

function clusterIdFromPathParts(parts) {
  return 'cluster_' + parts.join('/').replace(/"/g, '');
}

function renderTree(node, parts, originalNodeIndex, indent = '  ') {
  const lines = [];

  for (const [name, child] of [...node.children.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const childParts = [...parts, name];
    const clusterId = clusterIdFromPathParts(childParts);
    lines.push(
      `${indent}subgraph "${clusterId}" {label="${escapeDotValue(name)}"`,
    );

    const childLines = renderTree(
      child,
      childParts,
      originalNodeIndex,
      indent + '  ',
    );
    if (childLines.length) {
      lines.push(...childLines);
    }

    lines.push(`${indent}}`);
  }

  for (const file of node.files.sort()) {
    lines.push(buildNodeLine(file, originalNodeIndex));
  }

  return lines;
}

function buildClusterSection(keptNodes, originalNodeIndex) {
  const tree = buildTree(keptNodes);
  return renderTree(tree, [], originalNodeIndex, '  ');
}

function buildApiLegend(fetchEdges) {
  const apiPaths = [...new Set(fetchEdges.map((e) => e.apiPath))].sort();
  if (!apiPaths.length) return [];

  const lines = [];
  lines.push('  subgraph "cluster_api_legend" {label="API colors"');

  for (const apiPath of apiPaths) {
    const color = apiPathColor(apiPath);
    const nodeId = `legend:${apiPath}`;
    lines.push(
      `    "${nodeId}" [label="${escapeDotValue(apiPath)}", shape="note", style="filled", fillcolor="${color}", color="${color}", fontcolor="black", tooltip="${escapeDotValue(apiPath)}"];`,
    );
  }

  lines.push('  }');
  return lines;
}

function buildMinimalDot(baseDot, fetchEdges) {
  const keptNodes = buildKeptNodeSet(fetchEdges);
  const originalNodeIndex = buildOriginalNodeIndex(baseDot);
  const dependencyEdges = parseDependencyEdges(baseDot).filter(
    (e) => keptNodes.has(e.from) && keptNodes.has(e.to),
  );

  const frontendNodes = [...keptNodes]
    .filter((n) => !n.startsWith('app/api/'))
    .sort();
  const apiNodes = [...keptNodes]
    .filter((n) => n.startsWith('app/api/'))
    .sort();

  const clusterLines = buildClusterSection(keptNodes, originalNodeIndex);
  const legendLines = buildApiLegend(fetchEdges);

  const dependencyEdgeLines = dependencyEdges.map(
    (e) => `  "${e.from}" -> "${e.to}";`,
  );

  const fetchEdgeLines = fetchEdges.map((edge) => {
    const color = edgeColor(edge);
    const tooltip = escapeDotValue(
      `${edge.kind}: ${edge.apiPath}\ncolor: ${color}`,
    );
    return `  "${edge.from}" -> "${edge.to}" [color="${color}", fontcolor="${color}", style="dashed", penwidth=2.2, arrowsize=0.9, tooltip="${tooltip}", weight=8, minlen=1];`;
  });

  const { frontendLines, apiLines } = buildTooltipLines(fetchEdges, apiNodes);

  const rankFrontend =
    frontendNodes.length > 0
      ? `  { rank=same; ${frontendNodes.map((n) => `"${n}"`).join('; ')}; }`
      : '';

  const rankApi =
    apiNodes.length > 0
      ? `  { rank=same; ${apiNodes.map((n) => `"${n}"`).join('; ')}; }`
      : '';

  const gapLine =
    frontendNodes.length > 0 && apiNodes.length > 0
      ? `  "${frontendNodes[frontendNodes.length - 1]}" -> "${apiNodes[0]}" [style=invis, weight=200, minlen=8];`
      : '';

  return [
    'strict digraph "dependency-cruiser output"{',
    '  newrank=true;',
    '  rankdir="LR";',
    '  splines="line";',
    '  overlap="false";',
    '  compound=true;',
    '  nodesep=1.0;',
    '  ranksep=1.4;',
    '  node [shape="box" style="rounded, filled" height="0.2" color="black" fillcolor="#ffffcc" fontcolor="black" fontname="Helvetica" fontsize="9"];',
    '  edge [arrowhead="normal" arrowsize="0.6" penwidth="2.0" color="#00000033" fontname="Helvetica" fontsize="9"];',
    '',
    '  // Clusters + kept nodes',
    ...clusterLines,
    '',
    '  // Original dependency edges between kept nodes',
    ...dependencyEdgeLines,
    '',
    '  // Alignment',
    rankFrontend,
    rankApi,
    gapLine,
    '',
    '  // API color legend',
    ...legendLines,
    '',
    '  // Node tooltips for frontend files',
    ...frontendLines,
    '',
    '  // Node tooltips for API route files',
    ...apiLines,
    '',
    '  // Added API occurrence edges',
    ...fetchEdgeLines,
    '}',
    '',
  ].join('\n');
}

// ---------- PARTIE API SUMMARY ----------

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
      apiCalls: item.apiCalls.sort((a, b) =>
        a.apiPath.localeCompare(b.apiPath),
      ),
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

function buildAiSummary(edges, unmatched) {
  const uniqueApiPaths = [...new Set(edges.map((e) => e.apiPath))].sort();
  const uniqueRouteFiles = [...new Set(edges.map((e) => e.to))].sort();
  const uniqueSourceFiles = [...new Set(edges.map((e) => e.from))].sort();

  return {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    summary: {
      mappedOccurrences: edges.length,
      unmatchedOccurrences: unmatched.length,
      uniqueApiPaths: uniqueApiPaths.length,
      uniqueRouteFiles: uniqueRouteFiles.length,
      uniqueSourceFiles: uniqueSourceFiles.length,
    },
    apiRoutes: groupEdgesByApi(edges),
    sourceFiles: groupEdgesBySource(edges),
    unmatched: unmatched
      .slice()
      .sort(
        (a, b) =>
          a.from.localeCompare(b.from) || a.apiPath.localeCompare(b.apiPath),
      ),
  };
}

function buildAiMarkdown(aiSummary) {
  const lines = [];

  lines.push('# API call summary');
  lines.push('');
  lines.push(`Generated at: ${aiSummary.generatedAt}`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(`- mappedOccurrences: ${aiSummary.summary.mappedOccurrences}`);
  lines.push(
    `- unmatchedOccurrences: ${aiSummary.summary.unmatchedOccurrences}`,
  );
  lines.push(`- uniqueApiPaths: ${aiSummary.summary.uniqueApiPaths}`);
  lines.push(`- uniqueRouteFiles: ${aiSummary.summary.uniqueRouteFiles}`);
  lines.push(`- uniqueSourceFiles: ${aiSummary.summary.uniqueSourceFiles}`);
  lines.push('');

  lines.push('## API routes');
  lines.push('');

  for (const route of aiSummary.apiRoutes) {
    lines.push(`### ${route.apiPath}`);
    lines.push('');
    lines.push(`- routeFile: \`${route.routeFile}\``);
    lines.push(`- color: \`${route.color}\``);
    lines.push(`- callers: ${route.callers.length}`);
    lines.push('');

    for (const caller of route.callers) {
      lines.push(`  - \`${caller.file}\` (${caller.kind})`);
    }

    lines.push('');
  }

  lines.push('## Source files');
  lines.push('');

  for (const file of aiSummary.sourceFiles) {
    lines.push(`### ${file.file}`);
    lines.push('');

    for (const call of file.apiCalls) {
      lines.push(
        `- \`${call.apiPath}\` -> \`${call.routeFile}\` (${call.kind}, ${call.color})`,
      );
    }

    lines.push('');
  }

  lines.push('## Unmatched');
  lines.push('');

  if (aiSummary.unmatched.length === 0) {
    lines.push('None.');
    lines.push('');
  } else {
    for (const item of aiSummary.unmatched) {
      lines.push(`- \`${item.from}\` -> \`${item.apiPath}\` (${item.kind})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function writeAiFiles(edges, unmatched) {
  const aiSummary = buildAiSummary(edges, unmatched);
  const aiMarkdown = buildAiMarkdown(aiSummary);

  fs.writeFileSync(OUTPUT_AI_JSON, JSON.stringify(aiSummary, null, 2), 'utf8');
  fs.writeFileSync(OUTPUT_AI_MD, aiMarkdown, 'utf8');
}

// ---------- PARTIE FRONT -> LIB (+ API) ----------

function buildAdjacency(edges) {
  const map = new Map();

  for (const edge of edges) {
    if (!map.has(edge.from)) map.set(edge.from, []);
    map.get(edge.from).push(edge.to);
  }

  return map;
}

function collectFrontToLibTransitiveLinks(baseDot) {
  const dependencyEdges = parseDependencyEdges(baseDot);
  const adjacency = buildAdjacency(dependencyEdges);

  const allNodes = new Set();
  for (const e of dependencyEdges) {
    allNodes.add(e.from);
    allNodes.add(e.to);
  }

  const frontPages = [...allNodes].filter(isFrontPageNode).sort();
  const results = [];

  for (const front of frontPages) {
    const visited = new Set();
    const queue = [front];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const nextNodes = adjacency.get(current) || [];
      for (const next of nextNodes) {
        if (!visited.has(next)) {
          queue.push(next);
        }
      }
    }

    for (const node of visited) {
      if (node !== front && isLibNode(node)) {
        results.push({
          from: front,
          to: node,
          kind: 'front-to-lib-transitive',
        });
      }
    }
  }

  return results.sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
  );
}

function collectRelevantApiEdgesForFrontLib(frontLibLinks, fetchEdges) {
  const relevantNodes = new Set();

  for (const link of frontLibLinks) {
    relevantNodes.add(link.from);
    relevantNodes.add(link.to);
  }

  return fetchEdges
    .filter((edge) => relevantNodes.has(edge.from))
    .sort(
      (a, b) =>
        a.from.localeCompare(b.from) ||
        a.apiPath.localeCompare(b.apiPath) ||
        a.to.localeCompare(b.to),
    );
}

function buildFrontLibDot(baseDot, links, relevantApiEdges) {
  const keptNodes = new Set();

  for (const link of links) {
    keptNodes.add(link.from);
    keptNodes.add(link.to);
  }

  for (const edge of relevantApiEdges) {
    keptNodes.add(edge.from);
    keptNodes.add(edge.to);
  }

  const originalNodeIndex = buildOriginalNodeIndex(baseDot);
  const clusterLines = buildClusterSection(keptNodes, originalNodeIndex);

  const frontNodes = [...keptNodes].filter(isFrontPageNode).sort();
  const libNodes = [...keptNodes].filter(isLibNode).sort();
  const apiNodes = [...keptNodes]
    .filter((n) => n.startsWith('app/api/'))
    .sort();

  const legendLines = buildApiLegend(relevantApiEdges);

  const lines = [
    'strict digraph "front-lib dependencies" {',
    '  newrank=true;',
    '  rankdir="LR";',
    '  splines="line";',
    '  overlap="false";',
    '  compound=true;',
    '  nodesep=1.0;',
    '  ranksep=1.6;',
    '  node [shape="box" style="rounded, filled" height="0.2" color="black" fillcolor="#ffffcc" fontcolor="black" fontname="Helvetica" fontsize="9"];',
    '  edge [arrowhead="normal" arrowsize="0.6" penwidth="2.0" color="#444444" fontname="Helvetica" fontsize="9"];',
    '',
    '  // Nodes',
    ...clusterLines,
    '',
  ];

  if (frontNodes.length) {
    lines.push(
      `  { rank=same; ${frontNodes.map((n) => `"${n}"`).join('; ')}; }`,
    );
  }
  if (libNodes.length) {
    lines.push(`  { rank=same; ${libNodes.map((n) => `"${n}"`).join('; ')}; }`);
  }
  if (apiNodes.length) {
    lines.push(`  { rank=same; ${apiNodes.map((n) => `"${n}"`).join('; ')}; }`);
  }

  if (frontNodes.length > 0 && libNodes.length > 0) {
    lines.push(
      `  "${frontNodes[frontNodes.length - 1]}" -> "${libNodes[0]}" [style=invis, weight=200, minlen=5];`,
    );
  }

  if (libNodes.length > 0 && apiNodes.length > 0) {
    lines.push(
      `  "${libNodes[libNodes.length - 1]}" -> "${apiNodes[0]}" [style=invis, weight=200, minlen=7];`,
    );
  }

  lines.push('');
  lines.push('  // Front -> lib links');

  for (const link of links) {
    lines.push(
      `  "${link.from}" -> "${link.to}" [color="#1f6feb", penwidth=2.2, tooltip="${escapeDotValue(`${link.kind}: ${link.to}`)}"];`,
    );
  }

  lines.push('');
  lines.push('  // API color legend');
  lines.push(...legendLines);
  lines.push('');

  lines.push('  // API edges for kept front/lib nodes');

  for (const edge of relevantApiEdges) {
    const color = edgeColor(edge);
    const tooltip = escapeDotValue(
      `${edge.kind}: ${edge.apiPath}\ncolor: ${color}`,
    );

    lines.push(
      `  "${edge.from}" -> "${edge.to}" [color="${color}", fontcolor="${color}", style="dashed", penwidth=2.2, arrowsize=0.9, tooltip="${tooltip}", weight=8, minlen=1];`,
    );
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

function buildFrontLibSummary(links, relevantApiEdges) {
  const byFront = new Map();

  for (const link of links) {
    if (!byFront.has(link.from)) {
      byFront.set(link.from, {
        libDependencies: [],
        apiCalls: [],
      });
    }

    byFront.get(link.from).libDependencies.push({
      file: link.to,
      kind: link.kind,
    });
  }

  const apiByFrom = new Map();
  for (const edge of relevantApiEdges) {
    if (!apiByFrom.has(edge.from)) apiByFrom.set(edge.from, []);
    apiByFrom.get(edge.from).push({
      apiPath: edge.apiPath,
      routeFile: edge.to,
      color: apiPathColor(edge.apiPath),
      kind: edge.kind,
    });
  }

  for (const [page, data] of byFront.entries()) {
    const pageApiCalls = [];

    for (const dep of data.libDependencies) {
      const apiCalls = apiByFrom.get(dep.file) || [];
      pageApiCalls.push(...apiCalls);
    }

    const ownApiCalls = apiByFrom.get(page) || [];
    pageApiCalls.push(...ownApiCalls);

    const uniqueApiCalls = [];
    const seen = new Set();

    for (const call of pageApiCalls) {
      const key = `${call.apiPath}::${call.routeFile}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueApiCalls.push(call);
    }

    data.apiCalls = uniqueApiCalls.sort((a, b) =>
      a.apiPath.localeCompare(b.apiPath),
    );
  }

  const pages = [...byFront.entries()]
    .map(([page, data]) => ({
      page,
      libDependencies: data.libDependencies.sort((a, b) =>
        a.file.localeCompare(b.file),
      ),
      apiCalls: data.apiCalls,
    }))
    .sort((a, b) => a.page.localeCompare(b.page));

  return {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    summary: {
      pages: pages.length,
      uniqueLibFiles: new Set(links.map((l) => l.to)).size,
      totalFrontToLibLinks: links.length,
      uniqueApiRoutes: new Set(relevantApiEdges.map((e) => e.apiPath)).size,
      totalApiEdges: relevantApiEdges.length,
    },
    pages,
  };
}

function buildFrontLibMarkdown(summary) {
  const lines = [];

  lines.push('# Front pages -> lib dependencies + API calls');
  lines.push('');
  lines.push(`Generated at: ${summary.generatedAt}`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(`- pages: ${summary.summary.pages}`);
  lines.push(`- uniqueLibFiles: ${summary.summary.uniqueLibFiles}`);
  lines.push(`- totalFrontToLibLinks: ${summary.summary.totalFrontToLibLinks}`);
  lines.push(`- uniqueApiRoutes: ${summary.summary.uniqueApiRoutes}`);
  lines.push(`- totalApiEdges: ${summary.summary.totalApiEdges}`);
  lines.push('');

  for (const page of summary.pages) {
    lines.push(`## ${page.page}`);
    lines.push('');
    lines.push('### Lib dependencies');
    lines.push('');

    if (page.libDependencies.length === 0) {
      lines.push('- None');
    } else {
      for (const dep of page.libDependencies) {
        lines.push(`- \`${dep.file}\` (${dep.kind})`);
      }
    }

    lines.push('');
    lines.push('### API calls');
    lines.push('');

    if (page.apiCalls.length === 0) {
      lines.push('- None');
    } else {
      for (const call of page.apiCalls) {
        lines.push(
          `- \`${call.apiPath}\` -> \`${call.routeFile}\` (${call.kind}, ${call.color})`,
        );
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

function writeFrontLibFiles(baseDot, fetchEdges) {
  const links = collectFrontToLibTransitiveLinks(baseDot);
  const relevantApiEdges = collectRelevantApiEdgesForFrontLib(
    links,
    fetchEdges,
  );
  const dot = buildFrontLibDot(baseDot, links, relevantApiEdges);
  const summary = buildFrontLibSummary(links, relevantApiEdges);
  const md = buildFrontLibMarkdown(summary);

  fs.writeFileSync(OUTPUT_FRONT_LIB_DOT, dot, 'utf8');
  fs.writeFileSync(
    OUTPUT_FRONT_LIB_JSON,
    JSON.stringify(summary, null, 2),
    'utf8',
  );
  fs.writeFileSync(OUTPUT_FRONT_LIB_MD, md, 'utf8');

  return { links, relevantApiEdges, summary };
}

// ---------- UTILITAIRES LOG ----------

function groupByFrom(edges) {
  const map = new Map();
  for (const edge of edges) {
    if (!map.has(edge.from)) map.set(edge.from, []);
    map.get(edge.from).push(edge);
  }
  return map;
}

// ---------- MAIN ----------

function main() {
  if (!fs.existsSync(INPUT_DOT)) {
    throw new Error(`Fichier introuvable: ${INPUT_DOT}`);
  }

  const baseDot = readDotFile(INPUT_DOT);

  // Graphe API enrichi
  const { edges, unmatched } = collectFetchEdges();
  const outputDot = buildMinimalDot(baseDot, edges);
  fs.writeFileSync(OUTPUT_DOT, outputDot, 'utf8');
  writeAiFiles(edges, unmatched);

  // Graphe front -> lib + API
  const {
    links: frontLibLinks,
    relevantApiEdges: frontLibApiEdges,
    summary: frontLibSummary,
  } = writeFrontLibFiles(baseDot, edges);

  const byFrom = groupByFrom(edges);
  const keptNodes = buildKeptNodeSet(edges);

  console.log('');
  console.log('=== Résumé occurrences API détectées ===');
  console.log(
    `Fichiers conservés car reliés à une occurrence /api/ : ${keptNodes.size}`,
  );
  console.log(`Arêtes API ajoutées au graphe : ${edges.length}`);
  console.log(
    `Routes API uniques colorées : ${new Set(edges.map((e) => e.apiPath)).size}`,
  );
  console.log(
    `Occurrences /api/ non mappées vers app/api : ${unmatched.length}`,
  );
  console.log(`Fichier DOT enrichi : ${OUTPUT_DOT}`);
  console.log(`Fichier IA JSON : ${OUTPUT_AI_JSON}`);
  console.log(`Fichier IA Markdown : ${OUTPUT_AI_MD}`);
  console.log('');

  for (const [from, list] of [...byFrom.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`${from} -> ${list.length} occurrence(s) API`);
    for (const edge of list) {
      console.log(
        `  - [${edge.kind}] ${edge.apiPath} -> ${edge.to} (${edgeColor(edge)})`,
      );
    }
  }

  if (unmatched.length) {
    console.log('');
    console.log(
      '=== Occurrences détectées mais non mappées vers un route handler ===',
    );
    for (const item of unmatched) {
      console.log(`- ${item.from} :: [${item.kind}] ${item.apiPath}`);
    }
  }

  console.log('');
  console.log(`TOTAL occurrences API mappées : ${edges.length}`);

  console.log('');
  console.log('=== Résumé pages front -> lib + API ===');
  console.log(`Pages front détectées : ${frontLibSummary.summary.pages}`);
  console.log(
    `Fichiers lib uniques reliés : ${frontLibSummary.summary.uniqueLibFiles}`,
  );
  console.log(
    `Liens totaux pages -> lib : ${frontLibSummary.summary.totalFrontToLibLinks}`,
  );
  console.log(
    `Routes API uniques dans front->lib : ${frontLibSummary.summary.uniqueApiRoutes}`,
  );
  console.log(
    `Arêtes API dans front->lib : ${frontLibSummary.summary.totalApiEdges}`,
  );
  console.log(`Fichier DOT front->lib : ${OUTPUT_FRONT_LIB_DOT}`);
  console.log(`Fichier JSON front->lib : ${OUTPUT_FRONT_LIB_JSON}`);
  console.log(`Fichier Markdown front->lib : ${OUTPUT_FRONT_LIB_MD}`);

  if (frontLibLinks.length) {
    const groupedFrontLib = new Map();
    for (const link of frontLibLinks) {
      if (!groupedFrontLib.has(link.from)) groupedFrontLib.set(link.from, []);
      groupedFrontLib.get(link.from).push(link);
    }

    console.log('');
    console.log('=== Détail des dépendances front -> lib ===');

    for (const [from, list] of [...groupedFrontLib.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      console.log(`${from} -> ${list.length} dépendance(s) lib`);
      for (const link of list.sort((a, b) => a.to.localeCompare(b.to))) {
        console.log(`  - [${link.kind}] ${link.to}`);
      }
    }
  }

  if (frontLibApiEdges.length) {
    const groupedFrontLibApi = groupByFrom(frontLibApiEdges);

    console.log('');
    console.log('=== Détail des appels API du sous-graphe front -> lib ===');

    for (const [from, list] of [...groupedFrontLibApi.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      console.log(`${from} -> ${list.length} appel(s) API`);
      for (const edge of list.sort((a, b) =>
        a.apiPath.localeCompare(b.apiPath),
      )) {
        console.log(
          `  - [${edge.kind}] ${edge.apiPath} -> ${edge.to} (${edgeColor(edge)})`,
        );
      }
    }
  }
}

main();
