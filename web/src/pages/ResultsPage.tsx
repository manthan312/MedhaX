import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import axios from 'axios';

export default function ResultsPage() {
  const { user, token } = useAuthStore();
  const { matchResult, scores, reset, playerHandles, matchId } = useGameStore();
  const navigate = useNavigate();

  const [isFirstGame, setIsFirstGame] = useState(false);
  const [checkingFirstGame, setCheckingFirstGame] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const checkHistory = async () => {
      try {
        const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';
        const res = await axios.get(`${apiBase}/matches/history?userId=${user.id}`);
        const endedMatches = (res.data.matches || []).filter((m: any) => m.status === 'ended');
        // If they have 0 or 1 ended matches in history, this is their first completed game
        setIsFirstGame(endedMatches.length <= 1);
      } catch (err) {
        console.error('Failed to check match history:', err);
      } finally {
        setCheckingFirstGame(false);
      }
    };
    checkHistory();
  }, [user?.id]);

  const handleSubmitReview = async () => {
    if (rating === 0 || !matchId) return;
    setSubmittingReview(true);
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';
      await axios.post(`${apiBase}/analytics/review`, {
        matchId,
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewSuccess(true);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

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

        {/* Rating card for first game */}
        {isFirstGame && !checkingFirstGame && (
          <div className="card fade-in-up" style={{ marginBottom: 28, padding: 24, border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>⚔️ Rate Your First Game ⚔️</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              How did you enjoy your first multiplayer quiz match?
            </p>

            {reviewSuccess ? (
              <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14, padding: '8px 0' }}>
                ✓ Thank you! Your review has been saved.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 28, cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        color: star <= (hoverRating || rating) ? 'var(--yellow)' : 'var(--text-muted)',
                        transition: 'transform 0.1s ease, color 0.1s ease',
                        transform: star <= (hoverRating || rating) ? 'scale(1.2)' : 'scale(1)',
                        textShadow: star <= (hoverRating || rating) ? '0 0 10px rgba(234,179,8,0.5)' : 'none'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {rating > 0 && (
                  <div className="w-full fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Feedback comments... (Optional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{ resize: 'none', background: 'rgba(255,255,255,0.02)', fontSize: 13 }}
                    />
                    <button
                      onClick={handleSubmitReview}
                      className="btn btn-primary w-full btn-sm"
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
