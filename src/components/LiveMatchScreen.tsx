import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateMatchTickMs,
  eventIsVisibleAtSpeed,
} from "../engine/liveMatchEngine";
import type {
  CampaignResult,
  SimulationMode,
  SimulationSpeed,
} from "../types/game";
import { CurrentEventSummary } from "./CurrentEventSummary";
import { LiveEventFeed } from "./LiveEventFeed";
import { LiveMiniMap } from "./LiveMiniMap";
import { LiveObjectivePanel } from "./LiveObjectivePanel";
import { LiveScoreboard } from "./LiveScoreboard";
import { LiveTimelineControls } from "./LiveTimelineControls";
import { MatchSummaryCard } from "./MatchSummaryCard";
import { SeriesScoreboard } from "./SeriesScoreboard";
import { TournamentProgress } from "./TournamentProgress";

type LiveMatchScreenProps = {
  result: CampaignResult;
  initialMode: SimulationMode;
  initialSpeed: SimulationSpeed;
  onTournamentFinished: () => void;
};

export function LiveMatchScreen({
  result,
  initialMode,
  initialSpeed,
  onTournamentFinished,
}: LiveMatchScreenProps) {
  const queue = useMemo(
    () =>
      result.series.flatMap((series, seriesIndex) =>
        series.games.map((match, gameIndex) => ({
          series,
          seriesIndex,
          gameIndex,
          match,
          simulation: match.liveSimulation,
        })),
      ),
    [result],
  );
  const [matchIndex, setMatchIndex] = useState(0);
  const [minute, setMinute] = useState(0);
  const [mode, setMode] = useState<SimulationMode>(initialMode);
  const [speed, setSpeed] = useState<SimulationSpeed>(initialSpeed);
  const [tickMs, setTickMs] = useState(() =>
    calculateMatchTickMs(initialSpeed, queue[0].simulation.durationMinutes),
  );
  const [paused, setPaused] = useState(false);
  const finishedRef = useRef(false);
  const current = queue[matchIndex];
  const simulation = current.simulation;
  const matchFinished = minute >= simulation.durationMinutes;
  const currentStats =
    simulation.statsByMinute[Math.min(minute, simulation.durationMinutes)];
  const revealedGames = current.series.games.slice(
    0,
    current.gameIndex + (matchFinished ? 1 : 0),
  );
  const seriesUserWins = revealedGames.filter((game) => game.win).length;
  const seriesEnemyWins = revealedGames.length - seriesUserWins;
  const showGroupStandings =
    matchFinished &&
    current.series.stage === "Groups" &&
    queue[matchIndex + 1]?.series.stage !== "Groups";
  const visibleEvents = simulation.events.filter(
    (event) =>
      event.minute <= minute && eventIsVisibleAtSpeed(event, speed),
  );

  const finishTournament = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onTournamentFinished();
  };

  useEffect(() => {
    setTickMs(calculateMatchTickMs(speed, simulation.durationMinutes));
  }, [simulation.durationMinutes, speed]);

  const goToNextMatch = () => {
    if (matchIndex >= queue.length - 1) {
      finishTournament();
      return;
    }
    setMatchIndex((currentIndex) => currentIndex + 1);
    setMinute(0);
    setPaused(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || finishedRef.current) return;
    if (!matchFinished) {
      const timer = window.setTimeout(
        () =>
          setMinute((currentMinute) =>
            Math.min(currentMinute + 1, simulation.durationMinutes),
          ),
        tickMs,
      );
      return () => window.clearTimeout(timer);
    }
    if (mode === "Manual") return;

    const timer = window.setTimeout(
      goToNextMatch,
      Math.max(500, Math.min(1_800, tickMs * 3)),
    );
    return () => window.clearTimeout(timer);
  }, [
    matchFinished,
    matchIndex,
    minute,
    mode,
    paused,
    simulation.durationMinutes,
    tickMs,
  ]);

  const nextEntry = queue[matchIndex + 1];
  const nextLabel = !nextEntry
    ? "Ver resultado final"
    : mode === "Manual"
      ? "Começar próximo jogo"
      : nextEntry.series.stage !== current.series.stage
        ? `Avançar para ${
            nextEntry.series.stage === "Quarterfinals"
              ? "as quartas"
              : nextEntry.series.stage === "Semifinals"
                ? "a semifinal"
                : "a final"
          }`
        : "Próxima partida";

  return (
    <main className="live-match-screen">
      <TournamentProgress
        result={result}
        currentSeries={current.series}
        currentMatchNumber={current.match.matchNumber}
        completedMatches={matchIndex + (matchFinished ? 1 : 0)}
        showGroupStandings={showGroupStandings}
      />
      {current.series.stage !== "Groups" ? (
        <SeriesScoreboard
          userTeamName={simulation.userTeamName}
          enemyTeamName={simulation.enemyName}
          userWins={seriesUserWins}
          enemyWins={seriesEnemyWins}
          gameNumber={current.gameIndex + 1}
        />
      ) : null}
      <div className="simulation-layout">
        <div className="simulation-layout__info">
          <LiveScoreboard simulation={simulation} stats={currentStats} />
          <CurrentEventSummary events={visibleEvents} currentMinute={minute} />
          <LiveObjectivePanel stats={currentStats} />
          {matchFinished ? (
            <MatchSummaryCard
              simulation={simulation}
              stats={currentStats}
              winner={simulation.finalWinner}
              seriesUserWins={seriesUserWins}
              seriesEnemyWins={seriesEnemyWins}
              nextLabel={nextLabel}
              onNext={goToNextMatch}
            />
          ) : null}
          <LiveTimelineControls
            mode={mode}
            speed={speed}
            paused={paused}
            matchFinished={matchFinished}
            tickMs={tickMs}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              setPaused(false);
            }}
            onSpeedChange={setSpeed}
            onTogglePause={() => setPaused((currentPaused) => !currentPaused)}
            onSkipMatch={() => setMinute(simulation.durationMinutes)}
            onSkipTournament={finishTournament}
          />
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
      <LiveEventFeed
        events={simulation.events}
        currentMinute={minute}
      />
    </main>
  );
}
