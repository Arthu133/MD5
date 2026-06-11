import type {
  GameDifficulty,
  TournamentStage,
} from "../types/game";

type RunPhase = "Draft" | "Review" | "Card" | "Match" | "Result";

type RunProgressProps = {
  phase: RunPhase;
  difficulty: GameDifficulty;
  stage?: TournamentStage;
  matchNumber?: number;
  seriesUserWins?: number;
  seriesEnemyWins?: number;
  activeCards?: number;
};

const phaseLabels: Record<RunPhase, string> = {
  Draft: "Draft",
  Review: "Elenco",
  Card: "Regra",
  Match: "Partida",
  Result: "Rank",
};

const phases = Object.keys(phaseLabels) as RunPhase[];

const stageLabels: Record<TournamentStage, string> = {
  Groups: "Grupos",
  Quarterfinals: "Quartas",
  Semifinals: "Semifinal",
  Final: "Final",
};

export function RunProgress({
  phase,
  difficulty,
  stage,
  matchNumber,
  seriesUserWins = 0,
  seriesEnemyWins = 0,
  activeCards = 0,
}: RunProgressProps) {
  const currentIndex = phases.indexOf(phase);
  const ruleLabel = `${activeCards} ${activeCards === 1 ? "regra" : "regras"}`;

  return (
    <section className="run-progress" aria-label="Progresso da run">
      <div className="run-progress__steps">
        {phases.map((entry, index) => (
          <span
            className={`${index < currentIndex ? "is-done" : ""} ${
              entry === phase ? "is-current" : ""
            }`}
            key={entry}
          >
            {phaseLabels[entry]}
          </span>
        ))}
      </div>
      <div className="run-progress__status">
        {stage ? <strong>{stageLabels[stage]}</strong> : null}
        {matchNumber ? <span>Jogo {matchNumber}</span> : null}
        {stage && stage !== "Groups" ? (
          <span>MD5 {seriesUserWins} x {seriesEnemyWins}</span>
        ) : null}
        <span>{ruleLabel}</span>
        <span>{difficulty === "Hard" ? "Difícil" : "Clássico"}</span>
      </div>
    </section>
  );
}
