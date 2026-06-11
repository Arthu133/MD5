import { useState } from "react";
import { getRogueCardMatchupInsight } from "../engine/rogueCardEngine";
import type {
  ActiveRogueCard,
  CompetitiveEnemyTeam,
  DraftTeam,
  GameDifficulty,
  RogueCard,
  TeamArchetype,
  TournamentStage,
} from "../types/game";
import { DraftComparisonPanel } from "./DraftComparisonPanel";
import { RogueCardCard } from "./RogueCardCard";
import { RunProgress } from "./RunProgress";

type RogueCardSelectionProps = {
  options: RogueCard[];
  activeCards: ActiveRogueCard[];
  userTeam: DraftTeam;
  userArchetype: TeamArchetype;
  difficulty: GameDifficulty;
  stage: TournamentStage;
  matchNumber: number;
  enemy: CompetitiveEnemyTeam;
  seriesUserWins: number;
  seriesEnemyWins: number;
  refreshesRemaining: number;
  onRefresh: () => void;
  onConfirm: (card: RogueCard) => void;
};

const stageLabels: Record<TournamentStage, string> = {
  Groups: "Fase de Grupos",
  Quarterfinals: "Quartas de Final",
  Semifinals: "Semifinal",
  Final: "Final MD5",
};

export function RogueCardSelection({
  options,
  activeCards,
  userTeam,
  userArchetype,
  difficulty,
  stage,
  matchNumber,
  enemy,
  seriesUserWins,
  seriesEnemyWins,
  refreshesRemaining,
  onRefresh,
  onConfirm,
}: RogueCardSelectionProps) {
  const [selected, setSelected] = useState<RogueCard | null>(null);
  const isGroupStage = stage === "Groups";
  const gameNumber = isGroupStage
    ? matchNumber
    : seriesUserWins + seriesEnemyWins + 1;
  const matchupInsight = selected
    ? getRogueCardMatchupInsight(
        selected,
        enemy.simulatedDraft,
        enemy.archetype,
        difficulty,
      )
    : null;

  return (
    <main className="rogue-selection-screen">
      <RunProgress
        phase="Card"
        difficulty={difficulty}
        stage={stage}
        matchNumber={gameNumber}
        seriesUserWins={seriesUserWins}
        seriesEnemyWins={seriesEnemyWins}
        activeCards={activeCards.length}
      />
      <section className="rogue-selection-heading">
        <div>
          <p className="step-kicker">
            PRÓXIMA PARTIDA · {stageLabels[stage]}
          </p>
          <h1>Escolha a regra que pode decidir o jogo.</h1>
          <p>
            {difficulty === "Classic" ? (
              <>
                Compare seu draft com <strong>{enemy.name}</strong> antes de
                decidir.
              </>
            ) : (
              <>
                <strong>{enemy.name}</strong> está definido. Decida pelos
                modificadores brutos da regra.
              </>
            )}{" "}
            {!isGroupStage ? "A escolha vale por toda esta série MD5." : null}
          </p>
        </div>
      </section>

      <div className="rogue-selection-layout">
        <aside className="rogue-selection-sidebar">
          <div className="rogue-next-match-score">
            <span>Partida {matchNumber}</span>
            <strong>
              {stage === "Groups"
                ? enemy.archetype
                : `MD5 · ${seriesUserWins} x ${seriesEnemyWins}`}
            </strong>
          </div>
          <div className="rogue-selection-confirm">
            <div>
              <span>Carta escolhida</span>
              <strong>{selected?.name ?? "Selecione uma das três opções"}</strong>
              {matchupInsight ? <p>{matchupInsight}</p> : null}
            </div>
            <div className="rogue-selection-confirm__actions">
              <button
                className="secondary-button"
                type="button"
                disabled={refreshesRemaining <= 0}
                onClick={() => {
                  setSelected(null);
                  onRefresh();
                }}
              >
                Rerrolar regras ({refreshesRemaining})
              </button>
              <button
                className="primary-button primary-button--large"
                type="button"
                disabled={!selected}
                onClick={() => selected && onConfirm(selected)}
              >
                Iniciar Jogo {gameNumber}
              </button>
            </div>
          </div>
        </aside>
        <section className="rogue-card-options">
          <div className="rogue-card-options__heading">
            <p className="eyebrow">ESCOLHA 1 DE 3</p>
            <h2>Regras disponíveis</h2>
          </div>
          <div className="rogue-card-grid">
            {options.map((card) => (
              <RogueCardCard
                card={card}
                difficulty={difficulty}
                selected={selected?.id === card.id}
                onSelect={() => setSelected(card)}
                key={card.id}
              />
            ))}
          </div>
        </section>
        <DraftComparisonPanel
          userTeam={userTeam}
          userArchetype={userArchetype}
          enemy={enemy}
          difficulty={difficulty}
        />
      </div>

    </main>
  );
}
