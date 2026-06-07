import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LuBrain,
  LuGitBranch,
  LuCode,
  LuMessageSquare,
  LuWandSparkles,
  LuShield,
  LuArrowRight,
  LuGithub,
  LuZap,
  LuLayers,
} from 'react-icons/lu';

const features = [
  {
    icon: LuGitBranch,
    title: 'Repository Import',
    description: 'Import any GitHub repository and explore its structure in a VS Code-like interface.',
    color: '#6366f1',
  },
  {
    icon: LuBrain,
    title: 'AI Analysis',
    description: 'Get instant insights about architecture, tech stack, and code quality powered by Gemini.',
    color: '#8b5cf6',
  },
  {
    icon: LuMessageSquare,
    title: 'Intelligent Chat',
    description: 'Ask questions about any codebase and get context-aware answers with code references.',
    color: '#a78bfa',
  },
  {
    icon: LuWandSparkles,
    title: 'Feature Generator',
    description: 'Describe a feature in plain English and get implementation plans, code changes, and diffs.',
    color: '#10b981',
  },
  {
    icon: LuShield,
    title: 'Code Improvements',
    description: 'Receive categorized suggestions for performance, security, and code quality.',
    color: '#f59e0b',
  },
  {
    icon: LuCode,
    title: 'Diff Viewer',
    description: 'View generated code changes in a GitHub-style diff viewer with Monaco Editor.',
    color: '#ef4444',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface-950 overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <LuBrain className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold gradient-text">DevMate</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-lg text-gray-300 text-sm font-medium hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  Get Started <LuArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8 animate-fade-in">
            <LuZap size={14} />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Your AI-Powered{' '}
            <span className="gradient-text">GitHub</span>{' '}
            Code Assistant
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
            Import repositories, analyze codebases, get improvement suggestions, and generate
            code modifications — all from natural language instructions.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Link
              to={user ? '/dashboard' : '/register'}
              className="px-8 py-3.5 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all duration-200 glow flex items-center gap-2"
            >
              Start Building <LuArrowRight size={16} />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-2"
            >
              <LuGithub size={18} /> View on GitHub
            </a>
          </div>
        </div>

        {/* Mock terminal */}
        <div className="mt-20 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-primary-500/5">
            <div className="bg-surface-800 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-gray-500 font-mono">devmate — ai assistant</span>
            </div>
            <div className="bg-surface-900 p-6 font-mono text-sm leading-loose">
              <p className="text-gray-500">{">"} Import a repository</p>
              <p className="text-primary-400 mt-1">✓ github.com/user/my-project imported</p>
              <p className="text-gray-500 mt-3">{">"} Analyze the codebase</p>
              <p className="text-accent-400 mt-1">✓ React + Express + MongoDB detected</p>
              <p className="text-accent-400">✓ 47 components, 12 API routes found</p>
              <p className="text-gray-500 mt-3">{">"} Add dark mode support</p>
              <p className="text-purple-400 mt-1">⚡ Generated implementation plan</p>
              <p className="text-purple-400">⚡ 4 files to modify, 1 file to create</p>
              <p className="text-purple-400">⚡ Code diffs ready for review</p>
              <span className="inline-block w-2 h-5 bg-primary-400 animate-pulse ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm font-medium mb-4">
            <LuLayers size={14} />
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need to understand code
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A complete toolkit for repository analysis and AI-assisted development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl glass hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
              >
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl p-12 text-center glass glow">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to analyze your codebase?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Import your first repository and experience AI-powered code analysis in seconds.
          </p>
          <Link
            to={user ? '/repositories' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all duration-200"
          >
            Get Started Free <LuArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuBrain className="text-primary-400" />
            <span className="text-sm text-gray-500">DevMate © {new Date().getFullYear()}</span>
          </div>
          <p className="text-sm text-gray-600">Built with React, Express, Gemini AI</p>
        </div>
      </footer>
    </div>
  );
}
