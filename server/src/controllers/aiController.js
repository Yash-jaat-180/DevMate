import Repository from '../models/Repository.js';
import Task from '../models/Task.js';
import * as githubService from '../services/githubService.js';
import * as geminiService from '../services/geminiService.js';
import { selectRelevantFiles, buildContextWindow } from '../services/contextEngine.js';

/**
 * Helper: Fetch contents of selected files from GitHub
 */
async function fetchFileContents(owner, repo, branch, filePaths) {
  const contents = await Promise.allSettled(
    filePaths.map((path) => githubService.getFileContent(owner, repo, path, branch))
  );
  return contents
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
}

/**
 * Helper: Build context using the Context Engine
 */
async function buildContext(repository, prompt) {
  const relevantFiles = selectRelevantFiles(
    prompt,
    repository.structure,
    repository.summary
  );

  const fileContents = await fetchFileContents(
    repository.owner,
    repository.repoName,
    repository.defaultBranch,
    relevantFiles
  );

  return buildContextWindow(fileContents, repository.summary);
}

// POST /api/ai/analyze
export const analyzeRepository = async (req, res, next) => {
  try {
    const { repositoryId } = req.body;

    const repository = await Repository.findOne({
      _id: repositoryId,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    const contextWindow = await buildContext(repository, 'analyze repository architecture code quality tech stack');

    const analysis = await geminiService.analyzeRepository(contextWindow);

    // Update last analyzed date
    repository.lastAnalyzedAt = new Date();
    await repository.save();

    // Save as task
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

// POST /api/ai/chat
export const chatAboutRepo = async (req, res, next) => {
  try {
    const { repositoryId, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required.' });
    }

    const repository = await Repository.findOne({
      _id: repositoryId,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    const contextWindow = await buildContext(repository, prompt);
    const response = await geminiService.chatAboutRepo(prompt, contextWindow);

    // Save as task
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

// POST /api/ai/suggestions
export const suggestImprovements = async (req, res, next) => {
  try {
    const { repositoryId } = req.body;

    const repository = await Repository.findOne({
      _id: repositoryId,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    const contextWindow = await buildContext(repository, 'suggest improvements performance security code quality scalability refactoring');

    const suggestions = await geminiService.suggestImprovements(contextWindow);

    // Save as task
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

// POST /api/ai/generate-feature — FLAGSHIP FEATURE
export const generateFeature = async (req, res, next) => {
  try {
    const { repositoryId, prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Feature description is required.' });
    }

    const repository = await Repository.findOne({
      _id: repositoryId,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    const contextWindow = await buildContext(repository, prompt);
    const featureResult = await geminiService.generateFeature(prompt, contextWindow);

    // Save as task
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
