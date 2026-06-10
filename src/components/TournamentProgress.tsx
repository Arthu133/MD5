import type {
  CampaignResult,
  SeriesResult,
  TournamentStage,
} from "../types/game";

type TournamentProgressProps = {
  result: CampaignResult;
  currentSeries: SeriesResult;
  currentMatchNumber: number;
  completedMatches: number;
  showGroupStandings: boolean;
};

const stageLabels: Record<TournamentStage, string> = {
  Groups: "Grupos",
  Quarterfinals: "Quartas",
  Semifinals: "Semifinal",
  Final: "Final",
};

const tierWins = {
  Wildcard: 1,
  Regional: 1,
  Major: 2,
  Elite: 2,
  Champion: 3,
} as const;

export function TournamentProgress({
  result,
  currentSeries,
  currentMatchNumber,
  completedMatches,
  showGroupStandings,
}: TournamentProgressProps) {
  const stages: TournamentStage[] = [
    "Groups",
    "Quarterfinals",
    "Semifinals",
    "Final",
  ];
  const currentStageIndex = stages.indexOf(currentSeries.stage);
  const groupEnemies = result.series.filter((entry) => entry.stage === "Groups");
  const standings = [
    {
      name: "MD5",
      wins: result.groupWins,
      losses: result.groupLosses,
    },
    ...groupEnemies.map((entry) => {
      const wins = tierWins[entry.enemy.tier];
      return {
        name: entry.enemy.name,
        wins,
        losses: 3 - wins,
      };
    }),
  ].sort((left, right) => right.wins - left.wins);

  return (
    <section className="tournament-progress panel">
      <div className="tournament-progress__header">
        <div>
          <p className="eyebrow">TORNEIO EM ANDAMENTO</p>
          <h2>{stageLabels[currentSeries.stage]}</h2>
        </div>
        <span>Jogo {currentMatchNumber} · {completedMatches} concluídos</span>
      </div>
      <div className="live-stage-track">
        {stages.map((stage, index) => (
          <div
            className={`${index < currentStageIndex ? "is-done" : ""} ${index === currentStageIndex ? "is-current" : ""}`}
            key={stage}
          >
            <span>{index + 1}</span>
            <strong>{stageLabels[stage]}</strong>
          </div>
        ))}
      </div>
      {showGroupStandings ? (
        <div className="group-standings">
          <h3>Classificação do Grupo A</h3>
          {standings.map((entry, index) => (
            <div className={entry.name === "MD5" ? "is-user" : ""} key={entry.name}>
              <span>{index + 1}º</span>
              <strong>{entry.name}</strong>
              <small>{entry.wins}V · {entry.losses}D</small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
