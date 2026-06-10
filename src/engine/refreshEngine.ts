import type { GameDifficulty } from "../types/game";

export const refreshByDifficulty: Record<GameDifficulty, number> = {
  Classic: 3,
  Hard: 1,
};

export function canUseRefresh(refreshesRemaining: number): boolean {
  return refreshesRemaining > 0;
}

export function consumeRefresh(current: number): number {
  return Math.max(0, current - 1);
}
