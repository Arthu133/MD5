import { formatGoldDifference } from "../engine/liveMatchEngine";
import type { MatchSide } from "../types/game";

type GoldDifferenceBadgeProps = {
  userGold: number;
  enemyGold: number;
  side: MatchSide;
};

export function GoldDifferenceBadge({
  userGold,
  enemyGold,
  side,
}: GoldDifferenceBadgeProps) {
  const difference = formatGoldDifference(userGold, enemyGold, side);

  return (
    <span
      className={`gold-difference gold-difference--${difference.status.toLowerCase()}`}
    >
      {difference.text}
    </span>
  );
}
