import type { Ticket } from "./ticketGenerator";
import { isValidTicket, repairTicket } from "./ticketGenerator";
import type { Winner } from "./winDetector";

export type GamePhase = "idle" | "booking" | "preview" | "active" | "ended";

export interface BookingRequest {
  id: string;
  ticketId: number; // first ticket (backwards compat)
  ticketIds: number[]; // all tickets in the package
  packageType: "single" | "half" | "full" | "custom";
  playerName: string;
  status: "pending" | "approved" | "rejected";
  timestamp: number;
}

export interface GameSettings {
  gameName: string;
  ticketLimit: number;
  activePrizes: string[];
  prizeNames: Record<string, string>;
  selectedVoice: string;
  voiceMode: string;
  startTime: string | null;
  previewDuration: number; // minutes
  ticketDisplaySize: "small" | "medium" | "large";
  ticketsMinimized: boolean;
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
  prizeNames: Record<string, string>;
  selectedVoice: string;
  voiceMode: string;
  isPublished: boolean;
  previewDuration: number; // minutes, default 5
  ticketDisplaySize: "small" | "medium" | "large";
  ticketsMinimized: boolean;
}

const KEY = "tambola_game_state_v5";

export const ALL_PRIZES = [
  "Early 5",
  "Top Line",
  "Middle Line",
  "Bottom Line",
  "Full House",
];

export const DEFAULT_PRIZE_NAMES: Record<string, string> = {
  "Early 5": "Early 5",
  "Top Line": "Top Line",
  "Middle Line": "Middle Line",
  "Bottom Line": "Bottom Line",
  "Full House": "Full House",
};

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
  prizeNames: { ...DEFAULT_PRIZE_NAMES },
  selectedVoice: "",
  voiceMode: "male",
  isPublished: false,
  previewDuration: 5,
  ticketDisplaySize: "medium",
  ticketsMinimized: false,
};

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      const state = { ...defaultState, ...parsed };
      // Ensure prizeNames has all defaults
      state.prizeNames = {
        ...DEFAULT_PRIZE_NAMES,
        ...(parsed.prizeNames ?? {}),
      };
      // Repair tickets
      state.tickets = state.tickets.map((t) => {
        if (!isValidTicket(t.grid)) {
          return repairTicket(t);
        }
        return t;
      });
      return state;
    }
  } catch {
    // ignore
  }
  return { ...defaultState };
}

export function saveState(state: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
