

# FingerPick – 손가락 뽑기 웹앱 구현 계획

## Overview
A mobile-first web app where multiple people place fingers on screen, and the app randomly selects one (or more). No backend needed — 100% client-side.

---

## Phase 1: Foundation & Touch Detection

### Full-screen touch area with gesture blocking
- Dark gradient background filling the entire viewport
- CSS: `touch-action: none`, `overscroll-behavior: none`, `user-select: none`, `position: fixed`
- All touch event listeners with `{ passive: false }` and `preventDefault()`

### Multi-touch detection & visualization
- Custom `useMultiTouch` hook tracking all active touches via `Touch.identifier`
- Each finger gets a colored circle (10-color neon palette) at its position
- Circles follow finger movement smoothly at 60fps using `requestAnimationFrame`
- Circles appear with a bounce animation, disappear instantly on finger lift

### Idle state UI
- Center prompt: "화면에 손가락을 올려주세요" with subtle animation
- Finger count indicator at bottom
- Small settings gear icon (top corner, semi-transparent)
- Desktop detection: show "모바일 기기에서 사용해주세요" message

---

## Phase 2: Stabilization & Selection

### Stabilization detection (`useStabilization` hook)
- Track cumulative movement per touch; "stable" = < 10px movement
- Require 2+ touches before starting countdown (default 2 seconds)
- Show progress ring animation around each circle during countdown
- Reset countdown if any finger moves, is added, or removed

### Random selection & result animation
- `crypto.getRandomValues()` for unbiased random pick
- Animation sequence:
  1. All circles pulse (0.5s)
  2. Non-selected circles shrink/fade out sequentially (0.3s intervals)
  3. Winner circle enlarges with glow effect + color burst
- Confetti/particle celebration effect on winner

### Feedback
- Vibration: `navigator.vibrate(200)` on selection
- Sound: Short fanfare via Web Audio API (embedded, no external files)

### Auto-reset
- All fingers removed → reset to idle after 2 seconds

---

## Phase 3: Settings & Extended Modes

### Settings half-modal (bottom sheet)
- **Mode selection**: 1명 선택 (default) / N명 선택 / 팀 나누기 / 순서 정하기
- **Wait time**: 1s / 2s / 3s toggle
- **Sound**: ON/OFF
- **Vibration**: ON/OFF
- Settings stored in React Context (no localStorage)

### Extended modes
- **N명 선택**: Pick N winners, all highlighted with glow
- **팀 나누기**: Split into 2 teams with distinct color groups
- **순서 정하기**: Assign numbered order 1→N with sequential reveal animation

---

## Phase 4: Polish & Edge Cases

### Edge case handling
- 1 finger only → "한 명 더 필요해요!" tooltip
- `touchcancel` (phone call, notification) → graceful reset
- Screen rotation → reset state
- Max touch points display via `navigator.maxTouchPoints`

### Visual polish
- Subtle particle/ambient effect on idle background
- State machine: IDLE → DETECTING → STABILIZING → SELECTING → RESULT
- Smooth transitions between all states
- Dark theme as default with neon-colored circles

### Performance targets
- < 16ms touch-to-visual feedback
- 60fps during finger movement
- Lightweight bundle (no heavy dependencies)

