import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { initSocket, disconnectSocket } from './services/socket';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import FriendsPage from './pages/FriendsPage';
import LobbyPage from './pages/LobbyPage';
import PlacementPage from './pages/PlacementPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
  return isAuthenticated ? <>{children}</> : <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

/** 
 * Validates the stored token on app startup and sets up the global socket.
 * Also listens for game challenges from any page.
 */
function AppBootstrap() {
  const { isAuthenticated, token, validateToken, user } = useAuthStore();
  const [challenge, setChallenge] = useState<{ matchId: string; senderId: string; senderHandle: string } | null>(null);
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);

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

      const handleChallenge = (data: { matchId: string; senderId: string; senderHandle: string }) => {
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
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--indigo-light)' }}>{challenge.senderHandle}</strong>
          {' '}has challenged you to a coding battle!
        </p>
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
    <BrowserRouter>
      <AppBootstrap />
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/signup"    element={<PublicOnly><SignupPage /></PublicOnly>} />
        <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/friends"   element={<Protected><FriendsPage /></Protected>} />
        <Route path="/lobby"     element={<Protected><LobbyPage /></Protected>} />
        <Route path="/placement" element={<Protected><PlacementPage /></Protected>} />
        <Route path="/game"      element={<Protected><GamePage /></Protected>} />
        <Route path="/results"   element={<Protected><ResultsPage /></Protected>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
