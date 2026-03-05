import { useEffect, useRef, useState, useCallback } from "react";
import type { TouchPoint } from "./useMultiTouch";

const MOVEMENT_THRESHOLD = 10;

export function useStabilization(
  touches: TouchPoint[],
  waitTime: number,
  minTouches: number = 2
) {
  const [isStable, setIsStable] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [isCountingDown, setIsCountingDown] = useState(false);

  const prevPositions = useRef<Map<number, { x: number; y: number }>>(new Map());
  const stableStartTime = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    stableStartTime.current = null;
    setIsStable(false);
    setProgress(0);
    setIsCountingDown(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (touches.length < minTouches) {
      reset();
      prevPositions.current.clear();
      return;
    }

    // Check movement
    let moved = false;
    for (const t of touches) {
      const prev = prevPositions.current.get(t.id);
      if (prev) {
        const dx = t.x - prev.x;
        const dy = t.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MOVEMENT_THRESHOLD) {
          moved = true;
        }
      }
      prevPositions.current.set(t.id, { x: t.x, y: t.y });
    }

    // Clean old ids
    const activeIds = new Set(touches.map((t) => t.id));
    for (const id of prevPositions.current.keys()) {
      if (!activeIds.has(id)) {
        prevPositions.current.delete(id);
        moved = true; // finger removed
      }
    }

    if (moved) {
      reset();
      return;
    }

    // Start or continue countdown
    if (!stableStartTime.current) {
      stableStartTime.current = performance.now();
      setIsCountingDown(true);

      const tick = () => {
        if (!stableStartTime.current) return;
        const elapsed = performance.now() - stableStartTime.current;
        const p = Math.min(elapsed / (waitTime * 1000), 1);
        setProgress(p);
        if (p >= 1) {
          setIsStable(true);
          setIsCountingDown(false);
          return;
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }
  }, [touches, waitTime, minTouches, reset]);

  // Reset when touch count changes
  const prevCountRef = useRef(touches.length);
  useEffect(() => {
    if (touches.length !== prevCountRef.current) {
      reset();
    }
    prevCountRef.current = touches.length;
  }, [touches.length, reset]);

  return { isStable, progress, isCountingDown, reset };
}
