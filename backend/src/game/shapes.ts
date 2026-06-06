// ─── Shape Generation Logic ───────────────────────────────────────────────────
// All coordinates are relative to origin (0,0) for easy rotation/placement.

export interface Cell {
  r: number;
  c: number;
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

/**
 * Generate a set of shapes whose total cell count is exactly targetCells.
 * Randomly selects and optionally rotates/mirrors shapes from the catalog.
 */
export function generateShapesForGrid(questionCount: number): Shape[] {
  const targetCells = questionCount === 10 ? 6 : questionCount === 20 ? 12 : 18;
  const catalog = [...SHAPE_CATALOG];
  const selected: Shape[] = [];
  let totalCells = 0;

  let attempts = 0;
  while (totalCells < targetCells && attempts < 1000) {
    attempts++;
    const base = catalog[Math.floor(Math.random() * catalog.length)]!;
    
    if (totalCells + base.cells.length > targetCells) {
      continue;
    }

    let shape: Shape = { ...base, id: `${base.id}-${selected.length}-${Math.random()}` };
    const transform = Math.floor(Math.random() * 4);
    if (transform === 1) shape = rotateShape(shape);
    else if (transform === 2) shape = mirrorShape(shape);
    else if (transform === 3) shape = rotateShape(mirrorShape(shape));

    selected.push(shape);
    totalCells += shape.cells.length;
  }

  return selected;
}
