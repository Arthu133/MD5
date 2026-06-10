import type { SeriesResult, TournamentStage } from "../types/game";

type MatchHistoryProps = {
  series: SeriesResult[];
};

const stageLabels: Record<TournamentStage, string> = {
  Groups: "Fase de Grupos",
  Quarterfinals: "Quartas de Final",
  Semifinals: "Semifinal",
  Final: "Final MD5",
};

export function MatchHistory({ series }: MatchHistoryProps) {
  return (
    <section className="match-history panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CAMINHO DO TORNEIO</p>
          <h2>Adversários enfrentados</h2>
        </div>
      </div>
      <div className="match-list">
        {series.map((entry, index) => (
          <article
            className={`match-row tournament-row ${entry.won ? "is-win" : "is-loss"}`}
            key={`${entry.stage}-${entry.enemy.id}`}
          >
            <div className="match-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="match-opponent">
              <span>
                {stageLabels[entry.stage]} · {entry.enemy.tier}
              </span>
              <strong>{entry.enemy.name}</strong>
              <p>
                {entry.enemy.templateName} · Ameaça principal: {entry.enemy.mainThreat}
              </p>
              <div className="enemy-draft-line">
                {entry.enemy.simulatedDraft.map((build) => (
                  <span key={build.role}>
                    {build.role}: {build.champion.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="match-power">
              <span>Meta / Draft / Adaptação</span>
              <strong>
                {entry.enemy.metaRating}
                <small> / </small>
                {entry.enemy.draftCoherence}
                <small> / </small>
                {entry.enemy.rulesAdaptation}
              </strong>
            </div>
            <div className="series-score">
              <span>{entry.stage === "Groups" ? "Jogo único" : "Série MD5"}</span>
              <strong>
                {entry.userWins}<small> x </small>{entry.enemyWins}
              </strong>
              <em>{entry.won ? "VITÓRIA" : "DERROTA"}</em>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
