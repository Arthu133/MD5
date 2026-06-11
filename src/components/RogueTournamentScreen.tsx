import { useCallback, useState } from "react";
import {
  advanceRogueCampaignState,
  createRogueCampaignState,
  getCampaignResult,
  prepareRogueCampaignMatch,
  type PreparedRogueMatch,
  type RogueCampaignState,
} from "../engine/simulationEngine";
import {
  getRandomRogueCardOptions,
  refreshRogueCardOptions,
} from "../engine/rogueCardEngine";
import type {
  CampaignResult,
  DraftTeam,
  GameDifficulty,
  RogueCard,
  SimulationMode,
  SimulationSpeed,
} from "../types/game";
import { RogueCardSelection } from "./RogueCardSelection";
import { RogueLiveMatch } from "./RogueLiveMatch";

type RogueTournamentScreenProps = {
  team: DraftTeam;
  difficulty: GameDifficulty;
  simulationMode: SimulationMode;
  simulationSpeed: SimulationSpeed;
  onModeChange: (mode: SimulationMode) => void;
  onSpeedChange: (speed: SimulationSpeed) => void;
  refreshesRemaining: number;
  onConsumeRefresh: () => void;
  onDisableRefresh: () => void;
  onComplete: (result: CampaignResult) => void;
};

export function RogueTournamentScreen({
  team,
  difficulty,
  simulationMode,
  simulationSpeed,
  onModeChange,
  onSpeedChange,
  refreshesRemaining,
  onConsumeRefresh,
  onDisableRefresh,
  onComplete,
}: RogueTournamentScreenProps) {
  const [campaign, setCampaign] = useState<RogueCampaignState>(() =>
    createRogueCampaignState(team, difficulty),
  );
  const [options, setOptions] = useState(() =>
    getRandomRogueCardOptions([], 3),
  );
  const [prepared, setPrepared] = useState<PreparedRogueMatch | null>(null);

  const finishPreparedMatch = useCallback(() => {
    if (!prepared) return;
    const next = advanceRogueCampaignState(campaign, prepared);
    if (next.finished) {
      onComplete(getCampaignResult(next));
      return;
    }
    setCampaign(next);
    const needsCardChoice =
      next.currentStage === "Groups" || next.currentGames.length === 0;
    if (needsCardChoice) {
      setPrepared(null);
      setOptions(getRandomRogueCardOptions(next.activeCards, 3));
    } else {
      setPrepared(prepareRogueCampaignMatch(next));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [campaign, onComplete, prepared]);

  const chooseCard = (card: RogueCard) => {
    if (card.id === "sem-refresh") onDisableRefresh();
    setPrepared(prepareRogueCampaignMatch(campaign, card));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const skipTournament = () => {
    let next = prepared
      ? advanceRogueCampaignState(campaign, prepared)
      : campaign;
    let guard = 0;
    while (!next.finished && guard < 30) {
      const needsCard =
        next.currentStage === "Groups" || next.currentGames.length === 0;
      const card = needsCard
        ? getRandomRogueCardOptions(next.activeCards, 1)[0]
        : undefined;
      if (needsCard && !card) break;
      next = advanceRogueCampaignState(
        next,
        prepareRogueCampaignMatch(next, card),
      );
      guard += 1;
    }
    onComplete(getCampaignResult(next));
  };

  if (prepared) {
    return (
      <RogueLiveMatch
        key={prepared.match.matchNumber}
        match={prepared.match}
        difficulty={difficulty}
        mode={simulationMode}
        speed={simulationSpeed}
        onModeChange={onModeChange}
        onSpeedChange={onSpeedChange}
        seriesUserWins={campaign.currentUserWins}
        seriesEnemyWins={campaign.currentEnemyWins}
        onContinue={finishPreparedMatch}
        onSkipTournament={skipTournament}
      />
    );
  }

  return (
    <RogueCardSelection
      options={options}
      activeCards={campaign.activeCards}
      userTeam={campaign.team}
      userArchetype={campaign.teamScore.archetype}
      difficulty={difficulty}
      stage={campaign.currentStage}
      matchNumber={campaign.matchNumber}
      enemy={campaign.currentEnemy}
      seriesUserWins={campaign.currentUserWins}
      seriesEnemyWins={campaign.currentEnemyWins}
      refreshesRemaining={refreshesRemaining}
      onRefresh={() => {
        if (refreshesRemaining <= 0) return;
        setOptions(refreshRogueCardOptions(campaign.activeCards, options, 3));
        onConsumeRefresh();
      }}
      onConfirm={chooseCard}
    />
  );
}
