import { useMemo, useState } from "react";
import { BuildSummary } from "./components/BuildSummary";
import { ChampionCard } from "./components/ChampionCard";
import { DraftBoard } from "./components/DraftBoard";
import { ResultScreen } from "./components/ResultScreen";
import { RogueTournamentScreen } from "./components/RogueTournamentScreen";
import { TeamAnalysis } from "./components/TeamAnalysis";
import { DATA_DRAGON_VERSION } from "./data/champions/generatedChampions";
import { getRandomChampionsForRole } from "./engine/draftEngine";
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

function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [roleIndex, setRoleIndex] = useState(0);
  const [team, setTeam] = useState<DraftTeam>([]);
  const [championOptions, setChampionOptions] = useState<ChampionProfile[]>([]);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty | null>(null);
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

  const startDraft = () => {
    if (!difficulty) return;
    setTeam([]);
    setRoleIndex(0);
    setResult(null);
    setRefreshesRemaining(refreshByDifficulty[difficulty]);
    setChampionOptions(
      getRandomChampionsForRole(ROLES[0], [], 10, difficulty),
    );
    setStage("draft");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        10,
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
      10,
      difficulty,
    );
    setChampionOptions(
      refreshed.length === 10
        ? refreshed
        : getRandomChampionsForRole(currentRole, selectedIds, 10, difficulty),
    );
    setRefreshesRemaining(consumeRefresh);
  };

  return (
    <div className="app-shell">
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
              <p>
                Escolha campeões reais e transforme cada partida com cartas
                roguelike que permanecem ativas durante todo o torneio.
              </p>
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
                  <small>
                    3 Refresh globais e efeitos detalhados. Ideal para aprender
                    como as regras alteram o torneio.
                  </small>
                </button>
                <button
                  className={`difficulty-card ${difficulty === "Hard" ? "is-selected" : ""}`}
                  type="button"
                  onClick={() => setDifficulty("Hard")}
                  aria-pressed={difficulty === "Hard"}
                >
                  <span>Difícil</span>
                  <small>
                    1 Refresh global e números internos ocultos. Decida pela
                    leitura, conhecimento e intuição.
                  </small>
                </button>
              </div>
              <div className="hero-actions">
                <button
                  className="primary-button primary-button--large"
                  type="button"
                  onClick={startDraft}
                  disabled={!difficulty}
                >
                  Começar Draft
                </button>
                <button
                  className="secondary-button primary-button--large"
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("como-funciona")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
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
          <section className="intro-features md5-features" id="como-funciona">
            <article>
              <strong>01</strong>
              <span>Draft competitivo</span>
              <p>Escolha um campeão entre 10 opções para cada posição.</p>
            </article>
            <article>
              <strong>02</strong>
              <span>Cartas acumulativas</span>
              <p>Antes de cada jogo, escolha uma entre três regras permanentes.</p>
            </article>
            <article>
              <strong>03</strong>
              <span>Partidas transformadas</span>
              <p>Objetivos, mapa, duração, drafts e resultados obedecem às cartas.</p>
            </article>
            <article>
              <strong>04</strong>
              <span>Séries MD5</span>
              <p>Passe dos grupos e vença quartas, semifinal e final.</p>
            </article>
          </section>
        </main>
      ) : null}

      {stage === "draft" ? (
        <main className="game-layout">
          <DraftBoard team={team} currentRole={currentRole} />
          <div className="game-content">
            <div className="progress-header">
              <div>
                <p className="step-kicker">
                  POSIÇÃO {roleIndex + 1} DE 5 · MODO{" "}
                  {difficulty === "Hard" ? "DIFÍCIL" : "CLÁSSICO"}
                </p>
                <h1>Escolha seu {currentRole}</h1>
                <p>Dez opções. Uma escolha. Nenhum campeão se repete.</p>
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
          <div className="review-heading">
            <div>
              <p className="step-kicker">DRAFT COMPLETO</p>
              <h1>Seu elenco está inscrito.</h1>
              <p>
                A partir de agora, uma nova carta será escolhida antes de cada
                partida e ficará ativa até o fim da campanha.
              </p>
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
          <section className="review-builds">
            {team.map((build) => (
              <BuildSummary
                build={build}
                key={build.role}
                hiddenInsights={difficulty === "Hard"}
              />
            ))}
          </section>
          {difficulty === "Classic" ? (
            <TeamAnalysis score={teamScore} />
          ) : (
            <section className="blind-review panel">
              <p className="eyebrow">MODO DIFÍCIL</p>
              <h2>Os riscos estratégicos permanecem ocultos por enquanto.</h2>
              <p>
                Encaixe nas posições, condição de vitória e números das cartas
                serão revelados somente depois da campanha.
              </p>
            </section>
          )}
          <div className="simulation-setup panel">
            <div>
              <p className="eyebrow">TRANSMISSÃO DO TORNEIO</p>
              <h2>Como você quer acompanhar?</h2>
              <p>
                A escolha de cartas sempre será manual. O modo define apenas a
                passagem entre a partida encerrada e a próxima escolha.
              </p>
            </div>
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
              Escolher primeira carta
            </button>
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
          onDisableRefresh={() => setRefreshesRemaining(0)}
          onComplete={(campaignResult) => {
            setResult(campaignResult);
            setStage("result");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : null}

      {stage === "result" && result ? (
        <ResultScreen result={result} team={team} onRestart={startDraft} />
      ) : null}

      <footer className="site-footer">
        <p>
          MD5 é um fan project independente e não é endossado pela Riot Games.
          League of Legends e propriedades associadas pertencem à Riot Games,
          Inc.
        </p>
      </footer>
    </div>
  );
}

export default App;
