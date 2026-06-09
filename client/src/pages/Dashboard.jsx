import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { repoService } from '../services/repoService';
import { taskService } from '../services/taskService';
import {
  LuFolderGit2, LuBrain, LuHistory, LuPlus, LuArrowRight,
  LuZap, LuTrendingUp, LuClock, LuWandSparkles, LuActivity,
} from 'react-icons/lu';

const taskBadge = {
  analysis:            { label: 'Analysis',    bg: 'rgba(59,130,246,0.1)',  color: '#93c5fd', border: 'rgba(59,130,246,0.2)' },
  chat:                { label: 'Chat',        bg: 'rgba(139,92,246,0.1)', color: '#c4b5fd', border: 'rgba(139,92,246,0.2)' },
  suggestions:         { label: 'Suggestions', bg: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: 'rgba(245,158,11,0.2)' },
  'feature-generation':{ label: 'Feature',     bg: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: 'rgba(16,185,129,0.2)' },
};

function EmptyState({ icon: Icon, color, title, sub, linkTo, linkLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: '12px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>{title}</p>
        {sub && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {linkLabel} <LuArrowRight size={11} />
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [repos, setRepos]   = useState([]);
  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [reposRes, tasksRes] = await Promise.all([
        repoService.getAll(),
        taskService.getAll({ limit: 5 }),
      ]);
      setRepos(reposRes.data);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        <div className="skeleton" style={{ height: '44px', width: '200px', borderRadius: '8px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '14px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '14px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '14px' }} />)}
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Repositories',  value: repos.length,  icon: LuFolderGit2,  color: '#6366f1', delta: 'total connected' },
    { label: 'AI Tasks Run',  value: tasks.length,  icon: LuBrain,       color: '#8b5cf6', delta: 'recent activity' },
    { label: 'Last Active',   value: tasks[0] ? new Date(tasks[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—', icon: LuActivity, color: '#10b981', delta: 'most recent task' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '44px', paddingBottom: '60px' }}>

      {/* ── Page Header ── */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '28px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>
          {greeting}
        </p>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>
          {user?.name?.split(' ')[0]}'s Workspace
        </h1>
        <p className="page-subtitle">
          Here's your DevMate activity at a glance. {repos.length === 0 && 'Start by importing your first repository.'}
        </p>
      </div>

      {/* ── Stats ── */}
      <div>
        <p className="label" style={{ marginBottom: '14px' }}>Overview</p>
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {stats.map(stat => (
            <div key={stat.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="stat-label">{stat.label}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${stat.color}14`, border: `1px solid ${stat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={14} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="stat-value">{stat.value}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{stat.delta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="label" style={{ marginBottom: '14px' }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { to: '/repositories', color: '#6366f1', icon: LuPlus,         title: 'Import Repository', sub: 'Connect a GitHub repo for instant AI analysis.' },
            { to: '/chat',         color: '#8b5cf6', icon: LuZap,          title: 'AI Code Chat',      sub: 'Ask questions about any of your codebases.' },
            { to: '/repositories', color: '#10b981', icon: LuWandSparkles, title: 'Generate Feature',  sub: 'Describe a feature in plain English.' },
            { to: '/tasks',        color: '#f59e0b', icon: LuTrendingUp,   title: 'Task History',      sub: 'Review all previous AI interactions.' },
          ].map(a => (
            <Link
              key={a.title}
              to={a.to}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', textDecoration: 'none', transition: 'border-color 180ms, background 180ms, transform 180ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}40`; e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${a.color}14`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <a.icon size={17} style={{ color: a.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px', letterSpacing: '-0.01em' }}>{a.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{a.sub}</p>
              </div>
              <LuArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Repos + Tasks ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Recent Repositories */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LuFolderGit2 size={15} style={{ color: '#818cf8' }} />
              <span className="section-title">Recent Repositories</span>
            </div>
            <Link to="/repositories" style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <LuArrowRight size={10} />
            </Link>
          </div>
          <div style={{ padding: '8px' }}>
            {repos.length === 0 ? (
              <EmptyState icon={LuFolderGit2} color="#6366f1" title="No repositories yet" sub="Import your first GitHub repo" linkTo="/repositories" linkLabel="Import now" />
            ) : (
              repos.slice(0, 5).map(repo => (
                <Link
                  key={repo._id}
                  to={`/repositories/${repo._id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', transition: 'background 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LuFolderGit2 size={13} style={{ color: '#818cf8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {repo.owner}/<span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{repo.repoName}</span>
                    </p>
                    {repo.language && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                        {repo.language}
                      </p>
                    )}
                  </div>
                  <LuArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent AI Tasks */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LuBrain size={15} style={{ color: '#a78bfa' }} />
              <span className="section-title">Recent AI Activity</span>
            </div>
            <Link to="/tasks" style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <LuArrowRight size={10} />
            </Link>
          </div>
          <div style={{ padding: '8px' }}>
            {tasks.length === 0 ? (
              <EmptyState icon={LuHistory} color="#8b5cf6" title="No AI activity yet" sub="Your interactions will appear here" />
            ) : (
              tasks.map(task => {
                const badge = taskBadge[task.taskType] || taskBadge.chat;
                return (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', transition: 'background 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LuBrain size={13} style={{ color: '#a78bfa' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px', letterSpacing: '-0.01em' }}>
                        {task.prompt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: '4px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LuClock size={10} />
                          {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
