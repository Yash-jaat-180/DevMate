import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { LuBrain, LuMail, LuLock, LuUser, LuLoader, LuShield } from 'react-icons/lu';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created! Welcome to DevMate.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fields = [
    { label: 'Full name',   icon: LuUser, type: 'text',     placeholder: 'Your name',        val: name,     set: setName },
    { label: 'Email',       icon: LuMail, type: 'email',    placeholder: 'you@example.com',  val: email,    set: setEmail },
    { label: 'Password',    icon: LuLock, type: 'password', placeholder: 'Min. 6 characters', val: password, set: setPassword },
  ];

  return (
    <div className="auth-page">
      <div className="auth-glow-1" style={{ top: '15%', left: '25%' }} />
      <div className="auth-glow-2" style={{ bottom: '15%', right: '25%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

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
              Create your account
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Start analyzing repositories with AI — free forever
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {fields.map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {f.label}
                </label>
                <div style={{ position: 'relative' }}>
                  <f.icon size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="input"
                    type={f.type}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ paddingLeft: '38px', fontSize: '14px' }}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '14px', marginTop: '4px', opacity: loading ? 0.65 : 1, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '10px' }}
            >
              {loading
                ? <><LuLoader size={15} className="animate-spin" /> Creating account…</>
                : 'Create free account'
              }
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <LuShield size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#818cf8', fontWeight: '700', textDecoration: 'none' }}>
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
