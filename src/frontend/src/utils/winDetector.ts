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

export function detectWins(
  tickets: Ticket[],
  calledNumbers: number[],
  existingWinners: Winner[],
  activePrizes?: string[],
): Winner[] {
  const calledSet = new Set(calledNumbers);
  const wonTypes = new Set(existingWinners.map((w) => w.winType));
  const newWinners: Winner[] = [];
  const active = new Set(activePrizes ?? WIN_TYPES);

  const checkAndAdd = (
    winType: string,
    ticketId: number,
    playerName: string,
  ) => {
    if (active.has(winType) && !wonTypes.has(winType)) {
      wonTypes.add(winType);
      newWinners.push({
        ticketId,
        playerName,
        winType,
        calledCount: calledNumbers.length,
      });
    }
  };

  for (const ticket of tickets) {
    const nums = getTicketNumbers(ticket);
    const markedCount = nums.filter((n) => calledSet.has(n)).length;

    if (active.has("Early 5") && !wonTypes.has("Early 5") && markedCount >= 5) {
      checkAndAdd("Early 5", ticket.id, ticket.playerName);
    }
    if (active.has("Top Line") && !wonTypes.has("Top Line")) {
      const row0 = getRowNumbers(ticket, 0);
      if (row0.length > 0 && row0.every((n) => calledSet.has(n))) {
        checkAndAdd("Top Line", ticket.id, ticket.playerName);
      }
    }
    if (active.has("Middle Line") && !wonTypes.has("Middle Line")) {
      const row1 = getRowNumbers(ticket, 1);
      if (row1.length > 0 && row1.every((n) => calledSet.has(n))) {
        checkAndAdd("Middle Line", ticket.id, ticket.playerName);
      }
    }
    if (active.has("Bottom Line") && !wonTypes.has("Bottom Line")) {
      const row2 = getRowNumbers(ticket, 2);
      if (row2.length > 0 && row2.every((n) => calledSet.has(n))) {
        checkAndAdd("Bottom Line", ticket.id, ticket.playerName);
      }
    }
    // Full House: all ticket numbers called (require at least 10 numbers to avoid false positives)
    if (
      active.has("Full House") &&
      !wonTypes.has("Full House") &&
      nums.length >= 10 &&
      markedCount === nums.length
    ) {
      checkAndAdd("Full House", ticket.id, ticket.playerName);
    }
  }

  return newWinners;
}
