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
  "Half Sheet Bonus",
  "Full Sheet Bonus",
];

export function detectWins(
  tickets: Ticket[],
  calledNumbers: number[],
  existingWinners: Winner[],
): Winner[] {
  const calledSet = new Set(calledNumbers);
  const wonTypes = new Set(existingWinners.map((w) => w.winType));
  const newWinners: Winner[] = [];

  const checkAndAdd = (
    winType: string,
    ticketId: number,
    playerName: string,
  ) => {
    if (!wonTypes.has(winType)) {
      wonTypes.add(winType);
      newWinners.push({
        ticketId,
        playerName,
        winType,
        calledCount: calledNumbers.length,
      });
    }
  };

  // Standard wins per ticket
  for (const ticket of tickets) {
    const nums = getTicketNumbers(ticket);
    const markedCount = nums.filter((n) => calledSet.has(n)).length;

    if (!wonTypes.has("Early 5") && markedCount >= 5) {
      checkAndAdd("Early 5", ticket.id, ticket.playerName);
    }
    if (!wonTypes.has("Top Line")) {
      const row0 = getRowNumbers(ticket, 0);
      if (row0.length > 0 && row0.every((n) => calledSet.has(n))) {
        checkAndAdd("Top Line", ticket.id, ticket.playerName);
      }
    }
    if (!wonTypes.has("Middle Line")) {
      const row1 = getRowNumbers(ticket, 1);
      if (row1.length > 0 && row1.every((n) => calledSet.has(n))) {
        checkAndAdd("Middle Line", ticket.id, ticket.playerName);
      }
    }
    if (!wonTypes.has("Bottom Line")) {
      const row2 = getRowNumbers(ticket, 2);
      if (row2.length > 0 && row2.every((n) => calledSet.has(n))) {
        checkAndAdd("Bottom Line", ticket.id, ticket.playerName);
      }
    }
    if (
      !wonTypes.has("Full House") &&
      markedCount === nums.length &&
      nums.length === 15
    ) {
      checkAndAdd("Full House", ticket.id, ticket.playerName);
    }
  }

  // Bonus wins: group by playerName and setIndex
  if (!wonTypes.has("Full Sheet Bonus") || !wonTypes.has("Half Sheet Bonus")) {
    const byOwnerSet: Map<string, Ticket[]> = new Map();
    for (const ticket of tickets) {
      const key = `${ticket.playerName}__${ticket.setIndex}`;
      if (!byOwnerSet.has(key)) byOwnerSet.set(key, []);
      byOwnerSet.get(key)!.push(ticket);
    }

    for (const [, group] of byOwnerSet) {
      const markedGroup = group.filter((t) => {
        const nums = getTicketNumbers(t);
        return nums.filter((n) => calledSet.has(n)).length >= 2;
      });

      if (
        !wonTypes.has("Full Sheet Bonus") &&
        group.length >= 6 &&
        markedGroup.length >= 6
      ) {
        checkAndAdd("Full Sheet Bonus", group[0].id, group[0].playerName);
      }
      if (
        !wonTypes.has("Half Sheet Bonus") &&
        group.length >= 3 &&
        markedGroup.length >= 3
      ) {
        checkAndAdd("Half Sheet Bonus", group[0].id, group[0].playerName);
      }
    }
  }

  return newWinners;
}
