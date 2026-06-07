# DevMate

AI-powered GitHub Repository Assistant that helps developers understand, analyze, and improve codebases using Gemini AI.

DevMate acts like a mini developer assistant for GitHub repositories. Instead of manually exploring hundreds of files, developers can import a repository, analyze its architecture, ask questions about the codebase, and generate implementation plans for new features.

---

## 🚀 Features

### Repository Import
- Import any public GitHub repository
- Fetch repository metadata, file tree, and source code
- Store repository structure for future analysis

### Repository Explorer
- VS Code–style repository navigation
- Browse folders and files
- Monaco Editor integration for code viewing

### AI Repository Analysis
- Automatic repository summary generation
- Architecture overview
- Tech stack detection
- Identification of important files

### Context Engine
The core intelligence layer of DevMate.

Instead of sending the entire repository to Gemini:

```text
User Query
     ↓
Context Engine
     ↓
Relevant Files Selection
     ↓
Gemini AI
     ↓
Response
```

Benefits:
- Lower token usage
- Faster responses
- Better accuracy
- Supports larger repositories

### AI Chat
Ask questions about a repository:

Examples:
- How does authentication work?
- Explain the project structure.
- Where should caching be added?
- Which files handle API requests?

### Feature Generator
Generate implementation plans for new features.

Example:

```text
Add Dark Mode
```

DevMate returns:

- Implementation Plan
- Files To Modify
- Code Suggestions
- Explanation
- Diff Preview

### Task History
- Track previous AI analyses
- Store generated feature plans
- Revisit earlier discussions

### Diff Viewer
- Monaco Diff Editor
- Side-by-side comparison
- Visualize proposed code changes

---

## 🏗 Architecture

```text
                ┌──────────────┐
                │   Frontend   │
                │ React + Vite │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   Backend    │
                │ Node/Express │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼                             ▼
 ┌──────────────┐             ┌──────────────┐
 │  GitHub API  │             │ Gemini AI   │
 └──────────────┘             └──────────────┘
                       │
                       ▼
                ┌──────────────┐
                │   MongoDB    │
                └──────────────┘
```

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS v4
- Monaco Editor
- React Router
- Axios

### Backend
- Node.js
- Express.js
- JWT Authentication
- GitHub REST API

### Database
- MongoDB Atlas
- Mongoose

### AI
- Gemini 2.0 Flash

### Developer Tools
- Git
- GitHub
- Nodemon

---

## 📂 Core Modules

### Authentication Module
- User Registration
- User Login
- JWT-based Authentication
- Protected Routes

### Repository Module
- Repository Import
- Repository Metadata Storage
- Repository Explorer

### Context Engine
- Query Analysis
- File Ranking
- Relevant Context Selection
- AI Prompt Construction

### AI Service
- Repository Summary Generation
- Repository Analysis
- AI Chat
- Feature Generation

---

## 🎯 Example Workflow

### Import Repository

```text
GitHub URL
      ↓
Repository Fetch
      ↓
Store Repository Structure
      ↓
Generate Summary Cache
```

### Ask a Question

```text
How does authentication work?
        ↓
Context Engine
        ↓
Relevant Files Selected
        ↓
Gemini Analysis
        ↓
Answer Returned
```

### Generate Feature

```text
Add Dark Mode
        ↓
Context Engine
        ↓
Relevant Files
        ↓
Gemini
        ↓
Implementation Plan
        ↓
Diff Viewer
```

---

## 📸 Screenshots

### Dashboard

_Add screenshot here_

### Repository Explorer

_Add screenshot here_

### AI Chat

_Add screenshot here_

### Feature Generator

_Add screenshot here_

### Diff Viewer

_Add screenshot here_

---

## ⚡ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/devmate.git
cd devmate
```

### Backend Setup

```bash
cd server
npm install
```

Create `.env`

```env
MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_secret

GEMINI_API_KEY=your_gemini_api_key

GITHUB_TOKEN=your_github_token

PORT=5000

CLIENT_URL=http://localhost:5173
```

Run backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🔮 Future Improvements

- GitHub OAuth
- Pull Request Generation
- Docker Sandbox Execution
- Multi-Agent Architecture
- Repository Embeddings
- Semantic Search
- Team Collaboration
- CI/CD Integrations

---

## 📚 Key Learnings

This project helped me gain practical experience with:

- AI-assisted developer tooling
- Repository analysis systems
- Context retrieval architectures
- GitHub API integrations
- JWT authentication
- MongoDB schema design
- Monaco Editor integration
- Full-stack application development

---

## 👨‍💻 Author

Yash Saharan

GitHub: https://github.com/yourusername

LinkedIn: https://linkedin.com/in/yourprofile