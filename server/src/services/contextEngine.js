/**
 * Repository Context Engine
 *
 * Intelligently selects the most relevant files for AI analysis.
 * Enforces strict token limits to fit within Groq's 12K token cap.
 */

// ── Token budget constants ─────────────────────────────────
// Groq llama-3.3-70b-versatile: 12,000 token input limit
// System prompt uses ~1,500 tokens → leaves ~10,500 for context
// At ~4 chars/token: 10,500 * 4 = ~42,000 chars max
// We use 15,000 chars to be very safe (leaves room for large system prompts)
const MAX_FILES_FOR_ANALYSIS = 5;
const MAX_CHARS_PER_FILE     = 3000;
const MAX_TOTAL_CONTEXT_CHARS = 15000;

const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs',
  '.rb', '.php', '.c', '.cpp', '.h', '.cs', '.swift', '.kt',
  '.vue', '.svelte', '.html', '.css', '.scss', '.less',
  '.json', '.yaml', '.yml', '.toml', '.md', '.sql', '.env.example',
]);

// Always include these files — they define the project
const PRIORITY_FILES = [
  'package.json',
  'readme.md', 'readme.txt', 'readme',
  'tsconfig.json',
  'vite.config.js', 'vite.config.ts',
  'next.config.js', 'next.config.ts', 'next.config.mjs',
  'tailwind.config.js', 'tailwind.config.ts',
  'webpack.config.js',
  'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  '.env.example',
  'server.js', 'server.ts',
  'app.js', 'app.ts', 'app.jsx', 'app.tsx',
  'index.js', 'index.ts',
  'main.js', 'main.ts', 'main.jsx', 'main.tsx',
  'routes.js', 'routes.ts',
  'schema.js', 'schema.ts',
];

// Directories that contain important source code
const PRIORITY_DIRS = [
  'src', 'lib', 'app', 'server', 'api',
  'controllers', 'routes', 'models', 'services', 'middleware',
  'components', 'pages', 'hooks', 'context', 'store', 'utils',
];

// Always exclude these
const EXCLUDE_PATTERNS = [
  'node_modules', '.git', 'dist', 'build', '.next', 'out',
  'coverage', '__pycache__', '.cache', 'vendor',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.min.js', '.min.css', '.map', '.ico', '.png', '.jpg', '.jpeg',
  '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot',
];

// Keyword → related file patterns
const KEYWORD_EXPANSIONS = {
  'authentication': ['auth', 'login', 'register', 'user', 'jwt', 'token', 'middleware', 'session'],
  'database':       ['model', 'schema', 'db', 'mongoose', 'prisma', 'migration', 'seed'],
  'api':            ['route', 'controller', 'endpoint', 'handler', 'middleware', 'service'],
  'dark mode':      ['theme', 'style', 'css', 'color', 'context', 'app', 'layout'],
  'styling':        ['css', 'style', 'tailwind', 'theme', 'component', 'layout'],
  'routing':        ['route', 'router', 'navigation', 'page', 'link', 'nav'],
  'state':          ['context', 'store', 'redux', 'state', 'provider', 'hook'],
  'testing':        ['test', 'spec', 'mock', 'fixture', 'jest', 'cypress'],
  'deployment':     ['docker', 'dockerfile', 'nginx', 'config', 'env', 'ci', 'workflow'],
  'search':         ['search', 'filter', 'query', 'input', 'component', 'api'],
};

// ── Helpers ────────────────────────────────────────────────

function extractKeywords(prompt) {
  const lower = prompt.toLowerCase();
  const words = lower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const expanded = new Set(words);

  for (const [pattern, expansions] of Object.entries(KEYWORD_EXPANSIONS)) {
    if (lower.includes(pattern)) {
      expansions.forEach(e => expanded.add(e));
    }
  }
  return [...expanded];
}

function isExcluded(filePath) {
  const lower = filePath.toLowerCase();
  return EXCLUDE_PATTERNS.some(p => lower.includes(p));
}

function isPriorityFile(filePath) {
  const name = filePath.toLowerCase().split('/').pop();
  return PRIORITY_FILES.includes(name);
}

function isPriorityDir(filePath) {
  const parts = filePath.toLowerCase().split('/');
  return parts.some(p => PRIORITY_DIRS.includes(p));
}

function hasCodeExtension(filePath) {
  const ext = '.' + filePath.split('.').pop().toLowerCase();
  return CODE_EXTENSIONS.has(ext);
}

function scoreFile(filePath, keywords) {
  if (isExcluded(filePath)) return -100;

  const lower = filePath.toLowerCase();
  const fileName = lower.split('/').pop();
  let score = 0;

  // Priority file — always want these
  if (isPriorityFile(filePath)) score += 20;

  // In a priority source directory
  if (isPriorityDir(filePath)) score += 8;

  // Is code
  if (hasCodeExtension(filePath)) score += 3;
  else score -= 5;

  // Entry points
  if (['index.js','index.ts','index.jsx','index.tsx',
       'app.js','app.ts','app.jsx','app.tsx',
       'server.js','main.js','main.ts','main.jsx','main.tsx'].includes(fileName)) {
    score += 10;
  }

  // Keyword matches in filename (strongest signal)
  keywords.forEach(kw => { if (fileName.includes(kw)) score += 12; });

  // Keyword matches in directory path
  filePath.toLowerCase().split('/').slice(0, -1).forEach(dir => {
    keywords.forEach(kw => { if (dir.includes(kw)) score += 5; });
  });

  // Penalize test files
  if (lower.includes('test') || lower.includes('spec') || lower.includes('__test__')) score -= 4;

  // Penalize deeply nested
  if (filePath.split('/').length > 6) score -= 2;

  return score;
}

// ── Exports ────────────────────────────────────────────────

/**
 * Select the most relevant files for a given prompt.
 * Always includes high-priority files (package.json, README, etc.)
 */
export function selectRelevantFiles(prompt, repoStructure, summaryCache = {}, maxFiles = MAX_FILES_FOR_ANALYSIS) {
  const keywords = extractKeywords(prompt);

  // Expand keywords using cached tech stack
  if (summaryCache?.techStack?.length) {
    summaryCache.techStack.forEach(t => keywords.push(t.toLowerCase()));
  }

  const files = (repoStructure || []).filter(item => item.type === 'file');

  const scored = files
    .map(item => ({ path: item.path, score: scoreFile(item.path, keywords) }))
    .filter(item => item.score > -10)
    .sort((a, b) => b.score - a.score);

  const selected = [];
  const selectedSet = new Set();

  // First — always include priority files (package.json, README, etc.)
  for (const item of scored) {
    if (isPriorityFile(item.path) && !selectedSet.has(item.path)) {
      selected.push(item.path);
      selectedSet.add(item.path);
    }
  }

  // Then — fill remaining slots with highest-scored files
  for (const item of scored) {
    if (selected.length >= maxFiles) break;
    if (!selectedSet.has(item.path) && item.score > 0) {
      selected.push(item.path);
      selectedSet.add(item.path);
    }
  }

  // Fallback — if still empty, take the first 10 code files
  if (selected.length === 0) {
    const fallback = files.filter(f => hasCodeExtension(f.path) && !isExcluded(f.path)).slice(0, 10);
    fallback.forEach(f => { if (!selectedSet.has(f.path)) selected.push(f.path); });
  }

  return selected;
}

/**
 * Build the full context string sent to the AI.
 * Combines summary cache + actual file contents.
 */
export function buildContextWindow(fileContents, summaryCache, repoMeta = {}) {
  let context = '';
  let usedChars = 0;

  // ── Repository metadata header (~200 chars, minimal) ──
  if (repoMeta.repoName) {
    const header = `# Repository: ${repoMeta.owner || ''}/${repoMeta.repoName}\n`
      + (repoMeta.description ? `Description: ${repoMeta.description}\n` : '')
      + (repoMeta.language    ? `Primary Language: ${repoMeta.language}\n` : '')
      + '\n';
    context += header;
    usedChars += header.length;
  }

  // ── Cached summary — always include (this is compact and high value) ──
  if (summaryCache?.projectSummary) {
    const s = `## Project Overview\n${summaryCache.projectSummary}\n\n`;
    context += s; usedChars += s.length;
  }
  if (summaryCache?.techStack?.length) {
    const s = `## Tech Stack\n${summaryCache.techStack.join(', ')}\n\n`;
    context += s; usedChars += s.length;
  }
  if (summaryCache?.architectureOverview) {
    const s = `## Architecture Overview\n${summaryCache.architectureOverview}\n\n`;
    context += s; usedChars += s.length;
  }
  if (summaryCache?.importantFiles?.length) {
    const s = `## Important Files\n${summaryCache.importantFiles.slice(0, 20).join('\n')}\n\n`;
    context += s; usedChars += s.length;
  }

  // ── Source file contents — respect strict char budget ──
  const validFiles = (fileContents || []).filter(f => f && f.content && f.content.trim().length > 0);

  if (validFiles.length > 0) {
    context += `## Source Files\n\n`;
    usedChars += 16;

    let filesAdded = 0;
    for (const file of validFiles) {
      if (filesAdded >= MAX_FILES_FOR_ANALYSIS) break;
      if (usedChars >= MAX_TOTAL_CONTEXT_CHARS) break;

      // Truncate file to per-file limit
      const rawContent = file.content.length > MAX_CHARS_PER_FILE
        ? file.content.slice(0, MAX_CHARS_PER_FILE) + '\n... [truncated]'
        : file.content;

      const block = `### ${file.path}\n\`\`\`\n${rawContent}\n\`\`\`\n\n`;

      // Stop if this block would push us over the total limit
      if (usedChars + block.length > MAX_TOTAL_CONTEXT_CHARS) break;

      context += block;
      usedChars += block.length;
      filesAdded++;
    }

    if (filesAdded === 0) {
      context += `No source files included — context budget used by repository summary.\n\n`;
    }
  } else {
    context += `## Note\nAnalysis based on repository metadata and summary only.\n\n`;
  }

  return context;
}

/**
 * Select the most relevant files from the stored contextFiles cache.
 * Uses BOTH path-based AND content-based keyword scoring.
 * This is the core of query-aware retrieval — like GitHub Copilot Chat.
 *
 * @param {string} prompt - User's query
 * @param {Array} contextFiles - Array of { path, content } from repository.contextFiles
 * @param {number} maxFiles - Maximum files to return
 * @returns {Array} Top-ranked { path, content } objects
 */
export function selectFilesFromCache(prompt, contextFiles = [], maxFiles = MAX_FILES_FOR_ANALYSIS) {
  if (!contextFiles || contextFiles.length === 0) return [];

  const keywords = extractKeywords(prompt);

  console.log(`[Cache Retrieval] Query: "${prompt.slice(0, 80)}"`);
  console.log(`[Cache Retrieval] Keywords: ${keywords.slice(0, 10).join(', ')}`);
  console.log(`[Cache Retrieval] Pool: ${contextFiles.length} cached files`);

  // Diagnostic: log first file's raw structure to detect Mongoose subdoc issues
  if (contextFiles[0]) {
    const first = contextFiles[0];
    const plain = first.toObject ? first.toObject() : first;
    console.log(`[Cache Retrieval] First file → path:"${plain.path}" content:${plain.content?.length ?? 'n/a'} chars`);
  }

  const scored = contextFiles.map(file => {
    // ── Unwrap Mongoose subdocument if needed ──
    // { ...mongooseDoc } silently drops getters, so path/content come out undefined.
    // toObject() converts to a plain JS object with all enumerable properties.
    const plain = (file && typeof file.toObject === 'function') ? file.toObject() : file;
    const filePath    = plain.path    || '';
    const fileContent = plain.content || '';

    if (!filePath) {
      console.warn('[Cache Retrieval] Skipping entry with no path');
      return null; // will be filtered out
    }

    // ── Path-based score ──
    let score = scoreFile(filePath, keywords);

    // ── Content-based score — scan actual source code for keyword matches ──
    if (fileContent) {
      const contentLower = fileContent.toLowerCase();
      keywords.forEach(kw => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matches  = (contentLower.match(new RegExp(escaped, 'g')) || []).length;
        score += Math.min(matches * 3, 15);
      });
    }

    return { path: filePath, content: fileContent, score };
  });

  const selected = scored
    .filter(f => f !== null && f.path && f.score > -10)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles);

  console.log(`[Cache Retrieval] Selected ${selected.length}/${contextFiles.length} files:`);
  selected.forEach(f => console.log(`  [score:${Math.round(f.score)}] ${f.path} (${f.content.length} chars)`));

  return selected;
}

export { extractKeywords, MAX_FILES_FOR_ANALYSIS, MAX_CHARS_PER_FILE, MAX_TOTAL_CONTEXT_CHARS };

// ── Follow-Up Detection ─────────────────────────────────────

const FOLLOWUP_SIGNALS = [
  'continue', 'explain more', 'tell me more', 'go on', 'elaborate',
  'in detail', 'in more detail', 'more detail', 'explain this',
  'explain the flow', 'walk me through', 'how does this work',
  'then what', 'what happens next', 'what about', 'and then',
  'why', 'how', 'what is this', 'what does this do',
  'can you explain', 'can you elaborate', 'show me',
];

export function isFollowUpQuery(query, previousQuery) {
  if (!previousQuery) return false;
  const q = query.trim().toLowerCase();
  if (q.split(/\s+/).length <= 4) return true;
  if (FOLLOWUP_SIGNALS.some(sig => q.includes(sig))) return true;
  return false;
}

export function buildEnrichedQuery(currentQuery, previousQuery, previousSources) {
  const parts = [currentQuery];
  if (previousQuery) parts.push(previousQuery);
  if (previousSources?.length) {
    const fileHints = previousSources
      .map(p => p.split('/').pop().replace(/\.\w+$/, '').replace(/[._-]/g, ' '))
      .join(' ');
    parts.push(fileHints);
  }
  return parts.join(' ');
}

// ── Multi-Hop Import Expansion (Phase 2) ─────────────────────────────────────

/**
 * Parse all import/require paths from a JS/TS file's content.
 * Handles both ESM (import ... from '...') and CJS (require('...')) syntax.
 */
function parseImports(content) {
  const paths = new Set();
  // ESM: import ... from './path' or import './path'
  const esmMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const m of esmMatches) paths.add(m[1]);
  // CJS: require('./path')
  const cjsMatches = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const m of cjsMatches) paths.add(m[1]);
  return [...paths].filter(p => p.startsWith('.') || p.startsWith('/')); // local only
}

/**
 * Resolve a relative import path from a source file to a normalized project path.
 * e.g. "src/controllers/user.controller.js" + "../models/user.model" → "src/models/user.model.js"
 */
function resolveImport(sourceFilePath, importPath) {
  // Build base dir of source file
  const parts = sourceFilePath.split('/');
  parts.pop(); // remove filename
  const base = parts;

  // Resolve relative segments
  const segments = importPath.split('/');
  for (const seg of segments) {
    if (seg === '..') base.pop();
    else if (seg !== '.') base.push(seg);
  }
  return base.join('/');
}

/**
 * Given a set of already-retrieved files, find their import dependencies
 * inside the full cache and add them (up to maxHops depth, maxExtra files).
 *
 * @param {Array<{path,content}>} retrievedFiles - files already in context
 * @param {Array<{path,content}>} allCachedFiles - full repository cache
 * @param {number} maxExtra - max additional files to add
 * @returns {Array<{path,content}>} expanded file list (retrieved + dependencies)
 */
export function expandContextWithImports(retrievedFiles, allCachedFiles, maxExtra = 3) {
  const alreadyIncluded = new Set(retrievedFiles.map(f => f.path));
  const cacheByNorm     = new Map(); // normalizedPath → file

  // Index cache by multiple path variants for fuzzy matching
  for (const f of allCachedFiles) {
    const norm = f.path.toLowerCase().replace(/\.(js|ts|jsx|tsx)$/, '');
    cacheByNorm.set(norm, f);
    // Also index by basename
    const base = f.path.split('/').pop().replace(/\.(js|ts|jsx|tsx)$/, '').toLowerCase();
    if (!cacheByNorm.has(base)) cacheByNorm.set(base, f);
  }

  const toAdd = [];

  for (const file of retrievedFiles) {
    if (toAdd.length >= maxExtra) break;
    const imports = parseImports(file.content);

    for (const imp of imports) {
      if (toAdd.length >= maxExtra) break;

      const resolved    = resolveImport(file.path, imp).toLowerCase().replace(/\.(js|ts|jsx|tsx)$/, '');
      const baseName    = imp.split('/').pop().replace(/\.(js|ts|jsx|tsx)$/, '').toLowerCase();

      const dep = cacheByNorm.get(resolved) || cacheByNorm.get(baseName);
      if (dep && !alreadyIncluded.has(dep.path)) {
        toAdd.push(dep);
        alreadyIncluded.add(dep.path);
        console.log(`  [MultiHop] ${file.path} → ${dep.path}`);
      }
    }
  }

  if (toAdd.length > 0) {
    console.log(`[MultiHop] Added ${toAdd.length} dependency files via import expansion`);
  }

  return [...retrievedFiles, ...toAdd];
}

// ── Topic Extraction ────────────────────────────────────────────────────────

const TOPIC_KEYWORDS = {
  'Authentication':  ['auth', 'login', 'register', 'jwt', 'token', 'password', 'session', 'cookie', 'middleware'],
  'Video Upload':    ['upload', 'video', 'multer', 'cloudinary', 'file', 'stream', 'media'],
  'Subscriptions':   ['subscribe', 'subscription', 'channel', 'follower', 'follow'],
  'Playlist':        ['playlist', 'playlists', 'addvideo', 'createplaylist'],
  'Comments':        ['comment', 'comments', 'addcomment', 'deletecomment'],
  'Likes':           ['like', 'likes', 'togglelike', 'likedvideos'],
  'Dashboard':       ['dashboard', 'stats', 'analytics', 'views', 'metrics'],
  'Search':          ['search', 'query', 'filter', 'aggregation', 'pipeline'],
  'User Profile':    ['profile', 'avatar', 'coverimage', 'updateuser', 'changepassword'],
  'Database':        ['model', 'schema', 'mongoose', 'mongodb', 'aggregat', 'index'],
  'API Routes':      ['route', 'router', 'endpoint', 'api', 'controller'],
  'Error Handling':  ['error', 'apierror', 'trycatch', 'asynchandler', 'middleware'],
};

/**
 * Infer the current conversation topic from a message and prior topic.
 * Returns the topic string (e.g. "Authentication") or the previous topic if no new one found.
 */
export function extractTopicFromQuery(query, previousTopic = '') {
  const q = query.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw))) return topic;
  }
  return previousTopic; // stick with previous if follow-up has no new keywords
}
