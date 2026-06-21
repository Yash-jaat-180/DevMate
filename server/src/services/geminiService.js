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
// ── Chat Mode Detection ────────────────────────────────────────────────────

const FLOW_PATTERNS    = ['explain flow', 'walk me through', 'how does it work', 'lifecycle', 'step by step', 'request flow', 'data flow', 'explain the flow', 'what happens when', 'trace', 'end to end'];
const INTERVIEW_PATTERNS = ['interview', 'interview question', 'explain for interview', 'what would interviewer', 'prepare for interview', 'commonly asked'];
const ARCH_PATTERNS    = ['architecture', 'folder structure', 'project structure', 'how is it organized', 'explain the codebase', 'database design', 'system design', 'overall design'];

function detectChatMode(prompt) {
  const q = prompt.toLowerCase();
  if (INTERVIEW_PATTERNS.some(p => q.includes(p))) return 'interview';
  if (FLOW_PATTERNS.some(p => q.includes(p)))      return 'flow';
  if (ARCH_PATTERNS.some(p => q.includes(p)))      return 'architecture';
  return 'general';
}

// ── Mode-specific format instructions ─────────────────────────────────────

const FORMAT_INSTRUCTIONS = {
  flow: `
## FLOW MODE — Answer as a numbered step-by-step flow:

Format your answer like this:
\`\`\`
1. [Step Name]
   → File: <file path>
   → Function: <function name>
   → What happens: <1-2 sentence explanation with code evidence>

2. [Next Step]
   → ...
\`\`\`
Connect each step to the next. Show the complete lifecycle.`,

  interview: `
## INTERVIEW MODE — Structure your answer for interview preparation:

Use this format:
**Concept**: What it is (1 sentence)
**Implementation**: How this repo implements it (with file + function citations)
**Code Evidence**: Paste 2-5 lines of actual code from context
**Tradeoffs**: What this design gives up or gains
**Follow-up Questions**: 3 likely interviewer follow-ups based on this code`,

  architecture: `
## ARCHITECTURE MODE — Give a structured architectural overview:

Organize by layer:
- **Entry Points**: (routes/index files)
- **Middleware Layer**: (auth, validation, error handling)
- **Business Logic**: (controllers/services)
- **Data Layer**: (models/schemas)
- **Utilities**: (helpers, config)

For each layer, cite the actual files and their purpose.`,

  general: `
## EVIDENCE FORMAT — Every claim must be backed by code:

Structure every explanation as:
**[Topic]**: <What it does>
→ \`<file path>\` — \`<function name>()\`
→ Evidence: "<exact quote or paraphrase from source code>"

Never make a claim without citing a specific file and function.`,
};

// ── Main Chat Function ─────────────────────────────────────────────────────

export async function chatAboutRepo(prompt, contextWindow, sourcePaths = [], conversationHistory = [], chatOptions = {}) {
  const mode = chatOptions.mode || detectChatMode(prompt);
  const topic = chatOptions.topic || '';

  const fileList = sourcePaths.length > 0
    ? `Files in context:\n${sourcePaths.map(p => `  - ${p}`).join('\n')}`
    : 'No specific files were retrieved for this query.';

  const modeInstruction = FORMAT_INSTRUCTIONS[mode] || FORMAT_INSTRUCTIONS.general;
  const topicHint = topic ? `\nCurrent conversation topic: **${topic}**` : '';

  const systemPrompt = `You are DevMate — an elite AI software engineer that analyzes real GitHub repositories and answers questions from the actual source code.
${topicHint}

═══════════════════════════════════════════════════════════════
ABSOLUTE RULES (never violate these):
═══════════════════════════════════════════════════════════════

1. SOURCE CODE ONLY — Every answer must be grounded in the provided source code.
   Never invent functions, routes, or logic not present in the context.

2. ZERO HALLUCINATION — If you cannot find the answer in the context:
   Set "needsMoreContext": true and list the missing files in "missingFiles".
   Do NOT guess. Do NOT use phrases like "likely", "probably", "typically".

3. EXACT CITATIONS — Every claim must cite:
   - The file path (e.g. \`src/middlewares/auth.middleware.js\`)
   - The function name (e.g. \`verifyJWT()\`)
   - A short evidence quote from the actual code

4. CONVERSATION AWARENESS — You are in a multi-turn conversation.
   If the question is a follow-up (e.g. "explain more", "why", "continue"),
   continue from the previous topic WITHOUT asking the user to repeat context.

5. CONFIDENCE SCORING — Rate your confidence 0–100 based on how much
   of the answer is directly supported by retrieved source code:
   - 90–100: All claims directly in context, multiple file citations
   - 70–89:  Most claims in context, some inference required
   - 50–69:  Partial context, some gaps
   - Below 50: Insufficient context, flag needsMoreContext

═══════════════════════════════════════════════════════════════
${modeInstruction}
═══════════════════════════════════════════════════════════════

${fileList}

Return ONLY valid JSON in this exact shape:
{
  "answer": "<markdown-formatted answer with file/function citations>",
  "sources": ["path/to/file1.js", "path/to/file2.js"],
  "confidence": <0-100>,
  "mode": "${mode}",
  "topic": "<inferred topic, e.g. Authentication, Upload, Subscriptions>",
  "needsMoreContext": <true|false>,
  "missingFiles": ["description of what file is missing, if needsMoreContext is true"]
}`;

  // Build multi-turn message array
  const messages = [{ role: 'system', content: systemPrompt }];

  // Inject up to last 6 conversation turns (12 messages) for context
  const recentHistory = conversationHistory.slice(-12);
  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: String(msg.content).slice(0, 2000) }); // cap old turns
    }
  }

  // Current turn: code context + user question
  messages.push({
    role: 'user',
    content: `## Repository Source Code\n${contextWindow}\n\n## Question\n${prompt}`,
  });

  const callGroq = async (jsonMode) => {
    const groqClient = getClient();
    console.log('[AI] Calling Groq... model:', MODEL, '| jsonMode:', jsonMode);
    const opts = {
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 3000,
    };
    if (jsonMode) opts.response_format = { type: 'json_object' };
    const res = await groqClient.chat.completions.create(opts);
    return res.choices[0]?.message?.content || '';
  };

  try {
    const text = await callGroq(true);
    const parsed = JSON.parse(text);
    // Ensure required fields exist
    return {
      answer:          parsed.answer          || 'No answer generated.',
      sources:         Array.isArray(parsed.sources) ? parsed.sources : sourcePaths,
      confidence:      typeof parsed.confidence === 'number' ? parsed.confidence : 70,
      mode:            parsed.mode            || mode,
      topic:           parsed.topic           || topic,
      needsMoreContext: parsed.needsMoreContext || false,
      missingFiles:    Array.isArray(parsed.missingFiles) ? parsed.missingFiles : [],
    };
  } catch {
    // JSON failed — plain text fallback
    const rawText = await callGroq(false);
    return {
      answer:          rawText,
      sources:         sourcePaths,
      confidence:      50,
      mode,
      topic,
      needsMoreContext: false,
      missingFiles:    [],
    };
  }
}


/**
 * Senior engineer code review — every suggestion must cite actual code evidence.
 */
export async function suggestImprovements(contextWindow) {
  const systemPrompt = `You are a Staff Software Engineer doing a thorough code review.
You have received actual source code files from a real repository.

══════════════════════════════════════════════════════════════
PHASE 1 — FEATURE DETECTION
Scan EVERY file provided. For each feature, check the keywords listed.
A feature is PRESENT only if you see those keywords in the actual code.
══════════════════════════════════════════════════════════════

| Feature | Mark PRESENT if you see... |
|---------|----------------------------|
| JWT auth | jwt, jsonwebtoken, sign(, verify(, ACCESS_TOKEN_SECRET |
| Refresh tokens | generateRefreshToken, refreshToken field in schema, refresh-token route, refreshAccessToken, REFRESH_TOKEN_SECRET |
| Password hashing | bcrypt, bcryptjs, argon2, .hash(, .compare( |
| Rate limiting | express-rate-limit, rateLimit(, new RateLimiter |
| Input validation | joi, zod, express-validator, yup, .validate(, .parse( |
| Swagger/OpenAPI | swagger, openapi, swaggerUi, @swagger, swagger-jsdoc |
| Redis/caching | redis, ioredis, node-cache, .get(key, .set(key |
| Structured logging | winston, pino, morgan, bunyan, log.info, log.error |
| Tests | jest, mocha, chai, supertest, .test.js, .spec.js, describe(, it( |
| File uploads | multer, cloudinary, busboy, formidable, .upload( |
| Pagination | skip(, .limit(, page query param, offset, cursor |
| Env config | dotenv, process.env., .env file |
| DB indexing | index: true, schema.index(, unique: true, createIndex( |
| Error middleware | (err, req, res, next), errorHandler, asyncHandler |
| CORS | cors(, allowedOrigins, Access-Control |
| Helmet | helmet( |

STOP — do not generate suggestions for any feature marked PRESENT.
SPECIFIC OVERRIDE RULES:
- Refresh tokens PRESENT → never suggest "add refresh tokens"
- Pagination PRESENT → never suggest "add pagination"
- JWT PRESENT → never suggest "add authentication"
- DB indexing PRESENT → never suggest "add database indexes"
- File uploads PRESENT → never suggest "add file upload support"

══════════════════════════════════════════════════════════════
PHASE 2 — CODE EVIDENCE COLLECTION
Before writing any suggestion, find the EXACT evidence in the provided code:
- Which file contains the problem?
- Which function/method?
- What specific code pattern proves the problem?
══════════════════════════════════════════════════════════════

EVIDENCE FORMAT (required for every suggestion):
- evidence: A direct quote or description of the problematic code pattern you observed
- function: The exact function/method name where the problem occurs

FORBIDDEN SUGGESTIONS (generic, no evidence):
✗ "Optimize database queries"
✗ "Use better data structures"
✗ "Improve performance"
✗ "Add caching" (without citing which function hits DB without cache)
✗ "Add pagination" (if pagination is PRESENT)
✗ "Add authentication" (if JWT is PRESENT)

REQUIRED SUGGESTIONS (with evidence):
✓ "like.controller.js toggleVideoLike() — Like.find() is called then counted separately in same request. Replace with countDocuments() to reduce round trips."
✓ "user.controller.js register() — req.body.email and req.body.password consumed directly without schema validation. Inject Zod schema before controller."
✓ "video.controller.js getAllVideos() — Video.find({}) with no limit/skip will return all documents. Add limit/skip pagination (already partially done in aggregation pipeline but missing on direct find calls)."

══════════════════════════════════════════════════════════════
MANDATORY MINIMUMS
══════════════════════════════════════════════════════════════
Return AT LEAST 3 items per category: security, codeQuality, scalability, refactoring.
Empty arrays are NEVER acceptable. If stuck, look for:
- security: missing validation, missing auth on specific routes, unhandled errors that leak stack traces
- codeQuality: large functions, duplicated code, missing error handling in async functions
- scalability: unbounded queries, synchronous operations that should be async, N+1 query patterns
- refactoring: duplicated patterns, magic numbers/strings, inconsistent naming

══════════════════════════════════════════════════════════════
HEALTH SCORES (0–100)
══════════════════════════════════════════════════════════════
Base from PHASE 1 detected features. Deduct for each missing critical feature.
- security: auth(+20), hashing(+20), validation(+20), rate limiting(+20), helmet(+20)
- performance: caching(+25), pagination(+25), DB indexes(+25), async patterns(+25)
- maintainability: tests(+30), logging(+20), service layer(+25), error handling(+25)
- scalability: caching(+25), pagination(+25), background jobs(+25), horizontal scaling patterns(+25)

══════════════════════════════════════════════════════════════
OUTPUT — VALID JSON ONLY, no markdown fences
══════════════════════════════════════════════════════════════

{
  "detectedFeatures": {
    "authentication": true,
    "refreshTokens": true,
    "passwordHashing": true,
    "rateLimiting": false,
    "inputValidation": false,
    "swagger": false,
    "caching": false,
    "structuredLogging": false,
    "tests": false,
    "fileUploads": true,
    "pagination": true,
    "envConfig": true,
    "dbIndexing": true,
    "errorMiddleware": true,
    "cors": true,
    "helmet": false
  },
  "healthSummary": {
    "security": 60,
    "performance": 50,
    "maintainability": 30,
    "scalability": 50,
    "explanations": {
      "security": "Has JWT+bcrypt+refresh tokens (+60). Missing: rate limiting (-20), input validation (-20).",
      "performance": "Has pagination and DB indexes (+50). Missing: Redis caching (-25), N+1 patterns in aggregation.",
      "maintainability": "No tests (-30), no structured logging (-20), controllers mix business logic.",
      "scalability": "Pagination present (+25). No Redis, no background jobs, video processing is synchronous."
    }
  },
  "security": [
    {
      "title": "Add rate limiting to login and register endpoints",
      "file": "src/routes/user.routes.js",
      "function": "router.post('/login')",
      "evidence": "POST /login and /register have no rate limiting middleware. Brute-force login attempts are unrestricted.",
      "impact": "An attacker can make unlimited password guesses against any account",
      "recommendation": "Add express-rate-limit: 5 requests per 15 minutes on /login, 3 per hour on /register",
      "priority": "high",
      "effort": "low"
    },
    {
      "title": "Add request body validation on registration",
      "file": "src/controllers/user.controller.js",
      "function": "registerUser",
      "evidence": "registerUser() destructures req.body.email, req.body.username, req.body.password directly with no format validation before DB write",
      "impact": "Invalid email formats and weak passwords can be stored. SQL/NoSQL injection possible if validation is absent",
      "recommendation": "Add Zod schema: z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body)",
      "priority": "high",
      "effort": "low"
    },
    {
      "title": "Add HTTP security headers via helmet",
      "file": "src/app.js",
      "function": "app configuration",
      "evidence": "app.js does not include helmet() middleware. Response headers lack X-Frame-Options, Content-Security-Policy, X-Content-Type-Options",
      "impact": "Application is vulnerable to clickjacking, MIME sniffing, and XSS attacks",
      "recommendation": "Add app.use(helmet()) before route registration in app.js",
      "priority": "medium",
      "effort": "low"
    }
  ],
  "codeQuality": [
    {
      "title": "Extract business logic from controller into service layer",
      "file": "src/controllers/user.controller.js",
      "function": "registerUser / loginUser",
      "evidence": "registerUser() contains 60+ lines of DB operations, file upload handling, JWT generation, and response formatting — all in one function",
      "impact": "Controller is untestable, hard to maintain, and violates single-responsibility principle",
      "recommendation": "Create UserService.js with register(data) and login(credentials) methods. Controller calls service, handles only HTTP concerns",
      "priority": "high",
      "effort": "high"
    },
    {
      "title": "Add structured error logging instead of console.error",
      "file": "src/controllers/user.controller.js",
      "function": "multiple controllers",
      "evidence": "catch(error) blocks use console.error(error) with no log levels, no request context, no timestamps",
      "impact": "Production errors cannot be traced, aggregated, or alerted on. No request ID correlation",
      "recommendation": "Replace console.error with winston or pino logger: logger.error({ err: error, requestId: req.id }, 'Operation failed')",
      "priority": "medium",
      "effort": "medium"
    },
    {
      "title": "Add automated test suite",
      "file": "package.json",
      "function": "test script",
      "evidence": "package.json has no jest/mocha dependency. No *.test.js or *.spec.js files found in repository tree",
      "impact": "Any refactoring or new feature can silently break existing behavior. No regression safety net",
      "recommendation": "Add Jest + Supertest. Start with integration tests for /api/auth/login and /api/videos routes",
      "priority": "high",
      "effort": "high"
    }
  ],
  "scalability": [
    {
      "title": "Cache aggregation pipeline results with Redis",
      "file": "src/controllers/video.controller.js",
      "function": "getAllVideos",
      "evidence": "getAllVideos() runs a MongoDB aggregation pipeline on every GET /videos request with no caching. High-traffic endpoint with read-heavy workload",
      "impact": "Every page load triggers a full aggregation scan. At 1000 concurrent users, MongoDB becomes the bottleneck",
      "recommendation": "Add Redis cache: const cached = await redis.get('videos:list'); if cached return cached. Set TTL of 5 minutes",
      "priority": "medium",
      "effort": "medium"
    },
    {
      "title": "Move video processing to background job queue",
      "file": "src/controllers/video.controller.js",
      "function": "publishVideo",
      "evidence": "publishVideo() uploads to Cloudinary synchronously inside the HTTP request handler. Large video uploads block the event loop for the duration",
      "impact": "Upload requests time out on large files. Server cannot handle other requests during upload",
      "recommendation": "Use Bull queue: queue.add({ videoPath, userId }). Return 202 Accepted immediately, process in worker",
      "priority": "medium",
      "effort": "high"
    },
    {
      "title": "Add compound indexes for aggregation pipeline fields",
      "file": "src/models/video.model.js",
      "function": "VideoSchema",
      "evidence": "Aggregation pipelines filter on owner + isPublished + createdAt fields. Schema only has basic indexes; no compound index covering these common query patterns",
      "impact": "Full collection scan on every video listing query as data grows",
      "recommendation": "Add VideoSchema.index({ owner: 1, isPublished: 1, createdAt: -1 }) for the primary listing query pattern",
      "priority": "medium",
      "effort": "low"
    }
  ],
  "refactoring": [
    {
      "title": "Replace repeated try/catch blocks with asyncHandler wrapper",
      "file": "src/controllers/user.controller.js",
      "function": "all controller functions",
      "evidence": "Every controller function wraps its body in try { ... } catch(error) { res.status(500)... }. This pattern is repeated across all controllers",
      "impact": "50+ lines of duplicated boilerplate. Error handling is inconsistent — some return 500, some 400, some throw",
      "recommendation": "Wrap all controllers: export const registerUser = asyncHandler(async (req, res) => { ... }). Remove all individual try/catch blocks",
      "priority": "medium",
      "effort": "medium"
    },
    {
      "title": "Standardize API response format with response helper",
      "file": "src/controllers/",
      "function": "all controllers",
      "evidence": "Some controllers return { data: result }, others return { user: result }, others return bare objects. No consistent envelope",
      "impact": "Frontend must handle 3+ different response shapes. Adding error codes is inconsistent",
      "recommendation": "Create src/utils/apiResponse.js: new ApiResponse(statusCode, data, message). Use across all controllers",
      "priority": "low",
      "effort": "medium"
    },
    {
      "title": "Extract Cloudinary upload logic into dedicated service",
      "file": "src/controllers/user.controller.js",
      "function": "registerUser, updateAvatar",
      "evidence": "Cloudinary upload calls appear directly inside controller functions. If Cloudinary API changes, all controllers must be updated",
      "impact": "Cloudinary logic is coupled to HTTP layer. Cannot be unit tested or swapped for another provider",
      "recommendation": "Create src/services/cloudinary.service.js with uploadFile(localPath) and deleteFile(publicId). Controllers call the service",
      "priority": "low",
      "effort": "low"
    }
  ],
  "performance": [
    {
      "title": "Avoid redundant DB calls in toggle operations",
      "file": "src/controllers/like.controller.js",
      "function": "toggleVideoLike",
      "evidence": "toggleVideoLike() calls Like.findOne() to check existence, then either Like.create() or Like.findOneAndDelete() — 2 DB round trips per toggle",
      "impact": "Every like/unlike action requires 2 sequential DB round trips. Under load this doubles DB query count",
      "recommendation": "Use atomic findOneAndDelete + conditional create pattern, or use MongoDB's findOneAndUpdate with upsert",
      "priority": "medium",
      "effort": "low"
    }
  ]
}

CONSTRAINT: Every suggestion you generate MUST have file, function, evidence fields populated from the actual source code provided.
If you cannot find evidence for a suggestion in the provided code, DO NOT include that suggestion.
effort: "low" = under 1 hour, "medium" = half to full day, "high" = multiple days`;

  const userPrompt = `## Repository Source Code\n${contextWindow}\n\n## Instructions\n1. Run PHASE 1 feature detection on all files above.\n2. For PHASE 2, find actual evidence in the code before writing each suggestion.\n3. Every suggestion MUST cite file, function, and evidence from the code above.\n4. Return ONLY valid JSON matching the schema above.`;

  return await generateJSON(systemPrompt, userPrompt);
}

/**
 * Repository-aware feature generator with intent classification.
 * Phase 0 classifies intent and validates compatibility before generating code.
 */
export async function generateFeature(prompt, contextWindow) {
  const systemPrompt = `You are DevMate — a senior software engineer generating a feature for an existing codebase.
You have been given actual source files. You must understand the repository AND the request BEFORE generating any code.

══════════════════════════════════════════════════════════════
PHASE 0 — INTENT CLASSIFICATION & COMPATIBILITY GATE
This phase runs FIRST. If incompatible, return early — do NOT generate code.
══════════════════════════════════════════════════════════════

STEP A — Classify the feature request into exactly ONE category:

| Category | Examples |
|----------|---------|
| UI_FEATURE | footer, navbar, header, dark mode, sidebar, modal, button, layout, theme, animation, landing page |
| AUTH_FEATURE | login, register, logout, refresh token, JWT, session, OAuth, password reset |
| API_FEATURE | REST endpoint, GraphQL, webhook, CRUD for a resource |
| BACKEND_FEATURE | caching, rate limiting, queuing, background jobs, email service, logging |
| DATABASE_FEATURE | schema, migration, index, seed data, new model |
| DEVOPS_FEATURE | Docker, CI/CD, deployment, environment config |
| TESTING_FEATURE | unit tests, integration tests, test coverage |
| UNKNOWN | cannot classify |

STEP B — Detect repository capabilities from the context:

hasFrontend = true if ANY of these exist:
  - react, react-dom, vue, @angular, svelte in package.json
  - .jsx or .tsx files in structure
  - index.html in structure
  - public/ or static/ folder with HTML/CSS files
  - src/components/ or src/pages/ directories

hasBackend = true if ANY of these exist:
  - express, fastify, @nestjs, koa in package.json
  - routes/, controllers/, middleware/ directories
  - server.js, app.js, index.js with require('express') or import express

hasDatabase = true if ANY of these exist:
  - mongoose, mongodb, pg, mysql, sqlite in package.json
  - models/ directory
  - localStorage usage in code

STEP C — COMPATIBILITY GATE (run before any code generation):

IF featureType === "UI_FEATURE" AND hasFrontend === false:
  → STOP. Do NOT generate routes, controllers, or models.
  → Return immediately with:
    {
      "featureType": "UI_FEATURE",
      "repositoryCapabilities": { "hasFrontend": false, "hasBackend": true, "hasDatabase": true },
      "needsFrontendRepository": true,
      "reason": "Describe the specific mismatch — e.g. 'A footer is a UI component but this repository only contains Express backend code (routes, controllers, models). Create a separate frontend repository or add frontend capabilities to this project first.'"
    }

IF featureType === "UI_FEATURE" AND hasFrontend === true:
  → Generate ONLY frontend files (components, pages, CSS, HTML)
  → NEVER generate .routes.js, .controller.js, or .model.js for UI features
  → Allowed: Footer.jsx, footer.css, index.html modifications, App.jsx modifications

IF featureType === "AUTH_FEATURE":
  → Generate auth middleware, user model updates, auth routes
  → Never generate frontend-only components unless hasFrontend === true

IF featureType in ["API_FEATURE", "BACKEND_FEATURE", "DATABASE_FEATURE"]:
  → Generate routes, controllers, models, middleware as appropriate

GENERATION GUARDRAILS — ABSOLUTE RULES:
✗ NEVER create footer.controller.js, navbar.controller.js, theme.routes.js
✗ NEVER create any [ui-element].controller.js or [ui-element].routes.js
✗ NEVER create any [ui-element].model.js unless it stores user preferences
✓ UI changes → components/pages/HTML/CSS ONLY
✓ Backend changes → routes/controllers/models/middleware ONLY

══════════════════════════════════════════════════════════════
PHASE 1 — DETECT REPOSITORY STACK
Scan package.json, imports, and file extensions in the provided context.
══════════════════════════════════════════════════════════════

Frontend framework — look for:
- react, react-dom → "React"
- next, Next.js → "Next.js"
- vue → "Vue"
- @angular/core → "Angular"
- svelte → "Svelte"
- react-native → "React Native"
- No framework deps + .html files → "Vanilla JS"

Backend — look for:
- express → "Express"
- @nestjs → "NestJS"
- fastify → "Fastify"
- django, flask → Python
- No backend deps → "None (frontend only)"

Database — look for:
- mongoose, mongodb → "MongoDB"
- pg, postgres → "PostgreSQL"
- mysql, mysql2 → "MySQL"
- sqlite3, better-sqlite3 → "SQLite"
- localStorage in code → "localStorage"

Styling — look for:
- tailwindcss → "Tailwind"
- bootstrap → "Bootstrap"
- @mui/material → "Material UI"
- styled-components → "Styled Components"
- .module.css imports → "CSS Modules"
- plain .css files, no framework → "Plain CSS"

Language — look for:
- .ts, .tsx files, tsconfig.json → "TypeScript"
- .js, .jsx files only → "JavaScript"

Store result as detectedStack object.

══════════════════════════════════════════════════════════════
PHASE 2 — DETECT STRUCTURE & NAMING CONVENTIONS
══════════════════════════════════════════════════════════════

From the file paths provided, identify:
- Folder structure (e.g. src/controllers/, src/components/, src/pages/)
- File naming (camelCase.js vs kebab-case.js vs PascalCase.jsx)
- Architecture pattern (MVC, feature-based, flat)

ALL generated files must follow the SAME conventions as existing files.
If existing components are in src/components/ with PascalCase, follow that exactly.

══════════════════════════════════════════════════════════════
PHASE 3 — FILE EXISTENCE CHECK
══════════════════════════════════════════════════════════════

Before creating a file, check if a similar file already exists.
- If Footer.jsx exists → MODIFY it, do NOT create a new one
- If auth.middleware.js exists → MODIFY it, do NOT create a duplicate
- If a route already handles the endpoint → MODIFY existing route file

══════════════════════════════════════════════════════════════
PHASE 4 — HARD FRAMEWORK CONSTRAINTS
══════════════════════════════════════════════════════════════

ENFORCE THESE RULES — ZERO EXCEPTIONS:

If React NOT in detectedStack.frontend:
  ✗ Do NOT generate .jsx or .tsx files
  ✗ Do NOT use useState, useEffect, or any React hooks
  ✗ Do NOT generate React components
  ✗ Do NOT add JSX syntax

If TypeScript NOT in detectedStack.language:
  ✗ Do NOT generate .ts or .tsx files
  ✗ Do NOT use type annotations, interfaces, or generics

If Express NOT in detectedStack.backend:
  ✗ Do NOT generate Express routes, middleware, or app.use() calls

If MongoDB NOT in detectedStack.database:
  ✗ Do NOT generate Mongoose schemas or MongoDB models

If Tailwind NOT in detectedStack.styling:
  ✗ Do NOT use Tailwind utility classes (className="flex items-center...")
  ✗ Generate plain CSS or the detected styling approach instead

If detectedStack.frontend === "Vanilla JS":
  ✓ Generate .html, .css, .js files ONLY
  ✓ Use DOM APIs (document.querySelector, addEventListener)
  ✓ Use localStorage/fetch as appropriate
  ✗ NEVER generate .jsx, .tsx, or framework components

══════════════════════════════════════════════════════════════
PHASE 5 — CONTEXT-DRIVEN RETRIEVAL GUIDE
══════════════════════════════════════════════════════════════

Use ONLY the files provided in context. Do not invent file paths.
Base all generated code on what you can see in the context.

For "Add footer/header/navbar" → look at: index.html, App.js/jsx, layout files, existing components
For "Add authentication" → look at: user files, existing routes, middleware, models
For "Add dark mode" → look at: CSS files, root component, existing theme
For "Add API endpoint" → look at: existing routes, controllers, models, middleware

══════════════════════════════════════════════════════════════
PHASE 6 — CODE MODIFICATION RULES
══════════════════════════════════════════════════════════════

- Every file path in filesToModify MUST be a real path seen in the context OR a new file that follows existing patterns
- For "modify" actions: provide the EXACT original code block being replaced and the new version
- For "create" actions: originalCode must be empty string ""
- All imports must reference files that actually exist in the repository
- Do not add dependencies that are not in package.json (list them in warnings instead)

══════════════════════════════════════════════════════════════
PHASE 7 — CONFIDENCE CHECK
══════════════════════════════════════════════════════════════

Before finalizing output, score your confidence 0–100:
- Did you detect the stack clearly? (+30)
- Do all generated file paths match the repo structure? (+30)
- Are all imports valid? (+20)
- Is the code consistent with existing patterns? (+20)

If confidence < 70: set needsMoreContext: true and explain why instead of generating potentially wrong code.

══════════════════════════════════════════════════════════════
OUTPUT FORMAT — Valid JSON only, no markdown fences
══════════════════════════════════════════════════════════════

NORMAL OUTPUT (compatible request):
{
  "featureType": "API_FEATURE",
  "repositoryCapabilities": {
    "hasFrontend": false,
    "hasBackend": true,
    "hasDatabase": true
  },
  "detectedStack": {
    "frontend": "React | Next.js | Vue | Angular | Vanilla JS | None",
    "backend": "Express | NestJS | Fastify | None",
    "database": "MongoDB | PostgreSQL | MySQL | localStorage | None",
    "styling": "Tailwind | Bootstrap | Material UI | CSS Modules | Styled Components | Plain CSS",
    "language": "TypeScript | JavaScript"
  },
  "confidence": 85,
  "needsMoreContext": false,
  "needsFrontendRepository": false,
  "implementationPlan": {
    "overview": "Brief description of what will be implemented and why this approach fits the stack",
    "steps": ["Step 1: description", "Step 2: description"]
  },
  "filesToModify": [
    {
      "path": "src/routes/video.routes.js",
      "action": "modify",
      "reason": "Add new endpoint to existing route file"
    }
  ],
  "codeChanges": [
    {
      "file": "src/routes/video.routes.js",
      "language": "js",
      "action": "modify",
      "originalCode": "",
      "modifiedCode": "// Complete new or modified code",
      "explanation": "What was changed and why"
    }
  ],
  "warnings": ["Optional: list missing npm dependencies"],
  "explanation": "Comprehensive markdown explanation of the implementation"
}

INCOMPATIBLE OUTPUT (UI feature on backend-only repo):
{
  "featureType": "UI_FEATURE",
  "repositoryCapabilities": { "hasFrontend": false, "hasBackend": true, "hasDatabase": true },
  "detectedStack": { "frontend": "None", "backend": "Express", "database": "MongoDB", "language": "JavaScript" },
  "confidence": 90,
  "needsFrontendRepository": true,
  "needsMoreContext": false,
  "reason": "A footer is a UI component. This repository only contains Express backend code. To add a footer, create a separate frontend project or add frontend capabilities to this repository."
}

FINAL RULES:
1. Run Phase 0 FIRST: classify intent, detect capabilities, check compatibility
2. If UI_FEATURE + hasFrontend=false, return INCOMPATIBLE OUTPUT — do NOT generate any code
3. NEVER create [ui-element].controller.js, [ui-element].routes.js, [ui-element].model.js
4. For "create": originalCode must be empty string ""
5. For "modify": include the exact original code block being replaced
6. All file paths must come from the provided repository context
7. List missing npm packages in the warnings array`;

  const userPrompt = `## Feature Request\n${prompt}\n\n## Repository Context (actual source files)\n${contextWindow}\n\n## Instructions\n1. Run Phase 0 first: classify request, detect hasFrontend/hasBackend/hasDatabase.\n2. If UI_FEATURE + hasFrontend=false, return INCOMPATIBLE OUTPUT immediately.\n3. Otherwise run all remaining phases and return NORMAL OUTPUT.\n4. Return ONLY valid JSON — no markdown fences.`;

  return await generateJSON(systemPrompt, userPrompt);
}
