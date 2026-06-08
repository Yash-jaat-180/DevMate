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

  const scored = contextFiles.map(file => {
    // ── Path-based score (same as selectRelevantFiles) ──
    let score = scoreFile(file.path, keywords);

    // ── Content-based score (unique to cache retrieval) ──
    // Scan the actual source code for keyword matches
    if (file.content) {
      const contentLower = file.content.toLowerCase();
      keywords.forEach(kw => {
        // Count occurrences, capped to avoid over-weighting one keyword
        const matches = (contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += Math.min(matches * 3, 15); // up to 15 points per keyword from content
      });
    }

    return { ...file, score };
  });

  const selected = scored
    .filter(f => f.score > -10)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles);

  console.log(`[Cache Retrieval] Selected ${selected.length}/${contextFiles.length} cached files:`);
  selected.forEach(f => console.log(`  [score:${Math.round(f.score)}] ${f.path}`));

  return selected;
}

export { extractKeywords, MAX_FILES_FOR_ANALYSIS, MAX_CHARS_PER_FILE, MAX_TOTAL_CONTEXT_CHARS };
