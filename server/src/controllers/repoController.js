import Repository from '../models/Repository.js';
import * as githubService from '../services/githubService.js';
import { generateRepoSummary } from '../services/geminiService.js';

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
    const existing = await Repository.findOne({ userId: req.user._id, repoUrl: { $regex: new RegExp(`github\\.com/${owner}/${repo}`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Repository already imported.' });
    }

    // Fetch from GitHub in parallel
    const [repoInfo, tree, languages, readme] = await Promise.all([
      githubService.getRepoInfo(owner, repo),
      githubService.getRepoTree(owner, repo),
      githubService.getLanguages(owner, repo),
      githubService.getReadme(owner, repo),
    ]);

    // Generate AI summary cache
    let summary = {
      projectSummary: '',
      techStack: [],
      importantFiles: [],
      architectureOverview: '',
    };

    try {
      summary = await generateRepoSummary(tree, readme);
    } catch (aiError) {
      console.error('AI summary generation failed:', aiError.message);
      // Continue without summary — it can be generated later
    }

    // Store repository
    const repository = await Repository.create({
      userId: req.user._id,
      repoName: repoInfo.name,
      owner: repoInfo.owner,
      repoUrl: repoInfo.url,
      description: repoInfo.description,
      defaultBranch: repoInfo.defaultBranch,
      language: repoInfo.language,
      languages,
      stars: repoInfo.stars,
      forks: repoInfo.forks,
      fileCount: tree.filter((f) => f.type === 'file').length,
      structure: tree,
      summary,
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
      .select('-structure'); // Exclude large structure from list view
    res.json(repositories);
  } catch (error) {
    next(error);
  }
};

// GET /api/repositories/:id
export const getRepository = async (req, res, next) => {
  try {
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
