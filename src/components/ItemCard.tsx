import type {
  GameDifficulty,
  Item,
  ItemFitResult,
} from "../types/game";

export type ItemCardProps = {
  item: Item;
  fit?: ItemFitResult;
  difficulty: GameDifficulty;
  selected: boolean;
  onToggle: (item: Item) => void;
  disabled?: boolean;
};

export function ItemCard({
  item,
  fit,
  difficulty,
  selected,
  onToggle,
  disabled = false,
}: ItemCardProps) {
  return (
    <button
      type="button"
      className={`item-card ${selected ? "is-selected" : ""}`}
      onClick={() => onToggle(item)}
      disabled={disabled && !selected}
      aria-pressed={selected}
    >
      <div className="item-card__top">
        <img className="item-icon" src={item.icon} alt="" />
      </div>
      <div className="item-card__content">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="item-display-tags" aria-label="Atributos do item">
          {item.displayTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        {difficulty === "Classic" && fit ? (
          <div className={`item-fit item-fit--${fit.level.toLowerCase()}`}>
            <span>Compatibilidade</span>
            <strong>
              {fit.level === "Excellent"
                ? "Excelente"
                : fit.level === "Good"
                  ? "Bom"
                  : fit.level === "Average"
                    ? "Médio"
                    : fit.level === "Poor"
                      ? "Ruim"
                      : "Péssimo"}
            </strong>
          </div>
        ) : null}
      </div>
      <span className="item-card__check">
        {selected ? "Selecionado" : "Escolher"}
      </span>
    </button>
  );
}
