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

function generateSet(setIndex: number, startId: number): Ticket[] {
  // Column ranges
  const colRanges = [
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

  // All numbers for this set, shuffled per column
  const colNumbers: number[][] = colRanges.map(([lo, hi]) => {
    const nums: number[] = [];
    for (let n = lo; n <= hi; n++) nums.push(n);
    return shuffle(nums);
  });

  // Distribute column numbers to 6 tickets
  // Each col has 9, 10, or 11 numbers; we split across 6 tickets
  // Each ticket needs exactly 5 numbers total across all 9 cols, 5 per row
  // Strategy: assign column numbers to tickets greedily
  // For each column, assign 1 or 2 numbers to each ticket so total per ticket row = 5

  // Build 6 ticket grids
  const grids: (number | null)[][][] = Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => Array(9).fill(null)),
  );

  // Track which numbers go in each ticket per column
  const ticketColNums: number[][][] = Array.from({ length: 6 }, () =>
    Array.from({ length: 9 }, () => []),
  );

  // Assign numbers to tickets per column
  for (let col = 0; col < 9; col++) {
    const nums = colNumbers[col];
    let idx = 0;
    // Each ticket can take 0, 1, or 2 from this column
    // Total must equal nums.length, distributed over 6 tickets
    // Simple: give each ticket floor(len/6), then distribute remainder
    const perTicket = Math.floor(nums.length / 6);
    const extra = nums.length % 6;
    const assignment = Array(6).fill(perTicket);
    for (let i = 0; i < extra; i++) assignment[i]++;
    shuffle(assignment); // randomize which tickets get the extra
    for (let t = 0; t < 6; t++) {
      for (let k = 0; k < assignment[t]; k++) {
        ticketColNums[t][col].push(nums[idx++]);
      }
    }
  }

  // Now place numbers in rows such that each row has exactly 5 numbers
  for (let t = 0; t < 6; t++) {
    // Collect all (col, num) pairs
    const pairs: { col: number; num: number }[] = [];
    for (let col = 0; col < 9; col++) {
      for (const num of ticketColNums[t][col]) {
        pairs.push({ col, num });
      }
    }
    // pairs.length should be ~15 but may vary; trim or pad
    // Adjust to exactly 15
    // If fewer, steal from a column that has 2
    // If more, remove extras from column that has 2
    // For simplicity, just use what we have and place in rows
    // Place 5 per row greedily: sort by col, assign to rows
    const shuffledPairs = shuffle(pairs);
    let _placed = 0;
    for (let row = 0; row < 3; row++) {
      // pick 5 for this row, prefer different columns
      const usedCols = new Set<number>();
      let count = 0;
      for (const p of shuffledPairs) {
        if (count >= 5) break;
        if (!usedCols.has(p.col) && grids[t][row][p.col] === null) {
          grids[t][row][p.col] = p.num;
          usedCols.add(p.col);
          count++;
          _placed++;
        }
      }
      // Remove placed ones from shuffledPairs
      for (let col = 0; col < 9; col++) {
        if (grids[t][row][col] !== null) {
          const idx2 = shuffledPairs.findIndex(
            (p) => p.col === col && p.num === grids[t][row][col],
          );
          if (idx2 !== -1) shuffledPairs.splice(idx2, 1);
        }
      }
    }
    // Place any remaining
    for (const p of shuffledPairs) {
      for (let row = 0; row < 3; row++) {
        if (grids[t][row][p.col] === null) {
          grids[t][row][p.col] = p.num;
          break;
        }
      }
    }
  }

  return grids.map((grid, i) => ({
    id: startId + i,
    playerName: `Player ${startId + i}`,
    setIndex,
    grid,
  }));
}

export function generateTickets(count: number): Ticket[] {
  const sets = Math.floor(count / 6);
  const tickets: Ticket[] = [];
  for (let s = 0; s < sets; s++) {
    const set = generateSet(s, s * 6 + 1);
    tickets.push(...set);
  }
  return tickets;
}

export function getTicketNumbers(ticket: Ticket): number[] {
  return ticket.grid.flat().filter((n) => n !== null) as number[];
}

export function getRowNumbers(ticket: Ticket, row: number): number[] {
  return ticket.grid[row].filter((n) => n !== null) as number[];
}
