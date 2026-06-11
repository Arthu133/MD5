import { useEffect, useState } from "react";
import { calculateMatchTickMs, eventIsVisibleAtSpeed } from "../engine/liveMatchEngine";
import type {
  GameDifficulty,
  MatchResult,
  SimulationMode,
  SimulationSpeed,
} from "../types/game";
import { ActiveRogueCardsPanel } from "./ActiveRogueCardsPanel";
import { LiveEventFeed } from "./LiveEventFeed";
import { LiveMiniMap } from "./LiveMiniMap";
import { LiveObjectivePanel } from "./LiveObjectivePanel";
import { LiveScoreboard } from "./LiveScoreboard";
import { LiveTimelineControls } from "./LiveTimelineControls";
import { RunProgress } from "./RunProgress";
import { SeriesScoreboard } from "./SeriesScoreboard";

type RogueLiveMatchProps = {
  match: MatchResult;
  difficulty: GameDifficulty;
  mode: SimulationMode;
  speed: SimulationSpeed;
  onModeChange: (mode: SimulationMode) => void;
  onSpeedChange: (speed: SimulationSpeed) => void;
  seriesUserWins: number;
  seriesEnemyWins: number;
  onContinue: () => void;
  onSkipTournament: () => void;
};

export function RogueLiveMatch({
  match,
  difficulty,
  mode,
  speed,
  onModeChange,
  onSpeedChange,
  seriesUserWins,
  seriesEnemyWins,
  onContinue,
  onSkipTournament,
}: RogueLiveMatchProps) {
  const simulation = match.liveSimulation;
  const [minute, setMinute] = useState(0);
  const [paused, setPaused] = useState(false);
  const tickMs = calculateMatchTickMs(speed, simulation.durationMinutes);
  const matchFinished = minute >= simulation.durationMinutes;
  const currentStats =
    simulation.statsByMinute[Math.min(minute, simulation.durationMinutes)];
  const visibleEvents = simulation.events.filter(
    (event) =>
      event.minute <= minute && eventIsVisibleAtSpeed(event, speed),
  );

  useEffect(() => {
    if (paused || matchFinished) return;
    const remainingMinutes = simulation.durationMinutes - minute;
    const deadlineReserveTicks =
      speed === "UltraFast" ? 3 : speed === "Fast" ? 2 : 1;
    const timer = window.setInterval(
      () => {
        setMinute((current) =>
          Math.min(current + 1, simulation.durationMinutes),
        );
      },
      tickMs,
    );
    const finishTimer = window.setTimeout(
      () => setMinute(simulation.durationMinutes),
      Math.max(
        80,
        tickMs * Math.max(remainingMinutes - deadlineReserveTicks, 1),
      ),
    );
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(finishTimer);
    };
  }, [
    matchFinished,
    match.matchNumber,
    paused,
    simulation.durationMinutes,
    simulation.id,
    speed,
    tickMs,
  ]);

  useEffect(() => {
    if (!matchFinished || mode === "Manual") return;
    const timer = window.setTimeout(onContinue, 900);
    return () => window.clearTimeout(timer);
  }, [matchFinished, mode, onContinue]);

  const finalUserWins = seriesUserWins + (match.win ? 1 : 0);
  const finalEnemyWins = seriesEnemyWins + (match.win ? 0 : 1);
  const seriesFinished =
    match.stage === "Groups" || finalUserWins >= 3 || finalEnemyWins >= 3;
  const nextLabel =
    match.stage === "Groups"
      ? match.matchNumber >= 3
        ? "Ver resultado dos grupos"
        : "Escolher próxima regra"
      : seriesFinished
        ? match.stage === "Final" || finalEnemyWins >= 3
          ? "Ver score final"
          : "Escolher regra da próxima fase"
        : `Iniciar Jogo ${match.gameNumber + 1}`;

  return (
    <main className="live-match-screen">
      <RunProgress
        phase="Match"
        difficulty={difficulty}
        stage={match.stage}
        matchNumber={match.gameNumber}
        seriesUserWins={matchFinished ? finalUserWins : seriesUserWins}
        seriesEnemyWins={matchFinished ? finalEnemyWins : seriesEnemyWins}
        activeCards={match.activeCards?.length ?? 0}
      />
      <div className="rogue-live-heading panel">
        <div>
          <p className="eyebrow">TORNEIO EM ANDAMENTO</p>
          <h2>{simulation.gameLabel}</h2>
        </div>
        <span>Jogo {match.gameNumber}</span>
      </div>
      {match.stage !== "Groups" ? (
        <SeriesScoreboard
          userTeamName={simulation.userTeamName}
          enemyTeamName={simulation.enemyName}
          userWins={matchFinished ? finalUserWins : seriesUserWins}
          enemyWins={matchFinished ? finalEnemyWins : seriesEnemyWins}
          gameNumber={match.gameNumber}
        />
      ) : null}
      {matchFinished ? (
        <div className="match-next-action">
          <button
            className="primary-button primary-button--large"
            type="button"
            onClick={onContinue}
          >
            {nextLabel}
          </button>
        </div>
      ) : null}
      <div className="simulation-shell">
        <aside className="live-control-sidebar">
          <LiveTimelineControls
            mode={mode}
            speed={speed}
            paused={paused}
            matchFinished={matchFinished}
            onModeChange={(nextMode) => {
              onModeChange(nextMode);
              setPaused(false);
            }}
            onSpeedChange={onSpeedChange}
            onTogglePause={() => setPaused((current) => !current)}
            onSkipMatch={() => setMinute(simulation.durationMinutes)}
            onSkipTournament={onSkipTournament}
          />
        </aside>
        <div className="simulation-layout">
          <div className="simulation-layout__info">
            <ActiveRogueCardsPanel
              activeCards={match.activeCards ?? []}
              compact
            />
            <LiveScoreboard simulation={simulation} stats={currentStats} />
            <LiveObjectivePanel stats={currentStats} />
          </div>
          <div className="simulation-layout__map">
            <LiveMiniMap
              currentMinute={minute}
              events={visibleEvents}
              stats={currentStats}
              userTeamName={simulation.userTeamName}
              enemyTeamName={simulation.enemyName}
            />
          </div>
        </div>
      </div>
      <LiveEventFeed events={simulation.events} currentMinute={minute} />
    </main>
  );
}
