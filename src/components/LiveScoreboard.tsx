import type { LiveMatchSimulation, LiveMatchStats } from "../types/game";
import { GoldDifferenceBadge } from "./GoldDifferenceBadge";

type LiveScoreboardProps = {
  simulation: LiveMatchSimulation;
  stats: LiveMatchStats;
};

const formatGold = (gold: number) => `${(gold / 1000).toFixed(1)}k ouro`;

const phaseLabel = (minute: number) =>
  minute <= 14 ? "Early game" : minute <= 27 ? "Mid game" : "Late game";

export function LiveScoreboard({
  simulation,
  stats,
}: LiveScoreboardProps) {
  return (
    <section className="live-scoreboard panel">
      <div className="live-scoreboard__meta">
        <span>{simulation.gameLabel}</span>
        <small>{phaseLabel(stats.minute)}</small>
      </div>
      <div className="live-scoreboard__teams">
        <div className="live-team live-team--user">
          <span>SEU TIME</span>
          <strong>{simulation.userTeamName}</strong>
          <small>{formatGold(stats.userGold)}</small>
          <GoldDifferenceBadge
            userGold={stats.userGold}
            enemyGold={stats.enemyGold}
            side="User"
          />
        </div>
        <div className="live-kill-score">
          <strong>{stats.userKills}</strong>
          <div>
            <time>{String(stats.minute).padStart(2, "0")}:00</time>
            <span>ABATES</span>
          </div>
          <strong>{stats.enemyKills}</strong>
        </div>
        <div className="live-team live-team--enemy">
          <span>{simulation.enemyTier}</span>
          <strong>{simulation.enemyName}</strong>
          <small>{formatGold(stats.enemyGold)}</small>
          <GoldDifferenceBadge
            userGold={stats.userGold}
            enemyGold={stats.enemyGold}
            side="Enemy"
          />
        </div>
      </div>
      <div className="live-gold-track" aria-label="Comparação de ouro">
        <span
          style={{
            width: `${
              (stats.userGold / Math.max(stats.userGold + stats.enemyGold, 1)) *
              100
            }%`,
          }}
        />
      </div>
    </section>
  );
}
