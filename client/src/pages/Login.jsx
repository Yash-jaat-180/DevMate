import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { LuBrain, LuMail, LuLock, LuLoader, LuShield } from 'react-icons/lu';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            <LuBrain style={{ color: '#fff', fontSize: '17px' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            DevMate
          </span>
        </Link>

        {/* Card */}
        <div className="auth-card">
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Sign in to your DevMate account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <LuMail size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ paddingLeft: '38px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <LuLock size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingLeft: '38px', fontSize: '14px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '14px', marginTop: '4px', opacity: loading ? 0.65 : 1, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '10px' }}
            >
              {loading
                ? <><LuLoader size={15} className="animate-spin" /> Signing in…</>
                : 'Sign in to DevMate'
              }
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <LuShield size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No account?{' '}
              <Link to="/register" style={{ color: '#818cf8', fontWeight: '700', textDecoration: 'none' }}>
                Create one free
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
