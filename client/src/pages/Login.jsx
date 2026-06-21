import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { LuBrain, LuMail, LuLock, LuLoader, LuShield, LuEye, LuEyeOff, LuCircleAlert, LuCheck } from 'react-icons/lu';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email && !password) {
      setError('Please enter your email and password');
      emailRef.current?.focus();
      return;
    }
    if (!email) {
      setError('Please enter your email');
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError('Please enter your password');
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      setSuccess(true);
      toast.success('Welcome back!');
      // Slight delay to show the success state before redirecting
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
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

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
              <LuCircleAlert size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
              <LuCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#6ee7b7', margin: 0, fontWeight: '500' }}>Login successful</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <LuMail size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  ref={emailRef}
                  className="input"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  style={{ paddingLeft: '38px', fontSize: '14px', borderColor: error?.includes('email') ? 'rgba(239, 68, 68, 0.5)' : undefined }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <LuLock size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  ref={passwordRef}
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  style={{ paddingLeft: '38px', paddingRight: '40px', fontSize: '14px', borderColor: error?.includes('password') ? 'rgba(239, 68, 68, 0.5)' : undefined }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '0', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <LuEyeOff size={15} /> : <LuEye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '14px', marginTop: '4px', opacity: (loading || success) ? 0.65 : 1, cursor: (loading || success) ? 'not-allowed' : 'pointer', borderRadius: '10px' }}
            >
              {loading
                ? <><LuLoader size={15} className="animate-spin" /> Logging in…</>
                : success
                ? <><LuCheck size={15} /> Redirecting…</>
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
