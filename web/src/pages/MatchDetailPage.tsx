import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import LanguageLogo from '../components/LanguageLogo';
import Navbar from '../components/Navbar';

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000') + '/api';

interface MatchDetail {
  id: string;
  status: string;
  winner_id: string | null;
  config: {
    language: string;
    topics: string[];
    topic: string;
    gridSize: number;
    questionCount: number;
  };
  started_at: string;
  ended_at: string;
  rounds_played: number;
  duration_sec: number | null;
  disconnect_flags: Record<string, boolean>;
  scores: Record<string, number>;
  responseStats: Record<string, any>;
  player_ids: string[];
}

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/matches/${matchId}`);
        setMatch(res.data.match);
        setHandles(res.data.playerHandles || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load match details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [matchId]);

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div>Loading match details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
            <div style={{ color: 'var(--text-secondary)' }}>{error || 'Match not found'}</div>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: 20 }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myId = user?.id || '';
  const oppId = match.player_ids.find(pid => pid !== myId) || '';
  const myHandle = handles[myId] || 'You';
  const oppHandle = handles[oppId] || 'Opponent';

  const myScore = match.scores[myId] ?? 0;
  const oppScore = match.scores[oppId] ?? 0;

  let outcome: 'WIN' | 'LOSS' | 'TIE' = 'TIE';
  if (match.winner_id === myId) outcome = 'WIN';
  else if (match.winner_id && match.winner_id !== myId) outcome = 'LOSS';

  const outcomeConfig = {
    WIN:  { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', label: '🏆 Victory!',   emoji: '🎉' },
    LOSS: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  label: '💀 Defeated',   emoji: '😤' },
    TIE:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)', label: '🤝 Draw',       emoji: '🤝' },
  }[outcome];

  const startDate = match.started_at
    ? new Date(match.started_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Unknown';

  const durationLabel = match.duration_sec !== null
    ? match.duration_sec >= 60
      ? `${Math.floor(match.duration_sec / 60)}m ${match.duration_sec % 60}s`
      : `${match.duration_sec}s`
    : 'Unknown';

  const myDisconnected = match.disconnect_flags[myId] === true;
  const oppDisconnected = match.disconnect_flags[oppId] === true;

  const topics = match.config.topics?.length > 0
    ? match.config.topics
    : match.config.topic ? [match.config.topic] : [];

  return (
    <div className="page">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-ghost"
          style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
        >
          ← Back to Dashboard
        </button>

        {/* Outcome banner */}
        <div
          className="card fade-in"
          style={{
            background: outcomeConfig.bg,
            borderColor: outcomeConfig.border,
            marginBottom: 20,
            textAlign: 'center',
            padding: '32px 24px',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>{outcomeConfig.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: outcomeConfig.color, marginBottom: 4 }}>
            {outcomeConfig.label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            {startDate}
          </div>
        </div>

        {/* Score card */}
        <div className="card fade-in-up" style={{ marginBottom: 20, padding: '28px 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 16,
            textAlign: 'center',
          }}>
            {/* Me */}
            <div>
              <div className="avatar" style={{ margin: '0 auto 10px', width: 52, height: 52, fontSize: 22 }}>
                {myHandle[0]?.toUpperCase()}
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>{myHandle}</div>
              {myDisconnected && (
                <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 4, letterSpacing: 0.5 }}>DISCONNECTED</div>
              )}
              <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: outcome === 'WIN' ? '#6366f1' : 'var(--text-primary)' }}>
                {myScore}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>points</div>
            </div>

            {/* VS divider */}
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-muted)' }}>VS</div>

            {/* Opponent */}
            <div>
              <div className="avatar" style={{ margin: '0 auto 10px', width: 52, height: 52, fontSize: 22 }}>
                {oppHandle[0]?.toUpperCase()}
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>{oppHandle}</div>
              {oppDisconnected && (
                <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 4, letterSpacing: 0.5 }}>DISCONNECTED</div>
              )}
              <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: outcome === 'LOSS' ? '#6366f1' : 'var(--text-primary)' }}>
                {oppScore}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>points</div>
            </div>
          </div>
        </div>

        {/* Match info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Language */}
          <div className="card fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px' }}>
            <LanguageLogo language={match.config.language} size={36} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Language</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{match.config.language}</div>
            </div>
          </div>

          {/* Grid size */}
          <div className="card fade-in-up" style={{ padding: '20px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Match Config</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {match.config.gridSize}×{match.config.gridSize} grid
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {match.rounds_played} question{match.rounds_played !== 1 ? 's' : ''} played
            </div>
          </div>

          {/* Duration */}
          <div className="card fade-in-up" style={{ padding: '20px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Duration</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
              {durationLabel}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{startDate}</div>
          </div>

          {/* Point diff */}
          <div className="card fade-in-up" style={{ padding: '20px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Score Margin</div>
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace',
              color: myScore > oppScore ? '#6366f1' : myScore < oppScore ? '#ef4444' : 'var(--text-primary)'
            }}>
              {myScore > oppScore ? '+' : ''}{myScore - oppScore} pts
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {myScore > oppScore ? 'You dominated' : myScore < oppScore ? 'They outplayed you' : 'Perfectly balanced'}
            </div>
          </div>
        </div>

        {/* Topics */}
        {topics.length > 0 && (
          <div className="card fade-in-up" style={{ marginBottom: 20, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Topics Covered</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topics.map((t: string) => (
                <span
                  key={t}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'rgba(99,102,241,0.12)',
                    color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}
                >
                  {t.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Match ID */}
        <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Match ID: {match.id}
          </span>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
