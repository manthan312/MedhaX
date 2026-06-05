import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';

export default function ResultsPage() {
  const { user } = useAuthStore();
  const { matchResult, scores, reset, playerHandles, matchId } = useGameStore();
  const navigate = useNavigate();

  const isWinner = matchResult?.winnerId === user?.id;
  const isTie = matchResult?.winnerId === null;
  const myScore = scores[user?.id || ''] ?? matchResult?.scores?.[user?.id || ''] ?? 0;
  const opponentId = Object.keys(matchResult?.scores || {}).find(id => id !== user?.id);
  const opponentScore = opponentId ? (matchResult?.scores?.[opponentId] ?? 0) : 0;
  const opponentName = opponentId ? (playerHandles[opponentId] || 'Opponent') : 'Opponent';

  const handleRematch = () => {
    if (matchId) {
      const rematchId = matchId.startsWith('rematch_') ? matchId : `rematch_${matchId}`;
      reset();
      navigate(`/lobby?matchId=${rematchId}`);
    } else {
      reset();
      navigate('/lobby');
    }
  };
  const handleHome = () => { reset(); navigate('/dashboard'); };

  const resultText = isTie ? "It's a Tie!" : isWinner ? 'You Won! 🏆' : 'You Lost 💀';
  const resultColor = isTie ? 'var(--yellow)' : isWinner ? 'var(--green)' : 'var(--red)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        {/* Result emoji */}
        <div style={{ fontSize: 80, marginBottom: 16, animation: 'float 2s ease-in-out infinite' }}>
          {isTie ? '🤝' : isWinner ? '🏆' : '😔'}
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 900, color: resultColor, marginBottom: 8, letterSpacing: -1 }}>
          {resultText}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 40 }}>
          {matchResult?.reason === 'questions_exhausted' ? 'All questions answered!' :
           matchResult?.reason === 'all_ships_sunk' ? 'All shapes discovered!' :
           matchResult?.reason === 'opponent_disconnected' ? 'Opponent disconnected.' :
           matchResult?.reason === 'cheating' ? (isWinner ? 'Opponent was disqualified for tab switching.' : 'You were disqualified for tab switching.') :
           matchResult?.reason === 'left' ? (isWinner ? 'Opponent left the match.' : 'You left the match.') :
           'Match complete'}
        </p>

        {/* Score comparison */}
        <div className="card" style={{ marginBottom: 28, padding: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
            <div>
              <div className="avatar avatar-xl" style={{ margin: '0 auto 12px' }}>{user?.handle?.[0]?.toUpperCase()}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{user?.handle}</div>
              <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--indigo-light)' }}>{myScore}</div>
            </div>
            <div style={{ fontSize: 28, color: 'var(--text-muted)', fontWeight: 900 }}>VS</div>
            <div>
              <div className="avatar avatar-xl" style={{ margin: '0 auto 12px', background: 'linear-gradient(135deg, var(--purple), var(--cyan))' }}>
                {opponentName[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{opponentName}</div>
              <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--purple)' }}>{opponentScore}</div>
            </div>
          </div>

          {/* Bar comparison */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', gap: 8, height: 12, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ background: 'var(--indigo)', borderRadius: 99, transition: 'width 1s ease', width: `${myScore + opponentScore > 0 ? (myScore / (myScore + opponentScore)) * 100 : 50}%` }} />
              <div style={{ background: 'var(--purple)', borderRadius: 99, flex: 1 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={handleRematch} className="btn btn-primary btn-lg">
            🔄 Rematch
          </button>
          <button onClick={handleHome} className="btn btn-ghost btn-lg">
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
