import Groq from 'groq-sdk';

let client = null;

function getClient() {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

const MODEL = 'llama-3.3-70b-versatile'; // free, fast, high quality

/**
 * Helper — plain text response
 */
async function generate(systemPrompt, userPrompt) {
  const groq = getClient();
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content;
}

/**
 * Helper — JSON response
 */
async function generateJSON(systemPrompt, userPrompt) {
  const groq = getClient();
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt + '\n\nYou MUST respond with valid JSON only. No markdown, no extra text.' },
      { role: 'user',   content: userPrompt   },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const text = response.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Generate repository summary on import.
 * Called once when a repo is first imported.
 * @param {Array} treeStructure - File tree from GitHub
 * @param {string} readmeContent - README content
 * @param {Array} keyFiles - Array of { path, content } for important files
 */
export async function generateRepoSummary(treeStructure, readmeContent, keyFiles = []) {
  const systemPrompt = `You are a senior software engineer analyzing a GitHub repository.
Given the repository file structure, README, and key source files, generate a structured analysis.

Respond with valid JSON in this exact structure:
{
  "projectSummary": "A 2-3 sentence description of what this project does",
  "techStack": ["Technology1", "Technology2"],
  "importantFiles": ["path/to/file1", "path/to/file2"],
  "architectureOverview": "A paragraph explaining the project architecture and how components relate"
}

For importantFiles, list the 10-15 most important source files.
Do NOT include node_modules, lock files, or build artifacts.`;

  const treeSummary = treeStructure
    .slice(0, 200)
    .map(f => `${f.type === 'directory' ? '📁' : '📄'} ${f.path}`)
    .join('\n');

  // Include actual file contents in the summary prompt
  let fileContentsSection = '';
  if (keyFiles.length > 0) {
    fileContentsSection = '\n\n## Key File Contents\n';
    for (const file of keyFiles.slice(0, 8)) { // max 8 files for summary
      const content = file.content.length > 3000 ? file.content.slice(0, 3000) + '\n...[truncated]' : file.content;
      fileContentsSection += `\n### ${file.path}\n\`\`\`\n${content}\n\`\`\`\n`;
    }
  }

  const userPrompt = `## Repository Structure\n${treeSummary}\n\n## README\n${readmeContent || 'No README found.'}${fileContentsSection}`;

  return await generateJSON(systemPrompt, userPrompt);
}

/**
 * Deep analysis — senior engineer code review with 10 feature sections
 */
export async function analyzeRepository(contextWindow) {
  const systemPrompt = `You are a senior backend engineer doing a thorough code review. Think like a tech lead reviewing a junior developer's project.

STEP 1 — DETECT what already exists by scanning the source code:
- jwt/jsonwebtoken → authentication exists
- bcrypt/argon2 → password hashing exists
- express-rate-limit/rate-limiter → rate limiting exists
- joi/zod/express-validator/yup → input validation exists
- redis/node-cache → caching exists
- winston/morgan/pino → logging exists
- jest/mocha/vitest/.test./.spec. → tests exist
- swagger/openapi → API docs exist
- multer/cloudinary/s3/sharp → file upload exists
- socket.io/ws → websockets exist
- skip/limit/page query patterns → pagination exists
- .env/dotenv/process.env → environment config exists
- mongoose .index() calls → DB indexing exists
- refresh_token/refreshToken → refresh tokens exist

STEP 2 — Only suggest features that are genuinely MISSING.
BAD: "Add JWT authentication" (if jwt already found)
GOOD: "Add refresh token rotation" (if jwt found but no refresh token logic)
GOOD: "Add Zod input validation" (if no validation library found)

STEP 3 — Score each category 0-100:
Architecture: folder structure, separation of concerns, MVC adherence, modularity
Security: auth + hashing + validation + rate limiting + env vars (each worth 20pts)
Scalability: pagination + caching + DB indexing + service separation + stateless design
Maintainability: naming consistency + error handling + no god files + reusability + tests
Overall = (security×0.30 + architecture×0.25 + scalability×0.25 + maintainability×0.20)

Respond ONLY with valid JSON matching this exact structure (no markdown, no extra text):
{
  "projectSummary": "2-3 sentences describing the project purpose and scale",
  "techStack": {
    "frontend": [],
    "backend": [],
    "database": [],
    "devTools": [],
    "other": []
  },
  "architecture": {
    "pattern": "MVC Monolith | MERN Stack | Microservices | Component-based",
    "description": "Detailed explanation of pattern and how layers interact",
    "dataFlow": "Step-by-step: Client → Route → Middleware → Controller → Model → DB"
  },
  "folderStructure": {
    "overview": "Explanation of top-level organization",
    "keyDirectories": [
      {"path": "src/controllers", "purpose": "Route handler logic"}
    ]
  },
  "detectedFeatures": {
    "authentication": false,
    "passwordHashing": false,
    "inputValidation": false,
    "rateLimiting": false,
    "caching": false,
    "structuredLogging": false,
    "errorHandling": false,
    "unitTests": false,
    "apiDocumentation": false,
    "fileUpload": false,
    "pagination": false,
    "databaseIndexing": false,
    "refreshTokens": false,
    "environmentConfig": false,
    "websockets": false
  },
  "healthScore": {
    "overall": 0,
    "architecture": 0,
    "security": 0,
    "scalability": 0,
    "maintainability": 0,
    "explanations": {
      "architecture": "Why this score — e.g. Good MVC structure but controllers are too large",
      "security": "Why this score — e.g. Has JWT and bcrypt but missing rate limiting and input validation",
      "scalability": "Why this score — e.g. No caching, no pagination on list endpoints",
      "maintainability": "Why this score — e.g. No tests, inconsistent error handling patterns"
    }
  },
  "securityAnalysis": {
    "implemented": ["List only what you detected in the code"],
    "missing": ["List only what is absent based on your detection scan"],
    "critical": ["Highest-risk gaps that should be fixed immediately"]
  },
  "scalabilityAnalysis": {
    "strengths": ["What is already well-designed for scale"],
    "bottlenecks": ["Specific files/routes that will fail under load with explanation"],
    "recommendations": ["Concrete actions with file references"]
  },
  "strengths": [
    "Specific strength with file reference — e.g. Clean MVC structure in src/controllers/"
  ],
  "weaknesses": [
    "Specific weakness with file reference — e.g. No input validation in authController.js register()"
  ],
  "missingFeatures": [
    {
      "feature": "Feature name",
      "priority": "high|medium|low",
      "reason": "Why it matters for this specific project",
      "recommendation": "Specific library/approach to implement it"
    }
  ],
  "suggestions": [
    {
      "title": "Actionable title",
      "description": "Specific explanation referencing actual code files and patterns found",
      "priority": "high|medium|low",
      "file": "src/path/to/file.js",
      "effort": "low|medium|high"
    }
  ],
  "interviewTalkingPoints": [
    "Discussion point a recruiter would ask about — e.g. Explain how JWT authentication is implemented in this project"
  ],
  "complexityMetrics": {
    "estimatedComplexity": "Low|Medium|High",
    "modulesCount": 0,
    "apiEndpointsCount": 0,
    "majorFeaturesCount": 0,
    "rationale": "Brief explanation of complexity estimate"
  }
}`;

  const userPrompt = `Perform a senior engineer code review. Scan every source file provided, detect existing features, then generate all sections:\n\n${contextWindow}`;
  return await generateJSON(systemPrompt, userPrompt);
}


/**
 * Grounded repository chat — answers from actual source code only.
 * Returns { answer, sources } to surface which files were used.
 * @param {string} prompt - User question
 * @param {string} contextWindow - Source code context built by the context engine
 * @param {string[]} sourcePaths - Paths of the files included in the context
 */
export async function chatAboutRepo(prompt, contextWindow, sourcePaths = []) {
  const fileList = sourcePaths.length > 0
    ? `Files available in context:\n${sourcePaths.map(p => `- ${p}`).join('\n')}`
    : 'No specific files were retrieved for this query.';

  const systemPrompt = `You are DevMate — a code-aware AI assistant that answers questions about specific GitHub repositories.

## STRICT RULES — READ CAREFULLY:

1. GROUND TRUTH ONLY: Answer EXCLUSIVELY from the source code provided in the context.
   Never invent functions, files, or implementations that are not shown.

2. ANTI-HALLUCINATION: If the context does not contain the answer, say:
   "I cannot find [X] in the provided repository context. The relevant files may not have been retrieved."
   Do NOT speculate with phrases like "likely", "probably", "we can assume", "might be".

3. CODE REFERENCES: Always reference the exact file path, function name, or line content from the context.
   Example: "In \`src/middlewares/auth.js\`, the \`verifyToken\` function..."

4. SOURCES: At the end of your answer, list only the files from the provided context that you actually cited.

5. FORMAT: Respond in markdown. Use code blocks for code snippets.

${fileList}

Respond with valid JSON:
{
  "answer": "Your markdown-formatted answer here, grounded in the provided source code",
  "sources": ["src/path/to/file1.js", "src/path/to/file2.js"]
}

The "sources" array must only contain paths that actually appear in the context above.`;

  const userPrompt = `## Repository Source Code Context\n${contextWindow}\n\n## User Question\n${prompt}`;

  try {
    return await generateJSON(systemPrompt, userPrompt);
  } catch {
    // Fallback: if JSON parsing fails, return structured object with raw text
    const rawText = await generate(systemPrompt, userPrompt);
    return { answer: rawText, sources: sourcePaths };
  }
}

/**
 * Suggest improvements for a repository
 */
export async function suggestImprovements(contextWindow) {
  const systemPrompt = `You are a senior software engineer doing an expert code review.

CRITICAL RULE: First scan the source code to detect what already exists.
NEVER suggest adding something that is already implemented.

Scan for:
- jwt, bcrypt → authentication already present
- express-rate-limit → rate limiting already present
- joi, zod, express-validator → validation already present
- winston, morgan → logging already present
- jest, mocha, .test., .spec. → tests already present
- swagger, openapi → API docs already present
- redis, node-cache → caching already present
- socket.io, ws → WebSockets already present
- multer, cloudinary → file uploads already present
- skip/limit/page patterns → pagination already present

BAD (if jwt already present): "Add authentication"
GOOD (after detecting jwt): "Add refresh token rotation", "Add token blacklisting on logout"

For each suggestion, reference the exact file and explain the specific problem you found.

Respond with valid JSON:
{
  "performance": [
    {
      "title": "Add Redis caching for frequently-accessed routes",
      "description": "GET /api/videos is called on every page load with no caching. Add Redis with 5-min TTL.",
      "priority": "high",
      "file": "src/controllers/videoController.js",
      "effort": "medium"
    }
  ],
  "security": [
    {
      "title": "Add brute-force protection on login endpoint",
      "description": "POST /api/auth/login has no rate limiting. An attacker can try unlimited passwords.",
      "priority": "high",
      "file": "src/routes/auth.js",
      "effort": "low"
    }
  ],
  "codeQuality": [
    {
      "title": "Extract business logic from controllers",
      "description": "authController.js is 200+ lines. Move business logic to a dedicated AuthService class.",
      "priority": "medium",
      "file": "src/controllers/authController.js",
      "effort": "high"
    }
  ],
  "scalability": [
    {
      "title": "Add database query result pagination",
      "description": "GET /api/posts returns all documents without pagination. This will fail at scale.",
      "priority": "high",
      "file": "src/controllers/postController.js",
      "effort": "low"
    }
  ],
  "refactoring": [
    {
      "title": "Centralize API response format",
      "description": "Different controllers return different response shapes. Standardize with a response helper.",
      "priority": "medium",
      "file": "src/utils/",
      "effort": "low"
    }
  ]
}

effort: "low" = < 1 hour, "medium" = 1 day, "high" = > 1 day`;

  const userPrompt = `Review this codebase and generate specific, non-generic improvement suggestions. Only suggest what is MISSING:\n\n${contextWindow}`;
  return await generateJSON(systemPrompt, userPrompt);
}


/**
 * Generate a feature implementation — FLAGSHIP feature
 */
export async function generateFeature(prompt, contextWindow) {
  const systemPrompt = `You are DevMate, an expert AI code generator. Given a feature request and repository context, generate a complete implementation plan with code.

Respond with valid JSON in this exact structure:
{
  "implementationPlan": {
    "overview": "Brief description of the feature and approach",
    "steps": ["Step 1: description", "Step 2: description"]
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
      "originalCode": "",
      "modifiedCode": "// Complete new or modified code",
      "explanation": "What was changed and why"
    }
  ],
  "explanation": "A comprehensive markdown explanation of the overall implementation"
}

RULES:
1. For "create" actions: originalCode must be an empty string
2. For "modify" actions: show the relevant original code and the modified version
3. Code must be production-ready and follow existing codebase patterns
4. Reference actual file paths from the repository structure`;

  const userPrompt = `## Feature Request\n${prompt}\n\n## Repository Context\n${contextWindow}`;
  return await generateJSON(systemPrompt, userPrompt);
}
