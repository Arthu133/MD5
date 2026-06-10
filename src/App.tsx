import { useMemo, useState } from "react";
import { BuildSummary } from "./components/BuildSummary";
import { ChampionCard } from "./components/ChampionCard";
import { DraftBoard } from "./components/DraftBoard";
import { ItemSelection } from "./components/ItemSelection";
import { LiveMatchScreen } from "./components/LiveMatchScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TeamAnalysis } from "./components/TeamAnalysis";
import { DATA_DRAGON_VERSION } from "./data/champions/generatedChampions";
import { getRandomChampionsForRole } from "./engine/draftEngine";
import { getRandomItemsForChampion } from "./engine/itemEngine";
import {
  canUseRefresh,
  consumeRefresh,
  refreshByDifficulty,
} from "./engine/refreshEngine";
import { simulateCampaign } from "./engine/simulationEngine";
import { calculateTeamScore } from "./engine/synergyEngine";
import type {
  CampaignResult,
  ChampionProfile,
  DraftTeam,
  GameDifficulty,
  Item,
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
  const [selectedChampion, setSelectedChampion] = useState<ChampionProfile | null>(null);
  const [itemOptions, setItemOptions] = useState<Item[]>([]);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty | null>(null);
  const [refreshesRemaining, setRefreshesRemaining] = useState(0);
  const [itemRefreshVersion, setItemRefreshVersion] = useState(0);
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
    setSelectedChampion(null);
    setItemOptions([]);
    setResult(null);
    setRefreshesRemaining(refreshByDifficulty[difficulty]);
    setItemRefreshVersion(0);
    setChampionOptions(
      getRandomChampionsForRole(ROLES[0], [], 10, difficulty),
    );
    setStage("draft");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseChampion = (champion: ChampionProfile) => {
    setSelectedChampion(champion);
    setItemOptions(getRandomItemsForChampion(champion));
  };

  const refreshChampionOptions = () => {
    if (!difficulty || !canUseRefresh(refreshesRemaining)) return;
    const selectedIds = team.map((build) => build.champion.id);
    const withoutCurrentOptions = [
      ...selectedIds,
      ...championOptions.map((champion) => champion.id),
    ];
    const refreshed = getRandomChampionsForRole(
      currentRole,
      withoutCurrentOptions,
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

  const refreshItemOptions = () => {
    if (!selectedChampion || !canUseRefresh(refreshesRemaining)) return;
    setItemOptions(
      getRandomItemsForChampion(
        selectedChampion,
        9,
        itemOptions.map((item) => item.id),
      ),
    );
    setItemRefreshVersion((version) => version + 1);
    setRefreshesRemaining(consumeRefresh);
  };

  const confirmItems = (selectedItems: Item[]) => {
    if (!selectedChampion || selectedItems.length !== 3) return;
    const nextTeam: DraftTeam = [
      ...team,
      {
        role: currentRole,
        champion: selectedChampion,
        items: selectedItems,
      },
    ];
    setTeam(nextTeam);
    setSelectedChampion(null);
    setItemOptions([]);

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

  const runCampaign = () => {
    if (!difficulty) return;
    const campaignResult = simulateCampaign(team, difficulty);
    setResult(campaignResult);
    setStage("live");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => setStage("intro")}>
          <span className="brand__mark">M</span>
          <span>MD<strong>5</strong></span>
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
              <h1 className="md5-title">MD<span>5</span></h1>
              <h2>Monte seu draft. Escolha seus itens. Sobreviva ao mata-mata.</h2>
              <p>
                Escolha campeões reais, monte builds inteligentes e enfrente
                equipes competitivas em um torneio com fase de grupos e séries
                melhor de 5.
              </p>
              <div className="difficulty-selector" aria-label="Escolha a dificuldade">
                <button
                  className={`difficulty-card ${difficulty === "Classic" ? "is-selected" : ""}`}
                  type="button"
                  onClick={() => setDifficulty("Classic")}
                  aria-pressed={difficulty === "Classic"}
                >
                  <span>Clássico</span>
                  <small>
                    Mostra informações úteis. Ideal para aprender e testar composições.
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
                    Esconde detalhes. Você escolhe pelo conhecimento, leitura e intuição.
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
                <span className="map-node map-node--one">TOP</span>
                <span className="map-node map-node--two">MID</span>
                <span className="map-node map-node--three">BOT</span>
              </div>
              <div className="orbit orbit--one" />
              <div className="orbit orbit--two" />
              <div className="record-strip">
                <span>W</span><span>W</span><span>L</span><span>W</span><span>W</span>
              </div>
            </div>
          </section>
          <section className="intro-features md5-features" id="como-funciona">
            <article>
              <strong>01</strong>
              <span>Draft competitivo</span>
              <p>Escolha 1 campeão entre 10 opções para cada posição.</p>
            </article>
            <article>
              <strong>02</strong>
              <span>Builds que importam</span>
              <p>Selecione 3 entre 9 itens. Uma build ruim pode destruir o plano.</p>
            </article>
            <article>
              <strong>03</strong>
              <span>Meta e estratégia</span>
              <p>Adversários coerentes punem drafts previsíveis e frágeis.</p>
            </article>
            <article>
              <strong>04</strong>
              <span>Séries MD5</span>
              <p>Passe dos grupos e vença quartas, semifinal e final.</p>
            </article>
          </section>
          <section className="home-section role-showcase">
            <div className="home-section__heading">
              <p className="eyebrow">CINCO FUNÇÕES, UM PLANO</p>
              <h2>Monte uma composição completa</h2>
            </div>
            <div className="role-showcase__grid">
              {[
                ["T", "Top", "Frontline, duelo ou pressão lateral."],
                ["J", "Jungle", "Mapa, objetivos e ritmo de jogo."],
                ["M", "Mid", "Controle, burst ou presença global."],
                ["C", "Carry", "Dano constante e condição de vitória."],
                ["S", "Support", "Peel, engage, visão e proteção."],
              ].map(([icon, role, description]) => (
                <article key={role}>
                  <span>{icon}</span>
                  <h3>{role}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="home-section tournament-preview">
            <div className="home-section__heading">
              <p className="eyebrow">FORMATO COMPETITIVO</p>
              <h2>Um torneio, não sete partidas soltas</h2>
            </div>
            <div className="tournament-path">
              {[
                ["01", "Fase de Grupos", "3 confrontos"],
                ["02", "Quartas de Final", "MD5"],
                ["03", "Semifinal", "MD5"],
                ["04", "Final MD5", "Pelo título"],
              ].map(([number, title, detail], index) => (
                <article key={title}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                  {index < 3 ? <i>→</i> : null}
                </article>
              ))}
            </div>
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
                  POSIÇÃO {roleIndex + 1} DE 5 · MODO {difficulty === "Hard" ? "DIFÍCIL" : "CLÁSSICO"}
                </p>
                <h1>{selectedChampion ? "Feche a build" : `Escolha seu ${currentRole}`}</h1>
                <p>
                  {selectedChampion
                    ? "Três itens definem como este campeão entra na composição."
                    : "Dez opções. Uma escolha. Nenhum campeão se repete."}
                </p>
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
              {!selectedChampion ? (
                <button
                  className="secondary-button refresh-button"
                  type="button"
                  disabled={!canUseRefresh(refreshesRemaining)}
                  onClick={refreshChampionOptions}
                >
                  Atualizar opções ({refreshesRemaining})
                </button>
              ) : null}
            </div>

            {!selectedChampion ? (
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
            ) : (
              <ItemSelection
                key={`${selectedChampion.id}-${itemRefreshVersion}`}
                champion={selectedChampion}
                difficulty={difficulty ?? "Classic"}
                options={itemOptions}
                refreshesRemaining={refreshesRemaining}
                onRefresh={refreshItemOptions}
                onConfirm={confirmItems}
              />
            )}
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
                Grupos, quartas, semifinal e final vão testar a coerência desse draft.
              </p>
            </div>
            <div className="review-score">
              <span>
                {difficulty === "Hard" ? "Análise preliminar" : "Nota preliminar"}
              </span>
              {difficulty === "Hard" ? (
                <strong className="review-score__hidden">Oculta</strong>
              ) : (
                <strong>{teamScore.total}<small>/100</small></strong>
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
              <h2>O motor já encontrou riscos, mas não vai revelá-los agora.</h2>
              <p>
                Encaixe nas posições, compatibilidade dos itens e condição de
                vitória serão mostrados somente depois da simulação.
              </p>
            </section>
          )}
          <div className="simulation-setup panel">
            <div>
              <p className="eyebrow">TRANSMISSÃO DO TORNEIO</p>
              <h2>Como você quer acompanhar?</h2>
              <p>
                Acompanhe objetivos, lutas e pressão pelo mapa sem revelar o resultado.
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
              <small>
                No Manual, cada partida roda até o fim e você decide quando começa a próxima.
              </small>
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
              onClick={runCampaign}
            >
              Iniciar simulação
            </button>
          </div>
        </main>
      ) : null}

      {stage === "live" && result ? (
        <LiveMatchScreen
          result={result}
          initialMode={simulationMode}
          initialSpeed={simulationSpeed}
          onTournamentFinished={() => {
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
          League of Legends e propriedades associadas pertencem à Riot Games, Inc.
        </p>
      </footer>
    </div>
  );
}

export default App;
