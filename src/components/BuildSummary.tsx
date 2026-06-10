import { calculateBuildScore } from "../engine/buildEngine";
import type { ChampionBuild } from "../types/game";

type BuildSummaryProps = {
  build: ChampionBuild;
  compact?: boolean;
  hiddenInsights?: boolean;
};

const buildLabel = (score: number) => {
  if (score >= 85) return "Excelente";
  if (score >= 72) return "Boa";
  if (score >= 58) return "Instável";
  return "Arriscada";
};

export function BuildSummary({
  build,
  compact = false,
  hiddenInsights = false,
}: BuildSummaryProps) {
  const score = calculateBuildScore(build.champion, build.items);
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

  return (
    <article className={`build-summary ${compact ? "build-summary--compact" : ""}`}>
      <div className="build-summary__champion">
        <img src={build.champion.image} alt="" />
        <div>
          <p className="eyebrow">{build.role}</p>
          <h3>{build.champion.name}</h3>
          <span>{functionLabel}</span>
        </div>
        {!hiddenInsights ? (
          <div className="score-orb">
            <strong>{score.total}</strong>
            <span>build</span>
          </div>
        ) : null}
      </div>
      <div className="build-summary__items">
        {build.items.map((item) => (
          <div className="mini-item" key={item.id} title={item.description}>
            <img src={item.icon} alt="" />
            <small>{item.name}</small>
          </div>
        ))}
      </div>
      {!compact && !hiddenInsights ? (
        <div className="build-summary__analysis">
          <span>Build: <strong>{buildLabel(score.total)}</strong></span>
          <span>Pico: <strong>{score.spikeTiming}</strong></span>
          <p>{score.reasons[0] ?? score.warnings[0]}</p>
        </div>
      ) : hiddenInsights ? (
        <div className="build-summary__analysis">
          <span>Leitura estratégica oculta até a simulação.</span>
        </div>
      ) : null}
    </article>
  );
}
