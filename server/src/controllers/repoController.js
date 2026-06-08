import mongoose from 'mongoose';
import Repository from '../models/Repository.js';
import * as githubService from '../services/githubService.js';
import { generateRepoSummary } from '../services/geminiService.js';

// Helper: reject invalid ObjectIds early with a clean 400
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/repositories/import
export const importRepository = async (req, res, next) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ message: 'Repository URL is required.' });
    }

    // Parse URL
    const { owner, repo } = githubService.parseRepoUrl(repoUrl);

    // Check if already imported by this user
    const existing = await Repository.findOne({
      userId: req.user._id,
      repoUrl: { $regex: new RegExp(`github\\.com/${owner}/${repo}`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ message: 'Repository already imported.' });
    }

    // Fetch repo metadata, tree, languages and README in parallel
    const [repoInfo, tree, languages, readme] = await Promise.all([
      githubService.getRepoInfo(owner, repo),
      githubService.getRepoTree(owner, repo),
      githubService.getLanguages(owner, repo),
      githubService.getReadme(owner, repo),
    ]);

    const branch = repoInfo.defaultBranch || 'main';
    const existingPaths = new Set(tree.map(f => f.path));

    // ── Context File Cache ─────────────────────────────────────
    // Determine which important files to cache for AI chat/analysis.
    // Rules: max 50 files, max 3000 chars per file.
    const CACHE_PATTERNS = [
      // Config / manifest
      'package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml',
      'tsconfig.json', 'vite.config.js', 'vite.config.ts',
      'next.config.js', 'next.config.ts', 'next.config.mjs',
      '.env.example', 'docker-compose.yml', 'dockerfile',
      // Entry points
      'server.js', 'server.ts', 'app.js', 'app.ts',
      'src/index.js', 'src/index.ts', 'src/main.js', 'src/main.ts',
      'src/app.js', 'src/app.ts', 'src/App.jsx', 'src/App.tsx',
    ];

    // Important directory patterns — pick files from these dirs
    const CACHE_DIRS = [
      'controllers', 'controller',
      'routes', 'route',
      'models', 'model',
      'middlewares', 'middleware',
      'services', 'service',
      'utils', 'helpers', 'lib',
      'config',
      'src/controllers', 'src/routes', 'src/models',
      'src/middlewares', 'src/services', 'src/utils',
      'backend/controllers', 'backend/routes', 'backend/models',
      'server/controllers', 'server/routes', 'server/models',
    ];

    const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java', '.rb', '.php']);
    const EXCLUDE = ['node_modules', '.git', 'dist', 'build', '.next', 'vendor',
                     'package-lock.json', 'yarn.lock', '.min.js', '.min.css'];

    // Collect candidate paths
    const candidatePaths = new Set();

    // 1. Always-include named files
    CACHE_PATTERNS.forEach(p => { if (existingPaths.has(p)) candidatePaths.add(p); });

    // 2. Files inside important directories
    for (const item of tree) {
      if (item.type !== 'file') continue;
      if (EXCLUDE.some(e => item.path.toLowerCase().includes(e))) continue;
      const ext = '.' + item.path.split('.').pop().toLowerCase();
      if (!CODE_EXTS.has(ext)) continue;

      const lowerPath = item.path.toLowerCase();
      if (CACHE_DIRS.some(dir => lowerPath.startsWith(dir + '/') || lowerPath.includes('/' + dir + '/'))) {
        candidatePaths.add(item.path);
      }
    }

    // Limit to 50 files
    const pathsToFetch = [...candidatePaths].slice(0, 50);
    console.log(`[Import] Caching ${pathsToFetch.length} source files for AI context...`);

    // Fetch all candidate files in parallel
    const fileResults = await Promise.allSettled(
      pathsToFetch.map(path => githubService.getFileContent(owner, repo, path, branch))
    );

    const MAX_CHARS_PER_FILE = 3000;
    const contextFiles = fileResults
      .filter(r => r.status === 'fulfilled' && r.value?.content)
      .map(r => ({
        path: r.value.path,
        content: r.value.content.length > MAX_CHARS_PER_FILE
          ? r.value.content.slice(0, MAX_CHARS_PER_FILE) + '\n// ... [truncated]'
          : r.value.content,
      }));

    console.log(`[Import] Cached ${contextFiles.length} files (${(contextFiles.reduce((s, f) => s + f.content.length, 0) / 1000).toFixed(1)}KB total)`);

    // ── AI Summary Cache ───────────────────────────────────────
    // Use README + key files to generate a summary on import.
    const keyFiles = contextFiles.filter(f =>
      CACHE_PATTERNS.includes(f.path) || f.path.endsWith('package.json')
    ).slice(0, 8);

    let summary = { projectSummary: '', techStack: [], importantFiles: [], architectureOverview: '' };
    try {
      summary = await generateRepoSummary(tree, readme, keyFiles);
      console.log('[Import] AI summary generated successfully');
    } catch (aiError) {
      console.error('[Import] AI summary generation failed:', aiError.message);
    }

    // ── Store Repository ───────────────────────────────────────
    const repository = await Repository.create({
      userId: req.user._id,
      repoName: repoInfo.name,
      owner: repoInfo.owner,
      repoUrl: repoInfo.url,
      description: repoInfo.description,
      defaultBranch: branch,
      language: repoInfo.language,
      languages,
      stars: repoInfo.stars,
      forks: repoInfo.forks,
      fileCount: tree.filter(f => f.type === 'file').length,
      structure: tree,
      summary,
      contextFiles,
    });

    res.status(201).json(repository);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Repository not found on GitHub.' });
    }
    next(error);
  }
};


// GET /api/repositories
export const getRepositories = async (req, res, next) => {
  try {
    const repositories = await Repository.find({ userId: req.user._id })
      .sort({ importedAt: -1 })
      .select('-structure -contextFiles'); // Exclude large fields from list view
    res.json(repositories);
  } catch (error) {
    next(error);
  }
};

// GET /api/repositories/:id
export const getRepository = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid repository ID.' });
    const repository = await Repository.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    res.json(repository);
  } catch (error) {
    next(error);
  }
};

// GET /api/repositories/:id/tree
export const getRepositoryTree = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid repository ID.' });
    const repository = await Repository.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('structure repoName');

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    res.json({ tree: repository.structure, repoName: repository.repoName });
  } catch (error) {
    next(error);
  }
};

// GET /api/repositories/:id/file?path=src/index.js
export const getRepositoryFile = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid repository ID.' });
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ message: 'File path is required.' });
    }

    const repository = await Repository.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('owner repoName defaultBranch');

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    const file = await githubService.getFileContent(
      repository.owner,
      repository.repoName,
      path,
      repository.defaultBranch
    );

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    res.json(file);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/repositories/:id
export const deleteRepository = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid repository ID.' });
    const repository = await Repository.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    res.json({ message: 'Repository deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
