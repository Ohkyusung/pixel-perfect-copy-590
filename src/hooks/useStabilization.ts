import { useEffect, useRef, useState, useCallback } from "react";
import type { TouchPoint } from "./useMultiTouch";

const MOVEMENT_THRESHOLD = 12;

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
  const isRunning = useRef(false);
  const waitTimeRef = useRef(waitTime);
  waitTimeRef.current = waitTime;

  const stopLoop = useCallback(() => {
    isRunning.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stableStartTime.current = null;
    stopLoop();
    setIsStable(false);
    setProgress(0);
    setIsCountingDown(false);
  }, [stopLoop]);

  const startLoop = useCallback(() => {
    if (isRunning.current) return;
    stableStartTime.current = performance.now();
    isRunning.current = true;
    setIsCountingDown(true);

    const tick = () => {
      if (!isRunning.current || !stableStartTime.current) return;
      const elapsed = performance.now() - stableStartTime.current;
      const p = Math.min(elapsed / (waitTimeRef.current * 1000), 1);
      setProgress(p);
      if (p >= 1) {
        isRunning.current = false;
        setIsStable(true);
        setIsCountingDown(false);
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Movement detection - decoupled from animation loop
  useEffect(() => {
    if (touches.length < minTouches) {
      reset();
      prevPositions.current.clear();
      return;
    }

    let moved = false;
    for (const t of touches) {
      const prev = prevPositions.current.get(t.id);
      if (prev) {
        const dx = t.x - prev.x;
        const dy = t.y - prev.y;
        if (dx * dx + dy * dy > MOVEMENT_THRESHOLD * MOVEMENT_THRESHOLD) {
          moved = true;
        }
      }
      prevPositions.current.set(t.id, { x: t.x, y: t.y });
    }

    const activeIds = new Set(touches.map((t) => t.id));
    for (const id of prevPositions.current.keys()) {
      if (!activeIds.has(id)) {
        prevPositions.current.delete(id);
        moved = true;
      }
    }

    if (moved) {
      reset();
      return;
    }

    // Start countdown if not already running
    if (!isRunning.current) {
      startLoop();
    }
  }, [touches, minTouches, reset, startLoop]);

  // Reset when touch count changes
  const prevCountRef = useRef(touches.length);
  useEffect(() => {
    if (touches.length !== prevCountRef.current) {
      reset();
    }
    prevCountRef.current = touches.length;
  }, [touches.length, reset]);

  // Cleanup on unmount
  useEffect(() => stopLoop, [stopLoop]);

  return { isStable, progress, isCountingDown, reset };
}
