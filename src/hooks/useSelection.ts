import { useCallback } from "react";
import type { TouchPoint } from "./useMultiTouch";
import type { GameMode } from "../contexts/SettingsContext";

export interface SelectionResult {
  winners: number[]; // indices into touches array
  order?: number[]; // for "order" mode, maps index to order number
  teams?: { a: number[]; b: number[] }; // for "teams" mode
}

function secureRandom(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function shuffleSecure<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function useSelection() {
  const select = useCallback(
    (touches: TouchPoint[], mode: GameMode, pickCount: number): SelectionResult => {
      const indices = touches.map((_, i) => i);
      const shuffled = shuffleSecure(indices);

      switch (mode) {
        case "pick-one":
          return { winners: [shuffled[0]] };

        case "pick-n": {
          const count = Math.min(pickCount, touches.length - 1);
          return { winners: shuffled.slice(0, Math.max(1, count)) };
        }

        case "teams": {
          const half = Math.ceil(touches.length / 2);
          return {
            winners: shuffled,
            teams: {
              a: shuffled.slice(0, half),
              b: shuffled.slice(half),
            },
          };
        }

        case "order": {
          const order = new Array<number>(touches.length);
          shuffled.forEach((originalIdx, orderIdx) => {
            order[originalIdx] = orderIdx + 1;
          });
          return { winners: shuffled, order };
        }

        default:
          return { winners: [shuffled[0]] };
      }
    },
    []
  );

  return { select };
}
