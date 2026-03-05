import { useEffect, useRef, useState, useCallback } from "react";
import type { TouchPoint } from "./useMultiTouch";

const MOVEMENT_THRESHOLD_SQ = 144; // 12px squared

export function useStabilization(
  touches: TouchPoint[],
  waitTime: number,
  minTouches: number = 2
) {
  const [isStable, setIsStable] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const prevPositions = useRef<Map<number, { x: number; y: number }>>(new Map());
  const stableStartTime = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const waitTimeRef = useRef(waitTime);
  const touchCountRef = useRef(0);
  const completedRef = useRef(false);

  waitTimeRef.current = waitTime;

  const stopLoop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stableStartTime.current = null;
    completedRef.current = false;
    stopLoop();
    setIsStable(false);
    setProgress(0);
    setIsCountingDown(false);
  }, [stopLoop]);

  const startLoop = useCallback(() => {
    if (stableStartTime.current || completedRef.current) return;
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

  // Touch count change detection
  useEffect(() => {
    if (touches.length !== touchCountRef.current) {
      touchCountRef.current = touches.length;
      reset();
      prevPositions.current.clear();
      // Re-seed positions from current touches
      for (const t of touches) {
        prevPositions.current.set(t.id, { x: t.x, y: t.y });
      }
    }
  }, [touches, reset]);

  // Movement detection - only when we have enough touches and not completed
  useEffect(() => {
    if (completedRef.current) return;
    if (touches.length < minTouches) return;

    let moved = false;
    for (const t of touches) {
      const prev = prevPositions.current.get(t.id);
      if (prev) {
        const dx = t.x - prev.x;
        const dy = t.y - prev.y;
        if (dx * dx + dy * dy > MOVEMENT_THRESHOLD_SQ) {
          moved = true;
          // Update position on movement
          prevPositions.current.set(t.id, { x: t.x, y: t.y });
        }
        // Don't update position if no significant movement - prevents drift accumulation
      } else {
        prevPositions.current.set(t.id, { x: t.x, y: t.y });
      }
    }

    if (moved) {
      reset();
      // Re-seed all positions after reset
      for (const t of touches) {
        prevPositions.current.set(t.id, { x: t.x, y: t.y });
      }
      return;
    }

    // Start countdown if not already running
    if (!stableStartTime.current && !completedRef.current) {
      startLoop();
    }
  }, [touches, minTouches, reset, startLoop]);

  // Cleanup on unmount
  useEffect(() => stopLoop, [stopLoop]);

  return { isStable, progress, isCountingDown, reset };
}
