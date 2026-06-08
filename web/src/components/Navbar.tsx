import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { isAuthenticated, user, logout, updateHandle, error, clearError } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsEditingHandle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle || newHandle === user?.handle) {
      setIsEditingHandle(false);
      return;
    }
    try {
      await updateHandle(newHandle);
      setIsEditingHandle(false);
      setIsProfileOpen(false);
    } catch (err) {
      // Error is handled by store and shown in UI
    }
  };

  const openProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsEditingHandle(false);
    setNewHandle(user?.handle || '');
    clearError();
  };

  return (
    <nav className="navbar" style={{ position: 'relative' }}>
      <Link to="/" className="nav-logo">MedhaX</Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
            <Link to="/friends" className="btn btn-ghost btn-sm">Friends</Link>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div 
                className="avatar avatar-sm" 
                style={{ cursor: 'pointer', border: isProfileOpen ? '2px solid var(--indigo)' : 'none' }}
                onClick={openProfile}
              >
                {user?.handle?.[0]?.toUpperCase() || 'U'}
              </div>

              {isProfileOpen && (
                <div className="card fade-in-up" style={{
                  position: 'absolute', top: 50, right: 0, width: 320,
                  padding: 24, zIndex: 1000, boxShadow: '0 15px 50px rgba(0,0,0,0.9)',
                  background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-glow)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div className="avatar avatar-lg" style={{ width: 64, height: 64, fontSize: 28, margin: '0 auto 12px auto', background: 'var(--bg-card)', color: 'var(--indigo)' }}>
                      {user?.handle?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{user?.handle}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {user?.email || 'Authenticated User'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Joined:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Account Status:</span>
                      <strong style={{ color: 'var(--indigo)' }}>Active</strong>
                    </div>
                  </div>

                  {isEditingHandle ? (
                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <label className="input-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>NEW USERNAME</label>
                      <input 
                        className="input" 
                        value={newHandle} 
                        onChange={(e) => setNewHandle(e.target.value)} 
                        autoFocus
                        minLength={3}
                        required
                        style={{ background: 'var(--bg-primary)' }}
                      />
                      {error && <div className="error-msg">{error}</div>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => setIsEditingHandle(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm w-full">Save Changes</button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      className="btn btn-ghost btn-sm w-full" 
                      style={{ marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                      onClick={() => setIsEditingHandle(true)}
                    >
                      ✏️ Change Username
                    </button>
                  )}

                  <button className="btn btn-danger btn-sm w-full" onClick={logout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
