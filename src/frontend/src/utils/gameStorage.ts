import type { Ticket } from "./ticketGenerator";
import { isValidTicket, repairTicket } from "./ticketGenerator";
import type { Winner } from "./winDetector";

export type GamePhase = "idle" | "booking" | "preview" | "active" | "ended";

export interface BookingRequest {
  id: string;
  ticketId: number;
  playerName: string;
  status: "pending" | "approved" | "rejected";
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  tickets: Ticket[];
  calledNumbers: number[];
  currentNumber: number | null;
  winners: Winner[];
  callSpeed: number;
  ticketCount: number;
  startTime: string | null;
  bookingRequests: BookingRequest[];
}

const KEY = "tambola_game_state_v2";

export const defaultState: GameState = {
  phase: "idle",
  tickets: [],
  calledNumbers: [],
  currentNumber: null,
  winners: [],
  callSpeed: 5,
  ticketCount: 60,
  startTime: null,
  bookingRequests: [],
};

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      const state = { ...defaultState, ...parsed };
      // Repair any tickets that have > 15 numbers (legacy bug fix)
      if (state.tickets.length > 0) {
        state.tickets = state.tickets.map((t) =>
          isValidTicket(t.grid) ? t : repairTicket(t),
        );
      }
      return state;
    }
  } catch {}
  return { ...defaultState };
}

export function saveState(state: GameState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(KEY);
}
