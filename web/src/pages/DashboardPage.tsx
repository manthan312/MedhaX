import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import LanguageLogo from '../components/LanguageLogo';
import { useFriendStore } from '../store/friendStore';
import { v4 as uuidv4 } from 'uuid';
import { initSocket } from '../services/socket';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL ?? 'https://medhax-2.onrender.com') + '/api';

interface Match {
  id: string;
  status: string;
  winner_id: string | null;
  config: {
    language: string;
    topic: string;
    gridSize: number;
    questionCount: number;
  };
  started_at: string;
  ended_at: string;
  scores: Record<string, number>;
  player_ids: string[];
}

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const { friends, pendingRequests, fetchFriends, setFriendOnline } = useFriendStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [matches, setMatches] = useState<Match[]>([]);
  const [playerHandles, setPlayerHandles] = useState<Record<string, string>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (location.state && (location.state as any).toastMsg) {
      setToast({
        msg: (location.state as any).toastMsg,
        type: (location.state as any).toastType || 'info'
      });
      // Clear the history state so refreshing doesn't keep showing the toast
      window.history.replaceState({}, document.title);
      setTimeout(() => setToast(null), 4000);
    }
  }, [location.state]);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchMatches = async () => {
      try {
        setIsLoadingMatches(true);
        const res = await axios.get(`${API}/matches/history?userId=${user.id}`);
        setMatches(res.data.matches || []);
        setPlayerHandles(res.data.playerHandles || {});
      } catch (err) {
        console.error('[DashboardPage] failed to fetch match history:', err);
      } finally {
        setIsLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [user?.id]);

  useEffect(() => {
    if (!token) return;
    const socket = initSocket(token);

    const handleUpdate = () => {
      fetchFriends();
    };

    const handleStatus = (data: { friendId: string; online: boolean }) => {
      setFriendOnline(data.friendId, data.online);
    };

    socket.on('friend.request.received', handleUpdate);
    socket.on('friend.request.accepted', handleUpdate);
    socket.on('friend.request.declined', handleUpdate);
    socket.on('friend.status', handleStatus);

    return () => {
      socket.off('friend.request.received', handleUpdate);
      socket.off('friend.request.accepted', handleUpdate);
      socket.off('friend.request.declined', handleUpdate);
      socket.off('friend.status', handleStatus);
    };
  }, [token]);

  const handleQuickMatch = (eOrLang?: any) => {
    const matchId = uuidv4();
    let url = `/lobby?matchId=${matchId}`;
    if (typeof eOrLang === 'string') {
      url += `&lang=${encodeURIComponent(eOrLang)}`;
    }
    navigate(url);
  };

  const handleChallengeFriend = (friendId: string) => {
    const matchId = uuidv4();
    navigate(`/lobby?matchId=${matchId}&friendId=${friendId}`);
  };

  let wins = 0;
  let losses = 0;
  let streak = 0;
  let streakBroken = false;

  for (const match of matches) {
    if (match.status !== 'ended') continue;
    if (match.winner_id === user?.id) {
      wins++;
      if (!streakBroken) {
        streak++;
      }
    } else if (match.winner_id === null) {
      streakBroken = true;
    } else {
      losses++;
      streakBroken = true;
    }
  }

  return (
    <div className="page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
      <Navbar />
      <div className="page-content">
        {/* Welcome header */}
        <div className="fade-in" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>
                Welcome back, <span style={{ background: 'linear-gradient(135deg, var(--indigo-light), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.handle}</span> 👾
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Ready for your next coding battle?</p>
            </div>
            <button onClick={handleQuickMatch} className="btn btn-primary btn-lg glow-pulse">
              ⚡ Quick Match
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Profile card */}
            <div className="card fade-in-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div className="avatar avatar-xl">{user?.handle?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.handle}</div>
                  <div className="badge badge-indigo" style={{ marginTop: 6 }}>
                    🏅 {wins >= 20 ? 'Grandmaster' : wins >= 10 ? 'Veteran' : wins >= 5 ? 'Challenger' : 'Rookie'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
                {[
                  { v: wins, l: 'Wins' },
                  { v: losses, l: 'Losses' },
                  { v: streak, l: 'Streak' }
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Friends pending */}
            {pendingRequests.length > 0 && (
              <div className="card fade-in-up stagger-1" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#fbbf24' }}>
                  🔔 Pending Requests ({pendingRequests.length})
                </div>
                {pendingRequests.slice(0, 3).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{r.handle?.[0]?.toUpperCase()}</div>
                      <span style={{ fontSize: 14 }}>{r.handle}</span>
                    </div>
                    <Link to="/friends" className="btn btn-ghost btn-sm">View</Link>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            <div className="card fade-in-up stagger-2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 700 }}>Friends ({friends.length})</div>
                <Link to="/friends" className="btn btn-ghost btn-sm">Manage</Link>
              </div>
              {friends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No friends yet</div>
                  <Link to="/friends" className="btn btn-ghost btn-sm" style={{ marginTop: 12, textDecoration: 'none', display: 'inline-flex' }}>Find Friends →</Link>
                </div>
              ) : (
                friends.slice(0, 5).map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <div className="avatar avatar-sm">{f.handle?.[0]?.toUpperCase()}</div>
                        <div className={`online-dot ${f.online ? '' : 'offline'}`} style={{ position: 'absolute', bottom: -1, right: -1 }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{f.handle}</span>
                    </div>
                    {f.online && (
                      <button onClick={() => handleChallengeFriend(f.id)} className="btn btn-primary btn-sm">
                        ⚔️ Challenge
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Match History card */}
            <div className="card fade-in-up stagger-3" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🎮 Match History</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 10 games</span>
              </div>
              {isLoadingMatches ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                  Loading history...
                </div>
              ) : matches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No matches played yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: '350px', paddingRight: 4 }} className="scrollable">
                  {matches.slice(0, 10).map((m) => {
                    const myScore = m.scores?.[user?.id || ''] ?? 0;
                    const oppId = m.player_ids?.find(pid => pid !== user?.id) || '';
                    const oppHandle = playerHandles[oppId] || oppId.slice(0, 8) || 'Opponent';
                    const oppScore = m.scores?.[oppId] ?? 0;

                    let outcome: 'WIN' | 'LOSS' | 'TIE' = 'TIE';
                    if (m.winner_id === user?.id) outcome = 'WIN';
                    else if (m.winner_id) outcome = 'LOSS';

                    const dateStr = m.ended_at 
                      ? new Date(m.ended_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Unknown';

                    const outcomeColors = {
                      WIN: { bg: 'rgba(99,102,241, 0.15)', text: '#6366f1', border: 'rgba(99,102,241, 0.3)' },
                      LOSS: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
                      TIE: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' }
                    };
                    const color = outcomeColors[outcome];

                    return (
                      <div 
                        key={m.id}
                        onClick={() => navigate(`/match/${m.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/match/${m.id}`)}
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: 8, 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          cursor: 'pointer',
                          transition: 'border-color 0.18s, background 0.18s',
                          outline: 'none',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)';
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.05)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span 
                            style={{ 
                              padding: '2px 8px', 
                              borderRadius: 4, 
                              fontSize: 11, 
                              fontWeight: 800, 
                              background: color.bg, 
                              color: color.text,
                              border: `1px solid ${color.border}`,
                              letterSpacing: 0.5
                            }}
                          >
                            {outcome}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dateStr}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.5 }}>→</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>vs {oppHandle}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {m.config?.language} • {m.config?.topic?.replace(/-/g, ' ')}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: outcome === 'WIN' ? 'var(--indigo-light)' : 'var(--text-primary)' }}>
                              {myScore} - {oppScore}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {m.config?.gridSize}x{m.config?.gridSize} • {m.config?.questionCount} Qs
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Start match card */}
            <div className="card fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))', borderColor: 'var(--border-glow)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Start a New Match</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Choose your language, place your shapes on the hidden grid, and battle it out with 45-second coding questions.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { lang: 'Python', desc: 'Lists, GIL, OOP' },
                  { lang: 'JavaScript', desc: 'Closures, Promises, Event Loop' },
                  { lang: 'Java', desc: 'OOP, Collections, Threads' },
                  { lang: 'C++', desc: 'Pointers, STL, Memory' },
                  { lang: 'C', desc: 'Basics, Pointers, Memory' },
                  { lang: 'DBMS', desc: 'SQL, Normalization, ACID' },
                  { lang: 'DSA', desc: 'Structures, Patterns, Sorting' },
                  { lang: 'Operating System', desc: 'Scheduling, Memory, Deadlocks' },
                ].map(l => (
                  <div key={l.lang} onClick={() => handleQuickMatch(l.lang)} className="card card-glow" style={{ cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
                    <LanguageLogo language={l.lang} size={28} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{l.lang}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.3 }}>{l.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleQuickMatch} className="btn btn-primary w-full btn-lg">
                ⚡ Quick Match — Any Language
              </button>
            </div>

            {/* How to play */}
            <div className="card fade-in-up stagger-1">
              <div style={{ fontWeight: 700, marginBottom: 16 }}>🎯 How to Play</div>
              {[
                { n: '1', t: 'Place Shapes', d: 'Strategically place random shapes on your hidden 5×5 grid in 90 seconds.' },
                { n: '2', t: 'Answer Questions', d: 'Be first to answer the 45s MCQ question to earn a dig turn.' },
                { n: '3', t: 'Attack the Grid', d: 'Click a cell on your opponent\'s grid. Hit a shape cell to score points!' },
                { n: '4', t: 'Win!', d: 'Most points after all questions — or sink all opponent shapes — wins!' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--indigo), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.t}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
