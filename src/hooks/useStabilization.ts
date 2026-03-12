import { useEffect, useRef, useState, useCallback } from "react";
import type { TouchPoint } from "./useMultiTouch";

const MOVEMENT_THRESHOLD_SQ = 225; // 15px squared per-frame

export function useStabilization(
  touches: TouchPoint[],
  waitTime: number,
  minTouches: number = 2
) {
  const [isStable, setIsStable] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const lastPositions = useRef<Map<number, { x: number; y: number }>>(new Map());
  const stableStartTime = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const waitTimeRef = useRef(waitTime);
  const completedRef = useRef(false);
  const touchIdsRef = useRef<string>("");

  waitTimeRef.current = waitTime;

  const stopLoop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const resetProgress = useCallback(() => {
    stableStartTime.current = null;
    stopLoop();
    setProgress(0);
    setIsCountingDown(false);
  }, [stopLoop]);

  const fullReset = useCallback(() => {
    completedRef.current = false;
    resetProgress();
    setIsStable(false);
    lastPositions.current.clear();
  }, [resetProgress]);

  const startLoop = useCallback(() => {
    if (stableStartTime.current !== null || completedRef.current) return;
    stableStartTime.current = performance.now();
    setIsCountingDown(true);

    const tick = () => {
      if (!stableStartTime.current || completedRef.current) return;
      const elapsed = performance.now() - stableStartTime.current;
      const p = Math.min(elapsed / (waitTimeRef.current * 1000), 1);
      setProgress(p);
      if (p >= 1) {
        completedRef.current = true;
        setIsStable(true);
        setIsCountingDown(false);
        animFrameRef.current = null;
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Detect touch set changes (count or IDs changed) → full reset
  useEffect(() => {
    const ids = touches.map(t => t.id).sort().join(",");
    if (ids !== touchIdsRef.current) {
      touchIdsRef.current = ids;
      fullReset();
      // Seed positions
      for (const t of touches) {
        lastPositions.current.set(t.id, { x: t.x, y: t.y });
      }
    }
  }, [touches, fullReset]);

  // Movement detection + countdown start
  useEffect(() => {
    if (completedRef.current) return;
    if (touches.length < minTouches) return;

    // Frame-to-frame movement check: compare current vs last known position
    let moved = false;
    for (const t of touches) {
      const last = lastPositions.current.get(t.id);
      if (last) {
        const dx = t.x - last.x;
        const dy = t.y - last.y;
        if (dx * dx + dy * dy > MOVEMENT_THRESHOLD_SQ) {
          moved = true;
        }
      }
    }

    // Always update positions to latest (frame-to-frame, not cumulative)
    for (const t of touches) {
      lastPositions.current.set(t.id, { x: t.x, y: t.y });
    }

    if (moved) {
      resetProgress();
      return;
    }

    // Start countdown if not already running
    if (stableStartTime.current === null && !completedRef.current) {
      startLoop();
    }
  }, [touches, minTouches, resetProgress, startLoop]);

  // Cleanup
  useEffect(() => stopLoop, [stopLoop]);

  return { isStable, progress, isCountingDown, reset: fullReset };
}
