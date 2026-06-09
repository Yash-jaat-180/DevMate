import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuLayoutDashboard, LuFolderGit2, LuMessageSquare,
  LuHistory, LuSettings, LuChevronLeft, LuChevronRight,
  LuLogOut, LuBrain,
} from 'react-icons/lu';

const navItems = [
  { to: '/dashboard',    icon: LuLayoutDashboard, label: 'Dashboard' },
  { to: '/repositories', icon: LuFolderGit2,      label: 'Repositories' },
  { to: '/chat',         icon: LuMessageSquare,   label: 'AI Chat' },
  { to: '/tasks',        icon: LuHistory,          label: 'Task History' },
  { to: '/settings',     icon: LuSettings,         label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>

      {/* ── Logo ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '0 17px' : '0 18px',
        height: '62px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
        }}>
          <LuBrain style={{ color: '#fff', fontSize: '13px' }} />
        </div>
        {!collapsed && (
          <span style={{
            fontSize: '15px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.02em',
          }}>
            DevMate
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1,
        padding: '14px 8px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {!collapsed && (
          <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 11px 10px' }}>
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: 'center' } : {}}
            >
              <item.icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ letterSpacing: '-0.01em' }}>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            marginBottom: '4px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '800',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                {user.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="nav-link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LuLogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: '-11px',
          top: '80px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'var(--bg-page)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          zIndex: 50,
          transition: 'all 160ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#818cf8';
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)';
          e.currentTarget.style.boxShadow = '0 0 8px rgba(99,102,241,0.25)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {collapsed ? <LuChevronRight size={11} /> : <LuChevronLeft size={11} />}
      </button>
    </aside>
  );
}
