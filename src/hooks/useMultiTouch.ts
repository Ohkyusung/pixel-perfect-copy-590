import { useCallback, useRef, useState } from "react";

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  colorIndex: number;
}

const colorIndexMap = new Map<number, number>();
let nextColorIndex = 0;

function getColorIndex(id: number): number {
  if (!colorIndexMap.has(id)) {
    colorIndexMap.set(id, nextColorIndex % 10);
    nextColorIndex++;
  }
  return colorIndexMap.get(id)!;
}

export function useMultiTouch() {
  const [touches, setTouches] = useState<TouchPoint[]>([]);
  const rafRef = useRef<number | null>(null);
  const touchesRef = useRef<TouchPoint[]>([]);

  const updateTouches = useCallback((touchList: TouchList) => {
    const newTouches: TouchPoint[] = [];
    for (let i = 0; i < touchList.length; i++) {
      const t = touchList[i];
      newTouches.push({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        colorIndex: getColorIndex(t.identifier),
      });
    }
    touchesRef.current = newTouches;

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setTouches([...touchesRef.current]);
        rafRef.current = null;
      });
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      updateTouches(e.touches);
    },
    [updateTouches]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      updateTouches(e.touches);
    },
    [updateTouches]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      updateTouches(e.touches);
      // Clean up removed touch IDs
      const activeIds = new Set<number>();
      for (let i = 0; i < e.touches.length; i++) {
        activeIds.add(e.touches[i].identifier);
      }
      for (const id of colorIndexMap.keys()) {
        if (!activeIds.has(id)) {
          colorIndexMap.delete(id);
        }
      }
    },
    [updateTouches]
  );

  const handleTouchCancel = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      updateTouches(e.touches);
    },
    [updateTouches]
  );

  const resetColorMap = useCallback(() => {
    colorIndexMap.clear();
    nextColorIndex = 0;
  }, []);

  return {
    touches,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    resetColorMap,
  };
}
