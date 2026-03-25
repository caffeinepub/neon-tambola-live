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
  // Every column must have at least 1 number
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

function tryGenerateGrid(): (number | null)[][] | null {
  // Every column gets at least 1. Pick 6 columns to get 2 numbers (3x1 + 6x2 = 15)
  const colCounts = Array(9).fill(1);
  const sixCols = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 6);
  for (const c of sixCols) colCounts[c] = 2;

  const slots: number[] = [];
  for (let c = 0; c < 9; c++)
    for (let k = 0; k < colCounts[c]; k++) slots.push(c);

  let assignment: number[] | null = null;
  for (let att = 0; att < 500 && !assignment; att++) {
    const s = shuffle([...slots]);
    const rows = [s.slice(0, 5), s.slice(5, 10), s.slice(10, 15)];
    if (rows.every((r) => new Set(r).size === 5)) assignment = s;
  }
  if (!assignment) return null;

  const colRows: number[][] = Array.from({ length: 9 }, () => []);
  for (let row = 0; row < 3; row++) {
    const rowSlice = assignment.slice(row * 5, row * 5 + 5);
    for (const col of rowSlice) colRows[col].push(row);
  }

  const grid: (number | null)[][] = Array.from({ length: 3 }, () =>
    Array(9).fill(null),
  );
  for (let col = 0; col < 9; col++) {
    const [lo, hi] = COL_RANGES[col];
    const range: number[] = [];
    for (let n = lo; n <= hi; n++) range.push(n);
    const picked = shuffle(range)
      .slice(0, colRows[col].length)
      .sort((a, b) => a - b);
    const sortedRows = [...colRows[col]].sort((a, b) => a - b);
    for (let i = 0; i < picked.length; i++)
      grid[sortedRows[i]][col] = picked[i];
  }

  // Verify all columns have at least 1 number before accepting
  for (let col = 0; col < 9; col++) {
    if (!grid.some((row) => row[col] !== null)) return null;
  }

  return grid;
}

function fallbackGrid(): (number | null)[][] {
  // Safe fixed pattern ensuring every column has at least 1 number:
  // col0->rows[0,1], col1->rows[1,2], col2->rows[0,2], col3->rows[1,2],
  // col4->rows[0,2], col5->rows[1], col6->rows[0,2], col7->rows[1], col8->rows[0]
  const safePattern = [
    [0, 2, 4, 6, 8], // row 0: cols 0,2,4,6,8
    [0, 1, 3, 5, 7], // row 1: cols 0,1,3,5,7
    [1, 2, 3, 4, 6], // row 2: cols 1,2,3,4,6
  ];
  const colRows: number[][] = Array.from({ length: 9 }, () => []);
  for (let ri = 0; ri < 3; ri++)
    for (const col of safePattern[ri]) colRows[col].push(ri);

  const grid: (number | null)[][] = Array.from({ length: 3 }, () =>
    Array(9).fill(null),
  );
  for (let col = 0; col < 9; col++) {
    const [lo, hi] = COL_RANGES[col];
    const range: number[] = [];
    for (let n = lo; n <= hi; n++) range.push(n);
    const picked = shuffle(range)
      .slice(0, colRows[col].length)
      .sort((a, b) => a - b);
    const sortedRows = [...colRows[col]].sort((a, b) => a - b);
    for (let i = 0; i < picked.length; i++)
      grid[sortedRows[i]][col] = picked[i];
  }
  return grid;
}

export function generateSingleTicket(id: number, setIndex = 0): Ticket {
  for (let i = 0; i < 200; i++) {
    const g = tryGenerateGrid();
    if (g && isValidTicket(g))
      return { id, playerName: `Player ${id}`, setIndex, grid: g };
  }
  const g = fallbackGrid();
  return { id, playerName: `Player ${id}`, setIndex, grid: g };
}

export function generateTickets(count: number): Ticket[] {
  return Array.from({ length: count }, (_, i) =>
    generateSingleTicket(i + 1, Math.floor(i / 6)),
  );
}

export function getTicketNumbers(ticket: Ticket): number[] {
  return ticket.grid.flat().filter((n) => n !== null) as number[];
}

export function getRowNumbers(ticket: Ticket, row: number): number[] {
  return ticket.grid[row].filter((n) => n !== null) as number[];
}

/**
 * Repair a ticket from storage. If it's invalid (including empty columns),
 * regenerate the grid while preserving playerName and id.
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

  // isValidTicket now checks column coverage too, so invalid = full regeneration
  if (isValidTicket(grid)) return { ...ticket, grid };

  // Full regeneration, preserve player info
  const fresh = generateSingleTicket(ticket.id, ticket.setIndex ?? 0);
  return { ...fresh, playerName: ticket.playerName };
}
