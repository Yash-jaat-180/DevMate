import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { repoService } from '../services/repoService';
import { taskService } from '../services/taskService';
import {
  LuFolderGit2,
  LuBrain,
  LuHistory,
  LuPlus,
  LuArrowRight,
  LuZap,
  LuTrendingUp,
  LuClock,
  LuWandSparkles,
} from 'react-icons/lu';

/* ─────────────────────────────────────────── */
const S = {
  /* section */
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  viewAll: {
    fontSize: '12px',
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
  },
  /* card */
  card: {
    background: '#111118',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
  },
  /* stat card */
  statCard: {
    background: '#111118',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '20px 24px',
  },
  statLabel: { fontSize: '12px', color: '#475569', fontWeight: '500', marginBottom: '10px' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.03em' },
  /* row item */
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background 180ms',
    cursor: 'pointer',
  },
  iconBox: (color = '#6366f1') => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: `${color}18`,
    border: `1px solid ${color}28`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  /* action card */
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    background: '#111118',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'border-color 200ms, background 200ms',
    cursor: 'pointer',
  },
  actionIcon: (color = '#6366f1') => ({
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: `${color}18`,
    border: `1px solid ${color}28`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
};

const taskBadge = {
  analysis:           { label: 'Analysis',    bg: 'rgba(59,130,246,0.12)',   color: '#93c5fd', border: 'rgba(59,130,246,0.25)' },
  chat:               { label: 'Chat',        bg: 'rgba(139,92,246,0.12)',   color: '#c4b5fd', border: 'rgba(139,92,246,0.25)' },
  suggestions:        { label: 'Suggestions', bg: 'rgba(245,158,11,0.12)',   color: '#fcd34d', border: 'rgba(245,158,11,0.25)' },
  'feature-generation':{ label: 'Feature',   bg: 'rgba(16,185,129,0.12)',   color: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
};

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="skeleton" style={{ height: '40px', width: '220px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="skeleton" style={{ height: '320px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '320px', borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Repositories',    value: repos.length,                           icon: LuFolderGit2, color: '#6366f1' },
    { label: 'AI Tasks',        value: tasks.length,                           icon: LuBrain,      color: '#8b5cf6' },
    { label: 'Latest Activity', value: tasks[0] ? new Date(tasks[0].createdAt).toLocaleDateString() : '—', icon: LuTrendingUp, color: '#10b981' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '48px' }}>

      {/* ── Page Header ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '6px' }}>Overview</h1>
        <p style={{ fontSize: '13px', color: '#475569' }}>
          Welcome back, <span style={{ color: '#94a3b8' }}>{user?.name?.split(' ')[0]}</span>. Here's your DevMate workspace at a glance.
        </p>
      </div>

      {/* ── Stats ── */}
      <div>
        <p className="label" style={{ marginBottom: '12px' }}>At a Glance</p>
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {stats.map(stat => (
            <div key={stat.label} style={S.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={S.statLabel}>{stat.label}</p>
                <div style={S.iconBox(stat.color)}>
                  <stat.icon size={15} style={{ color: stat.color }} />
                </div>
              </div>
              <p style={S.statValue}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="label" style={{ marginBottom: '12px' }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { to: '/repositories', color: '#6366f1', icon: LuPlus, title: 'Import Repository', sub: 'Connect a new GitHub repo for AI analysis.' },
            { to: '/chat',         color: '#8b5cf6', icon: LuZap,  title: 'AI Code Chat',       sub: 'Ask questions about any of your codebases.' },
          ].map(a => (
            <Link key={a.to} to={a.to} style={S.actionCard}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}50`; e.currentTarget.style.background = '#16161f'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = '#111118'; }}
            >
              <div style={S.actionIcon(a.color)}>
                <a.icon size={18} style={{ color: a.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', marginBottom: '3px' }}>{a.title}</p>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>{a.sub}</p>
              </div>
              <LuArrowRight size={15} style={{ color: '#334155', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Repos + Tasks ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Recent Repositories */}
        <div style={S.card}>
          <div style={{ ...S.sectionHeader, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
            <span style={S.sectionTitle}>Recent Repositories</span>
            <Link to="/repositories" style={S.viewAll}>View all →</Link>
          </div>
          <div style={{ padding: '8px' }}>
            {repos.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ ...S.iconBox('#6366f1'), width: '40px', height: '40px', marginBottom: '12px' }}>
                  <LuFolderGit2 size={18} style={{ color: '#6366f1' }} />
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', marginBottom: '6px' }}>No repositories yet</p>
                <Link to="/repositories" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none' }}>
                  Import your first repo →
                </Link>
              </div>
            ) : (
              repos.slice(0, 5).map(repo => (
                <Link
                  key={repo._id}
                  to={`/repositories/${repo._id}`}
                  style={S.listItem}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={S.iconBox('#6366f1')}>
                    <LuFolderGit2 size={14} style={{ color: '#818cf8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {repo.owner}/{repo.repoName}
                    </p>
                    {repo.language && (
                      <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                        {repo.language}
                      </p>
                    )}
                  </div>
                  <LuArrowRight size={13} style={{ color: '#334155', flexShrink: 0 }} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent AI Tasks */}
        <div style={S.card}>
          <div style={{ ...S.sectionHeader, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
            <span style={S.sectionTitle}>Recent AI Activity</span>
            <Link to="/tasks" style={S.viewAll}>View all →</Link>
          </div>
          <div style={{ padding: '8px' }}>
            {tasks.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ ...S.iconBox('#8b5cf6'), width: '40px', height: '40px', marginBottom: '12px' }}>
                  <LuHistory size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', marginBottom: '6px' }}>No AI activity yet</p>
                <p style={{ fontSize: '12px', color: '#334155' }}>Your AI interactions will appear here</p>
              </div>
            ) : (
              tasks.map(task => {
                const badge = taskBadge[task.taskType] || taskBadge.chat;
                return (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    style={S.listItem}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={S.iconBox('#8b5cf6')}>
                      <LuBrain size={14} style={{ color: '#a78bfa' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                        {task.prompt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em',
                          padding: '2px 7px', borderRadius: '4px',
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                        }}>
                          {badge.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LuClock size={10} />
                          {new Date(task.createdAt).toLocaleDateString()}
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
