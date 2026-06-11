import { useEffect, useState } from "react";
import { calculateMatchTickMs, eventIsVisibleAtSpeed } from "../engine/liveMatchEngine";
import type {
  GameDifficulty,
  MatchResult,
  SimulationMode,
  SimulationSpeed,
} from "../types/game";
import { ActiveRogueCardsPanel } from "./ActiveRogueCardsPanel";
import { CurrentEventSummary } from "./CurrentEventSummary";
import { LiveEventFeed } from "./LiveEventFeed";
import { LiveMiniMap } from "./LiveMiniMap";
import { LiveObjectivePanel } from "./LiveObjectivePanel";
import { LiveScoreboard } from "./LiveScoreboard";
import { LiveTimelineControls } from "./LiveTimelineControls";
import { MatchSummaryCard } from "./MatchSummaryCard";
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
        seriesUserWins={seriesUserWins}
        seriesEnemyWins={seriesEnemyWins}
        activeCards={match.activeCards?.length ?? 0}
      />
      <div className="rogue-live-heading panel">
        <div>
          <p className="eyebrow">TORNEIO EM ANDAMENTO</p>
          <h2>{simulation.gameLabel}</h2>
        </div>
        <span>Jogo {match.matchNumber}</span>
      </div>
      {match.stage !== "Groups" ? (
        <SeriesScoreboard
          userTeamName={simulation.userTeamName}
          enemyTeamName={simulation.enemyName}
          userWins={seriesUserWins}
          enemyWins={seriesEnemyWins}
          gameNumber={match.gameNumber}
        />
      ) : null}
      <div className="simulation-shell">
        <aside className="live-control-sidebar">
          {matchFinished ? (
            <MatchSummaryCard
              simulation={simulation}
              stats={currentStats}
              winner={simulation.finalWinner}
              seriesUserWins={finalUserWins}
              seriesEnemyWins={finalEnemyWins}
              nextLabel={nextLabel}
              onNext={onContinue}
              compact
            />
          ) : null}
          <LiveTimelineControls
            mode={mode}
            speed={speed}
            paused={paused}
            matchFinished={matchFinished}
            tickMs={tickMs}
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
            <CurrentEventSummary events={visibleEvents} currentMinute={minute} />
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
