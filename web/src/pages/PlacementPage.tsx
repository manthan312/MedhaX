import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import type { PlacedShape } from '../store/gameStore';
import { initSocket, emit, getSyncedTime } from '../services/socket';

const SHAPE_COLORS = ['#6366f1', '#8B5CF6', '#EC4899', '#F59E0B', '#6366f1', '#3B82F6', '#EF4444'];

interface ShapeTemplate { id: string; name: string; cells: { r: number; c: number }[]; }

const SHAPES: ShapeTemplate[] = [
  { id: 'dot', name: 'Single Block', cells: [{r:0,c:0}] },
  { id: 'line2', name: 'Line 2', cells: [{r:0,c:0},{r:0,c:1}] },
  { id: 'line3', name: 'Line 3', cells: [{r:0,c:0},{r:0,c:1},{r:0,c:2}] },
  { id: 'square', name: 'Square', cells: [{r:0,c:0},{r:0,c:1},{r:1,c:0},{r:1,c:1}] },
  { id: 'L3', name: 'L-Shape', cells: [{r:0,c:0},{r:1,c:0},{r:1,c:1}] },
  { id: 'T4', name: 'T-Shape', cells: [{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:1,c:1}] },
  { id: 'Z3', name: 'Z-Shape', cells: [{r:0,c:0},{r:0,c:1},{r:1,c:1},{r:1,c:2}] },
];

function rotateShape(cells: { r: number; c: number }[]) {
  const rotated = cells.map(({ r, c }) => ({ r: c, c: -r }));
  const minR = Math.min(...rotated.map(p => p.r));
  const minC = Math.min(...rotated.map(p => p.c));
  return rotated.map(p => ({ r: p.r - minR, c: p.c - minC }));
}

export default function PlacementPage() {
  const [params] = useSearchParams();
  const matchId = params.get('matchId') || '';
  const { user, token } = useAuthStore();
  const {
    config,
    setMyShapes,
    setStatus,
    placementDeadline,
    setPlacementDeadline,
    setConfig,
    setPlayers,
    initGrids,
    players,
    playerHandles
  } = useGameStore();
  const navigate = useNavigate();

  const gridSize = config?.gridSize || 5;
  const [placed, setPlaced] = useState<PlacedShape[]>([]);
  const [selectedShapeIdx, setSelectedShapeIdx] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);
  const [locked, setLocked] = useState(false);
  const [opponentLocked, setOpponentLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [localDeadline, setLocalDeadline] = useState<number | null>(null);
  const [shapesTemplates, setShapesTemplates] = useState<ShapeTemplate[]>([]);

  // templates and targetCells are derived from server-sent shapesTemplates.
  // Before the server sends them, fall back to built-in SHAPES and a 52% default.
  const templates = shapesTemplates.length > 0 ? shapesTemplates : SHAPES;
  // targetCells = exact sum of cells across all templates assigned by the server
  const targetCells = shapesTemplates.length > 0
    ? shapesTemplates.reduce((a, s) => a + s.cells.length, 0)
    : Math.floor(gridSize * gridSize * 0.52);

  const currentCells = (() => {
    let cells = templates[selectedShapeIdx % templates.length]?.cells || [];
    for (let i = 0; i < (rotation % 4); i++) cells = rotateShape(cells);
    return cells;
  })();

  const occupiedSet = new Set(placed.flatMap(s => s.cells.map(c => `${s.originR + c.r},${s.originC + c.c}`)));
  const totalPlaced = placed.reduce((a, s) => a + s.cells.length, 0);

  const autoFillGrid = (currentPlaced: PlacedShape[]) => {
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    const newPlaced = [...currentPlaced];

    // Mark already-placed cells
    for (const shape of newPlaced) {
      for (const cell of shape.cells) {
        const r = shape.originR + cell.r;
        const c = shape.originC + cell.c;
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          grid[r][c] = true;
        }
      }
    }

    // Find which templates are not yet placed (each template should be placed exactly once)
    const templatesList = shapesTemplates.length > 0 ? shapesTemplates : SHAPES;
    const remaining = templatesList.filter(t => !newPlaced.some(p => p.id.startsWith(t.id)));

    // For each remaining template, find a random valid origin and place it
    for (const template of remaining) {
      // Try all 4 rotations of this template
      let placed = false;
      const rotations = [0, 1, 2, 3];
      // Shuffle rotations
      for (let i = rotations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rotations[i], rotations[j]] = [rotations[j]!, rotations[i]!];
      }

      for (const rot of rotations) {
        let cells = template.cells;
        for (let i = 0; i < rot; i++) cells = rotateShape(cells);

        // Build list of all valid origins, shuffled
        const origins: [number, number][] = [];
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            origins.push([r, c]);
          }
        }
        for (let i = origins.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [origins[i], origins[j]] = [origins[j]!, origins[i]!];
        }

        for (const [originR, originC] of origins) {
          const fits = cells.every(c => {
            const gr = originR + c.r;
            const gc = originC + c.c;
            return gr >= 0 && gr < gridSize && gc >= 0 && gc < gridSize && !grid[gr][gc];
          });

          if (fits) {
            const newShape: PlacedShape = {
              id: `${template.id}-autofill-${Date.now()}-${Math.random()}`,
              name: template.name,
              cells,
              originR,
              originC
            };
            newPlaced.push(newShape);
            for (const c of cells) {
              grid[originR + c.r][originC + c.c] = true;
            }
            placed = true;
            break;
          }
        }
        if (placed) break;
      }

      if (!placed) {
        console.warn(`[autoFillGrid] Could not place template "${template.id}" — grid may be too full`);
      }
    }

    return newPlaced;
  };

  // Timer & Reconnect Sync
  useEffect(() => {
    if (!token || !user) return;
    const socket = initSocket(token);

    const handlePlacementStart = (data: { deadline_ts: number; remainingSeconds?: number; gridSize: number; players: any[]; playerHandles?: Record<string, string>; config?: any; shapesTemplates?: ShapeTemplate[] }) => {
      const useGridSize = data.gridSize || gridSize;
      if (data.config) {
        setConfig(data.config);
      }
      if (data.shapesTemplates) {
        setShapesTemplates(data.shapesTemplates);
      }
      setPlacementDeadline(data.deadline_ts);
      setLocalDeadline(Date.now() + (data.remainingSeconds ?? 90) * 1000);
      if (data.playerHandles) {
        useGameStore.getState().setPlayerHandles(data.playerHandles);
      }
      if (data.players) {
        const pIds = data.players.map((p: any) => typeof p === 'string' ? p : p.id);
        const oppId = pIds.find((id: string) => id !== user.id) || '';
        setPlayers(pIds, oppId);
        initGrids(useGridSize);
      }
    };

    socket.on('placement.start', handlePlacementStart);
    socket.on('placement.locked', (data: { userId: string }) => {
      if (data.userId !== user?.id) setOpponentLocked(true);
    });
    socket.on('question.start', () => {
      setStatus('question');
      navigate(`/game?matchId=${matchId}`);
    });
    socket.on('placement_invalid', (data: { message: string }) => {
      alert(`Server rejected placement: ${data.message}`);
      setLocked(false);
    });
    socket.on('error', (data: { message: string }) => {
      alert(`Match error: ${data.message}`);
      setLocked(false);
    });

    // Join room / recover config if refreshed
    socket.emit('lobby.join', {
      matchId,
      userId: user.id,
      config: config || { gridSize }
    });

    return () => {
      socket.off('placement.start', handlePlacementStart);
      socket.off('placement.locked');
      socket.off('question.start');
      socket.off('placement_invalid');
      socket.off('error');
    };
  }, [matchId, user?.id, token, config, gridSize]);

  useEffect(() => {
    if (placementDeadline && !localDeadline) {
      const rem = Math.max(0, Math.ceil((placementDeadline - getSyncedTime()) / 1000));
      setLocalDeadline(Date.now() + rem * 1000);
    }
  }, [placementDeadline, localDeadline]);

  useEffect(() => {
    if (!localDeadline) return;
    const iv = setInterval(() => {
      const msLeft = Math.max(0, localDeadline - Date.now());
      const left = Math.ceil(msLeft / 1000);
      setTimeLeft(left);
      if (msLeft === 0 && !locked) {
        clearInterval(iv);
        const finalPlaced = autoFillGrid(placed);
        setPlaced(finalPlaced);
        setMyShapes(finalPlaced);
        setLocked(true);
        emit('placement.lock', { matchId, userId: user?.id, shapes: finalPlaced });
      }
    }, 50);
    return () => clearInterval(iv);
  }, [localDeadline, locked, placed, matchId, user?.id]);

  const previewCells = hoverCell
    ? currentCells.map(c => ({ r: hoverCell.r + c.r, c: hoverCell.c + c.c }))
    : [];

  const isPreviewValid = previewCells.every(c => c.r >= 0 && c.r < gridSize && c.c >= 0 && c.c < gridSize && !occupiedSet.has(`${c.r},${c.c}`));
  const opponentId = players.find(id => id !== user?.id);
  const opponentHandle = opponentId ? (playerHandles[opponentId] || 'Opponent') : 'Opponent';

  const handleCellClick = (r: number, c: number) => {
    if (locked) return;
    const cells = currentCells.map(cell => ({ r: r + cell.r, c: c + cell.c }));
    if (cells.some(cell => cell.r < 0 || cell.r >= gridSize || cell.c < 0 || cell.c >= gridSize || occupiedSet.has(`${cell.r},${cell.c}`))) return;

    const templatesList = shapesTemplates.length > 0 ? shapesTemplates : SHAPES;
    const shape = templatesList[selectedShapeIdx % templatesList.length]!;
    const newShape: PlacedShape = { id: `${shape.id}-${Date.now()}`, name: shape.name, cells: currentCells, originR: r, originC: c };
    
    const newPlaced = [...placed, newShape];
    setPlaced(newPlaced);

    // Auto-select next unplaced shape index
    const nextIdx = templatesList.findIndex((temp) => {
      const tempPlaced = newPlaced.some(p => p.id.startsWith(temp.id));
      return !tempPlaced;
    });
    if (nextIdx !== -1) {
      setSelectedShapeIdx(nextIdx);
      setRotation(0);
    }
  };

  const handleRemove = (shapeId: string) => {
    if (locked) return;
    setPlaced(prev => prev.filter(s => s.id !== shapeId));
  };

  const handleLock = useCallback(() => {
    if (locked) return;
    let finalPlaced = [...placed];
    if (totalPlaced < targetCells) {
      finalPlaced = autoFillGrid(placed);
      setPlaced(finalPlaced);
      setMyShapes(finalPlaced);
    } else {
      setMyShapes(placed);
    }
    setLocked(true);
    emit('placement.lock', { matchId, userId: user?.id, shapes: finalPlaced });
  }, [locked, placed, matchId, user?.id, totalPlaced, targetCells]);

  const pct = Math.min(1, totalPlaced / targetCells);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="nav-logo">MedhaX</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Placement Phase</div>
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: timeLeft <= 20 ? 'var(--red)' : 'var(--text-primary)', transition: 'color 0.3s' }}>
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time remaining</div>
          <div className="progress-bar" style={{ width: 120, marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${localDeadline ? (Math.max(0, localDeadline - Date.now()) / 90000) * 100 : 100}%`, transition: 'none', background: timeLeft <= 20 ? 'linear-gradient(90deg, var(--red), #dc2626)' : undefined }} />
          </div>
        </div>

        {/* Opponent status */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{opponentHandle}</div>
          {opponentLocked ? (
            <div className="badge badge-green">✓ Locked In!</div>
          ) : (
            <div className="badge badge-indigo">Placing shapes…</div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px', display: 'flex', gap: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {/* Grid */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Your Grid ({gridSize}×{gridSize})</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 5, maxWidth: 400 }}>
            {Array.from({ length: gridSize }, (_, r) =>
              Array.from({ length: gridSize }, (_, c) => {
                const key = `${r},${c}`;
                const isOccupied = occupiedSet.has(key);
                const isPreview = previewCells.some(p => p.r === r && p.c === c);
                const placedShape = placed.find(s => s.cells.some(cell => s.originR + cell.r === r && s.originC + cell.c === c));

                const templatesList = shapesTemplates.length > 0 ? shapesTemplates : SHAPES;
                const shapeColor = placedShape
                  ? SHAPE_COLORS[templatesList.findIndex(temp => placedShape.id.startsWith(temp.id)) % SHAPE_COLORS.length]
                  : undefined;
                const activeColor = templatesList[selectedShapeIdx % templatesList.length]
                  ? SHAPE_COLORS[selectedShapeIdx % templatesList.length]
                  : '#6366f1';

                return (
                  <div key={key}
                    className={`grid-cell ${isPreview ? (isPreviewValid ? 'preview-valid' : 'preview-invalid') : ''}`}
                    style={{
                      width: '100%',
                      paddingBottom: '100%',
                      position: 'relative',
                      cursor: locked ? 'default' : 'pointer',
                      background: isOccupied ? `${shapeColor}66` : undefined,
                      border: isOccupied ? `2px solid ${shapeColor}` : undefined,
                      boxShadow: isOccupied ? `0 0 10px ${shapeColor}33` : undefined,
                      // Apply preview colors dynamically matching active color
                      ...(isPreview && isPreviewValid ? {
                        background: `${activeColor}33`,
                        border: `2px dashed ${activeColor}`,
                      } : {})
                    }}
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => setHoverCell({ r, c })}
                    onMouseLeave={() => setHoverCell(null)}
                    title={isOccupied ? 'Click to remove shape' : ''}
                  >
                    {isOccupied && placedShape && (
                      <button onClick={(e) => { e.stopPropagation(); handleRemove(placedShape.id); }}
                        style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Coverage progress */}
          <div style={{ marginTop: 20, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Coverage</span>
              <span>{totalPlaced} / {targetCells} cells required</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Shapes Palette</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {templates.map((s, i) => {
                const isSelected = selectedShapeIdx === i;
                const isPlaced = placed.some(p => p.id.startsWith(s.id));
                const cells = s.cells;
                const maxR = Math.max(...cells.map(c => c.r)) + 1;
                const maxC = Math.max(...cells.map(c => c.c)) + 1;
                const color = SHAPE_COLORS[i % SHAPE_COLORS.length];

                return (
                  <button
                    key={s.id}
                    disabled={isPlaced || locked}
                    onClick={() => { setSelectedShapeIdx(i); setRotation(0); }}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      border: `2px solid ${isSelected ? color : isPlaced ? 'transparent' : 'var(--border)'}`,
                      background: isSelected ? `${color}1a` : 'var(--bg-glass)',
                      cursor: isPlaced || locked ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      opacity: isPlaced ? 0.35 : 1,
                      transition: 'all 0.2s',
                      outline: 'none',
                      position: 'relative',
                      boxShadow: isSelected ? `0 0 15px ${color}33` : undefined,
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxC}, 10px)`, gap: 1.5 }}>
                      {Array.from({ length: maxR }).map((_, r) =>
                        Array.from({ length: maxC }).map((_, c) => {
                          const hasCell = cells.some(cell => cell.r === r && cell.c === c);
                          return (
                            <div
                              key={`${r}-${c}`}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2.5,
                                background: hasCell ? color : 'transparent',
                              }}
                            />
                          );
                        })
                      )}
                    </div>
                    {isPlaced && (
                      <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700, marginTop: 4, position: 'absolute', bottom: 4 }}>
                        ✓ Placed
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-ghost w-full" onClick={() => setRotation(r => r + 1)}>
              ↻ Rotate 90°
            </button>
            <button className="btn btn-ghost w-full" onClick={() => setPlaced([])}>
              🗑 Clear All
            </button>
          </div>

          {!locked ? (
            <button onClick={handleLock} className="btn btn-primary w-full btn-lg" style={{ padding: '20px' }}>
              ✓ Lock In!
            </button>
          ) : (
            <div className="badge badge-green" style={{ padding: '16px', textAlign: 'center', justifyContent: 'center', fontSize: 16, borderRadius: 12 }}>
              ✓ Locked In!
            </div>
          )}

          <div className="card" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>💡 Tips</div>
            <div>• Click a cell to place the selected shape</div>
            <div>• Click a placed shape (✕) to remove it</div>
            <div>• Spread shapes out to make them harder to find!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
