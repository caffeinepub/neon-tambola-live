export interface Ticket {
  id: number;
  playerName: string;
  setIndex: number;
  grid: (number | null)[][]; // 3 rows x 9 cols
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function countTicketNumbers(grid: (number | null)[][]): number {
  return grid.flat().filter((n) => n !== null).length;
}

export function isValidTicket(grid: (number | null)[][]): boolean {
  if (!grid || grid.length !== 3) return false;
  for (const row of grid) {
    if (!row || row.length !== 9) return false;
    if (row.filter((n) => n !== null).length !== 5) return false;
  }
  if (countTicketNumbers(grid) !== 15) return false;
  for (let col = 0; col < 9; col++) {
    const hasNum = grid.some((row) => row[col] !== null);
    if (!hasNum) return false;
  }
  return true;
}

const COL_RANGES: [number, number][] = [
  [1, 9],
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 90],
];

// ─── Full-Sheet Strip Generation ─────────────────────────────────────────────
// Each strip = 6 tickets that together cover ALL numbers 1–90 exactly once.
// Each ticket is 5×3 (5 numbers per row, 3 rows, 15 numbers total).
// Column column c gets all numbers in COL_RANGES[c] distributed across 6 tickets.
//
// Gale-Ryser derived "extras" matrix (which ticket slots get 2 numbers per col
// instead of 1). Row sums = 6, col sums = [3,4,4,4,4,4,4,4,5].
// This is shuffled per strip for variety.
const BASE_EXTRAS: number[][] = [
  [0, 1, 1, 1, 1, 1, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 0, 0, 0],
  [1, 1, 1, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1],
];

/**
 * Returns true if the given column-index set for a row has 3+ consecutive blank cells.
 * colsWithNums is a Set of column indices (0–8) that contain numbers.
 */
function rowHasConsecutiveBlanks(colsWithNums: Set<number>): boolean {
  let consecutiveBlanks = 0;
  for (let c = 0; c < 9; c++) {
    if (colsWithNums.has(c)) {
      consecutiveBlanks = 0;
    } else {
      consecutiveBlanks++;
      if (consecutiveBlanks >= 3) return true;
    }
  }
  return false;
}

/**
 * Assign 15 column-slots to 3 rows (5 per row) with no duplicate columns
 * in the same row, and no 3+ consecutive blanks in any row.
 * Returns colRows mapping or null on failure.
 */
function assignRowsToSlots(slots: number[]): number[][] | null {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const s = shuffle([...slots]);
    const rows = [s.slice(0, 5), s.slice(5, 10), s.slice(10, 15)];
    if (!rows.every((r) => new Set(r).size === 5)) continue;

    // Check no 3+ consecutive blanks in any row
    const valid = rows.every((rowCols) => {
      const colSet = new Set(rowCols);
      return !rowHasConsecutiveBlanks(colSet);
    });
    if (!valid) continue;

    const colRows: number[][] = Array.from({ length: 9 }, () => []);
    for (let ri = 0; ri < 3; ri++) {
      for (const c of rows[ri]) colRows[c].push(ri);
    }
    return colRows;
  }
  return null;
}

/**
 * Deterministic row assignment fallback using a greedy approach.
 * Tries to avoid 3+ consecutive blanks when possible.
 */
function assignRowsFallback(colCounts: number[]): number[][] {
  const colRows: number[][] = Array.from({ length: 9 }, () => []);
  const rowBudget = [5, 5, 5];

  // Build list of (col, slotIndex) in order
  const allSlots: { col: number }[] = [];
  for (let c = 0; c < 9; c++) {
    for (let k = 0; k < colCounts[c]; k++) allSlots.push({ col: c });
  }

  // Track which row each col already occupies
  const colUsedRows: Set<number>[] = Array.from({ length: 9 }, () => new Set());
  // Track which cols are assigned to each row so far
  const rowAssignedCols: Set<number>[] = Array.from(
    { length: 3 },
    () => new Set(),
  );

  for (const { col } of allSlots) {
    // Find a row with budget, not yet used for this col, and preferably no 3+ consecutive blanks
    let bestRow = -1;
    for (let ri = 0; ri < 3; ri++) {
      if (rowBudget[ri] <= 0 || colUsedRows[col].has(ri)) continue;
      // Check if adding this col would cause 3+ consecutive blanks
      const testCols = new Set(rowAssignedCols[ri]);
      testCols.add(col);
      if (!rowHasConsecutiveBlanks(testCols)) {
        bestRow = ri;
        break;
      }
      if (bestRow === -1) bestRow = ri; // fallback: use even if it causes blanks
    }
    if (bestRow !== -1) {
      colRows[col].push(bestRow);
      colUsedRows[col].add(bestRow);
      rowBudget[bestRow]--;
      rowAssignedCols[bestRow].add(col);
    }
  }
  return colRows;
}

/**
 * Generate one full-sheet strip: 6 tickets covering all 1–90 exactly once.
 */
function generateFullSheetStrip(stripIndex: number): Ticket[] {
  // Shuffle ticket rows of the extras matrix for variety
  const ticketPerm = shuffle([0, 1, 2, 3, 4, 5]);
  const extraMatrix = ticketPerm.map((t) => BASE_EXTRAS[t]);

  // Assign numbers from each column to tickets
  const ticketColNums: number[][][] = Array.from({ length: 6 }, () =>
    Array.from({ length: 9 }, () => [] as number[]),
  );

  for (let c = 0; c < 9; c++) {
    const [lo, hi] = COL_RANGES[c];
    const nums = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));
    let idx = 0;
    for (let t = 0; t < 6; t++) {
      const count = 1 + extraMatrix[t][c];
      ticketColNums[t][c] = nums.slice(idx, idx + count).sort((a, b) => a - b);
      idx += count;
    }
  }

  const tickets: Ticket[] = [];

  for (let t = 0; t < 6; t++) {
    const colCounts = ticketColNums[t].map((nums) => nums.length);

    // Build flat slot list
    const slots: number[] = [];
    for (let c = 0; c < 9; c++) {
      for (let k = 0; k < colCounts[c]; k++) slots.push(c);
    }

    // Assign slots to rows
    let colRows = assignRowsToSlots(slots);
    if (!colRows) colRows = assignRowsFallback(colCounts);

    // Build grid
    const grid: (number | null)[][] = Array.from({ length: 3 }, () =>
      Array(9).fill(null),
    );
    for (let c = 0; c < 9; c++) {
      const sortedRows = [...colRows[c]].sort((a, b) => a - b);
      for (let i = 0; i < ticketColNums[t][c].length; i++) {
        grid[sortedRows[i]][c] = ticketColNums[t][c][i];
      }
    }

    tickets.push({
      id: stripIndex * 6 + t + 1,
      playerName: "",
      setIndex: stripIndex,
      grid,
    });
  }

  return tickets;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate `count` tickets in groups of 6 (full sheets).
 * Each group of 6 covers all numbers 1–90 exactly once.
 */
export function generateTickets(count: number): Ticket[] {
  const numStrips = Math.ceil(count / 6);
  const all: Ticket[] = [];
  for (let s = 0; s < numStrips; s++) {
    all.push(...generateFullSheetStrip(s));
  }
  // Re-assign sequential IDs after slicing
  return all.slice(0, count).map((t, i) => ({ ...t, id: i + 1 }));
}

/**
 * Generate a single standalone ticket (not part of a full sheet).
 * Used for one-off additions or repairs.
 */
export function generateSingleTicket(id: number, setIndex = 0): Ticket {
  // Generate a mini-strip and return the first ticket with the correct id
  const strip = generateFullSheetStrip(setIndex);
  const t = strip[0];
  return { ...t, id, setIndex };
}

export function getTicketNumbers(ticket: Ticket): number[] {
  return ticket.grid.flat().filter((n) => n !== null) as number[];
}

export function getRowNumbers(ticket: Ticket, row: number): number[] {
  return ticket.grid[row].filter((n) => n !== null) as number[];
}

/**
 * Repair a ticket from storage. If it's invalid, regenerate the grid
 * while preserving playerName and id.
 */
export function repairTicket(ticket: Ticket): Ticket {
  if (isValidTicket(ticket.grid)) return ticket;

  const grid: (number | null)[][] = Array.from({ length: 3 }, (_, ri) => {
    const row = Array.isArray(ticket.grid?.[ri]) ? [...ticket.grid[ri]] : [];
    while (row.length < 9) row.push(null);
    return row.slice(0, 9);
  });

  // Trim rows with > 5 numbers
  for (let ri = 0; ri < 3; ri++) {
    const filled = grid[ri].reduce<number[]>((acc, v, ci) => {
      if (v !== null) acc.push(ci);
      return acc;
    }, []);
    if (filled.length > 5) {
      for (const ci of filled.slice(5)) grid[ri][ci] = null;
    }
  }

  // Trim total > 15
  let total = countTicketNumbers(grid);
  trimLoop: for (let ri = 0; ri < 3; ri++) {
    for (let ci = 8; ci >= 0; ci--) {
      if (total <= 15) break trimLoop;
      if (grid[ri][ci] !== null) {
        grid[ri][ci] = null;
        total--;
      }
    }
  }

  if (isValidTicket(grid)) return { ...ticket, grid };

  // Full regeneration, preserve player info
  const fresh = generateSingleTicket(ticket.id, ticket.setIndex ?? 0);
  return { ...fresh, playerName: ticket.playerName };
}
