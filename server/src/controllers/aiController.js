import Repository from '../models/Repository.js';
import Task from '../models/Task.js';
import * as githubService from '../services/githubService.js';
import * as geminiService from '../services/geminiService.js';
import {
  selectRelevantFiles,
  selectFilesFromCache,
  buildContextWindow,
  MAX_TOTAL_CONTEXT_CHARS,
} from '../services/contextEngine.js';

const MAX_CONTEXT_CHARS = MAX_TOTAL_CONTEXT_CHARS;

// ── Helpers ──────────────────────────────────────────────────

/**
 * Caching logic — fetches important source files from GitHub and saves to MongoDB.
 * Used by: auto-populate (chat), refresh-cache endpoint, and import.
 */
async function populateContextFiles(repository) {
  const { owner, repoName: repo, defaultBranch: branch, structure: tree = [] } = repository;

  const CACHE_PATTERNS = [
    // Manifests & config
    'package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml',
    'tsconfig.json', 'vite.config.js', 'vite.config.ts',
    'next.config.js', 'next.config.ts', 'next.config.mjs',
    '.env.example', 'docker-compose.yml', 'Dockerfile', 'dockerfile',
    // README (case-insensitive variants)
    'README.md', 'Readme.md', 'readme.md', 'README.MD',
    // Entry points
    'server.js', 'server.ts', 'app.js', 'app.ts',
    'src/index.js', 'src/index.ts', 'src/main.js', 'src/main.ts',
    'src/app.js', 'src/app.ts', 'src/App.jsx', 'src/App.tsx',
    'index.js', 'index.ts', 'main.js', 'main.ts',
  ];

  const CACHE_DIRS = [
    'controllers', 'controller',
    'routes', 'route',
    'models', 'model',
    'middlewares', 'middleware',
    'services', 'service',
    'utils', 'helpers', 'lib', 'config',
    'src/controllers', 'src/routes', 'src/models',
    'src/middlewares', 'src/services', 'src/utils',
    'backend/controllers', 'backend/routes', 'backend/models',
    'server/controllers', 'server/routes', 'server/models',
    'api/controllers', 'api/routes', 'api/models',
  ];

  const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java', '.rb', '.php', '.md']);
  const EXCLUDE   = ['node_modules', '.git', 'dist', 'build', '.next', 'vendor',
                     'package-lock.json', 'yarn.lock', 'pnpm-lock', '.min.js', '.min.css',
                     'coverage', '__pycache__'];

  const existingPathsLower = new Map(); // lowercase path → original path
  for (const item of (tree || [])) {
    existingPathsLower.set(item.path.toLowerCase(), item.path);
  }

  const candidatePaths = new Set();

  // Named files (case-insensitive match)
  for (const p of CACHE_PATTERNS) {
    const original = existingPathsLower.get(p.toLowerCase());
    if (original) candidatePaths.add(original);
  }

  // Directory-based files
  for (const item of (tree || [])) {
    if (item.type !== 'file') continue;
    if (EXCLUDE.some(e => item.path.toLowerCase().includes(e))) continue;
    const ext = '.' + item.path.split('.').pop().toLowerCase();
    if (!CODE_EXTS.has(ext)) continue;
    const lowerPath = item.path.toLowerCase();
    if (CACHE_DIRS.some(dir => lowerPath.startsWith(dir + '/') || lowerPath.includes('/' + dir + '/'))) {
      candidatePaths.add(item.path);
    }
  }

  const pathsToFetch = [...candidatePaths].slice(0, 50);
  console.log(`[AutoCache] Candidate files (${pathsToFetch.length}):`, pathsToFetch.join(', '));

  if (pathsToFetch.length === 0) {
    console.warn('[AutoCache] No candidate files found in repository tree. Verify tree has files.');
    return [];
  }

  const results = await Promise.allSettled(
    pathsToFetch.map(p => githubService.getFileContent(owner, repo, p, branch || 'main'))
  );

  const MAX_CHARS = 3000;
  const contextFiles = results
    .filter(r => r.status === 'fulfilled' && r.value?.content)
    .map(r => ({
      path:    r.value.path,
      content: r.value.content.length > MAX_CHARS
        ? r.value.content.slice(0, MAX_CHARS) + '\n// ... [truncated]'
        : r.value.content,
    }));

  console.log(`[AutoCache] Fetched ${contextFiles.length}/${pathsToFetch.length} files successfully`);
  contextFiles.forEach(f => console.log(`  ✓ ${f.path} (${f.content.length} chars)`));

  // ── Critical: use $set to guarantee Mongoose writes the array ──
  // repository.save() may miss array replacements without markModified
  await Repository.findByIdAndUpdate(
    repository._id,
    { $set: { contextFiles } },
    { new: false }
  );

  // Also update in-memory object so caller can use it immediately
  repository.contextFiles = contextFiles;

  console.log(`[AutoCache] ✅ Saved ${contextFiles.length} files to MongoDB for repo ${owner}/${repo}`);
  return contextFiles;
}

/**
 * Build context from the STORED cache (repository.contextFiles).
 * If cache is empty, auto-populates it first (transparent to the caller).
 */
async function buildContextFromCache(repository, prompt) {
  // ── Diagnostic logging ────────────────────────────────────
  console.log(`\n[Cache] ── buildContextFromCache ──`);
  console.log(`[Cache] Repository ID: ${repository._id}`);
  console.log(`[Cache] Repository: ${repository.owner}/${repository.repoName}`);
  console.log(`[Cache] contextFiles count: ${repository.contextFiles?.length ?? 0}`);

  if (repository.contextFiles?.length > 0) {
    console.log(`[Cache] First 3 files:`);
    repository.contextFiles.slice(0, 3).forEach((f, i) => {
      // Use toObject() to safely access Mongoose subdoc properties
      const plain = f.toObject ? f.toObject() : f;
      console.log(`  [${i}] path="${plain.path}" content=${plain.content?.length ?? 0} chars`);
    });
  }

  // Auto-populate if cache is empty (repos imported before contextFiles feature)
  if (!repository.contextFiles || repository.contextFiles.length === 0) {
    console.log(`[Cache] Empty — triggering auto-populate...`);
    await populateContextFiles(repository);
    console.log(`[Cache] After populate: ${repository.contextFiles?.length ?? 0} files`);
  }

  const cachedFiles = repository.contextFiles || [];

  if (cachedFiles.length === 0) {
    console.warn('[Cache] ⚠️  populate returned 0 files — will fall back to live GitHub fetch');
    return { contextWindow: null, sourcePaths: [] };
  }

  // Query-aware retrieval: scores by path keywords + content keyword matches
  console.log(`[Cache] Scoring ${cachedFiles.length} files for query: "${prompt.slice(0, 60)}"`);
  const selected = selectFilesFromCache(prompt, cachedFiles);

  if (selected.length === 0) {
    console.warn('[Cache] ⚠️  selectFilesFromCache returned 0 files — scoring filtered everything out');
    // Return all cached files (up to MAX) rather than nothing
    const fallbackFiles = cachedFiles.slice(0, 5).map(f => {
      const plain = f.toObject ? f.toObject() : f;
      return { path: plain.path || '', content: plain.content || '' };
    }).filter(f => f.path);
    console.log(`[Cache] Using top-${fallbackFiles.length} unscored files as fallback`);
    const repoMeta = { repoName: repository.repoName, owner: repository.owner, language: repository.language };
    const contextWindow = buildContextWindow(fallbackFiles, repository.summary, repoMeta);
    return { contextWindow, sourcePaths: fallbackFiles.map(f => f.path) };
  }

  // Validate paths before returning — must never have nulls
  const sourcePaths = selected.map(f => f.path).filter(Boolean);
  console.log(`[Cache] ✅ Selected files: ${sourcePaths.join(', ')}`);

  const repoMeta = {
    repoName:    repository.repoName,
    owner:       repository.owner,
    description: repository.description,
    language:    repository.language,
  };

  const contextWindow = buildContextWindow(selected, repository.summary, repoMeta);
  const totalChars = contextWindow.length;
  console.log(`[Cache] Context: ${totalChars} chars (~${Math.round(totalChars / 4)} tokens)`);
  console.log(`[Cache] Preview:\n${contextWindow.slice(0, 500)}\n`);

  return { contextWindow, sourcePaths };
}

/**
 * Build context via LIVE GitHub fetch.
 * Used by analysis, suggestions, feature-generation — more thorough but slower.
 */
async function buildContextFromGitHub(repository, prompt) {
  console.log(`\n[GitHub Fetch] Building context for: "${prompt.slice(0, 60)}"`);
  console.log(`[GitHub Fetch] Repo: ${repository.owner}/${repository.repoName}`);

  const selectedPaths = selectRelevantFiles(
    prompt,
    repository.structure,
    repository.summary
  );

  console.log(`[GitHub Fetch] Selected ${selectedPaths.length} files:`);
  selectedPaths.forEach(p => console.log(`  - ${p}`));

  let fileContents = [];
  const fetchedPaths = [];

  if (selectedPaths.length > 0) {
    console.log(`[GitHub Fetch] Fetching from GitHub...`);
    const results = await Promise.allSettled(
      selectedPaths.map(path =>
        githubService.getFileContent(
          repository.owner,
          repository.repoName,
          path,
          repository.defaultBranch || 'main'
        )
      )
    );
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.content) {
        fileContents.push(r.value);
        fetchedPaths.push(selectedPaths[i]);
      }
    });
    console.log(`[GitHub Fetch] Got ${fileContents.length}/${selectedPaths.length} files`);
  }

  const repoMeta = {
    repoName:    repository.repoName,
    owner:       repository.owner,
    description: repository.description,
    language:    repository.language,
  };

  let contextWindow = buildContextWindow(fileContents, repository.summary, repoMeta);

  const totalChars = contextWindow.length;
  console.log(`[GitHub Fetch] Context: ${totalChars} chars (~${Math.round(totalChars / 4)} tokens)`);
  console.log(`[GitHub Fetch] Preview:\n${contextWindow.slice(0, 300)}\n`);

  // Graceful fallback if still oversized
  if (totalChars > MAX_CONTEXT_CHARS) {
    console.warn(`[GitHub Fetch] OVERSIZED. Falling back to summary-only context.`);
    contextWindow = buildContextWindow([], repository.summary, repoMeta);
    contextWindow += `\n## Note\nRepository is large. Response based on repository summary only.\n`;
  }

  return { contextWindow, sourcePaths: fetchedPaths };
}

// ── POST /api/ai/analyze ────────────────────────────────────
export const analyzeRepository = async (req, res, next) => {
  try {
    const { repositoryId } = req.body;
    if (!repositoryId) return res.status(400).json({ message: 'repositoryId is required.' });

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository) return res.status(404).json({ message: 'Repository not found.' });

    // Analysis: prefer cache, fall back to live GitHub
    let contextResult;
    if (repository.contextFiles?.length > 0) {
      console.log(`[Analyze] Using cached files (${repository.contextFiles.length} files)`);
      contextResult = buildContextFromCache(
        repository,
        'analyze repository architecture code quality tech stack folder structure security scalability'
      );
    } else {
      contextResult = await buildContextFromGitHub(
        repository,
        'analyze repository architecture code quality tech stack folder structure security scalability'
      );
    }

    console.log('[AI] Calling AI service for repository analysis...');
    const analysis = await geminiService.analyzeRepository(contextResult.contextWindow);

    repository.lastAnalyzedAt = new Date();
    await repository.save();

    const task = await Task.create({
      userId: req.user._id,
      repositoryId: repository._id,
      taskType: 'analysis',
      prompt: 'Analyze Repository',
      response: analysis,
    });

    res.json({ analysis, taskId: task._id });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/ai/chat ───────────────────────────────────────
export const chatAboutRepo = async (req, res, next) => {
  try {
    const { repositoryId, prompt } = req.body;
    if (!prompt)       return res.status(400).json({ message: 'Prompt is required.' });
    if (!repositoryId) return res.status(400).json({ message: 'repositoryId is required.' });

    // Load repo WITH contextFiles (needed for cache-based retrieval)
    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository)   return res.status(404).json({ message: 'Repository not found.' });

    console.log(`\n[Chat] Query: "${prompt.slice(0, 80)}"`);
    console.log(`[Chat] Repo: ${repository.owner}/${repository.repoName}`);
    console.log(`[Chat] contextFiles in DB: ${(repository.contextFiles || []).length}`);

    // Build context from cache (auto-populates if empty — transparent)
    const { contextWindow, sourcePaths } = await buildContextFromCache(repository, prompt);

    let finalContext = contextWindow;
    let finalSources = sourcePaths;

    // Last-resort fallback: if auto-populate also failed, use live GitHub
    if (!finalContext) {
      console.log('[Chat] Cache unavailable — using live GitHub fetch as last resort...');
      const liveResult = await buildContextFromGitHub(repository, prompt);
      finalContext = liveResult.contextWindow;
      finalSources = liveResult.sourcePaths;
    }

    console.log('[AI] Calling Groq for chat response...');
    const aiResult = await geminiService.chatAboutRepo(prompt, finalContext, finalSources);

    const response = {
      answer:  aiResult.answer  || aiResult,
      sources: aiResult.sources?.length ? aiResult.sources : finalSources,
    };

    const task = await Task.create({
      userId: req.user._id,
      repositoryId: repository._id,
      taskType: 'chat',
      prompt,
      response,
    });

    res.json({ response, taskId: task._id });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/ai/suggestions ────────────────────────────────

/**
 * Build a wide repository sweep for the Suggestions feature.
 * NOT query-based — always selects files across all architecture layers.
 * Returns { contextWindow, selectedFiles }
 */
function buildSuggestionsContext(repository) {
  const cachedFiles = (repository.contextFiles || []).map(f => {
    const plain = f.toObject ? f.toObject() : f;
    return { path: plain.path || '', content: plain.content || '' };
  }).filter(f => f.path);

  if (cachedFiles.length === 0) {
    return { contextWindow: null, selectedFiles: [] };
  }

  // ── File bucket helpers ──────────────────────────────
  const byDir = (keyword) => cachedFiles
    .filter(f => f.path.toLowerCase().includes(keyword))
    .sort((a, b) => b.content.length - a.content.length); // largest first

  const corePatterns = [
    'package.json', 'readme.md', 'src/index.js', 'src/index.ts',
    'src/app.js', 'src/app.ts', 'app.js', 'server.js',
  ];

  // ── Collect by category ──────────────────────────────
  const coreFiles        = cachedFiles.filter(f => corePatterns.some(p => f.path.toLowerCase().endsWith(p)));
  const controllerFiles  = byDir('controller').slice(0, 3);
  const modelFiles       = byDir('model').slice(0, 2);
  const middlewareFiles  = byDir('middlewar').slice(0, 2);
  const routeFiles       = byDir('route').slice(0, 2);
  const serviceFiles     = byDir('service').slice(0, 1);
  const utilFiles        = byDir('util').slice(0, 1);

  // Deduplicate and limit to 12 files, 25000 chars total
  const MAX_TOTAL = 25000;
  const MAX_FILES = 12;
  const MAX_PER_FILE = 3000;

  const seen = new Set();
  const selected = [];
  let totalChars = 0;

  for (const file of [...coreFiles, ...controllerFiles, ...modelFiles,
                        ...middlewareFiles, ...routeFiles, ...serviceFiles, ...utilFiles]) {
    if (seen.has(file.path)) continue;
    if (selected.length >= MAX_FILES) break;
    if (totalChars >= MAX_TOTAL) break;

    const content = file.content.length > MAX_PER_FILE
      ? file.content.slice(0, MAX_PER_FILE) + '\n// ... [truncated]'
      : file.content;

    seen.add(file.path);
    selected.push({ path: file.path, content });
    totalChars += content.length;
  }

  console.log(`[Suggestions] Review files (${selected.length}, ${totalChars} chars):`);
  selected.forEach(f => console.log(`  ✓ ${f.path} (${f.content.length} chars)`));

  const repoMeta = {
    repoName:    repository.repoName,
    owner:       repository.owner,
    description: repository.description,
    language:    repository.language,
  };

  const contextWindow = buildContextWindow(selected, repository.summary, repoMeta);
  console.log(`[Suggestions] Context window: ${contextWindow.length} chars (~${Math.round(contextWindow.length / 4)} tokens)`);

  return { contextWindow, selectedFiles: selected };
}

export const suggestImprovements = async (req, res, next) => {
  try {
    const { repositoryId } = req.body;
    if (!repositoryId) return res.status(400).json({ message: 'repositoryId is required.' });

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository)   return res.status(404).json({ message: 'Repository not found.' });

    // Auto-populate contextFiles if empty
    if (!repository.contextFiles || repository.contextFiles.length === 0) {
      console.log('[Suggestions] Cache empty — auto-populating...');
      await populateContextFiles(repository);
    }

    // Build wide-sweep context (not query-based)
    const { contextWindow, selectedFiles } = buildSuggestionsContext(repository);

    let finalContext = contextWindow;
    if (!finalContext) {
      // Last-resort: live GitHub fetch
      console.log('[Suggestions] Cache unavailable — falling back to live GitHub fetch...');
      const liveResult = await buildContextFromGitHub(
        repository,
        'suggest improvements performance security code quality scalability refactoring'
      );
      finalContext = liveResult.contextWindow;
    }

    console.log('[AI] Calling AI service for suggestions...');
    const suggestions = await geminiService.suggestImprovements(finalContext);

    const task = await Task.create({
      userId: req.user._id,
      repositoryId: repository._id,
      taskType: 'suggestions',
      prompt: 'Suggest Improvements',
      response: suggestions,
    });

    res.json({ suggestions, taskId: task._id });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/ai/generate-feature ───────────────────────────

/**
 * Build a rich context for the Feature Generator.
 * Unlike chat (5 files, query-focused), this gives the AI:
 *   1. Full repository summary + tech stack (for stack detection)
 *   2. Top 100 structure paths  (for naming conventions + file existence check)
 *   3. Relevant source files from cache (up to 15, query-aware)
 */
async function buildFeatureGenerationContext(repository, featureRequest) {
  const MAX_FILES     = 15;
  const MAX_PER_FILE  = 3000;
  const MAX_TOTAL     = 30000;

  // ── Diagnostic logging ──────────────────────────────────
  console.log(`\n[FeatureGen] ── buildFeatureGenerationContext ──`);
  console.log(`[FeatureGen] Repository: ${repository.owner}/${repository.repoName}`);
  console.log(`[FeatureGen] Structure Count: ${repository.structure?.length || 0}`);
  console.log(`[FeatureGen] Context Files Count: ${repository.contextFiles?.length || 0}`);
  console.log(`[FeatureGen] Summary Exists: ${!!repository.summary}`);
  console.log(`[FeatureGen] First Context File: ${repository.contextFiles?.[0]?.path || 'none'}`);

  // ── SECTION 1: Repository Intelligence Header ────────────
  const sections = [];

  // Always inject summary so the AI can detect stack even without package.json
  if (repository.summary) {
    const s = repository.summary;
    sections.push(`## Repository Summary
Project: ${repository.repoName} by ${repository.owner}
Language: ${repository.language || 'Unknown'}
Description: ${repository.description || 'N/A'}

### Project Summary
${s.projectSummary || 'N/A'}

### Tech Stack
${s.techStack || 'N/A'}

### Architecture Overview
${s.architectureOverview || 'N/A'}
`);
  } else {
    sections.push(`## Repository
Project: ${repository.repoName} by ${repository.owner}
Language: ${repository.language || 'Unknown'}
Description: ${repository.description || 'N/A'}
`);
  }

  // ── SECTION 2: File Structure (top 100 paths) ───────────
  const structure = (repository.structure || []).slice(0, 100);
  if (structure.length > 0) {
    const pathList = structure.map(f => `  ${f.path}`).join('\n');
    sections.push(`## Repository File Structure (${structure.length} paths)
${pathList}
`);
  }

  // ── SECTION 3: Relevant Source Files ────────────────────
  // Use the cached files, scored by the feature request
  const cachedFiles = (repository.contextFiles || []).map(f => {
    const plain = f.toObject ? f.toObject() : f;
    return { path: plain.path || '', content: plain.content || '' };
  }).filter(f => f.path);

  let selectedFiles = [];

  if (cachedFiles.length > 0) {
    // Score by feature request keywords
    selectedFiles = selectFilesFromCache(featureRequest, cachedFiles, MAX_FILES);

    // If scoring filtered too aggressively, top up with priority files
    if (selectedFiles.length < 3) {
      const priorityPaths = ['package.json', 'src/app.js', 'app.js', 'index.js', 'src/index.js'];
      const priorityFiles = cachedFiles.filter(f =>
        priorityPaths.some(p => f.path.toLowerCase().endsWith(p)) &&
        !selectedFiles.find(s => s.path === f.path)
      );
      selectedFiles = [...selectedFiles, ...priorityFiles].slice(0, MAX_FILES);
    }
  }

  if (selectedFiles.length > 0) {
    let usedChars = sections.join('\n').length;
    const fileSection = ['## Source Code Files'];
    for (const file of selectedFiles) {
      const content = file.content.length > MAX_PER_FILE
        ? file.content.slice(0, MAX_PER_FILE) + '\n// ... [truncated]'
        : file.content;
      const ext = file.path.split('.').pop();
      const entry = `\nFILE: ${file.path}\n\`\`\`${ext}\n${content}\n\`\`\``;
      if (usedChars + entry.length > MAX_TOTAL) break;
      fileSection.push(entry);
      usedChars += entry.length;
    }
    sections.push(fileSection.join('\n'));
    console.log(`[FeatureGen] Source files included: ${selectedFiles.map(f => f.path).join(', ')}`);
  } else {
    console.warn('[FeatureGen] No source files in cache — stack detection relies on summary + structure only');
  }

  const contextWindow = sections.join('\n');
  console.log(`[FeatureGen] Context Length: ${contextWindow.length} chars (~${Math.round(contextWindow.length / 4)} tokens)`);
  console.log(`[FeatureGen] Context Preview:\n${contextWindow.slice(0, 800)}\n`);

  return contextWindow;
}

export const generateFeature = async (req, res, next) => {
  try {
    const { repositoryId, prompt } = req.body;
    if (!prompt)       return res.status(400).json({ message: 'Feature description is required.' });
    if (!repositoryId) return res.status(400).json({ message: 'repositoryId is required.' });

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository)   return res.status(404).json({ message: 'Repository not found.' });

    // Auto-populate contextFiles if empty
    if (!repository.contextFiles || repository.contextFiles.length === 0) {
      console.log('[FeatureGen] Cache empty — auto-populating...');
      await populateContextFiles(repository);
    }

    // Build rich feature-generation context
    const contextWindow = await buildFeatureGenerationContext(repository, prompt);

    console.log('[AI] Calling AI service for feature generation...');
    const featureResult = await geminiService.generateFeature(prompt, contextWindow);

    // ── Phase 0 intent logging ───────────────────────────
    console.log(`[FeatureGen] Feature Type: ${featureResult?.featureType || 'unknown'}`);
    console.log(`[FeatureGen] Repository Capabilities:`, featureResult?.repositoryCapabilities);
    console.log(`[FeatureGen] Compatible: ${!featureResult?.needsFrontendRepository}`);

    // ── Compatibility gate — return early without storing task ──
    if (featureResult?.needsFrontendRepository) {
      return res.status(200).json({
        incompatible: true,
        featureType: featureResult.featureType,
        repositoryCapabilities: featureResult.repositoryCapabilities,
        detectedStack: featureResult.detectedStack,
        reason: featureResult.reason,
      });
    }

    const task = await Task.create({
      userId: req.user._id,
      repositoryId: repository._id,
      taskType: 'feature-generation',
      prompt,
      response: featureResult,
    });

    res.json({ result: featureResult, taskId: task._id });
  } catch (error) {
    next(error);
  }
};
