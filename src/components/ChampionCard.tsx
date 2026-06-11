import type { ChampionProfile, GameDifficulty, Role } from "../types/game";
import { getTopChampionAttributes } from "../data/champions/championAttributes";

export type ChampionCardProps = {
  champion: ChampionProfile;
  role: Role;
  onSelect: (champion: ChampionProfile) => void;
  disabled?: boolean;
  gameDifficulty?: GameDifficulty;
};

export function ChampionCard({
  champion,
  role,
  onSelect,
  disabled = false,
  gameDifficulty = "Classic",
}: ChampionCardProps) {
  const hiddenInsights = gameDifficulty === "Hard";
  const topAttributes = getTopChampionAttributes(champion, 3);

  return (
    <button
      className="champion-card"
      type="button"
      onClick={() => onSelect(champion)}
      disabled={disabled}
      aria-label={`Escolher ${champion.name} para ${role}`}
    >
      <div className="champion-card__portrait">
        {champion.image ? (
          <img
            src={champion.image}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <span className="champion-card__role">{role}</span>
        <span className="champion-card__difficulty">{champion.difficulty}/10</span>
      </div>
      <div className="champion-card__body">
        <div>
          <p className="eyebrow">
            {hiddenInsights
              ? "ESCOLHA ÀS CEGAS"
              : champion.classes.slice(0, 2).join(" / ")}
          </p>
          <h3>{champion.name}</h3>
        </div>
        {!hiddenInsights ? (
          <span className={`damage-pill damage-pill--${champion.damageProfile.toLowerCase()}`}>
            {champion.damageProfile}
          </span>
        ) : null}
        {!hiddenInsights ? (
          <div className="champion-card__attributes">
            {topAttributes.map((attribute) => (
              <span key={attribute.key}>{attribute.label}</span>
            ))}
          </div>
        ) : null}
        <p>
          {hiddenInsights
            ? champion.title
              ? `${champion.name}, ${champion.title}.`
              : "Um campeão de Runeterra com ferramentas que você precisa interpretar."
            : champion.summary}
        </p>
        <div className="champion-card__footer">
          <span>
            {hiddenInsights
              ? `Dificuldade ${champion.difficulty}/10`
              : champion.tags.includes("engage")
                ? "Iniciação"
                : champion.tags.includes("poke")
                  ? "Poke"
                  : champion.classes[0]}
          </span>
          <strong>Selecionar</strong>
        </div>
      </div>
    </button>
  );
}
