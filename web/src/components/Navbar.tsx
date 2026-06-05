import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">MedhaX</Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
            <Link to="/friends" className="btn btn-ghost btn-sm">Friends</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar avatar-sm">{user?.handle?.[0]?.toUpperCase() || 'U'}</div>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
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
