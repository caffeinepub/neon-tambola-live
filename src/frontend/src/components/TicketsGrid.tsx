import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { useState } from "react";
import type { BookingRequest } from "../utils/gameStorage";
import type { Ticket } from "../utils/ticketGenerator";
import type { Winner } from "../utils/winDetector";
import TicketCard from "./TicketCard";

interface Props {
  tickets: Ticket[];
  calledNumbers: number[];
  currentNumber: number | null;
  winners: Winner[];
  bookingRequests?: BookingRequest[];
  onBookingRequest?: (ticketId: number, playerName: string) => void;
  searchOnly?: boolean;
  bookingMode?: boolean;
  ticketDisplaySize?: "small" | "medium" | "large";
  ticketsMinimized?: boolean;
}

export default function TicketsGrid({
  tickets,
  calledNumbers,
  currentNumber,
  winners,
  bookingRequests = [],
  onBookingRequest,
  searchOnly = false,
  bookingMode = false,
  ticketDisplaySize = "medium",
  ticketsMinimized = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [pinnedTicketIds, setPinnedTicketIds] = useState<number[]>([]);
  const [dialogTicket, setDialogTicket] = useState<Ticket | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const getSearchMatches = (): Ticket[] => {
    if (!search.trim()) return [];
    const trimmed = search.trim();
    const asNum = Number(trimmed);
    if (!Number.isNaN(asNum) && String(asNum) === trimmed) {
      return tickets.filter((t) => t.id === asNum);
    }
    return tickets.filter((t) =>
      t.playerName.toLowerCase().includes(trimmed.toLowerCase()),
    );
  };

  const handleSearch = () => {
    const matches = getSearchMatches();
    if (matches.length === 0) return;
    const newIds = matches
      .map((t) => t.id)
      .filter((id) => !pinnedTicketIds.includes(id));
    if (newIds.length > 0) {
      setPinnedTicketIds((prev) => [...prev, ...newIds]);
    }
    setSearch("");
  };

  const removeTicket = (id: number) => {
    setPinnedTicketIds((prev) => prev.filter((x) => x !== id));
  };

  const clearAll = () => setPinnedTicketIds([]);

  const pinnedTickets = pinnedTicketIds
    .map((id) => tickets.find((t) => t.id === id))
    .filter(Boolean) as Ticket[];

  const getFiltered = () => {
    if (!search.trim()) return searchOnly ? [] : tickets;
    const trimmed = search.trim();
    const asNum = Number(trimmed);
    if (!Number.isNaN(asNum) && String(asNum) === trimmed) {
      return tickets.filter((t) => t.id === asNum);
    }
    return tickets.filter((t) =>
      t.playerName.toLowerCase().includes(trimmed.toLowerCase()),
    );
  };

  const filtered = getFiltered();

  const getPendingRequest = (ticketId: number) =>
    bookingRequests.find(
      (r) => r.ticketId === ticketId && r.status === "pending",
    );

  const handleRequestSubmit = () => {
    if (!dialogTicket || !playerName.trim()) return;
    onBookingRequest?.(dialogTicket.id, playerName.trim());
    setSubmitted(true);
    setTimeout(() => {
      setDialogTicket(null);
      setPlayerName("");
      setSubmitted(false);
    }, 1500);
  };

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="relative mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              searchOnly
                ? "Enter ticket number or your name..."
                : "Search ticket # or name..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (searchOnly) handleSearch();
              }
            }}
            className="w-full glass rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:shadow-neon-purple transition-all"
            data-ocid="tickets.search_input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        {searchOnly && search && (
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 transition-all whitespace-nowrap"
            data-ocid="tickets.primary_button"
          >
            Add to View
          </button>
        )}
      </div>

      {/* Pinned / accumulated tickets (searchOnly mode) */}
      {searchOnly &&
        (pinnedTickets.length === 0 ? (
          <div
            className="text-center py-16 animate-slide-up"
            data-ocid="tickets.empty_state"
          >
            <div className="text-5xl mb-4 animate-float">🎫</div>
            <p className="text-muted-foreground font-body">
              Search by ticket number or your name to view your ticket
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                {pinnedTickets.length} ticket
                {pinnedTickets.length !== 1 ? "s" : ""} shown
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-destructive hover:underline font-mono"
                data-ocid="tickets.secondary_button"
              >
                Clear All
              </button>
            </div>
            {pinnedTickets.map((t) => (
              <div key={t.id} className="relative">
                <button
                  type="button"
                  onClick={() => removeTicket(t.id)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-destructive/20 hover:bg-destructive/40 text-destructive flex items-center justify-center transition-all"
                  aria-label="Remove ticket"
                  data-ocid="tickets.close_button"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-base font-heading font-black text-primary neon-text-purple">
                    Ticket #{t.id}
                  </span>
                  <span className="text-sm text-foreground font-semibold">
                    {t.playerName && !t.playerName.startsWith("Player ")
                      ? t.playerName
                      : "Unbooked"}
                  </span>
                </div>
                <TicketCard
                  ticket={t}
                  calledNumbers={calledNumbers}
                  currentNumber={currentNumber}
                  winners={winners}
                  showBookingBadge={bookingMode}
                  isPending={!!getPendingRequest(t.id)}
                  onBook={
                    bookingMode && onBookingRequest
                      ? () => setDialogTicket(t)
                      : undefined
                  }
                  large={true}
                  displaySize={ticketDisplaySize}
                  minimized={ticketsMinimized}
                />
              </div>
            ))}
          </div>
        ))}

      {/* Normal (non-searchOnly) grid view */}
      {!searchOnly &&
        (filtered.length === 0 && search ? (
          <div
            className="text-center py-10 text-muted-foreground"
            data-ocid="tickets.empty_state"
          >
            No tickets found for &ldquo;{search}&rdquo;
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-widest">
                ✦ All Tickets
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {filtered.length} / {tickets.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {filtered.slice(0, 200).map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  calledNumbers={calledNumbers}
                  currentNumber={currentNumber}
                  winners={winners}
                  showBookingBadge={bookingMode}
                  isPending={!!getPendingRequest(t.id)}
                  onBook={
                    bookingMode && onBookingRequest
                      ? () => setDialogTicket(t)
                      : undefined
                  }
                  displaySize={ticketDisplaySize}
                  minimized={ticketsMinimized}
                />
              ))}
            </div>
            {filtered.length > 200 && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Showing 200 of {filtered.length}. Use search to find specific
                tickets.
              </p>
            )}
          </>
        ))}

      <Dialog
        open={!!dialogTicket}
        onOpenChange={(o) => !o && setDialogTicket(null)}
      >
        <DialogContent
          className="glass border-primary/30 max-w-sm"
          data-ocid="tickets.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              Book Ticket #{dialogTicket?.id}
            </DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center animate-slide-up">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-success font-semibold">
                Request sent! Awaiting admin approval.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="player-name-input"
                  className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                  Your Name
                </Label>
                <Input
                  id="player-name-input"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="glass border-border"
                  data-ocid="tickets.input"
                  onKeyDown={(e) => e.key === "Enter" && handleRequestSubmit()}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogTicket(null)}
                  className="border-border"
                  data-ocid="tickets.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestSubmit}
                  disabled={!playerName.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon-purple"
                  data-ocid="tickets.confirm_button"
                >
                  Request Booking
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
