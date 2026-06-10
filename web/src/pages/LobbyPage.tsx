import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { initSocket, emit } from '../services/socket';
import LanguageLogo from '../components/LanguageLogo';

const LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'C', 'DBMS', 'DSA', 'Operating System'];
const TOPICS: Record<string, string[]> = {
  Python: [
    'Python-basics', 'Python-data-types', 'Python-lists', 'Python-tuples', 'Python-dictionaries',
    'Python-sets', 'Python-functions', 'Python-OOP-concepts', 'Python-modules-packages', 'Python-exceptions',
    'Python-file-handling', 'Python-iterators', 'Python-generators', 'Python-decorators', 'Python-multithreading',
    'Python-multiprocessing', 'Python-GIL', 'Python-list-comprehension', 'Python-lambda-functions', 'Python-strings'
  ],
  JavaScript: [
    'JS-variables', 'JS-data-types', 'JS-functions', 'JS-arrays', 'JS-objects',
    'JS-DOM', 'JS-events', 'JS-ES6-features', 'JS-closures', 'JS-hoisting',
    'JS-scope', 'JS-callbacks', 'JS-promises', 'JS-async-await', 'JS-event-loop',
    'JS-fetch-api', 'JS-storage', 'JS-strings'
  ],
  Java: [
    'Java-basics', 'Java-OOP-concepts', 'Java-classes-objects', 'Java-inheritance', 'Java-polymorphism',
    'Java-abstraction', 'Java-encapsulation', 'Java-strings', 'Java-arrays', 'Java-collections',
    'Java-exceptions', 'Java-interfaces', 'Java-packages', 'Java-multithreading', 'Java-synchronization',
    'Java-streams-api', 'Java-lambda-expressions', 'Java-JVM', 'Java-garbage-collection'
  ],
  'C++': [
    'CPP-OOP-fundamentals', 'CPP-classes-objects', 'CPP-constructors-destructors', 'CPP-inheritance', 'CPP-polymorphism',
    'CPP-abstraction', 'CPP-encapsulation', 'CPP-templates', 'CPP-exceptions', 'CPP-STL',
    'CPP-smart-pointers', 'CPP-memory-management'
  ],
  C: [
    'C-basics', 'C-data-types', 'C-operators', 'C-control-statements', 'C-functions',
    'C-arrays', 'C-strings', 'C-pointers', 'C-structures', 'C-unions',
    'C-file-handling', 'C-dynamic-memory', 'C-bit-manipulation'
  ],
  DBMS: [
    'DBMS-basics', 'DBMS-ER-model', 'DBMS-keys', 'DBMS-normalization', 'DBMS-SQL-basics',
    'DBMS-joins', 'DBMS-views', 'DBMS-indexes', 'DBMS-transactions', 'DBMS-ACID',
    'DBMS-concurrency-control', 'DBMS-locks', 'DBMS-deadlocks', 'DBMS-query-optimization'
  ],
  DSA: [
    'DSA-DS-arrays', 'DSA-DS-strings', 'DSA-DS-linked-lists', 'DSA-DS-stacks', 'DSA-DS-queues', 'DSA-DS-deques',
    'DSA-DS-hashing', 'DSA-DS-heaps', 'DSA-DS-trees', 'DSA-DS-BST', 'DSA-DS-AVL-tree', 'DSA-DS-trie', 'DSA-DS-graphs', 'DSA-DS-DSU',
    'DSA-Algo-searching', 'DSA-Algo-sorting', 'DSA-Algo-recursion', 'DSA-Algo-backtracking', 'DSA-Algo-greedy', 'DSA-Algo-divide-conquer',
    'DSA-Algo-DP', 'DSA-Algo-BFS-DFS', 'DSA-Algo-shortest-path', 'DSA-Algo-MST',
    'DSA-Pattern-two-pointers', 'DSA-Pattern-sliding-window', 'DSA-Pattern-prefix-sum', 'DSA-Pattern-binary-search', 'DSA-Pattern-slow-fast-pointers',
    'DSA-Pattern-monotonic-stack', 'DSA-Pattern-topological-sort', 'DSA-Pattern-bitmasking', 'DSA-Pattern-KMP'
  ],
  'Operating System': [
    'OS-intro', 'OS-types', 'OS-processes-threads', 'OS-cpu-scheduling', 'OS-process-sync',
    'OS-mutex-semaphores', 'OS-deadlocks', 'OS-memory-management', 'OS-file-systems', 'OS-disk-scheduling',
    'OS-context-switching', 'OS-race-conditions'
  ],
};

export default function LobbyPage() {
  const [params] = useSearchParams();
  const matchId = params.get('matchId') || `match_${Date.now()}`;
  const friendId = params.get('friendId') || null;

  const { user, token } = useAuthStore();
  const { setMatchId, setStatus, setConfig, setPlayers, setReadyPlayers, initGrids, setPlacementDeadline } = useGameStore();
  const navigate = useNavigate();

  const initLang = params.get('lang') || 'Python';
  const [language, setLanguage] = useState(initLang);
  const [topics, setTopics] = useState(TOPICS[initLang] ? [TOPICS[initLang][0]] : ['Python-basics']);
  const [players, setPlayersLocal] = useState<{ id: string; handle: string }[]>([]);
  const [readySet, setReadySet] = useState<string[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myReady, setMyReady] = useState(false);

  const [questionCount, setQuestionCount] = useState<10 | 20 | 30>(10);
  const gameMode = 'grid';

  const gridSize: number = questionCount === 10 ? 5 : questionCount === 20 ? 6 : 7;

  const updateConfig = (
    newLang: string,
    newTopics: string[],
    newQCount: 10 | 20 | 30
  ) => {
    setLanguage(newLang);
    setTopics(newTopics);
    setQuestionCount(newQCount);

    const gs = newQCount === 10 ? 5 : newQCount === 20 ? 6 : 7;

    emit('lobby.update_config', {
      matchId,
      config: {
        language: newLang,
        topics: newTopics,
        gridSize: gs,
        questionCount: newQCount,
        gameMode: 'grid',
      },
    });
  };

  // Refs to prevent double-emit in strict mode / double connections
  const lastJoinedMatchId = useRef<string | null>(null);
  const lastChallengeSentMatchId = useRef<string | null>(null);

  useEffect(() => {
    setMyReady(false);
    setPlayersLocal([]);
    setReadySet([]);

    if (!token || !user) return;
    const socket = initSocket(token);

    const doJoin = () => {
      if (lastJoinedMatchId.current === matchId) return;
      lastJoinedMatchId.current = matchId;

      socket.emit('lobby.join', {
        matchId,
        userId: user.id,
        config: { language, topics, gridSize, questionCount, gameMode },
      });

      // If this is a challenge invite link, send the challenge notification
      if (friendId && lastChallengeSentMatchId.current !== matchId) {
        lastChallengeSentMatchId.current = matchId;
        socket.emit('challenge.send', { matchId, targetUserId: friendId });
      }
    };

    if (socket.connected) {
      setConnected(true);
      doJoin();
    }

    socket.on('connect', () => {
      setConnected(true);
      doJoin();
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('lobby.update', (data: { creatorId?: string; players: { id: string; handle: string }[]; readyPlayers: string[]; config?: any }) => {
      if (data.creatorId) setCreatorId(data.creatorId);
      setPlayersLocal(data.players || []);
      setReadySet(data.readyPlayers || []);
      setReadyPlayers(data.readyPlayers || []);
      if (data.config) {
        if (data.config.language) setLanguage(data.config.language);
        if (data.config.topics) setTopics(data.config.topics);
        if (data.config.questionCount) setQuestionCount(data.config.questionCount);
      }
    });

    socket.on('placement.start', (data: {
      deadline_ts: number;
      remainingSeconds?: number;
      gridSize: number;
      players: ({ id: string; handle: string } | string)[];
      playerHandles?: Record<string, string>;
      config?: any;
    }) => {
      const gs = (data.gridSize || gridSize) as 5 | 6 | 7;
      const gameConfig = data.config || { language, topics, gridSize: gs, questionCount, gameMode: 'grid' };
      setConfig(gameConfig);
      setPlacementDeadline(data.deadline_ts);
      setMatchId(matchId);
      setStatus('placement');
      if (data.playerHandles) {
        useGameStore.getState().setPlayerHandles(data.playerHandles);
      }

      const pIds = (data.players || []).map((p: any) => typeof p === 'string' ? p : p.id);
      const oppId = pIds.find((id: string) => id !== user.id) || '';
      setPlayers(pIds, oppId);
      initGrids(gs);
      navigate(`/placement?matchId=${matchId}`);
    });

    // Removed tictactoe start handler

    socket.on('challenge.declined', (data: { declinerHandle: string }) => {
      navigate('/dashboard', {
        state: {
          toastMsg: `Challenge declined: ${data.declinerHandle} declined your invitation.`,
          toastType: 'error'
        }
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('lobby.update');
      socket.off('placement.start');
      // Removed tictactoe off handler
      socket.off('challenge.declined');
    };
  }, [token, user?.id, matchId]);

  const toggleTopic = (t: string) => {
    const newTopics = topics.includes(t)
      ? (topics.length > 1 ? topics.filter(x => x !== t) : topics)
      : [...topics, t];
    updateConfig(language, newTopics, questionCount);
  };

  const handleReady = () => {
    if (!user || myReady) return;
    setMyReady(true);
    emit('lobby.ready', { matchId, userId: user.id });
  };

  const copyLink = () => {
    const link = `${window.location.origin}/#/lobby?matchId=${matchId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const opponent = players.find(p => p.id !== user?.id);
  const opponentHandle = opponent?.handle;
  const opponentReady = opponent ? readySet.includes(opponent.id) : false;

  const isCreator = !creatorId || creatorId === user?.id;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 840 }}>
        <div className="fade-in" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>Game Lobby</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Configure your match and wait for your opponent
          </p>
        </div>

        {/* Invite link */}
        <div className="card fade-in" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Invite Link — share this with your opponent
            </div>
            <div className="font-mono" style={{ fontSize: 13, color: 'var(--indigo-light)', wordBreak: 'break-all' }}>
              {`${window.location.origin}/#/lobby?matchId=${matchId}`}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyLink} style={{ flexShrink: 0 }}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Config panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Game Mode selection removed */}

            <div className="card fade-in-up stagger-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700 }}>🌐 Language</div>
                {!isCreator && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}>View Only</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
                {LANGUAGES.map(l => {
                  const active = language === l;
                  return (
                    <button
                      key={l}
                      className={`lang-tag ${active ? 'active' : ''}`}
                      onClick={() => isCreator && updateConfig(l, [TOPICS[l]![0]!], questionCount)}
                      disabled={!isCreator}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: '99px',
                        height: 'auto',
                        width: '100%',
                        justifyContent: 'flex-start',
                        opacity: !isCreator && !active ? 0.5 : 1,
                        cursor: isCreator ? 'pointer' : 'default'
                      }}
                    >
                      <LanguageLogo language={l} size={20} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{l}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card fade-in-up stagger-2">
              <div style={{ fontWeight: 700, marginBottom: 16 }}>📚 Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(TOPICS[language] || []).map(t => (
                  <button 
                    key={t} 
                    className={`lang-tag ${topics.includes(t) ? 'active' : ''}`}
                    onClick={() => isCreator && toggleTopic(t)}
                    disabled={!isCreator}
                    style={{ opacity: !isCreator && !topics.includes(t) ? 0.5 : 1, cursor: isCreator ? 'pointer' : 'default' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="card fade-in-up stagger-3">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>❓ Match Scale (Questions & Grid Size)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[10, 20, 30].map((qCount) => {
                  const size = qCount === 10 ? 5 : qCount === 20 ? 6 : 7;
                  const active = questionCount === qCount;
                  return (
                    <button
                      key={qCount}
                      onClick={() => isCreator && updateConfig(language, topics, qCount as 10 | 20 | 30)}
                      className={`lang-tag ${active ? 'active' : ''}`}
                      disabled={!isCreator}
                      style={{
                        padding: '12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        height: 'auto',
                        textAlign: 'center',
                        justifyContent: 'center',
                        opacity: !isCreator && !active ? 0.5 : 1,
                        cursor: isCreator ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{qCount} Qs</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{size}×{size} Grid</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Players panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card fade-in-up">
              <div style={{ fontWeight: 700, marginBottom: 16 }}>👥 Players</div>

              {/* Me */}
              <PlayerSlot handle={user?.handle || 'You'} ready={myReady} isMe />

              {/* Opponent */}
              {opponent ? (
                <PlayerSlot handle={opponentHandle || 'Opponent'} ready={opponentReady} />
              ) : (
                <div style={{ padding: '20px 0', border: '1px dashed var(--border)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                  Waiting for opponent to join…
                  <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                    Share the invite link above
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Connection {connected ? '🟢 Live' : '🔴 Connecting…'}
                </div>

                {!myReady ? (
                  <button
                    className="ready-btn not-ready w-full"
                    onClick={handleReady}
                    disabled={!connected}
                  >
                    ✓ Click when Ready
                  </button>
                ) : (
                  <button className="ready-btn ready w-full" disabled>
                    ✓ READY — waiting for opponent…
                  </button>
                )}
              </div>
            </div>

            {/* Match info */}
            <div className="card fade-in-up stagger-1" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>📋 Match Info</div>
              <div>🎮 Mode: <strong style={{ color: 'var(--indigo-light)' }}>Grid Game</strong></div>
              <div>🌐 Language: <strong style={{ color: 'var(--indigo-light)' }}>{language}</strong></div>
              <div>📚 Topics: <strong style={{ color: 'var(--indigo-light)' }}>{topics.join(', ')}</strong></div>
              <div>⊞ Grid: <strong style={{ color: 'var(--indigo-light)' }}>{gridSize}×{gridSize}</strong></div>
              <div>❓ Questions: <strong style={{ color: 'var(--indigo-light)' }}>{questionCount}</strong></div>
              <div>⏱ Timer: <strong style={{ color: 'var(--indigo-light)' }}>45s per question</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerSlot({ handle, ready, isMe }: { handle: string; ready: boolean; isMe?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="avatar avatar-md">{handle[0]?.toUpperCase()}</div>
        <div>
          <div style={{ fontWeight: 700 }}>
            {handle}{' '}
            {isMe && <span className="badge badge-indigo" style={{ marginLeft: 4 }}>You</span>}
          </div>
        </div>
      </div>
      {ready ? (
        <span className="badge badge-green">✓ READY</span>
      ) : (
        <span className="badge" style={{ background: 'rgba(71,85,105,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Waiting…
        </span>
      )}
    </div>
  );
}
