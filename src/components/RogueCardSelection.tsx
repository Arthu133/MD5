import { useState } from "react";
import { getRogueCardMatchupInsight } from "../engine/rogueCardEngine";
import type {
  ActiveRogueCard,
  CompetitiveEnemyTeam,
  GameDifficulty,
  RogueCard,
  TournamentStage,
} from "../types/game";
import { ActiveRogueCardsPanel } from "./ActiveRogueCardsPanel";
import { EnemyDraftPreview } from "./EnemyDraftPreview";
import { RogueCardCard } from "./RogueCardCard";

type RogueCardSelectionProps = {
  options: RogueCard[];
  activeCards: ActiveRogueCard[];
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
      <section className="rogue-selection-heading">
        <div>
          <p className="step-kicker">
            PRÓXIMA PARTIDA · {stageLabels[stage]}
          </p>
          <h1>Escolha a próxima regra.</h1>
          <p>
            O adversário já está definido. Analise o draft de{" "}
            <strong>{enemy.name}</strong> antes de aplicar uma regra{" "}
            {isGroupStage
              ? "para esta partida."
              : "que permanecerá por toda esta série MD5."}
          </p>
        </div>
        <div className="rogue-next-match-score">
          <span>Partida {matchNumber}</span>
          <strong>
            {stage === "Groups"
              ? enemy.archetype
              : `MD5 · ${seriesUserWins} x ${seriesEnemyWins}`}
          </strong>
        </div>
      </section>

      <section className="rogue-preparation-grid">
        <EnemyDraftPreview enemy={enemy} difficulty={difficulty} />
        <div className="rogue-card-options">
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
        </div>
      </section>

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
            Atualizar cartas ({refreshesRemaining})
          </button>
          <button
            className="primary-button primary-button--large"
            type="button"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
          >
            {isGroupStage
              ? "Aplicar e iniciar partida"
              : "Aplicar e iniciar série MD5"}
          </button>
        </div>
      </div>

      {activeCards.length ? (
        <ActiveRogueCardsPanel activeCards={activeCards} />
      ) : null}
    </main>
  );
}
