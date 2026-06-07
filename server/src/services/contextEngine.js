/**
 * Repository Context Engine
 *
 * Instead of sending the entire repository to Gemini,
 * this module intelligently selects the most relevant files
 * based on the user's prompt and cached repository summary.
 *
 * This is a core system design differentiator.
 */

// File extensions we consider as code
const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs',
  '.rb', '.php', '.c', '.cpp', '.h', '.cs', '.swift', '.kt',
  '.vue', '.svelte', '.html', '.css', '.scss', '.less',
  '.json', '.yaml', '.yml', '.toml', '.md', '.sql',
]);

// Files that are always relevant regardless of query
const ALWAYS_INCLUDE = new Set([
  'package.json', 'readme.md', 'readme.txt',
]);

// Files/dirs to always exclude
const EXCLUDE_PATTERNS = [
  'node_modules', '.git', 'dist', 'build', '.next',
  'coverage', '__pycache__', '.cache', '.env',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.min.js', '.min.css', '.map',
];

// Keyword expansion map — maps user intent to related file patterns
const KEYWORD_EXPANSIONS = {
  'dark mode': ['theme', 'style', 'css', 'color', 'context', 'app', 'navbar', 'header', 'layout'],
  'authentication': ['auth', 'login', 'register', 'user', 'jwt', 'token', 'middleware', 'session', 'passport'],
  'database': ['model', 'schema', 'db', 'mongoose', 'prisma', 'migration', 'seed', 'config'],
  'api': ['route', 'controller', 'endpoint', 'handler', 'middleware', 'service'],
  'testing': ['test', 'spec', 'mock', 'fixture', 'jest', 'cypress'],
  'deployment': ['docker', 'dockerfile', 'nginx', 'config', 'env', 'ci', 'cd', 'workflow'],
  'styling': ['css', 'style', 'tailwind', 'theme', 'component', 'layout', 'ui'],
  'routing': ['route', 'router', 'navigation', 'page', 'link', 'nav'],
  'state': ['context', 'store', 'redux', 'state', 'provider', 'hook'],
  'pagination': ['list', 'table', 'page', 'query', 'api', 'controller', 'component'],
  'search': ['search', 'filter', 'query', 'input', 'component', 'api'],
  'form': ['form', 'input', 'validation', 'submit', 'handler', 'component'],
};

/**
 * Extract keywords from a user prompt
 */
function extractKeywords(prompt) {
  const lower = prompt.toLowerCase();
  const words = lower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Add expanded keywords based on known patterns
  const expanded = new Set(words);
  for (const [pattern, expansions] of Object.entries(KEYWORD_EXPANSIONS)) {
    if (lower.includes(pattern)) {
      expansions.forEach((e) => expanded.add(e));
    }
  }

  // Also add individual words from multi-word patterns
  for (const [pattern] of Object.entries(KEYWORD_EXPANSIONS)) {
    const patternWords = pattern.split(' ');
    if (patternWords.every((pw) => lower.includes(pw))) {
      KEYWORD_EXPANSIONS[pattern].forEach((e) => expanded.add(e));
    }
  }

  return [...expanded];
}

/**
 * Expand keywords using the cached repository summary
 */
function expandWithSummary(keywords, summary) {
  const expanded = new Set(keywords);

  if (summary?.techStack) {
    // If the repo uses React, terms like 'component', 'jsx', 'hook' become more relevant
    summary.techStack.forEach((tech) => {
      expanded.add(tech.toLowerCase());
    });
  }

  if (summary?.importantFiles) {
    // Extract directory patterns from important files
    summary.importantFiles.forEach((file) => {
      const parts = file.split('/');
      parts.forEach((p) => {
        if (p.length > 2 && !p.includes('.')) {
          expanded.add(p.toLowerCase());
        }
      });
    });
  }

  return [...expanded];
}

/**
 * Calculate a relevance score for a file given keywords
 */
function scoreFile(filePath, keywords) {
  const lower = filePath.toLowerCase();
  const fileName = lower.split('/').pop();
  const dirParts = lower.split('/').slice(0, -1);
  let score = 0;

  // Check if file should be excluded
  if (EXCLUDE_PATTERNS.some((p) => lower.includes(p))) {
    return -100;
  }

  // Check file extension is code
  const ext = '.' + fileName.split('.').pop();
  if (!CODE_EXTENSIONS.has(ext) && !ALWAYS_INCLUDE.has(fileName)) {
    score -= 5;
  }

  // Always-include files get a boost
  if (ALWAYS_INCLUDE.has(fileName)) {
    score += 15;
  }

  // Keyword matches in filename (strongest signal)
  keywords.forEach((keyword) => {
    if (fileName.includes(keyword)) score += 12;
  });

  // Keyword matches in directory path
  keywords.forEach((keyword) => {
    dirParts.forEach((dir) => {
      if (dir.includes(keyword)) score += 6;
    });
  });

  // Source directory boost
  if (dirParts.some((d) => ['src', 'lib', 'app', 'pages', 'components'].includes(d))) {
    score += 4;
  }

  // Entry point boost
  if (['index.js', 'index.jsx', 'index.ts', 'index.tsx', 'main.js', 'main.jsx',
       'app.js', 'app.jsx', 'app.tsx', 'server.js', 'app.py', 'main.py'].includes(fileName)) {
    score += 8;
  }

  // Config files get moderate relevance
  if (['vite.config.js', 'webpack.config.js', 'tsconfig.json', 'tailwind.config.js',
       '.eslintrc.js', '.babelrc'].includes(fileName)) {
    score += 3;
  }

  // Penalize test files slightly (unless user asks about testing)
  if (lower.includes('test') || lower.includes('spec') || lower.includes('__test')) {
    score -= 3;
  }

  // Penalize deeply nested files
  if (dirParts.length > 5) {
    score -= 2;
  }

  return score;
}

/**
 * Select the most relevant files for a given prompt
 * @param {string} prompt - User's prompt
 * @param {Array} repoStructure - Array of {path, type, size}
 * @param {Object} summaryCache - Cached repository summary
 * @param {number} maxFiles - Maximum number of files to select
 * @returns {Array} Selected file paths, sorted by relevance
 */
export function selectRelevantFiles(prompt, repoStructure, summaryCache = {}, maxFiles = 15) {
  const keywords = extractKeywords(prompt);
  const expandedKeywords = expandWithSummary(keywords, summaryCache);

  // Score all files (not directories)
  const scoredFiles = repoStructure
    .filter((item) => item.type === 'file')
    .map((item) => ({
      path: item.path,
      score: scoreFile(item.path, expandedKeywords),
      size: item.size,
    }))
    .filter((item) => item.score > -10) // Exclude heavily penalized files
    .sort((a, b) => b.score - a.score);

  // Take top files, but respect a rough token budget
  const selected = [];
  let totalSize = 0;
  const MAX_TOTAL_SIZE = 200000; // ~200KB of code ≈ ~50K tokens

  for (const file of scoredFiles) {
    if (selected.length >= maxFiles) break;
    if (totalSize + file.size > MAX_TOTAL_SIZE) continue;
    selected.push(file.path);
    totalSize += file.size;
  }

  return selected;
}

/**
 * Build a context window string for Gemini
 * Combines selected file contents with the summary cache
 */
export function buildContextWindow(fileContents, summaryCache) {
  let context = '';

  // Add summary context first
  if (summaryCache?.projectSummary) {
    context += `## Project Overview\n${summaryCache.projectSummary}\n\n`;
  }
  if (summaryCache?.techStack?.length) {
    context += `## Tech Stack\n${summaryCache.techStack.join(', ')}\n\n`;
  }
  if (summaryCache?.architectureOverview) {
    context += `## Architecture\n${summaryCache.architectureOverview}\n\n`;
  }

  // Add file contents
  context += `## Relevant Source Files\n\n`;
  for (const file of fileContents) {
    if (file && file.content) {
      context += `### File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
    }
  }

  return context;
}

export { extractKeywords };
