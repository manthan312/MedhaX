import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { initSocket, disconnectSocket } from './services/socket';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import FriendsPage from './pages/FriendsPage';
import LobbyPage from './pages/LobbyPage';
import PlacementPage from './pages/PlacementPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';
import MatchDetailPage from './pages/MatchDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ParticleBackground from './components/ParticleBackground';

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const redirectUrl = encodeURIComponent(location.pathname + location.search);
  
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }
  
  const isAdmin = user?.email === 'admin31256@gmail.com' || (user as any)?.role === 'admin';
  return isAdmin ? <Navigate to="/admin-dashboard" replace /> : <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) {
    return <>{children}</>;
  }
  const isAdmin = user?.email === 'admin31256@gmail.com' || (user as any)?.role === 'admin';
  return <Navigate to={isAdmin ? "/admin-dashboard" : "/dashboard"} replace />;
}

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const redirectUrl = encodeURIComponent(location.pathname + location.search);

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  const isAdmin = user?.email === 'admin31256@gmail.com' || (user as any)?.role === 'admin';
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

/** 
 * Validates the stored token on app startup and sets up the global socket.
 * Also listens for game challenges from any page.
 */
function AppBootstrap() {
  const { isAuthenticated, token, validateToken, user } = useAuthStore();
  const [challenge, setChallenge] = useState<{ 
    matchId: string; 
    senderId: string; 
    senderHandle: string;
    config?: { language: string; topics: string[]; questionCount: number; gridSize: number };
  } | null>(null);
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);

  // Visitor tracking
  useEffect(() => {
    let sessionId = sessionStorage.getItem('medhax_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('medhax_session_id', sessionId);
    }
    const apiBase = (import.meta.env.VITE_API_URL ?? 'https://medhax-2.onrender.com') + '/api';
    axios.post(`${apiBase}/analytics/visit`, { sessionId }).catch(err => {
      console.warn('Failed to log visit:', err);
    });
  }, []);

  // On mount: validate token once
  useEffect(() => {
    if (isAuthenticated && token) {
      validateToken().finally(() => setValidated(true));
    } else {
      setValidated(true);
    }
  }, []); // only on mount

  // When auth changes: connect/disconnect socket
  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = initSocket(token);

      const handleChallenge = (data: any) => {
        setChallenge(data);
      };

      socket.on('challenge.received', handleChallenge);

      return () => {
        socket.off('challenge.received', handleChallenge);
      };
    } else {
      disconnectSocket();
      setChallenge(null);
    }
  }, [isAuthenticated, token]);

  // Don't render challenge popup until we've validated the token
  if (!validated || !challenge) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div className="card fade-in-up" style={{
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        border: '1px solid var(--border-glow)',
        padding: 40,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Challenge Received!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--indigo-light)' }}>{challenge.senderHandle}</strong>
          {' '}has challenged you to a coding battle!
        </p>
        
        {challenge.config && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left', fontSize: 13, color: 'var(--text-secondary)' }}>
            <div style={{ marginBottom: 6 }}><strong style={{ color: 'var(--text-primary)' }}>Language:</strong> {challenge.config.language}</div>
            <div style={{ marginBottom: 6 }}><strong style={{ color: 'var(--text-primary)' }}>Topics:</strong> {challenge.config.topics.join(', ')}</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Scale:</strong> {challenge.config.questionCount} Qs ({challenge.config.gridSize}x{challenge.config.gridSize})</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost w-full" onClick={() => {
            if (token && challenge) {
              const socket = initSocket(token);
              socket.emit('challenge.decline', {
                matchId: challenge.matchId,
                targetUserId: challenge.senderId,
                declinerHandle: user?.handle || 'A player'
              });
            }
            setChallenge(null);
          }}>
            Decline
          </button>
          <button className="btn btn-primary w-full" onClick={() => {
            const matchId = challenge.matchId;
            setChallenge(null);
            navigate(`/lobby?matchId=${matchId}`);
          }}>
            ⚔️ Accept & Join
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppBootstrap />
      <ParticleBackground />
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/signup"    element={<PublicOnly><SignupPage /></PublicOnly>} />
        <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/admin-dashboard" element={<AdminProtected><AdminDashboardPage /></AdminProtected>} />
        <Route path="/friends"   element={<Protected><FriendsPage /></Protected>} />
        <Route path="/lobby"     element={<Protected><LobbyPage /></Protected>} />
        <Route path="/placement" element={<Protected><PlacementPage /></Protected>} />
        <Route path="/game"      element={<Protected><GamePage /></Protected>} />
        <Route path="/results"   element={<Protected><ResultsPage /></Protected>} />
        <Route path="/match/:matchId" element={<Protected><MatchDetailPage /></Protected>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
