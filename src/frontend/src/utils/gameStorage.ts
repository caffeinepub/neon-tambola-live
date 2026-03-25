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

export interface GameSettings {
  gameName: string;
  ticketLimit: number;
  activePrizes: string[];
  selectedVoice: string;
  startTime: string | null;
  previewDuration: number; // minutes
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
  gameName: string;
  ticketLimit: number;
  activePrizes: string[];
  selectedVoice: string;
  isPublished: boolean;
  previewDuration: number; // minutes, default 5
}

const KEY = "tambola_game_state_v4";

export const ALL_PRIZES = [
  "Early 5",
  "Top Line",
  "Middle Line",
  "Bottom Line",
  "Full House",
];

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
  gameName: "Neon Tambola Live",
  ticketLimit: 100,
  activePrizes: [...ALL_PRIZES],
  selectedVoice: "",
  isPublished: false,
  previewDuration: 5,
};

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      const state = { ...defaultState, ...parsed };
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
