import { useMemo, useState } from "react";
import { BuildSummary } from "./components/BuildSummary";
import { ChampionCard } from "./components/ChampionCard";
import { DraftBoard } from "./components/DraftBoard";
import { ResultScreen } from "./components/ResultScreen";
import { RogueTournamentScreen } from "./components/RogueTournamentScreen";
import { RunProgress } from "./components/RunProgress";
import { DATA_DRAGON_VERSION } from "./data/champions/generatedChampions";
import {
  CHAMPION_OPTION_COUNT,
  getRandomChampionsForRole,
} from "./engine/draftEngine";
import {
  canUseRefresh,
  consumeRefresh,
  refreshByDifficulty,
} from "./engine/refreshEngine";
import { calculateTeamScore } from "./engine/synergyEngine";
import type {
  CampaignResult,
  ChampionProfile,
  DraftTeam,
  GameDifficulty,
  SimulationMode,
  SimulationSpeed,
} from "./types/game";
import { ROLES } from "./types/game";

type Stage = "intro" | "draft" | "review" | "live" | "result";

const qualityLabel = (value: number) =>
  value >= 75 ? "Alta" : value >= 55 ? "Média" : "Baixa";

function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [roleIndex, setRoleIndex] = useState(0);
  const [team, setTeam] = useState<DraftTeam>([]);
  const [championOptions, setChampionOptions] = useState<ChampionProfile[]>([]);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("Classic");
  const [showGuide, setShowGuide] = useState(false);
  const [refreshesRemaining, setRefreshesRemaining] = useState(0);
  const [simulationMode, setSimulationMode] =
    useState<SimulationMode>("Automatic");
  const [simulationSpeed, setSimulationSpeed] =
    useState<SimulationSpeed>("Normal");
  const currentRole = ROLES[roleIndex];
  const teamScore = useMemo(
    () =>
      team.length === 5 && difficulty
        ? calculateTeamScore(team, difficulty)
        : null,
    [difficulty, team],
  );

  const startDraftFor = (nextDifficulty: GameDifficulty) => {
    setDifficulty(nextDifficulty);
    setTeam([]);
    setRoleIndex(0);
    setResult(null);
    setRefreshesRemaining(refreshByDifficulty[nextDifficulty]);
    setChampionOptions(
      getRandomChampionsForRole(
        ROLES[0],
        [],
        CHAMPION_OPTION_COUNT,
        nextDifficulty,
      ),
    );
    setStage("draft");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startDraft = () => startDraftFor(difficulty);

  const chooseChampion = (champion: ChampionProfile) => {
    const nextTeam: DraftTeam = [
      ...team,
      { role: currentRole, champion, items: [] },
    ];
    setTeam(nextTeam);

    if (roleIndex === ROLES.length - 1) {
      setStage("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const nextIndex = roleIndex + 1;
    setRoleIndex(nextIndex);
    setChampionOptions(
      getRandomChampionsForRole(
        ROLES[nextIndex],
        nextTeam.map((build) => build.champion.id),
        CHAMPION_OPTION_COUNT,
        difficulty ?? "Classic",
      ),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshChampionOptions = () => {
    if (!difficulty || !canUseRefresh(refreshesRemaining)) return;
    const selectedIds = team.map((build) => build.champion.id);
    const excluded = [
      ...selectedIds,
      ...championOptions.map((champion) => champion.id),
    ];
    const refreshed = getRandomChampionsForRole(
      currentRole,
      excluded,
      CHAMPION_OPTION_COUNT,
      difficulty,
    );
    setChampionOptions(
      refreshed.length === CHAMPION_OPTION_COUNT
        ? refreshed
        : getRandomChampionsForRole(
            currentRole,
            selectedIds,
            CHAMPION_OPTION_COUNT,
            difficulty,
          ),
    );
    setRefreshesRemaining(consumeRefresh);
  };

  return (
    <div className={`app-shell app-shell--${stage}`}>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => setStage("intro")}>
          <span className="brand__mark">M</span>
          <span>
            MD<strong>5</strong>
          </span>
        </button>
        <div className="header-status">
          <span className="status-dot" />
          {stage === "intro"
            ? `Data Dragon ${DATA_DRAGON_VERSION}`
            : `Modo ${difficulty === "Hard" ? "Difícil" : "Clássico"}`}
        </div>
      </header>

      {stage === "intro" ? (
        <main className="intro">
          <section className="intro-hero md5-hero">
            <div className="intro-hero__grid" />
            <div className="intro-copy">
              <p className="step-kicker">META. DRAFT. MATA-MATA.</p>
              <h1 className="md5-title">
                MD<span>5</span>
              </h1>
              <h2>Monte seu draft. Acumule regras. Sobreviva ao mata-mata.</h2>
              <div
                className="difficulty-selector"
                aria-label="Escolha a dificuldade"
              >
                <button
                  className={`difficulty-card ${difficulty === "Classic" ? "is-selected" : ""}`}
                  type="button"
                  onClick={() => setDifficulty("Classic")}
                  aria-pressed={difficulty === "Classic"}
                >
                  <span>Clássico</span>
                  <small>3 Refresh · efeitos detalhados</small>
                </button>
                <button
                  className={`difficulty-card ${difficulty === "Hard" ? "is-selected" : ""}`}
                  type="button"
                  onClick={() => setDifficulty("Hard")}
                  aria-pressed={difficulty === "Hard"}
                >
                  <span>Difícil</span>
                  <small>1 Refresh · análises ocultas</small>
                </button>
              </div>
              <div className="hero-actions">
                <button
                  className="primary-button primary-button--large"
                  type="button"
                  onClick={startDraft}
                >
                  Jogar agora
                </button>
                <button
                  className="secondary-button primary-button--large"
                  type="button"
                  onClick={() => setShowGuide(true)}
                >
                  Como funciona
                </button>
              </div>
            </div>
            <div className="intro-visual" aria-hidden="true">
              <div className="rift-map">
                <span className="rift-lane rift-lane--top" />
                <span className="rift-lane rift-lane--mid" />
                <span className="rift-lane rift-lane--bot" />
                <span className="rift-river" />
                <div className="nexus-core">
                  <span>5</span>
                  <small>melhor de</small>
                </div>
              </div>
              <div className="orbit orbit--one" />
              <div className="orbit orbit--two" />
            </div>
          </section>
          <div className="intro-loop" aria-label="Fluxo do jogo">
            <span>Monte o draft</span>
            <span>Escolha a regra</span>
            <span>Vença a série</span>
            <span>Suba de rank</span>
          </div>
        </main>
      ) : null}

      {stage === "draft" ? (
        <main className="game-layout">
          <DraftBoard team={team} currentRole={currentRole} />
          <div className="game-content">
            <RunProgress phase="Draft" difficulty={difficulty} />
            <div className="progress-header">
              <div>
                <p className="step-kicker">
                  POSIÇÃO {roleIndex + 1} DE 5 · MODO{" "}
                  {difficulty === "Hard" ? "DIFÍCIL" : "CLÁSSICO"}
                </p>
                <h1>Escolha seu {currentRole}</h1>
              </div>
              <div className="role-progress">
                {ROLES.map((role, index) => (
                  <span
                    className={`${index < roleIndex ? "is-done" : ""} ${index === roleIndex ? "is-active" : ""}`}
                    key={role}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
              <button
                className="secondary-button refresh-button"
                type="button"
                disabled={!canUseRefresh(refreshesRemaining)}
                onClick={refreshChampionOptions}
              >
                Atualizar opções ({refreshesRemaining})
              </button>
            </div>
            <section className="champion-grid">
              {championOptions.map((champion) => (
                <ChampionCard
                  key={champion.id}
                  champion={champion}
                  role={currentRole}
                  onSelect={chooseChampion}
                  gameDifficulty={difficulty ?? "Classic"}
                />
              ))}
            </section>
          </div>
        </main>
      ) : null}

      {stage === "review" && teamScore ? (
        <main className="review-screen">
          <RunProgress phase="Review" difficulty={difficulty} />
          <div className="review-heading">
            <div>
              <p className="step-kicker">DRAFT COMPLETO</p>
              <h1>Seu elenco está inscrito.</h1>
            </div>
            <div className="review-score">
              <span>
                {difficulty === "Hard"
                  ? "Análise preliminar"
                  : "Nota preliminar"}
              </span>
              {difficulty === "Hard" ? (
                <strong className="review-score__hidden">Oculta</strong>
              ) : (
                <strong>
                  {teamScore.total}
                  <small>/100</small>
                </strong>
              )}
            </div>
          </div>
          <div className="review-layout">
            <aside className="review-control-sidebar">
              <div className="simulation-setup panel">
                <div className="simulation-option-group">
                  <span>Modo</span>
                  <div className="segmented-control">
                    <button
                      className={simulationMode === "Automatic" ? "is-active" : ""}
                      type="button"
                      onClick={() => setSimulationMode("Automatic")}
                    >
                      Automático
                    </button>
                    <button
                      className={simulationMode === "Manual" ? "is-active" : ""}
                      type="button"
                      onClick={() => setSimulationMode("Manual")}
                    >
                      Manual
                    </button>
                  </div>
                </div>
                <div className="simulation-option-group">
                  <span>Velocidade inicial</span>
                  <div className="segmented-control">
                    {([
                      ["Slow", "Devagar"],
                      ["Normal", "Normal"],
                      ["Fast", "Rápida"],
                      ["UltraFast", "Ultra rápida"],
                    ] as [SimulationSpeed, string][]).map(([value, label]) => (
                      <button
                        className={simulationSpeed === value ? "is-active" : ""}
                        type="button"
                        onClick={() => setSimulationSpeed(value)}
                        key={value}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="primary-button primary-button--large"
                  type="button"
                  onClick={() => {
                    setStage("live");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Escolher regra do Jogo 1
                </button>
              </div>
            </aside>
            <div className="review-content">
              <section className="review-builds">
                {team.map((build) => (
                  <BuildSummary
                    build={build}
                    key={build.role}
                    hiddenInsights={difficulty === "Hard"}
                    compact
                  />
                ))}
              </section>
              {difficulty === "Classic" ? (
                <section className="review-quick-read panel">
                  <div>
                    <p className="eyebrow">LEITURA RÁPIDA</p>
                    <h2>{teamScore.identity.primaryWinCondition}</h2>
                    <p>{teamScore.winCondition}</p>
                  </div>
                  <span>
                    Consistência
                    <strong>{qualityLabel(teamScore.metrics.consistency)}</strong>
                  </span>
                  <span>
                    Objetivos
                    <strong>
                      {qualityLabel(teamScore.metrics.objectiveControl)}
                    </strong>
                  </span>
                  <span>
                    Encaixe
                    <strong>{qualityLabel(teamScore.metrics.roleFit)}</strong>
                  </span>
                </section>
              ) : (
                <section className="blind-review panel">
                  <p className="eyebrow">MODO DIFÍCIL</p>
                  <h2>A leitura estratégica depende de você.</h2>
                </section>
              )}
            </div>
          </div>
        </main>
      ) : null}

      {stage === "live" && difficulty ? (
        <RogueTournamentScreen
          team={team}
          difficulty={difficulty}
          simulationMode={simulationMode}
          simulationSpeed={simulationSpeed}
          onModeChange={setSimulationMode}
          onSpeedChange={setSimulationSpeed}
          refreshesRemaining={refreshesRemaining}
          onConsumeRefresh={() => setRefreshesRemaining(consumeRefresh)}
          onComplete={(campaignResult) => {
            setResult(campaignResult);
            setStage("result");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : null}

      {stage === "result" && result ? (
        <ResultScreen
          result={result}
          team={team}
          onRestart={startDraft}
          onHardRematch={() => startDraftFor("Hard")}
          onHome={() => {
            setResult(null);
            setTeam([]);
            setStage("intro");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : null}

      {stage === "intro" ? (
        <footer className="site-footer">
          <p>
            MD5 é um fan project independente e não é endossado pela Riot Games.
          </p>
        </footer>
      ) : null}

      {showGuide ? (
        <div className="game-guide" role="dialog" aria-modal="true">
          <button
            className="game-guide__backdrop"
            type="button"
            aria-label="Fechar"
            onClick={() => setShowGuide(false)}
          />
          <section className="game-guide__panel panel">
            <p className="eyebrow">COMO FUNCIONA</p>
            <h2>Uma run rápida em quatro decisões</h2>
            <ol>
              <li>Monte um time com cinco campeões.</li>
              <li>Escolha regras que alteram o ritmo das partidas.</li>
              <li>Vença os grupos e as séries melhor de cinco.</li>
              <li>Receba Pontos MD5 e tente alcançar Desafiante.</li>
            </ol>
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowGuide(false)}
            >
              Entendi
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
