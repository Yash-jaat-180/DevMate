import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LuBrain, LuGitBranch, LuCode, LuMessageSquare,
  LuWandSparkles, LuShield, LuArrowRight, LuGithub,
  LuZap, LuLayers, LuStar, LuCheck,
} from 'react-icons/lu';

const features = [
  { icon: LuGitBranch,     title: 'Repository Import',   description: 'Import any GitHub repository instantly. Explore structure, files, and metadata in a clean interface.', color: '#6366f1' },
  { icon: LuBrain,         title: 'AI Analysis',         description: 'Deep code review powered by Groq. Detects architecture, tech stack, and code quality issues.', color: '#8b5cf6' },
  { icon: LuMessageSquare, title: 'Codebase Chat',       description: 'Ask anything about your code. Get grounded, citation-backed answers from actual source files.', color: '#a78bfa' },
  { icon: LuWandSparkles,  title: 'Feature Generator',   description: 'Describe a feature in plain English. Get stack-aware implementation plans with actual code diffs.', color: '#10b981' },
  { icon: LuShield,        title: 'Security Review',     description: 'Detect missing rate limiting, validation gaps, and security vulnerabilities in your codebase.', color: '#f59e0b' },
  { icon: LuCode,          title: 'Diff Viewer',         description: 'Review AI-generated code changes in a GitHub-style diff viewer before applying them.', color: '#ef4444' },
];

const stats = [
  { value: '50+', label: 'Files analyzed per repo' },
  { value: '8',   label: 'AI review phases' },
  { value: '< 30s', label: 'To first insight' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', overflowX: 'hidden' }}>

      {/* ── Ambient background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 65%)', filter: 'blur(1px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* ── Header ── */}
      <header style={{ position: 'relative', zIndex: 10 }}>
        <nav style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}>
              <LuBrain style={{ color: '#fff', fontSize: '16px' }} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: '800', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              DevMate
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Dashboard <LuArrowRight size={12} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get started <LuArrowRight size={12} />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: '1100px', margin: '0 auto', padding: '72px 40px 96px' }}>
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto' }}>

          <div className="hero-badge animate-fade-in" style={{ marginBottom: '28px' }}>
            <LuZap size={12} />
            Powered by Groq · Built for engineers
          </div>

          <h1 className="animate-fade-in" style={{
            fontSize: 'clamp(42px, 6vw, 76px)',
            fontWeight: '900',
            lineHeight: '1.06',
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            marginBottom: '24px',
            animationDelay: '80ms',
          }}>
            The AI that actually<br />
            <span className="gradient-text">reads your code</span>
          </h1>

          <p className="animate-fade-in" style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto 40px', animationDelay: '160ms' }}>
            Import any GitHub repository. DevMate analyzes real source files, detects your stack,
            and gives you senior-engineer-grade insights — not generic checklists.
          </p>

          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', animationDelay: '240ms' }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-xl">
              Start for free <LuArrowRight size={16} />
            </Link>
            <a
              href="https://github.com"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-secondary btn-xl"
            >
              <LuGithub size={17} /> View on GitHub
            </a>
          </div>

          {/* Social proof */}
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '24px', animationDelay: '320ms' }}>
            {[...Array(5)].map((_, i) => (
              <LuStar key={i} size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            ))}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>Trusted by developers</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0px', maxWidth: '560px', margin: '56px auto 0', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden', animationDelay: '360ms' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '20px 24px', textAlign: 'center', borderRight: i < stats.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px', fontWeight: '500' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Terminal mockup */}
        <div className="animate-fade-in" style={{ marginTop: '64px', maxWidth: '720px', margin: '64px auto 0', animationDelay: '400ms' }}>
          <div className="terminal-window">
            <div style={{ background: '#0d0d15', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>devmate — ai assistant</span>
            </div>
            <div style={{ background: '#090910', padding: '28px 32px', fontFamily: 'ui-monospace, "Fira Code", monospace', fontSize: '13px', lineHeight: '1.9' }}>
              <p style={{ color: 'var(--text-muted)' }}>$ devmate analyze github.com/acme/api</p>
              <p style={{ color: '#6366f1', marginTop: '6px' }}>✓ Repository imported — 47 files, 12 routes</p>
              <p style={{ color: '#10b981' }}>✓ Stack detected: Express + MongoDB + JWT + Cloudinary</p>
              <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>$ devmate suggest improvements</p>
              <p style={{ color: '#f59e0b', marginTop: '6px' }}>⚠ Rate limiting missing on POST /auth/login</p>
              <p style={{ color: '#f59e0b' }}>⚠ No input validation in registerUser() · user.controller.js:47</p>
              <p style={{ color: '#8b5cf6', marginTop: '12px' }}>⚡ Feature type: UI_FEATURE — backend-only repository detected</p>
              <p style={{ color: '#8b5cf6' }}>⚡ Suggested: create separate frontend or add frontend capabilities</p>
              <span style={{ display: 'inline-block', width: '8px', height: '16px', background: '#6366f1', marginLeft: '2px', animation: 'pulse-glow 1.2s ease-in-out infinite', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: '1100px', margin: '0 auto', padding: '0 40px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="hero-badge" style={{ marginBottom: '20px' }}>
            <LuLayers size={12} />
            Capabilities
          </div>
          <h2 style={{ fontSize: '38px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.035em', marginBottom: '14px' }}>
            Everything you need to master a codebase
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: '1.7' }}>
            A complete AI toolkit that reads actual source code — not just summaries.
          </p>
        </div>

        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${f.color}15`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: '1100px', margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{
          borderRadius: '24px',
          padding: '72px 48px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(99,102,241,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '38px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '14px' }}>
              Ready to understand your codebase?
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '36px', maxWidth: '440px', margin: '0 auto 36px', lineHeight: '1.7' }}>
              Import your first repository and get AI-powered analysis in under 30 seconds.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <Link to={user ? '/repositories' : '/register'} className="btn btn-primary btn-xl">
                Get started free <LuArrowRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {['No credit card required', 'Any GitHub repository', 'Free to start'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <LuCheck size={13} style={{ color: '#10b981' }} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid var(--border-subtle)', padding: '28px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LuBrain style={{ color: '#fff', fontSize: '11px' }} />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>DevMate © {new Date().getFullYear()}</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Built with React · Express · Groq AI</p>
        </div>
      </footer>

      <style>{`@keyframes pulse-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
