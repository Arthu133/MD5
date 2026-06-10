import type { GameDifficulty, RogueCard } from "../types/game";
import { RogueCardEffectSummary } from "./RogueCardEffectSummary";

type RogueCardCardProps = {
  card: RogueCard;
  selected: boolean;
  difficulty: GameDifficulty;
  onSelect: () => void;
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
        <RogueCardEffectSummary card={card} />
      ) : (
        <div className="rogue-card__hidden-effect">
          Efeito detalhado oculto no modo Difícil
        </div>
      )}
    </button>
  );
}
