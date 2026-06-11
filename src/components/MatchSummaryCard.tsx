import { formatGoldDifference } from "../engine/liveMatchEngine";
import type {
  LiveMatchSimulation,
  LiveMatchStats,
  MatchSide,
} from "../types/game";

type MatchSummaryCardProps = {
  simulation: LiveMatchSimulation;
  stats: LiveMatchStats;
  winner: MatchSide;
  seriesUserWins: number;
  seriesEnemyWins: number;
  nextLabel: string;
  onNext: () => void;
  compact?: boolean;
};

const decisivePriority: Partial<
  Record<LiveMatchSimulation["events"][number]["type"], number>
> = {
  ObjectiveSteal: 10,
  Ace: 9,
  BaronTaken: 8,
  TeamFight: 7,
  InhibitorDestroyed: 6,
  DragonTaken: 5,
};

const decisiveRole = (
  zone: LiveMatchSimulation["events"][number]["mapZone"] | undefined,
) => {
  if (!zone) return "Equipe";
  if (zone === "TopLane") return "Top";
  if (zone === "MidLane") return "Mid";
  if (zone === "BotLane") return "Carry";
  if (["TopJungle", "BotJungle", "DragonPit", "BaronPit", "River"].includes(zone)) {
    return "Jungle";
  }
  return "Support";
};

export function MatchSummaryCard({
  simulation,
  stats,
  winner,
  seriesUserWins,
  seriesEnemyWins,
  nextLabel,
  onNext,
  compact = false,
}: MatchSummaryCardProps) {
  const goldDifference = formatGoldDifference(
    stats.userGold,
    stats.enemyGold,
    winner,
  );
  const decisiveEvent = simulation.events
    .filter((event) => event.minute < simulation.durationMinutes)
    .sort(
      (left, right) =>
        (decisivePriority[right.type] ?? 0) -
          (decisivePriority[left.type] ?? 0) ||
        right.minute - left.minute,
    )[0];
  const decisiveCard = simulation.activeCards?.at(-1)?.card.name;

  return (
    <section
      className={`match-summary panel ${winner === "User" ? "is-win" : "is-loss"} ${compact ? "match-summary--compact" : ""}`}
    >
      <div className="match-summary__result">
        <p className="eyebrow">FIM DO JOGO {simulation.gameNumber}</p>
        <h2>
          {winner === "User"
            ? `Você venceu o Jogo ${simulation.gameNumber}`
            : `Você perdeu o Jogo ${simulation.gameNumber}`}
        </h2>
        <p>{simulation.finalReason}</p>
        {decisiveEvent ? (
          <div className="decisive-moment">
            <span>MOMENTO DECISIVO · {decisiveEvent.minute}:00</span>
            <strong>{decisiveEvent.description}</strong>
          </div>
        ) : null}
        <div className="match-summary__highlights">
          <span>
            Fator decisivo
            <strong>{decisiveEvent?.title ?? simulation.finalReason}</strong>
          </span>
          <span>
            Posição decisiva
            <strong>{decisiveRole(decisiveEvent?.mapZone)}</strong>
          </span>
          {decisiveCard ? (
            <span>
              Regra ativa <strong>{decisiveCard}</strong>
            </span>
          ) : null}
        </div>
      </div>
      <div className="match-summary__stats">
        <span>
          Duração <strong>{simulation.durationMinutes} min</strong>
        </span>
        <span>
          Abates <strong>{stats.userKills} x {stats.enemyKills}</strong>
        </span>
        <span>
          Ouro final <strong>{goldDifference.text}</strong>
        </span>
        <span>
          Torres <strong>{stats.userTowers} x {stats.enemyTowers}</strong>
        </span>
        <span>
          Dragões <strong>{stats.userDragons} x {stats.enemyDragons}</strong>
        </span>
        <span>
          Barões <strong>{stats.userBarons} x {stats.enemyBarons}</strong>
        </span>
        <span>
          Inibidores <strong>{stats.userInhibitors} x {stats.enemyInhibitors}</strong>
        </span>
        <span>
          {simulation.stage === "Groups" ? "Grupo" : "Série"}
          <strong>{seriesUserWins} x {seriesEnemyWins}</strong>
        </span>
      </div>
      <button className="primary-button" type="button" onClick={onNext}>
        {nextLabel}
      </button>
    </section>
  );
}
