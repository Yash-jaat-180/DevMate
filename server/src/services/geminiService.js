import { GoogleGenAI } from '@google/genai';

let ai = null;

function getAI() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const MODEL = 'gemini-2.0-flash';

/**
 * Helper to call Gemini and return text
 */
async function generate(systemPrompt, userPrompt) {
  const client = getAI();
  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
    ],
  });
  return response.text;
}

/**
 * Helper to call Gemini and return parsed JSON
 */
async function generateJSON(systemPrompt, userPrompt) {
  const client = getAI();
  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  try {
    return JSON.parse(response.text);
  } catch {
    // If JSON parsing fails, try to extract JSON from the response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Generate repository summary on import
 * Called once when a repo is first imported
 */
export async function generateRepoSummary(treeStructure, readmeContent) {
  const systemPrompt = `You are a senior software engineer analyzing a GitHub repository.
Given the repository file structure and README, generate a structured analysis.

You MUST respond in valid JSON with this exact structure:
{
  "projectSummary": "A 2-3 sentence description of what this project does",
  "techStack": ["Technology1", "Technology2", ...],
  "importantFiles": ["path/to/file1", "path/to/file2", ...],
  "architectureOverview": "A paragraph explaining the project architecture and how components relate"
}

For importantFiles, list the 10-15 most important source files (entry points, main components, core logic, configs).
Do NOT include node_modules, lock files, or build artifacts.`;

  const treeSummary = treeStructure
    .slice(0, 200) // Limit to first 200 files
    .map((f) => `${f.type === 'directory' ? '📁' : '📄'} ${f.path}`)
    .join('\n');

  const userPrompt = `## Repository Structure\n${treeSummary}\n\n## README\n${readmeContent || 'No README found.'}`;

  return await generateJSON(systemPrompt, userPrompt);
}

/**
 * Deep analysis of a repository
 * Uses cached summary + selected file contents from Context Engine
 */
export async function analyzeRepository(contextWindow) {
  const systemPrompt = `You are an expert software engineer performing a thorough code review.
Analyze the provided repository context and return a detailed analysis.

You MUST respond in valid JSON with this exact structure:
{
  "projectSummary": "Detailed description of the project",
  "techStack": {
    "frontend": ["tech1", "tech2"],
    "backend": ["tech1", "tech2"],
    "database": ["tech1"],
    "devTools": ["tool1", "tool2"],
    "other": ["tech1"]
  },
  "architecture": {
    "pattern": "e.g., MVC, Component-based, Microservices",
    "description": "Detailed architecture explanation",
    "dataFlow": "How data flows through the application"
  },
  "folderStructure": {
    "overview": "Explanation of the folder organization",
    "keyDirectories": [
      {"path": "src/components", "purpose": "React UI components"}
    ]
  },
  "codeQuality": {
    "strengths": ["strength1", "strength2"],
    "concerns": ["concern1", "concern2"],
    "score": 7
  },
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

  const userPrompt = `Analyze this repository:\n\n${contextWindow}`;
  return await generateJSON(systemPrompt, userPrompt);
}

/**
 * Chat about a repository — answer questions with context
 */
export async function chatAboutRepo(prompt, contextWindow) {
  const systemPrompt = `You are DevMate, an AI assistant that helps developers understand codebases.
You have been given context about a specific repository. Answer the user's question thoroughly and accurately.

Use the provided source code context to give specific, detailed answers.
Reference actual file names, function names, and code patterns from the codebase.
If you're not sure about something, say so rather than guessing.

Format your response in markdown with code blocks where appropriate.`;

  const userPrompt = `## Repository Context\n${contextWindow}\n\n## User Question\n${prompt}`;

  return await generate(systemPrompt, userPrompt);
}

/**
 * Suggest improvements for a repository
 */
export async function suggestImprovements(contextWindow) {
  const systemPrompt = `You are a senior software engineer reviewing a codebase for improvements.
Analyze the provided code and suggest specific, actionable improvements.

You MUST respond in valid JSON with this exact structure:
{
  "performance": [
    {"title": "Short title", "description": "Detailed explanation", "priority": "high|medium|low", "file": "path/to/file"}
  ],
  "security": [
    {"title": "Short title", "description": "Detailed explanation", "priority": "high|medium|low", "file": "path/to/file"}
  ],
  "codeQuality": [
    {"title": "Short title", "description": "Detailed explanation", "priority": "high|medium|low", "file": "path/to/file"}
  ],
  "scalability": [
    {"title": "Short title", "description": "Detailed explanation", "priority": "high|medium|low", "file": "path/to/file"}
  ],
  "refactoring": [
    {"title": "Short title", "description": "Detailed explanation", "priority": "high|medium|low", "file": "path/to/file"}
  ]
}

Be specific. Reference actual files and code patterns. Prioritize the most impactful improvements.`;

  const userPrompt = `Review this codebase and suggest improvements:\n\n${contextWindow}`;
  return await generateJSON(systemPrompt, userPrompt);
}

/**
 * Generate a feature implementation — the FLAGSHIP feature
 * Returns implementation plan, file changes, code, diffs, and explanation
 */
export async function generateFeature(prompt, contextWindow) {
  const systemPrompt = `You are DevMate, an expert AI code generator. Given a feature request and repository context, generate a complete implementation plan with code.

You MUST respond in valid JSON with this exact structure:
{
  "implementationPlan": {
    "overview": "Brief description of the feature and approach",
    "steps": [
      "Step 1: description",
      "Step 2: description"
    ]
  },
  "filesToModify": [
    {
      "path": "src/path/to/file.jsx",
      "action": "create|modify",
      "reason": "Why this file needs to be changed"
    }
  ],
  "codeChanges": [
    {
      "file": "src/path/to/file.jsx",
      "language": "jsx",
      "action": "create|modify",
      "originalCode": "// Original code (only for modify action, empty string for create)",
      "modifiedCode": "// Complete new or modified code",
      "explanation": "What was changed and why"
    }
  ],
  "explanation": "A comprehensive markdown explanation of the overall implementation, how the pieces fit together, and any important notes"
}

IMPORTANT RULES:
1. For "create" actions: originalCode should be an empty string, modifiedCode should be the complete file content
2. For "modify" actions: show the relevant section of original code and the modified version
3. Code must be production-ready, well-commented, and follow the existing codebase patterns
4. Reference actual file paths from the repository structure
5. Include all necessary imports and dependencies
6. Keep code changes focused and minimal — only change what's needed`;

  const userPrompt = `## Feature Request\n${prompt}\n\n## Repository Context\n${contextWindow}`;
  return await generateJSON(systemPrompt, userPrompt);
}
