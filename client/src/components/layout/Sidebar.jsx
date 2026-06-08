import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuLayoutDashboard,
  LuFolderGit2,
  LuMessageSquare,
  LuHistory,
  LuSettings,
  LuChevronLeft,
  LuChevronRight,
  LuLogOut,
  LuBrain,
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
        padding: '0 16px',
        height: '60px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <LuBrain style={{ color: '#fff', fontSize: '15px' }} />
        </div>
        {!collapsed && (
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
          }}>
            DevMate
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
            >
              <item.icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            marginBottom: '4px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
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
              fontSize: '12px',
              fontWeight: '700',
              flexShrink: 0,
            }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </p>
              <p style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="nav-link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LuLogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: '-12px',
          top: '76px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          cursor: 'pointer',
          zIndex: 50,
          transition: 'all 180ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
      >
        {collapsed ? <LuChevronRight size={12} /> : <LuChevronLeft size={12} />}
      </button>
    </aside>
  );
}
