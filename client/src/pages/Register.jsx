import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { LuBrain, LuMail, LuLock, LuUser, LuLoader } from 'react-icons/lu';

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
    { label: 'Name',     icon: LuUser, type: 'text',     placeholder: 'Your name',          val: name,     set: setName },
    { label: 'Email',    icon: LuMail, type: 'email',    placeholder: 'you@example.com',    val: email,    set: setEmail },
    { label: 'Password', icon: LuLock, type: 'password', placeholder: 'Min 6 characters',   val: password, set: setPassword },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050507', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '25%', right: '30%', width: '500px', height: '500px', background: 'rgba(139,92,246,0.05)', borderRadius: '50%', filter: 'blur(100px)' }} />
      </div>

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '36px', textDecoration: 'none' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LuBrain style={{ color: '#fff', fontSize: '18px' }} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            DevMate
          </span>
        </Link>

        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px', letterSpacing: '-0.02em' }}>Create your account</h2>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '28px' }}>Start analyzing repositories with AI</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {fields.map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {f.label}
                </label>
                <div style={{ position: 'relative' }}>
                  <f.icon size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                  <input
                    className="input"
                    type={f.type}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', marginTop: '4px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <><LuLoader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
