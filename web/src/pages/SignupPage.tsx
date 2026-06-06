import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ParticleBackground from '../components/ParticleBackground';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const { signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (password !== confirm) { setLocalError('Passwords do not match.'); return; }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }
    try {
      await signup(email, password, username);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/dashboard');
    } catch { /* error shown from store */ }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page">
      <ParticleBackground />
      <div className="auth-box fade-in-up">
        <div className="text-center" style={{ marginBottom: 40 }}>
          <Link to="/" className="nav-logo" style={{ fontSize: 28 }}>MedhaX</Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>Join the competition</p>
        </div>

        <div className="card">
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Start competing for free today</p>

          {displayError && (
            <div className="toast toast-error" style={{ marginBottom: 20, maxWidth: '100%' }}>
              <span>⚠️</span> {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">USERNAME</label>
              <input className="input" type="text" placeholder="coolcoder42" value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                required minLength={3} maxLength={20} autoFocus />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>3–20 characters, lowercase</span>
            </div>
            <div className="input-group">
              <label className="input-label">EMAIL</label>
              <input className="input" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">PASSWORD</label>
              <input className="input" type="password" placeholder="At least 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="input-group">
              <label className="input-label">CONFIRM PASSWORD</label>
              <input className="input" type="password" placeholder="••••••••" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isLoading} style={{ marginTop: 8 }}>
              {isLoading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <div className="divider-text" style={{ margin: '24px 0' }}>Already have an account?</div>
          <Link to="/login" className="btn btn-ghost w-full" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Sign In
          </Link>
        </div>

        <div className="text-center" style={{ marginTop: 20 }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
