import type { TeamScore } from "../types/game";

type TeamAnalysisProps = {
  score: TeamScore;
};

const metricLabels: [keyof TeamScore["metrics"], string][] = [
  ["physicalDamage", "Dano físico"],
  ["magicDamage", "Dano mágico"],
  ["frontline", "Frontline"],
  ["engage", "Engage"],
  ["peel", "Peel"],
  ["crowdControl", "Controle"],
  ["scaling", "Scaling"],
  ["earlyGame", "Early game"],
  ["objectiveControl", "Objetivos"],
  ["itemization", "Itemização"],
  ["roleFit", "Encaixe nas posições"],
];

export function TeamAnalysis({ score }: TeamAnalysisProps) {
  return (
    <section className="team-analysis panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">LEITURA DO MOTOR</p>
          <h2>Análise da composição</h2>
        </div>
        <div className="archetype-badge">
          <span>Arquétipo</span>
          <strong>{score.archetype}</strong>
        </div>
      </div>
      <div className="metric-grid">
        {metricLabels.map(([key, label]) => (
          <div className="metric" key={key}>
            <div>
              <span>{label}</span>
              <strong>{score.metrics[key]}</strong>
            </div>
            <div className="metric__track">
              <span style={{ width: `${score.metrics[key]}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="score-diagnostics">
        <div>
          <span>Nota bruta</span>
          <strong>{score.rawTotal}</strong>
        </div>
        <div>
          <span>Coerência das builds</span>
          <strong>{score.buildCoherence}</strong>
        </div>
        <div>
          <span>Clareza da condição</span>
          <strong>{score.winConditionClarity}</strong>
        </div>
      </div>
      {score.scoreCap && score.scoreCap.finalCap < score.rawTotal ? (
        <div className="score-cap-warning">
          <span>NOTA LIMITADA A {score.scoreCap.finalCap}</span>
          <ul>
            {score.scoreCap.reasons.map((entry) => (
              <li key={`${entry.cap}-${entry.reason}`}>{entry.reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="win-condition">
        <span>Condição de vitória</span>
        <strong>{score.winCondition}</strong>
      </div>
    </section>
  );
}
