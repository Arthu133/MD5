import type { LiveMatchStats } from "../types/game";

type LiveObjectivePanelProps = {
  stats: LiveMatchStats;
};

const objectiveRows = (stats: LiveMatchStats) => [
  ["Torres", stats.userTowers, stats.enemyTowers],
  ["Dragões", stats.userDragons, stats.enemyDragons],
  ["Arautos", stats.userHeralds, stats.enemyHeralds],
  ["Barões", stats.userBarons, stats.enemyBarons],
  ["Inibidores", stats.userInhibitors, stats.enemyInhibitors],
] as const;

export function LiveObjectivePanel({ stats }: LiveObjectivePanelProps) {
  return (
    <section className="live-objectives panel">
      <div className="live-panel-heading">
        <p className="eyebrow">CONTROLE DO MAPA</p>
        <h2>Objetivos</h2>
      </div>
      <div className="objective-list">
        {objectiveRows(stats).map(([label, userValue, enemyValue]) => (
          <div key={label}>
            <strong>{userValue}</strong>
            <span>{label}</span>
            <strong>{enemyValue}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
