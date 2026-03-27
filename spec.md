# Neon Tambola Live

## Current State
- Two separate calling displays: `CallingDisplay` (circle with current number) and `NumberBoard` (1-90 grid + current number showcase at top)
- `WinnerBoard` displayed in the left column mid-page during active/preview phases
- `TicketsGrid` search resets/replaces results on new search
- No admin ticket size/minimize controls
- ThemeManager supports photo backgrounds for full page; no specific call board theme

## Requested Changes (Diff)

### Add
- Admin ticket size controls in AgentPanel: ability to set ticket display size (small/medium/large) and toggle minimize/collapse state for tickets; setting saved to localStorage and applied to all tickets on home page
- Call board photo theme: in ThemeManager, admin can add/upload a photo that applies as background to the number calling board section specifically (separate from the full page background)

### Modify
- **Merge calling boards into one**: Remove standalone `CallingDisplay` component from `PreviewPhase` and `ActivePhase`. The `NumberBoard` already has a "Just Called" showcase at the top — enhance it to also include the `CallingDisplay`'s "Now Calling" text, phrase ("Single number, X"), and recently called chips. Result: single unified board with current number large display + 1-90 grid below.
- **Winner board placement**: Move `WinnerBoard` to the very bottom of the home page in all phases (active, preview, ended). Add a visible "Check Winners" button/section heading that stays at bottom. During active/preview, the main content above is just the combined number board + ticket search.
- **Search persistence**: In `TicketsGrid` (searchOnly mode), search results accumulate — new searches add to existing results. Each result ticket card has an X button to remove it individually. Old results stay until explicitly removed by user.

### Remove
- `CallingDisplay` usage from `PreviewPhase` and `ActivePhase` layout (component file can stay but is no longer rendered in player view)

## Implementation Plan
1. Update `NumberBoard.tsx` to integrate calling display: add "Now Calling" header, phrase label, recently called chips — making it a fully self-contained combined board
2. Update `App.tsx` `PreviewPhase` and `ActivePhase`: remove `<CallingDisplay>` usage, move `<WinnerBoard>` to bottom of each phase after a divider/button
3. Update `TicketsGrid.tsx` search: accumulate results, add per-card X/remove button
4. Add ticket size state (small/medium/large + minimized toggle) to `useGameState` / localStorage; expose setter
5. In `AgentPanel.tsx` Themes/Display section: add ticket size controls (S/M/L buttons + minimize toggle)
6. Apply ticket size from state in `TicketsGrid.tsx` and `TicketCard.tsx`
7. In `ThemeManager.tsx`: add a "Call Board Background" photo upload, stored as `callBoardBg` in theme; apply it to the number board section via CSS variable `--theme-callboard-bg`
