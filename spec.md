# Neon Tambola Live

## Current State
- Full game platform with booking, preview, active, ended phases
- NumberBoard component exists but only shows called numbers
- TicketsGrid shows tickets in a small grid layout, search works but results display small
- AgentPanel has ticket management but no per-number inline editing
- TicketCard renders 3x9 grid with called number highlights

## Requested Changes (Diff)

### Add
- Full 1–90 static number reference grid visible in preview/active/ended phases — all 90 numbers always shown, called ones highlighted, uncalled dim
- Large ticket display in search results: when a ticket is found via search (TicketsGrid in searchOnly mode), show the ticket in a large expanded card format with big number cells
- Per-number inline editor in AgentPanel: each ticket's numbers can be individually edited or deleted (set to null/blank) by admin at any time, including during the active game phase

### Modify
- NumberBoard: extend to always render all 90 numbers as a grid, highlighting called ones; previously only showed recent calls
- TicketsGrid: when searchOnly=true and a ticket is found, render it in large/expanded mode (bigger cells, bigger font, clearer highlighting)
- AgentPanel tickets tab: add per-ticket edit mode showing all 15 number cells with individual edit/delete controls

### Remove
- Nothing removed

## Implementation Plan
1. **NumberBoard.tsx** — Refactor to render a 9x10 grid (all 90 numbers), highlight called numbers with neon glow, dim uncalled; show the current/last called number prominently above
2. **TicketsGrid.tsx** — In searchOnly mode with results found, render each matched ticket as a large TicketCard with a `large` prop; add `large` prop to TicketCard for expanded view
3. **TicketCard.tsx** — Add `large` prop: when true, render bigger cells, bigger font, larger overall card
4. **AgentPanel.tsx** — In tickets tab, add an edit mode per ticket: show all 15 number cells in a 3x9 mini-grid, each cell has an edit icon (click to edit value) and a delete icon (sets to null). Validate column rules on edit.
5. **App.tsx / useGameState** — Ensure ticket grid mutations (edit/delete cell) are persisted to localStorage via saveState
