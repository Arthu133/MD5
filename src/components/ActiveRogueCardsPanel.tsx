import type { ActiveRogueCard } from "../types/game";

type ActiveRogueCardsPanelProps = {
  activeCards: ActiveRogueCard[];
  compact?: boolean;
};

export function ActiveRogueCardsPanel({
  activeCards,
  compact = false,
}: ActiveRogueCardsPanelProps) {
  return (
    <section className={`active-rogue-cards panel ${compact ? "is-compact" : ""}`}>
      <div className="active-rogue-cards__heading">
        <div>
          <p className="eyebrow">REGRAS ACUMULADAS</p>
          <h2>{activeCards.length} carta(s) ativa(s)</h2>
        </div>
        <span>Valem até o fim do torneio</span>
      </div>
      <div className="active-rogue-cards__list">
        {activeCards.map(({ card, pickedBeforeMatchId }) => (
          <article key={card.id} title={card.description}>
            <span>{card.rarity.slice(0, 1)}</span>
            <div>
              <strong>{card.name}</strong>
              {!compact ? <small>{card.description}</small> : null}
            </div>
            <em>{pickedBeforeMatchId}</em>
          </article>
        ))}
      </div>
    </section>
  );
}
