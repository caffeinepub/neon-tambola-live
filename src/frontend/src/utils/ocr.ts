// OCR utility using Tesseract.js (loaded via CDN)
// Extracts numbers 1-90 from an image and attempts to group them into Tambola tickets

declare global {
  interface Window {
    Tesseract: any;
  }
}

export interface OcrProgress {
  status: string;
  progress: number;
}

export async function ocrExtractNumbers(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<number[]> {
  if (!window.Tesseract) {
    throw new Error("Tesseract.js not loaded. Please refresh and try again.");
  }

  const worker = await window.Tesseract.createWorker("eng", 1, {
    logger: (m: any) => {
      if (onProgress && m.status) {
        onProgress({
          status: m.status,
          progress: Math.round((m.progress ?? 0) * 100),
        });
      }
    },
  });

  await worker.setParameters({
    tessedit_char_whitelist: "0123456789 \n\t|/\\",
  });

  const { data } = await worker.recognize(file);
  await worker.terminate();

  const text: string = data.text ?? "";
  // Extract all numbers found in the text
  const matches = text.match(/\b([1-9]|[1-8][0-9]|90)\b/g) ?? [];
  const nums = matches
    .map((s: string) => Number.parseInt(s, 10))
    .filter((n: number) => n >= 1 && n <= 90);

  return nums;
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

function colIndex(n: number): number {
  return COL_RANGES.findIndex(([lo, hi]) => n >= lo && n <= hi);
}

/**
 * Try to parse OCR numbers into valid Tambola ticket grids.
 * Attempts to group every 15 consecutive numbers into a ticket.
 * Returns grids that pass validation, plus any leftover raw numbers.
 */
export function parseOcrIntoTickets(numbers: number[]): {
  grids: (number | null)[][][];
  raw: number[];
} {
  if (numbers.length === 0) return { grids: [], raw: [] };

  // Deduplicate while preserving order within reasonable ticket-sized chunks
  const grids: (number | null)[][][] = [];
  const leftovers: number[] = [];

  // Try splitting into chunks of 15
  for (let i = 0; i < numbers.length; i += 15) {
    const chunk = numbers.slice(i, i + 15);
    if (chunk.length < 15) {
      leftovers.push(...chunk);
      break;
    }
    const grid = tryBuildGrid(chunk);
    if (grid) {
      grids.push(grid);
    } else {
      leftovers.push(...chunk);
    }
  }

  return { grids, raw: leftovers };
}

function tryBuildGrid(nums: number[]): (number | null)[][] | null {
  // Check column coverage: each column must have at least 1 num
  const byCols: number[][] = Array.from({ length: 9 }, () => []);
  for (const n of nums) {
    const ci = colIndex(n);
    if (ci < 0) return null;
    byCols[ci].push(n);
  }
  if (byCols.some((col) => col.length === 0)) return null;
  if (byCols.some((col) => col.length > 3)) return null;

  // Assign numbers to rows: each row gets 5, numbers sorted within column
  // Simple assignment: distribute columns to rows
  const grid: (number | null)[][] = Array.from({ length: 3 }, () =>
    Array(9).fill(null),
  );

  for (let col = 0; col < 9; col++) {
    const sorted = [...byCols[col]].sort((a, b) => a - b);
    // Assign to rows 0, 1, 2 in order
    for (let k = 0; k < sorted.length; k++) {
      grid[k][col] = sorted[k];
    }
  }

  // Verify each row has exactly 5 numbers
  for (const row of grid) {
    if (row.filter((c) => c !== null).length !== 5) return null;
  }

  return grid;
}
