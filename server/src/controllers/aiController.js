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
 * Build context from the STORED cache (repository.contextFiles).
 * Used by chat — instant, no GitHub API calls, content-aware retrieval.
 */
function buildContextFromCache(repository, prompt) {
  const cachedFiles = repository.contextFiles || [];

  if (cachedFiles.length === 0) {
    console.log('[Cache] No contextFiles stored. Run a fresh import to populate the cache.');
    return { contextWindow: null, sourcePaths: [] };
  }

  // Query-aware selection using content + path scoring
  const selected = selectFilesFromCache(prompt, cachedFiles);
  const sourcePaths = selected.map(f => f.path);

  const repoMeta = {
    repoName:    repository.repoName,
    owner:       repository.owner,
    description: repository.description,
    language:    repository.language,
  };

  // Build context from cached content (no truncation needed — already stored at 3000 chars)
  const contextWindow = buildContextWindow(selected, repository.summary, repoMeta);

  const totalChars = contextWindow.length;
  console.log(`[Cache] Context: ${totalChars} chars (~${Math.round(totalChars / 4)} tokens) from ${selected.length} cached files`);

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

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository)   return res.status(404).json({ message: 'Repository not found.' });

    // Chat: always use cache — fast, no GitHub API calls
    const { contextWindow, sourcePaths } = buildContextFromCache(repository, prompt);

    // If cache is empty, fall back to live fetch
    let finalContext = contextWindow;
    let finalSources = sourcePaths;

    if (!finalContext) {
      console.log('[Chat] Cache empty — falling back to live GitHub fetch...');
      const liveResult = await buildContextFromGitHub(repository, prompt);
      finalContext  = liveResult.contextWindow;
      finalSources  = liveResult.sourcePaths;
    }

    console.log('[AI] Calling AI service for chat...');
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
export const suggestImprovements = async (req, res, next) => {
  try {
    const { repositoryId } = req.body;
    if (!repositoryId) return res.status(400).json({ message: 'repositoryId is required.' });

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository)   return res.status(404).json({ message: 'Repository not found.' });

    let contextResult;
    if (repository.contextFiles?.length > 0) {
      contextResult = buildContextFromCache(
        repository,
        'suggest improvements performance security code quality scalability refactoring'
      );
    } else {
      contextResult = await buildContextFromGitHub(
        repository,
        'suggest improvements performance security code quality scalability refactoring'
      );
    }

    console.log('[AI] Calling AI service for suggestions...');
    const suggestions = await geminiService.suggestImprovements(contextResult.contextWindow);

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
export const generateFeature = async (req, res, next) => {
  try {
    const { repositoryId, prompt } = req.body;
    if (!prompt)       return res.status(400).json({ message: 'Feature description is required.' });
    if (!repositoryId) return res.status(400).json({ message: 'repositoryId is required.' });

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository)   return res.status(404).json({ message: 'Repository not found.' });

    let contextResult;
    if (repository.contextFiles?.length > 0) {
      contextResult = buildContextFromCache(repository, prompt);
    } else {
      contextResult = await buildContextFromGitHub(repository, prompt);
    }

    console.log('[AI] Calling AI service for feature generation...');
    const featureResult = await geminiService.generateFeature(prompt, contextResult.contextWindow);

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
