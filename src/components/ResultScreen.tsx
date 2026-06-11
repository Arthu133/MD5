import { useEffect, useMemo, useState } from "react";
import { generateShareText } from "../engine/diagnosisEngine";
import { calculateFinalRunScore } from "../scoring/finalScore";
import {
  loadLocalRecords,
  mostUsedEntry,
  recordLocalRun,
} from "../storage/localRecords";
import type { CampaignResult, DraftTeam, TournamentStage } from "../types/game";
import { MatchHistory } from "./MatchHistory";
import { RunProgress } from "./RunProgress";

type ResultScreenProps = {
  result: CampaignResult;
  team: DraftTeam;
  onRestart: () => void;
  onHome: () => void;
  onHardRematch: () => void;
};

const eliminatedTitles: Record<TournamentStage, string> = {
  Groups: "Run encerrada na fase de grupos",
  Quarterfinals: "Run encerrada nas quartas de final",
  Semifinals: "Run encerrada na semifinal",
  Final: "Run encerrada na final MD5",
};

const breakdownLabels = {
  campaign: "Campanha",
  matches: "Partidas",
  draft: "Draft",
  cards: "Cartas",
  difficulty: "Dificuldade",
  bonus: "Bônus",
} as const;

const formatPoints = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

export function ResultScreen({
  result,
  team,
  onRestart,
  onHome,
  onHardRematch,
}: ResultScreenProps) {
  const [copied, setCopied] = useState(false);
  const score = useMemo(() => calculateFinalRunScore(result), [result]);
  const [records, setRecords] = useState(loadLocalRecords);

  useEffect(() => {
    setRecords(recordLocalRun(result, team, score));
  }, [result, score, team]);

  const copyResult = async () => {
    await navigator.clipboard.writeText(
      `${generateShareText(result, team)}\nScore MD5: ${formatPoints(
        score.totalPoints,
      )} pontos · ${score.rank.name}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const resultTitle = result.champion
    ? "Você conquistou a MD5"
    : eliminatedTitles[result.eliminatedAt ?? "Groups"];

  return (
    <main className="result-screen final-score-screen">
      <RunProgress
        phase="Result"
        difficulty={result.difficulty}
        activeCards={result.activeCards?.length ?? 0}
      />

      <section
        className={`final-score-card rank-${score.rank.tier.toLowerCase()}`}
      >
        <div className="final-score-card__result">
          <p className="eyebrow">RESULTADO DA RUN</p>
          <h1>{resultTitle}</h1>
          <p>{score.rank.message}</p>
          <div className="final-run-record">
            <span>Campanha</span>
            <strong>
              {result.wins}V <small>·</small> {result.losses}D
            </strong>
          </div>
        </div>

        <div className="rank-emblem" aria-label={`Rank ${score.rank.name}`}>
          <span>{score.title}</span>
          <strong>{score.rank.name}</strong>
          <b>{formatPoints(score.totalPoints)} Pontos MD5</b>
          <div className="rank-progress">
            <i style={{ width: `${score.progressPercent}%` }} />
          </div>
          <small>
            {score.pointsToNextRank !== null && score.nextRankName
              ? `${formatPoints(score.pointsToNextRank)} pontos para ${
                  score.nextRankName
                }`
              : "Você alcançou o topo da classificação"}
          </small>
        </div>

        <div className="final-score-card__actions">
          <button className="primary-button" type="button" onClick={onRestart}>
            Jogar novamente
          </button>
          {result.difficulty === "Classic" ? (
            <button
              className="secondary-button"
              type="button"
              onClick={onHardRematch}
            >
              Revanche no modo difícil
            </button>
          ) : null}
          <button className="ghost-button" type="button" onClick={onHome}>
            Voltar ao início
          </button>
        </div>
      </section>

      <section className="final-score-grid">
        <article className="score-breakdown panel">
          <div className="score-panel-heading">
            <div>
              <p className="eyebrow">SEUS PONTOS</p>
              <h2>De onde vieram</h2>
            </div>
            <button className="ghost-button" type="button" onClick={copyResult}>
              {copied ? "Resultado copiado" : "Compartilhar"}
            </button>
          </div>
          <div className="score-breakdown__list">
            {Object.entries(score.breakdown).map(([key, value]) => (
              <span key={key}>
                {breakdownLabels[key as keyof typeof breakdownLabels]}
                <strong>+{formatPoints(value)}</strong>
              </span>
            ))}
          </div>
        </article>

        <article className="local-records panel">
          <p className="eyebrow">SEUS RECORDES</p>
          <h2>Melhor marca: {formatPoints(records.bestScore)}</h2>
          <div>
            <span>
              Melhor rank <strong>{records.bestRank}</strong>
            </span>
            <span>
              Melhor campanha <strong>{records.bestCampaignWins} vitórias</strong>
            </span>
            <span>
              Vitórias no difícil <strong>{records.hardModeWins}</strong>
            </span>
            <span>
              Campeão mais escolhido
              <strong>
                {mostUsedEntry(records.championPicks) ?? "Sem histórico"}
              </strong>
            </span>
          </div>
        </article>
      </section>

      <details className="result-details panel">
        <summary>
          <span>
            <strong>Rever campanha</strong>
            <small>Partidas e diagnóstico final</small>
          </span>
        </summary>
        <div className="result-details__content">
          <p>{result.finalDiagnosis}</p>
          <MatchHistory series={result.series} />
        </div>
      </details>
    </main>
  );
}
