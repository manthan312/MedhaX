import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      const isAdmin = user?.email === 'admin31256@gmail.com' || (user as any)?.role === 'admin';
      if (isAdmin) {
        navigate('/admin-dashboard');
      } else {
        const redirect = searchParams.get('redirect');
        navigate(redirect ? decodeURIComponent(redirect) : '/dashboard');
      }
    } catch { /* error shown from store */ }
  };

  return (
    <div className="auth-page">
      <div className="auth-box fade-in-up">
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 40 }}>
          <Link to="/" className="nav-logo" style={{ fontSize: 28 }}>MedhaX</Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>Welcome back, coder</p>
        </div>

        <div className="card">
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Sign In</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Enter your credentials to continue</p>

          {error && (
            <div className="toast toast-error" style={{ marginBottom: 20, maxWidth: '100%' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">EMAIL</label>
              <input className="input" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="input-group">
              <label className="input-label">PASSWORD</label>
              <input className="input" type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isLoading} style={{ marginTop: 8 }}>
              {isLoading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <div className="text-center" style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to={searchParams.get('redirect') ? `/signup?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : '/signup'} style={{ color: 'var(--indigo-light)', fontWeight: 600, textDecoration: 'none' }}>
              Create one free →
            </Link>
          </div>
        </div>

        <div className="text-center" style={{ marginTop: 20 }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
