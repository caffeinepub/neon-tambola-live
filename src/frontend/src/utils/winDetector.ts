import {
  type Ticket,
  getRowNumbers,
  getTicketNumbers,
} from "./ticketGenerator";

export interface Winner {
  ticketId: number;
  playerName: string;
  winType: string;
  calledCount: number;
}

export const WIN_TYPES = [
  "Early 5",
  "Top Line",
  "Middle Line",
  "Bottom Line",
  "Full House",
];

// Returns new winners when calledNumbers are checked against tickets.
// Allows up to 3 simultaneous winners per prize type.
// If a prize already has any winner, it is closed (won't fire again).
export function detectWins(
  tickets: Ticket[],
  calledNumbers: number[],
  existingWinners: Winner[],
  activePrizes?: string[],
): Winner[] {
  const calledSet = new Set(calledNumbers);
  // Prizes that already have at least one winner are closed
  const wonTypes = new Set(existingWinners.map((w) => w.winType));
  const newWinners: Winner[] = [];
  const active = new Set(activePrizes ?? WIN_TYPES);

  // Collect all NEW winners per prize type (for simultaneous detection)
  const newWinsByType: Record<string, Winner[]> = {};

  for (const ticket of tickets) {
    const nums = getTicketNumbers(ticket);
    const markedCount = nums.filter((n) => calledSet.has(n)).length;

    const tryWin = (winType: string) => {
      if (!active.has(winType) || wonTypes.has(winType)) return;
      if (!newWinsByType[winType]) newWinsByType[winType] = [];
      newWinsByType[winType].push({
        ticketId: ticket.id,
        playerName: ticket.playerName,
        winType,
        calledCount: calledNumbers.length,
      });
    };

    if (active.has("Early 5") && markedCount >= 5) tryWin("Early 5");

    if (active.has("Top Line")) {
      const row0 = getRowNumbers(ticket, 0);
      if (row0.length > 0 && row0.every((n) => calledSet.has(n)))
        tryWin("Top Line");
    }
    if (active.has("Middle Line")) {
      const row1 = getRowNumbers(ticket, 1);
      if (row1.length > 0 && row1.every((n) => calledSet.has(n)))
        tryWin("Middle Line");
    }
    if (active.has("Bottom Line")) {
      const row2 = getRowNumbers(ticket, 2);
      if (row2.length > 0 && row2.every((n) => calledSet.has(n)))
        tryWin("Bottom Line");
    }
    if (
      active.has("Full House") &&
      nums.length >= 10 &&
      markedCount === nums.length
    ) {
      tryWin("Full House");
    }
  }

  // For each prize type, accept up to 3 simultaneous winners
  for (const [winType, wins] of Object.entries(newWinsByType)) {
    if (wins.length <= 3) {
      // Accept all (1–3 simultaneous winners)
      newWinners.push(...wins);
      wonTypes.add(winType); // close this prize after awarding
    }
    // If 4 or more would win simultaneously, they are all skipped (handled by callNumber)
  }

  return newWinners;
}

// Check if calling `candidateNum` would cause 4+ simultaneous winners for any prize.
// Returns true if the number should be skipped.
export function wouldCause4Winners(
  tickets: Ticket[],
  calledNumbers: number[],
  existingWinners: Winner[],
  candidateNum: number,
  activePrizes?: string[],
): boolean {
  const calledSet = new Set([...calledNumbers, candidateNum]);
  const wonTypes = new Set(existingWinners.map((w) => w.winType));
  const active = new Set(activePrizes ?? WIN_TYPES);

  const countByType: Record<string, number> = {};

  for (const ticket of tickets) {
    const nums = getTicketNumbers(ticket);
    const markedCount = nums.filter((n) => calledSet.has(n)).length;

    const count = (winType: string) => {
      if (!active.has(winType) || wonTypes.has(winType)) return;
      countByType[winType] = (countByType[winType] ?? 0) + 1;
    };

    if (active.has("Early 5") && markedCount >= 5) count("Early 5");

    if (active.has("Top Line")) {
      const row0 = getRowNumbers(ticket, 0);
      if (row0.length > 0 && row0.every((n) => calledSet.has(n)))
        count("Top Line");
    }
    if (active.has("Middle Line")) {
      const row1 = getRowNumbers(ticket, 1);
      if (row1.length > 0 && row1.every((n) => calledSet.has(n)))
        count("Middle Line");
    }
    if (active.has("Bottom Line")) {
      const row2 = getRowNumbers(ticket, 2);
      if (row2.length > 0 && row2.every((n) => calledSet.has(n)))
        count("Bottom Line");
    }
    if (
      active.has("Full House") &&
      nums.length >= 10 &&
      markedCount === nums.length
    ) {
      count("Full House");
    }
  }

  return Object.values(countByType).some((c) => c >= 4);
}
