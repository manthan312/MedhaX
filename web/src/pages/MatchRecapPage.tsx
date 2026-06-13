import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api';

interface Question {
  id: string;
  prompt: string;
  choices: string[];
  language: string;
  topic: string;
  difficulty: string;
  correct_index?: number;
  explanation?: string;
}

interface RoundRecap {
  roundIndex: number;
  question: Question;
  answers: Record<string, any>;
}

interface MatchRecap {
  matchId: string;
  config: {
    language: string;
    gameMode: 'grid';
    gridSize: number;
    questionCount: number;
    topics: string[];
  };
  players: string[];
  scores: Record<string, number>;
  winnerId: string | null;
  rounds: RoundRecap[];
}

export default function MatchRecapPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [recap, setRecap] = useState<MatchRecap | null>(null);
  const [playerHandles, setPlayerHandles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoundIdx, setSelectedRoundIdx] = useState<number>(0);

  useEffect(() => {
    if (!matchId) return;

    const fetchRecap = async () => {
      try {
        setLoading(true);
        const recapRes = await axios.get(`${API}/matches/${matchId}/recap`);
        setRecap(recapRes.data);

        const matchRes = await axios.get(`${API}/matches/${matchId}`);
        if (matchRes.data.playerHandles) {
          setPlayerHandles(matchRes.data.playerHandles);
        }
        setError(null);
      } catch (err: any) {
        console.error('[MatchRecapPage] Error fetching recap:', err);
        setError(err.response?.data?.message || 'Failed to load match recap.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecap();
  }, [matchId]);

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="avatar avatar-lg" style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 16px' }}>👾</div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading match recap analytics…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recap) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-content" style={{ maxWidth: 600, textAlign: 'center', margin: '40px auto' }}>
          <div className="card" style={{ padding: 40, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Recap Unavailable</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              {error || 'Recap data is only available immediately after a live match has concluded.'}
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myUserId = user?.id || '';
  const oppUserId = recap.players.find(id => id !== myUserId) || '';
  const myHandle = user?.handle || 'You';
  const oppHandle = playerHandles[oppUserId] || 'Opponent';

  const myScore = recap.scores[myUserId] ?? 0;
  const oppScore = recap.scores[oppUserId] ?? 0;
  const isWinner = recap.winnerId === myUserId;
  const isTie = recap.winnerId === null;

  const currentRound = recap.rounds[selectedRoundIdx];

  return (
    <div className="page">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 1100 }}>
        {/* Header Summary */}
        <div className="card fade-in" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))', padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-indigo" style={{ textTransform: 'uppercase' }}>
                  Grid MCQ Match
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>ID: {matchId?.slice(0, 13)}</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>
                {isTie ? 'Tie Game' : isWinner ? 'Winner, Winner! 🏆' : 'GG! Nice Try'}
              </h1>
            </div>
            
            {/* Scoreboard */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{myHandle}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--indigo-light)' }}>{myScore}</div>
              </div>
              <div style={{ fontSize: 20, color: 'var(--text-muted)', fontWeight: 800 }}>-</div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{oppHandle}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--purple)' }}>{oppScore}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recap Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
          
          {/* Round Selector Sidebar */}
          <div className="card" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, paddingLeft: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Match Rounds
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 500, overflowY: 'auto' }} className="scrollable">
              {recap.rounds.map((round, idx) => {
                const isActive = selectedRoundIdx === idx;
                
                // Determine round status (check if user won this round)
                let roundWonBy = 'none';
                const myAns = round.answers[myUserId];
                const oppAns = round.answers[oppUserId];
                const correctIdx = round.question.correct_index;
                
                const myCorrect = myAns?.optionIndex === correctIdx;
                const oppCorrect = oppAns?.optionIndex === correctIdx;

                if (myCorrect && oppCorrect) {
                  if (myAns.receivedAt < oppAns.receivedAt) roundWonBy = 'me';
                  else roundWonBy = 'opp';
                } else if (myCorrect) {
                  roundWonBy = 'me';
                } else if (oppCorrect) {
                  roundWonBy = 'opp';
                }

                let indicatorColor = 'transparent';
                if (roundWonBy === 'me') {
                  indicatorColor = 'var(--green)';
                } else if (roundWonBy === 'opp') {
                  indicatorColor = 'var(--red)';
                }

                return (
                  <button
                    key={round.roundIndex}
                    onClick={() => setSelectedRoundIdx(idx)}
                    className="lang-tag"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                      border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, opacity: isActive ? 1 : 0.7 }}>
                        Round {idx + 1}
                      </span>
                    </div>
                    {indicatorColor !== 'transparent' && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: indicatorColor,
                          boxShadow: `0 0 6px ${indicatorColor}`
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Question Review Panel */}
          {currentRound && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="card fade-in" style={{ padding: 32 }}>
                
                {/* Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{currentRound.question.topic || 'Coding Snippet'}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Difficulty: <span style={{ color: 'var(--indigo-light)', fontWeight: 600 }}>{currentRound.question.difficulty}</span>
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-purple">{currentRound.question.language}</span>
                  </div>
                </div>

                {/* Question Code Block */}
                <div style={{ marginBottom: 24 }}>
                  <pre style={{
                    background: '#04060c',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 20,
                    overflowX: 'auto',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 14,
                    lineHeight: 1.5
                  }}>
                    <code>{currentRound.question.prompt}</code>
                  </pre>
                </div>

                {/* MCQ choices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Option Choices</h4>
                  {currentRound.question.choices.map((choice, oIdx) => {
                    const isCorrect = oIdx === currentRound.question.correct_index;
                    
                    const myAns = currentRound.answers[myUserId];
                    const oppAns = currentRound.answers[oppUserId];

                    const selectedByMe = myAns?.optionIndex === oIdx;
                    const selectedByOpp = oppAns?.optionIndex === oIdx;

                    let borderStyle = '1px solid var(--border)';
                    let bgStyle = 'transparent';
                    
                    if (isCorrect) {
                      borderStyle = '1px solid rgba(16, 185, 129, 0.4)';
                      bgStyle = 'rgba(16, 185, 129, 0.04)';
                    } else if (selectedByMe || selectedByOpp) {
                      borderStyle = '1px solid rgba(239, 68, 68, 0.3)';
                      bgStyle = 'rgba(239, 68, 68, 0.02)';
                    }

                    return (
                      <div
                        key={oIdx}
                        style={{
                          padding: '16px 20px',
                          borderRadius: 10,
                          border: borderStyle,
                          background: bgStyle,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 16
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: isCorrect ? 'var(--green)' : 'var(--border)',
                            color: isCorrect ? '#fff' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: isCorrect ? 600 : 400, color: isCorrect ? 'var(--green)' : 'var(--text-primary)' }}>
                            {choice}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          {selectedByMe && (
                            <span className={`badge ${isCorrect ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                              {myHandle} (You) {myAns?.receivedAt && `(${Math.round(myAns.timeTaken / 1000)}s)`}
                            </span>
                          )}
                          {selectedByOpp && (
                            <span className={`badge ${isCorrect ? 'badge-purple' : 'badge-red'}`} style={{ fontSize: 10, border: selectedByOpp && !isCorrect ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
                              {oppHandle} {oppAns?.receivedAt && `(${Math.round(oppAns.timeTaken / 1000)}s)`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {currentRound.question.explanation && (
                  <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>💡</span>
                      <h4 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Gemini Explains</h4>
                    </div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                      lineHeight: 1.6,
                      background: 'rgba(255,255,255,0.01)',
                      padding: 16,
                      borderRadius: 8,
                      borderLeft: '3px solid var(--indigo)'
                    }}>
                      {currentRound.question.explanation}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost">
            ← Back to Results
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            🏠 Go Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
