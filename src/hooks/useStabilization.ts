import { useEffect, useRef, useState, useCallback } from "react";
import type { TouchPoint } from "./useMultiTouch";

const MOVEMENT_THRESHOLD_SQ = 400; // 20px squared — base threshold
const LARGE_MOVEMENT_SQ = 2500;    // 50px squared — instant reset
const PROGRESS_UPDATE_INTERVAL = 33; // ~30fps for UI updates

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
  const lastProgressUpdate = useRef<number>(0);
  const consecutiveMovementFrames = useRef(0);
  const lastTouchTime = useRef<number>(performance.now());
  const mountedRef = useRef(true);

  waitTimeRef.current = waitTime;

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
    lastProgressUpdate.current = 0;
  }, [stopLoop]);

  const fullReset = useCallback(() => {
    completedRef.current = false;
    consecutiveMovementFrames.current = 0;
    resetProgress();
    setIsStable(false);
    lastPositions.current.clear();
  }, [resetProgress]);

  const startLoop = useCallback(() => {
    if (stableStartTime.current !== null || completedRef.current) return;
    stableStartTime.current = performance.now();
    setIsCountingDown(true);

    const tick = (now: number) => {
      if (!stableStartTime.current || completedRef.current) return;
      const elapsed = now - stableStartTime.current;
      const p = Math.min(elapsed / (waitTimeRef.current * 1000), 1);
      
      // Throttle UI updates to ~30fps
      if (now - lastProgressUpdate.current >= PROGRESS_UPDATE_INTERVAL || p >= 1) {
        lastProgressUpdate.current = now;
        setProgress(p);
      }
      
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
      for (const t of touches) {
        lastPositions.current.set(t.id, { x: t.x, y: t.y });
      }
      lastTouchTime.current = performance.now();
    }
  }, [touches, fullReset]);

  // Movement detection + countdown start
  useEffect(() => {
    if (completedRef.current) return;
    if (touches.length < minTouches) return;

    const now = performance.now();
    const dt = now - lastTouchTime.current;
    lastTouchTime.current = now;

    // Time-corrected threshold: scale by dt relative to 16ms baseline
    const timeScale = Math.max(dt / 16, 1);
    const effectiveThreshold = MOVEMENT_THRESHOLD_SQ * timeScale;

    let moved = false;
    let largeMove = false;

    for (const t of touches) {
      const last = lastPositions.current.get(t.id);
      if (last) {
        const dx = t.x - last.x;
        const dy = t.y - last.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > LARGE_MOVEMENT_SQ * timeScale) {
          largeMove = true;
          moved = true;
        } else if (distSq > effectiveThreshold) {
          moved = true;
        }
      }
    }

    // Update positions
    for (const t of touches) {
      lastPositions.current.set(t.id, { x: t.x, y: t.y });
    }

    if (largeMove) {
      // Instant reset for large movements
      consecutiveMovementFrames.current = 0;
      resetProgress();
      return;
    }

    if (moved) {
      consecutiveMovementFrames.current++;
      // Hysteresis: require 2+ consecutive movement frames for reset
      if (consecutiveMovementFrames.current >= 2) {
        consecutiveMovementFrames.current = 0;
        resetProgress();
      }
      return;
    }

    // No movement detected
    consecutiveMovementFrames.current = 0;

    if (stableStartTime.current === null && !completedRef.current) {
      startLoop();
    }
  }, [touches, minTouches, resetProgress, startLoop]);

  // Cleanup
  useEffect(() => stopLoop, [stopLoop]);

  return { isStable, progress, isCountingDown, reset: fullReset };
}
