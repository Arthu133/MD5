import type { GameDifficulty, RogueCard } from "../types/game";
import { RogueCardEffectSummary } from "./RogueCardEffectSummary";

type RogueCardCardProps = {
  card: RogueCard;
  selected: boolean;
  difficulty: GameDifficulty;
  onSelect: () => void;
};

const impactLabel = (card: RogueCard) => {
  const maxEffect = Math.max(
    ...card.effects.map((effect) =>
      effect.operation === "multiply"
        ? Math.abs((effect.value - 1) * 100)
        : Math.abs(effect.value),
    ),
    0,
  );
  return maxEffect >= 25 ? "Alto" : maxEffect >= 12 ? "Médio" : "Baixo";
};

const styleLabel = (card: RogueCard) => {
  const tag = card.tags.find((entry) =>
    ["engage", "scaling", "poke", "objective", "snowball", "teamfight"].includes(
      entry.toLowerCase(),
    ),
  );
  return tag ?? card.tags[0] ?? "Regra global";
};

const riskLabel = (card: RogueCard) => {
  const highRisk = card.effects.some(
    (effect) =>
      effect.rule === "enemyDraftQuality" && effect.value > 0,
  );
  const hasTradeoff = card.effects.some(
    (effect) =>
      effect.operation === "multiply" ? effect.value < 1 : effect.value < 0,
  );

  return highRisk ? "Alto" : hasTradeoff ? "Médio" : "Baixo";
};

export function RogueCardCard({
  card,
  selected,
  difficulty,
  onSelect,
}: RogueCardCardProps) {
  return (
    <button
      className={`rogue-card rogue-card--${card.rarity.toLowerCase()} ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="rogue-card__top">
        <span>{card.rarity}</span>
        <small>{card.tags.slice(0, 2).join(" · ")}</small>
      </div>
      <div className="rogue-card__sigil">M5</div>
      <h3>{card.name}</h3>
      <p>{card.description}</p>
      {difficulty === "Classic" ? (
        <div className="rogue-card__decision-tags">
          <span>Impacto {impactLabel(card)}</span>
          <span>Risco {riskLabel(card)}</span>
          <span>{styleLabel(card)}</span>
        </div>
      ) : null}
      <RogueCardEffectSummary card={card} />
    </button>
  );
}
