import type { ChampionBuild } from "../types/game";
import { getTopChampionAttributes } from "../data/champions/championAttributes";

type BuildSummaryProps = {
  build: ChampionBuild;
  compact?: boolean;
  hiddenInsights?: boolean;
};

export function BuildSummary({
  build,
  compact = false,
  hiddenInsights = false,
}: BuildSummaryProps) {
  const topAttributes = getTopChampionAttributes(build.champion, 2);
  const functionLabel = build.champion.classes.includes("Engager")
    ? "Iniciação"
    : build.champion.classes.includes("Tank")
      ? "Frontline"
      : build.champion.classes.includes("Enchanter")
        ? "Proteção"
        : build.champion.classes.includes("Marksman")
          ? "Dano contínuo"
          : build.champion.classes.includes("Assassin")
            ? "Pickoff"
            : "Controle";
  const primaryPower = Math.max(
    build.champion.stats.damageAD,
    build.champion.stats.damageAP,
  );

  return (
    <article
      className={`build-summary champion-summary ${compact ? "build-summary--compact" : ""}`}
    >
      <div className="build-summary__champion">
        <img src={build.champion.image} alt="" />
        <div>
          <p className="eyebrow">{build.role}</p>
          <h3>{build.champion.name}</h3>
          <span>{topAttributes[0]?.label ?? functionLabel}</span>
        </div>
        {!hiddenInsights ? (
          <div className="score-orb">
            <strong>{primaryPower}</strong>
            <span>poder</span>
          </div>
        ) : null}
      </div>
      {!compact && !hiddenInsights ? (
        <div className="champion-summary__stats">
          <span>
            Early <strong>{build.champion.stats.earlyPressure}</strong>
          </span>
          <span>
            Team fight <strong>{build.champion.stats.teamFight}</strong>
          </span>
          <span>
            Scaling <strong>{build.champion.stats.scaling}</strong>
          </span>
        </div>
      ) : hiddenInsights ? (
        <div className="build-summary__analysis">
          <span>Leitura estratégica oculta até o fim da campanha.</span>
        </div>
      ) : null}
    </article>
  );
}
