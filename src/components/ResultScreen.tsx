import { useState } from "react";
import { generateShareText } from "../engine/diagnosisEngine";
import type { CampaignResult, DraftTeam, TournamentStage } from "../types/game";
import { BuildSummary } from "./BuildSummary";
import { MatchHistory } from "./MatchHistory";
import { TeamAnalysis } from "./TeamAnalysis";

type ResultScreenProps = {
  result: CampaignResult;
  team: DraftTeam;
  onRestart: () => void;
};

const stageLabels: Record<TournamentStage, string> = {
  Groups: "Grupos",
  Quarterfinals: "Quartas",
  Semifinals: "Semifinal",
  Final: "Final",
};

const consistencyLabel = (value: number) =>
  value >= 75 ? "Alta" : value >= 58 ? "Média" : "Baixa";

const hookForResult = (result: CampaignResult) => {
  if (result.champion) return "Campeão do MD5. O título foi merecido.";
  if (result.eliminatedAt === "Final") return "Vice-campeão. A final cobrou cada detalhe.";
  if (result.eliminatedAt === "Semifinals") return "A semifinal expôs o limite do seu plano.";
  if (result.eliminatedAt === "Quarterfinals") return "O mata-mata puniu as brechas do draft.";
  return "A fase de grupos não perdoou a inconsistência.";
};

export function ResultScreen({
  result,
  team,
  onRestart,
}: ResultScreenProps) {
  const [copied, setCopied] = useState(false);

  const copyResult = async () => {
    await navigator.clipboard.writeText(generateShareText(result, team));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="result-screen">
      <section className={`result-hero ${result.champion ? "is-perfect" : ""}`}>
        <div className="result-hero__glow" />
        <div className="result-score">
          <span>
            MD5 · MODO {result.difficulty === "Hard" ? "DIFÍCIL" : "CLÁSSICO"}
          </span>
          <strong className="tournament-result">
            {result.champion
              ? "CAMPEÃO"
              : stageLabels[result.eliminatedAt ?? "Groups"].toUpperCase()}
          </strong>
          <p>{hookForResult(result)}</p>
        </div>
        <div className="result-overview">
          <div>
            <span>Grupos</span>
            <strong>{result.groupWins}<small>-</small>{result.groupLosses}</strong>
          </div>
          <div>
            <span>Jogos totais</span>
            <strong>{result.wins}<small>-</small>{result.losses}</strong>
          </div>
          <div>
            <span>Nota</span>
            <strong>{result.teamScore.total}<small>/100</small></strong>
          </div>
          <div>
            <span>Consistência</span>
            <strong>{consistencyLabel(result.teamScore.metrics.consistency)}</strong>
          </div>
        </div>
        <div className="result-actions">
          <button className="primary-button" type="button" onClick={onRestart}>
            Jogar outro torneio
          </button>
          <button className="secondary-button" type="button" onClick={copyResult}>
            {copied ? "Campanha copiada" : "Copiar campanha"}
          </button>
        </div>
      </section>

      <section className="result-builds">
        {team.map((build) => (
          <BuildSummary build={build} compact key={build.role} />
        ))}
      </section>

      <TeamAnalysis score={result.teamScore} />
      <MatchHistory series={result.series} />

      <section className="diagnosis-grid">
        {result.teamScore.warnings.length ? (
          <article className="panel">
            <p className="eyebrow">LIMITES ESTRUTURAIS DA NOTA</p>
            <ul className="insight-list insight-list--warning">
              {result.teamScore.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </article>
        ) : null}
        <article className="panel">
          <p className="eyebrow">PONTOS FORTES</p>
          <ul className="insight-list insight-list--positive">
            {result.teamScore.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <p className="eyebrow">PONTOS FRACOS</p>
          <ul className="insight-list insight-list--negative">
            {(result.teamScore.weaknesses.length
              ? result.teamScore.weaknesses
              : ["Nenhuma fraqueza estrutural grave foi detectada."]
            ).map((weakness) => (
              <li key={weakness}>{weakness}</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <p className="eyebrow">AVISOS DE ITEMIZAÇÃO</p>
          <ul className="insight-list insight-list--warning">
            {(result.teamScore.itemWarnings.length
              ? result.teamScore.itemWarnings
              : ["As cinco builds mantiveram boa coerência."]
            ).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <p className="eyebrow">ENCAIXE NAS POSIÇÕES</p>
          <ul className="insight-list insight-list--warning">
            {(result.teamScore.roleWarnings.length
              ? result.teamScore.roleWarnings
              : ["Todos os campeões cumpriram funções naturais ou flexíveis."]
            ).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="final-diagnosis panel">
        <p className="eyebrow">DIAGNÓSTICO FINAL</p>
        <blockquote>{result.finalDiagnosis}</blockquote>
      </section>
    </main>
  );
}
