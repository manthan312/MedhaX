// ─── Shape Generation Logic ───────────────────────────────────────────────────
// All coordinates are relative to origin (0,0) for easy rotation/placement.

export interface Cell {
  r: number;
  c: number;
  x?: number;
  y?: number;
}

export interface Shape {
  id: string;
  name: string;
  cells: Cell[];
}

export interface PlacedShape extends Shape {
  originR: number;
  originC: number;
}

// ─── Shape Catalog ────────────────────────────────────────────────────────────

/** 11 canonical shape templates (relative to origin). */
export const SHAPE_CATALOG: Shape[] = [
  {
    id: 'dot',
    name: 'Single Block',
    cells: [{ r: 0, c: 0 }],
  },
  {
    id: 'line2',
    name: 'Line 2',
    cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }],
  },
  {
    id: 'line3',
    name: 'Line 3',
    cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
  },
  {
    id: 'line4',
    name: 'Line 4',
    cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }],
  },
  {
    id: 'square2x2',
    name: '2×2 Square',
    cells: [
      { r: 0, c: 0 }, { r: 0, c: 1 },
      { r: 1, c: 0 }, { r: 1, c: 1 },
    ],
  },
  {
    id: 'L3',
    name: 'L3',
    cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
  },
  {
    id: 'L4',
    name: 'L4',
    cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }],
  },
  {
    id: 'T4',
    name: 'T4',
    cells: [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
      { r: 1, c: 1 },
    ],
  },
  {
    id: 'Z3',
    name: 'Z3',
    cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
  },
  {
    id: 'S3',
    name: 'S3',
    cells: [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
  },
  {
    id: 'corner3',
    name: 'Corner 3',
    cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 0, c: 1 }],
  },
];

// ─── Transformations ──────────────────────────────────────────────────────────

/** Rotate a shape 90° clockwise around origin, then normalise to (0,0). */
export function rotateShape(shape: Shape): Shape {
  const rotated = shape.cells.map(({ r, c }) => ({ r: c, c: -r }));
  const minR = Math.min(...rotated.map(p => p.r));
  const minC = Math.min(...rotated.map(p => p.c));
  return {
    ...shape,
    cells: rotated.map(p => ({ r: p.r - minR, c: p.c - minC })),
  };
}

/** Mirror a shape horizontally, then normalise. */
export function mirrorShape(shape: Shape): Shape {
  const mirrored = shape.cells.map(({ r, c }) => ({ r, c: -c }));
  const minC = Math.min(...mirrored.map(p => p.c));
  return {
    ...shape,
    cells: mirrored.map(p => ({ r: p.r, c: p.c - minC })),
  };
}

// ─── Placement Helpers ────────────────────────────────────────────────────────

/** Returns true if `shape` can be placed at `(originR, originC)` on `grid`. */
export function isValidPlacement(
  shape: Shape,
  originR: number,
  originC: number,
  grid: boolean[][],
  gridSize: number,
): boolean {
  for (const { r, c } of shape.cells) {
    const gr = originR + r;
    const gc = originC + c;
    if (gr < 0 || gr >= gridSize || gc < 0 || gc >= gridSize) return false;
    if (grid[gr]?.[gc]) return false; // cell already occupied
  }
  return true;
}

/** Mark cells occupied by `shape` at given origin on `grid`. */
function occupyCells(shape: Shape, originR: number, originC: number, grid: boolean[][]): void {
  for (const { r, c } of shape.cells) {
    if (grid[originR + r]) {
      grid[originR + r]![originC + c] = true;
    }
  }
}

/** Shuffle an array in-place (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Auto-place all `shapes` randomly on a `gridSize`×`gridSize` grid.
 * Returns an array of PlacedShape with their origins, or throws if placement fails.
 */
export function placeShapes(shapes: Shape[], gridSize: number): PlacedShape[] {
  const grid: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false),
  );

  const placed: PlacedShape[] = [];

  for (const shape of shapes) {
    // Try random positions; give up after many attempts (shape may not fit)
    const positions: Array<[number, number]> = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        positions.push([r, c]);
      }
    }
    shuffle(positions);

    let success = false;
    for (const [oR, oC] of positions) {
      if (isValidPlacement(shape, oR, oC, grid, gridSize)) {
        occupyCells(shape, oR, oC, grid);
        placed.push({ ...shape, originR: oR, originC: oC });
        success = true;
        break;
      }
    }

    if (!success) {
      // Shape couldn't be placed; skip it (caller may retry)
      console.warn(`[shapes] Could not place shape "${shape.id}" on ${gridSize}×${gridSize} grid`);
    }
  }

  return placed;
}

export function generateRandomShape(size: number, id: string): Shape {
  const cells: Cell[] = [];
  cells.push({ r: 0, c: 0 });
  const cellSet = new Set<string>(['0,0']);

  const dr = [-1, 0, 1, 0];
  const dc = [0, 1, 0, -1];

  while (cells.length < size) {
    const candidates: Cell[] = [];
    for (const cell of cells) {
      for (let d = 0; d < 4; d++) {
        const nr = cell.r + dr[d]!;
        const nc = cell.c + dc[d]!;
        const key = `${nr},${nc}`;
        if (!cellSet.has(key)) {
          candidates.push({ r: nr, c: nc });
        }
      }
    }

    if (candidates.length === 0) break;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)]!;
    cells.push(chosen);
    cellSet.add(`${chosen.r},${chosen.c}`);
  }

  // Normalize
  const minR = Math.min(...cells.map(c => c.r));
  const minC = Math.min(...cells.map(c => c.c));
  const normalizedCells = cells.map(c => ({
    r: c.r - minR,
    c: c.c - minC,
    y: c.r - minR, // row corresponds to y
    x: c.c - minC  // column corresponds to x
  })).sort((a, b) => a.r - b.r || a.c - b.c);

  return {
    id,
    name: `Randomized Shape (${size})`,
    cells: normalizedCells
  };
}

export function generateRandomShapes(gridSize: number): Shape[] {
  const targetCells = gridSize === 5 ? 13 : gridSize === 6 ? 19 : 26;
  const shapes: Shape[] = [];
  let remaining = targetCells;
  let i = 0;

  while (remaining > 0) {
    if (remaining <= 6) {
      const id = `rand-${remaining}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      shapes.push(generateRandomShape(remaining, id));
      remaining = 0;
    } else {
      const size = Math.floor(Math.random() * 3) + 4; // size in [4, 5, 6]
      const id = `rand-${size}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      shapes.push(generateRandomShape(size, id));
      remaining -= size;
    }
    i++;
  }

  return shapes;
}

export function generateShapesForGrid(gridSize: number): Shape[] {
  return generateRandomShapes(gridSize);
}
