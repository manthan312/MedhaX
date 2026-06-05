import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import type { Question } from '../store/gameStore';
import { initSocket, emit } from '../services/socket';

const OPTS = ['A', 'B', 'C', 'D'];

// ─── Code-aware prompt renderer ────────────────────────────────────────────────
function renderPrompt(text: string): React.ReactNode {
  let cleaned = text.replace(/(\/\/|\/\*|)\s*\(subtopic:.*?, v:\s*\d+\)\s*(\*\/|)/gi, '').trim();
  cleaned = cleaned.replace(/\[dup:\s*\d+\]/gi, '').trim();
  const fencedParts = cleaned.split(/(```[\s\S]*?```)/g);
  return (
    <span>
      {fencedParts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const inner = part.slice(3, -3).replace(/^\n/, '').replace(/\n$/, '');
          return (
            <pre key={idx} style={{
              margin: '12px 0', padding: '14px 16px',
              background: 'rgba(0,0,0,0.45)', borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.25)',
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13, lineHeight: 1.65, color: '#c4b5fd',
              whiteSpace: 'pre', overflowX: 'auto',
            }}>
              <code>{inner}</code>
            </pre>
          );
        }

        // Inline backtick spans and plain text
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={idx}>
            {inlineParts.map((ip, ii) => {
              if (ip.startsWith('`') && ip.endsWith('`') && ip.length > 2) {
                return (
                  <code key={ii} style={{
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    fontSize: '0.88em', color: '#a5f3fc',
                    background: 'rgba(34,211,238,0.1)',
                    padding: '2px 6px', borderRadius: 5,
                    border: '1px solid rgba(34,211,238,0.2)',
                  }}>
                    {ip.slice(1, -1)}
                  </code>
                );
              }
              // Preserve newlines as <br/>
              return (
                <span key={ii} style={{ whiteSpace: 'pre-wrap' }}>{ip}</span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

export default function GamePage() {
  const [params] = useSearchParams();
  const matchId = params.get('matchId') || '';
  const { user, token } = useAuthStore();
  const { myShapes, myGrid, opponentGrid, config, markDigResult, updateScores, setMatchResult, setStatus, playerHandles } = useGameStore();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [total, setTotal] = useState(10);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{ correctIndex: number; winnerId: string | null } | null>(null);
  const [opponentFaster, setOpponentFaster] = useState(false);   // ⚡ lockout overlay
  const [digTurn, setDigTurn] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [scores2, setScores2] = useState<Record<string, number>>({});

  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    let wasHidden = false;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
      } else if (document.visibilityState === 'visible' && wasHidden) {
        wasHidden = false;
        
        setCheatWarnings(prev => {
          const nextVal = prev + 1;
          if (nextVal >= 3) {
            emit('match.forfeit', { matchId, userId: user?.id, reason: 'cheating' });
            alert("Cheating caught! You switched tabs 3 times and are disqualified.");
            navigate('/dashboard');
          } else {
            setShowCheatModal(true);
          }
          return nextVal;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [matchId, user?.id]);

  useEffect(() => {
    if (!token || !user) return;
    const socket = initSocket(token);

    // Join room / recover state if refreshed
    socket.emit('lobby.join', {
      matchId,
      userId: user.id,
      config: config || { gridSize: 5 }
    });

    socket.on('question.start', (data: { question: Question; questionIdx: number; total: number; deadline_ts: number; remainingSeconds?: number; playerHandles?: Record<string, string> }) => {
      setQuestion(data.question);
      setQuestionIdx(data.questionIdx);
      setTotal(data.total);
      const secs = data.remainingSeconds ?? Math.max(0, Math.ceil((data.deadline_ts - Date.now()) / 1000));
      setDeadline(Date.now() + secs * 1000);
      setSelectedOpt(null);
      setAnswerResult(null);
      setOpponentFaster(false);
      setDigTurn(null);
      if (data.playerHandles) {
        useGameStore.getState().setPlayerHandles(data.playerHandles);
      }
    });

    socket.on('answer.result', (data: { winnerId: string | null; correctIndex: number; scores: Record<string, number> }) => {
      setAnswerResult({ correctIndex: data.correctIndex, winnerId: data.winnerId });
      setScores2(data.scores);
      updateScores(data.scores);

      if (data.winnerId === user?.id) {
        showToast('🎯 Correct! You answered first — dig turn incoming!');
      } else if (data.winnerId) {
        // Opponent answered correctly first — show lockout overlay if user didn't answer
        setOpponentFaster(true);
        showToast('⚡ Opponent answered first!');
      } else {
        showToast('⏰ No one got it — moving to next question!');
      }
    });

    socket.on('dig.turn', (data: { diggerUserId: string; playerHandles?: Record<string, string> }) => {
      setDigTurn(data.diggerUserId);
      setOpponentFaster(false);
      if (data.playerHandles) {
        useGameStore.getState().setPlayerHandles(data.playerHandles);
      }
      if (data.diggerUserId === user?.id) showToast('💥 Your dig turn! Click the opponent\'s grid!');
    });

    socket.on('dig.result', (data: { r: number; c: number; hit: boolean; diggerUserId: string; targetUserId: string; scores: Record<string, number> }) => {
      const isMyGrid = data.targetUserId === user?.id;
      markDigResult(data.r, data.c, data.hit, isMyGrid);
      setScores2(data.scores);
      updateScores(data.scores);
      if (data.hit) {
        const pts = questionIdx + 1 + 5;
        showToast(`💥 HIT! +${pts} points scored!`);
      } else {
        showToast('💧 MISS! Nothing there.');
      }
    });

    socket.on('match.end', (data: { winnerId: string | null; scores: Record<string, number>; reason: string }) => {
      setMatchResult({ ...data });
      setStatus('ended');
      setTimeout(() => navigate(`/results?matchId=${matchId}`), 1000);
    });

    return () => { ['question.start','answer.result','dig.turn','dig.result','match.end'].forEach(e => socket.off(e)); };
  }, [user?.id, token]);

  // Timer countdown
  useEffect(() => {
    if (!deadline) return;
    const iv = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(iv);
  }, [deadline]);

  const handleAnswer = (idx: number) => {
    if (selectedOpt !== null || answerResult !== null || opponentFaster) return;
    setSelectedOpt(idx);
    emit('answer.submit', { matchId, userId: user?.id, optionIndex: idx });
  };

  const handleDig = (r: number, c: number) => {
    if (digTurn !== user?.id) return;
    const targetId = Object.keys(scores2).find(id => id !== user?.id);
    emit('dig.submit', { matchId, userId: user?.id, targetUserId: targetId, r, c });
    setDigTurn(null);
  };

  const myScore = scores2[user?.id || ''] ?? 0;
  const opponentId = Object.keys(scores2).find(id => id !== user?.id);
  const opponentScore = opponentId ? (scores2[opponentId] ?? 0) : 0;

  const timerPct = deadline ? Math.max(0, (deadline - Date.now()) / 45000) : 1;
  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f97316' : '#6366f1';
  const size = 100, stroke = 8, r2 = (size - stroke) / 2, circ = 2 * Math.PI * r2;

  const gridSize = config?.gridSize || 5;

  // Lock options when: user already answered, answer result arrived, or opponent answered faster
  const optionsLocked = selectedOpt !== null || answerResult !== null || opponentFaster;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toast && (
        <div className="toast-container"><div className="toast toast-info">{toast}</div></div>
      )}

      {/* Header scoreboard */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => setShowLeaveConfirm(true)} 
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar avatar-sm">{user?.handle?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user?.handle}</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--indigo-light)' }}>{myScore}</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Round {questionIdx + 1} / {total}</div>
          <div style={{ fontSize: 12, color: 'var(--indigo-light)', fontWeight: 600, marginTop: 2 }}>{config?.language} • {config?.topics?.join(', ')}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{opponentId ? (playerHandles[opponentId] || 'Opponent') : 'Opponent'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: 'var(--purple)' }}>{opponentScore}</div>
          </div>
          <div className="avatar avatar-sm">{(opponentId ? (playerHandles[opponentId] || 'Opponent') : 'Opponent')[0]?.toUpperCase()}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
        {/* Left: Question panel */}
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, borderRight: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          {question ? (
            <>
              {/* ⚡ Opponent answered faster overlay */}
              {opponentFaster && !digTurn && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 20,
                  background: 'rgba(5,8,17,0.92)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 20, animation: 'fadeIn 0.3s ease',
                }}>
                  {/* Lightning bolt animated icon */}
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f97316, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 40, boxShadow: '0 0 60px rgba(249,115,22,0.5)',
                    animation: 'glow-pulse 1s ease infinite',
                  }}>⚡</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 28, fontWeight: 900, color: '#f97316',
                      letterSpacing: -0.5, marginBottom: 8,
                    }}>Opponent Answered First!</div>
                    <div style={{
                      fontSize: 15, color: 'var(--text-secondary)', maxWidth: 320,
                      lineHeight: 1.6,
                    }}>
                      Your opponent answered correctly faster than you. Wait for the next question…
                    </div>
                  </div>
                  {/* Show the correct answer */}
                  {answerResult && (
                    <div style={{
                      padding: '12px 20px', borderRadius: 10,
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                      color: '#34d399', fontSize: 14, fontWeight: 600,
                    }}>
                      ✅ Correct answer was: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {OPTS[answerResult.correctIndex]}. {question.choices[answerResult.correctIndex]}
                      </strong>
                    </div>
                  )}
                  {/* Pulse ring */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                </div>
              )}

              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div className="timer-ring" style={{ display: 'inline-flex' }}>
                  <svg width={size} height={size}>
                    <circle cx={size/2} cy={size/2} r={r2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
                    <circle cx={size/2} cy={size/2} r={r2} fill="none" stroke={timerColor} strokeWidth={stroke}
                      strokeDasharray={circ} strokeDashoffset={circ * (1 - timerPct)}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }} />
                  </svg>
                  <div className="timer-text" style={{ color: timerColor, fontSize: 20 }}>{timeLeft}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--indigo-light)' }}>{question.language}</div>
                </div>
              </div>

              {/* Question prompt — code-aware rendering */}
              <div style={{
                fontSize: 17, fontWeight: 600, lineHeight: 1.7,
                color: 'var(--text-primary)',
                padding: '18px 20px',
                background: 'rgba(255,255,255,0.025)',
                borderRadius: 12, border: '1px solid var(--border)',
              }}>
                {renderPrompt(question.prompt)}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {question.choices.map((choice, i) => {
                  let cls = 'mcq-option';
                  if (answerResult) {
                    if (i === answerResult.correctIndex) cls += ' correct';
                    else if (i === selectedOpt) cls += ' wrong';
                  } else if (i === selectedOpt) cls += ' selected';
                  return (
                    <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={optionsLocked}>
                      <span className="opt-letter">{OPTS[i]}</span>
                      <span style={{ whiteSpace: 'pre-wrap', textAlign: 'left', flex: 1 }}>{choice}</span>
                    </button>
                  );
                })}
              </div>



              {/* Dig phase prompts */}
              {digTurn === user?.id && (
                <div className="toast toast-info" style={{ maxWidth: '100%' }}>
                  🎯 <strong>Your dig turn!</strong> Click a cell on the opponent's grid →
                </div>
              )}
              {answerResult && digTurn && digTurn !== user?.id && (
                <div className="toast toast-error" style={{ maxWidth: '100%' }}>
                  Opponent is digging… 💀
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
                <div style={{ color: 'var(--text-secondary)' }}>Waiting for question…</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Grids panel */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Opponent grid */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚔️ Opponent Grid</span>
              {digTurn === user?.id && <span className="badge badge-red" style={{ animation: 'glow-pulse 1s infinite' }}>Your Turn!</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 4 }}>
              {Array.from({ length: gridSize }, (_, r) =>
                Array.from({ length: gridSize }, (_, c) => {
                  const cell = opponentGrid[r]?.[c];
                  let cls = 'grid-cell';
                  if (cell?.attacked) cls += cell.hit ? ' attacked-hit' : ' attacked-miss';
                  if (digTurn === user?.id && !cell?.attacked) cls += ' dig-target';
                  return (
                    <div key={`${r},${c}`} className={cls} style={{ paddingBottom: '100%', position: 'relative' }}
                      onClick={() => handleDig(r, c)}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        {cell?.attacked ? (cell.hit ? '💥' : '○') : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* My grid */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>🛡️ Your Grid</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 4 }}>
              {Array.from({ length: gridSize }, (_, r) =>
                Array.from({ length: gridSize }, (_, c) => {
                  const cell = myGrid[r]?.[c];
                  const hasShape = myShapes.some(s => s.cells.some(sc => s.originR + sc.r === r && s.originC + sc.c === c));
                  let cls = 'grid-cell';
                  if (hasShape) cls += cell?.attacked ? ' attacked-hit' : ' shape-placed';
                  else if (cell?.attacked) cls += ' attacked-miss';
                  return (
                    <div key={`${r},${c}`} className={cls} style={{ paddingBottom: '100%', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        {cell?.attacked ? (hasShape ? '💥' : '○') : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cheat warning overlay modal */}
      {showCheatModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div className="card text-center fade-in" style={{ maxWidth: 400, width: '100%', borderColor: 'var(--red)', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)', marginBottom: 12 }}>Tab Switch Warning</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Tab switching is strictly prohibited for fair play! This is warning <strong style={{ color: 'var(--text-primary)' }}>{cheatWarnings} of 3</strong>.
              If you switch tabs again, you will be disqualified instantly.
            </p>
            <button 
              onClick={() => setShowCheatModal(false)} 
              className="btn btn-primary w-full glow-pulse"
              style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Leave match confirmation modal */}
      {showLeaveConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div className="card text-center fade-in" style={{ maxWidth: 400, width: '100%', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚪</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Leave Match?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Are you sure you want to leave the match? This will count as an <strong style={{ color: 'var(--red)' }}>automatic loss</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setShowLeaveConfirm(false)} 
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  emit('match.forfeit', { matchId, userId: user?.id, reason: 'left' });
                  navigate('/dashboard');
                }} 
                className="btn btn-primary flex-1"
                style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
              >
                Leave Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
