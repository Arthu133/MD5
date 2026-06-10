type SeriesScoreboardProps = {
  userTeamName: string;
  enemyTeamName: string;
  userWins: number;
  enemyWins: number;
  gameNumber: number;
  bestOf?: number;
};

const winDots = (wins: number, winsNeeded: number, label: string) =>
  Array.from({ length: winsNeeded }, (_, index) => (
    <span
      className={index < wins ? "is-won" : ""}
      key={`${label}-${index}`}
      aria-hidden="true"
    />
  ));

export function SeriesScoreboard({
  userTeamName,
  enemyTeamName,
  userWins,
  enemyWins,
  gameNumber,
  bestOf = 5,
}: SeriesScoreboardProps) {
  const winsNeeded = Math.ceil(bestOf / 2);
  const seriesFinished = userWins >= winsNeeded || enemyWins >= winsNeeded;
  const winner = userWins > enemyWins ? userTeamName : enemyTeamName;

  return (
    <section className="series-scoreboard panel" aria-label="Placar da série">
      <div className="series-scoreboard__heading">
        <div>
          <p className="eyebrow">SÉRIE MELHOR DE {bestOf}</p>
          <h2>
            {seriesFinished
              ? `${winner} venceu a série`
              : `Jogo ${gameNumber} · ${winsNeeded - Math.max(userWins, enemyWins)} vitória(s) para fechar`}
          </h2>
        </div>
        <strong>
          {userWins} — {enemyWins}
        </strong>
      </div>
      <div className="series-scoreboard__teams">
        <div className="series-scoreboard__team is-user">
          <span>{userTeamName}</span>
          <div className="series-scoreboard__dots">
            {winDots(userWins, winsNeeded, userTeamName)}
          </div>
        </div>
        <div className="series-scoreboard__team is-enemy">
          <span>{enemyTeamName}</span>
          <div className="series-scoreboard__dots">
            {winDots(enemyWins, winsNeeded, enemyTeamName)}
          </div>
        </div>
      </div>
    </section>
  );
}
