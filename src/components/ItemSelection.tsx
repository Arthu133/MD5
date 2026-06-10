import { useState } from "react";
import { calculateItemFit } from "../engine/itemEngine";
import type {
  ChampionProfile,
  GameDifficulty,
  Item,
} from "../types/game";
import { ItemCard } from "./ItemCard";

type ItemSelectionProps = {
  champion: ChampionProfile;
  difficulty: GameDifficulty;
  options: Item[];
  refreshesRemaining: number;
  onRefresh: () => void;
  onConfirm: (items: Item[]) => void;
};

export function ItemSelection({
  champion,
  difficulty,
  options,
  refreshesRemaining,
  onRefresh,
  onConfirm,
}: ItemSelectionProps) {
  const [selected, setSelected] = useState<Item[]>([]);

  const toggleItem = (item: Item) => {
    setSelected((current) => {
      if (current.some((selectedItem) => selectedItem.id === item.id)) {
        return current.filter((selectedItem) => selectedItem.id !== item.id);
      }
      if (current.length >= 3) return current;
      return [...current, item];
    });
  };

  return (
    <section className="selection-panel">
      <div className="selection-heading">
        <div className="selected-champion-chip">
          <img src={champion.image} alt="" />
          <div>
            <p className="eyebrow">Campeão escolhido</p>
            <strong>{champion.name}</strong>
          </div>
        </div>
        <div>
          <p className="step-kicker">ETAPA DE ITEMIZAÇÃO</p>
          <h2>Escolha 3 itens para {champion.name}</h2>
          <p>
            Leia os atributos e escolha os itens que reforçam sua função no draft.
          </p>
        </div>
        <div className="selection-heading__actions">
          <div className="selection-counter">
            <strong>{selected.length}</strong>
            <span>/ 3</span>
          </div>
          <button
            className="secondary-button refresh-button"
            type="button"
            disabled={refreshesRemaining === 0}
            onClick={onRefresh}
          >
            Atualizar opções ({refreshesRemaining})
          </button>
        </div>
      </div>

      <div className="item-grid">
        {options.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            fit={calculateItemFit(champion, item)}
            difficulty={difficulty}
            selected={selected.some((selectedItem) => selectedItem.id === item.id)}
            onToggle={toggleItem}
            disabled={selected.length >= 3}
          />
        ))}
      </div>

      <div className="sticky-confirm">
        <div>
          <span>Build atual</span>
          <strong>
            {selected.length === 0
              ? "Nenhum item escolhido"
              : selected.map((item) => item.name).join(" · ")}
          </strong>
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={selected.length !== 3}
          onClick={() => onConfirm(selected)}
        >
          Confirmar itens
        </button>
      </div>
    </section>
  );
}
