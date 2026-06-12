import { describe, expect, it } from "vitest";
import {
  championAttributeValidationErrors,
  championProfiles,
} from "../data/champions/championProfiles";
import {
  getChampionAttributeValue,
  getTopChampionAttributes,
} from "../data/champions/championAttributes";
import { generatedChampions } from "../data/champions/generatedChampions";
import {
  rogueCards,
  rogueCardValidationErrors,
} from "../data/rogueCards";
import type { DraftTeam, Role } from "../types/game";
import { ROLES } from "../types/game";
import {
  generateCounterMetaEnemy,
  validateEnemyDraft,
} from "./competitiveEnemyEngine";
import {
  CHAMPION_OPTION_COUNT,
  getRandomChampionsForRole,
} from "./draftEngine";
import {
  applyEventToStats,
  canDestroyNexus,
  calculateMatchTickMs,
  calculateProfessionalGameDuration,
  formatGoldDifference,
  getWinningLanePath,
  matchSimulationTimeBudgetMs,
} from "./liveMatchEngine";
import {
  addRogueCardToCampaign,
  applyRogueCardsToChampionStats,
  applyRogueCardsToLiveMatch,
  applyRogueCardsToMatchContext,
  applyRogueCardsToTeamScore,
  getRandomRogueCardOptions,
  refreshRogueCardOptions,
} from "./rogueCardEngine";
import { evaluateRogueCardContext } from "./rogueCardContextEngine";
import { calculateRoleFit } from "./roleEngine";
import {
  canUseRefresh,
  consumeRefresh,
  refreshByDifficulty,
} from "./refreshEngine";
import {
  advanceRogueCampaignState,
  createRogueCampaignState,
  getCampaignResult,
  prepareRogueCampaignMatch,
  simulateCampaign,
} from "./simulationEngine";
import {
  calculateObjectiveReadiness,
  calculateTeamScore,
} from "./synergyEngine";
import { analyzeTeamIdentity } from "./teamIdentityEngine";

const getChampion = (id: string) =>
  championProfiles.find((champion) => champion.id === id)!;

const createTeam = (
  championIds = ["Ornn", "Vi", "Orianna", "Jinx", "Lulu"],
): DraftTeam =>
  ROLES.map((role, index) => ({
    role,
    champion: getChampion(championIds[index]),
    items: [],
  }));

describe("MD5 roguelike engine", () => {
  it("validates individual attributes and distinct win conditions", () => {
    expect(championAttributeValidationErrors).toEqual([]);
    expect(championProfiles).toHaveLength(172);
    expect(
      championProfiles.every((champion) => champion.attributes.length >= 5),
    ).toBe(true);
    expect(
      championProfiles.every((champion) => champion.attributeTags.length >= 5),
    ).toBe(true);
    expect(getTopChampionAttributes(getChampion("Trundle"))).toHaveLength(3);
    const trundle = getChampion("Trundle");
    expect(getChampionAttributeValue(trundle, "antiTank")).toBeGreaterThanOrEqual(
      90,
    );
    expect(getChampionAttributeValue(trundle, "duelist")).toBeGreaterThanOrEqual(
      85,
    );

    const teamFight = analyzeTeamIdentity(createTeam());
    const sideLane = analyzeTeamIdentity(
      createTeam(["Fiora", "Nidalee", "TwistedFate", "Ezreal", "Bard"]),
    );
    expect(teamFight.primaryWinCondition).not.toBe(
      sideLane.primaryWinCondition,
    );
    expect(sideLane.secondaryWinConditions.length).toBeGreaterThan(0);
  });

  it("reads composition plans from contributors and required structure", () => {
    const scalingProtect = analyzeTeamIdentity(
      createTeam(["Ornn", "Vi", "Orianna", "Jinx", "Lulu"]),
    );
    expect(scalingProtect.primaryWinCondition).toBe("Scaling");
    expect(scalingProtect.scores["Protect the Carry"]).toBeGreaterThanOrEqual(60);

    const earlyEngage = analyzeTeamIdentity(
      createTeam(["Renekton", "LeeSin", "Pantheon", "Draven", "Nautilus"]),
    );
    expect(["Early Snowball", "Dive", "Hard Engage"]).toContain(
      earlyEngage.primaryWinCondition,
    );
    expect(earlyEngage.primaryWinCondition).not.toBe("Scaling");
    expect(earlyEngage.primaryWinCondition).not.toBe("Comeback");

    const splitMap = analyzeTeamIdentity(
      createTeam(["Fiora", "Nidalee", "TwistedFate", "Ezreal", "Bard"]),
    );
    const splitMapPlans = Object.entries(splitMap.scores)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 4)
      .map(([condition]) => condition);
    expect(splitMapPlans).toEqual(
      expect.arrayContaining(["Split Push", "Map Pressure", "Pickoff"]),
    );

    const pokeSiege = analyzeTeamIdentity(
      createTeam(["Jayce", "Nidalee", "Xerath", "Caitlyn", "Karma"]),
    );
    expect(pokeSiege.primaryWinCondition).toBe("Poke / Siege");

    const womboCombo = analyzeTeamIdentity(
      createTeam(["Malphite", "JarvanIV", "Orianna", "Twitch", "Leona"]),
    );
    expect(womboCombo.primaryWinCondition).toBe("Wombo Combo");
    expect(womboCombo.displayName).toBe("Comp do Montanha");
    expect(womboCombo.secondaryWinConditions).toEqual(
      expect.arrayContaining(["Team Fight 5v5", "Hard Engage"]),
    );
    expect(
      analyzeTeamIdentity(
        createTeam(["Malphite", "JarvanIV", "Orianna", "Jinx", "Leona"]),
      ).displayName,
    ).not.toBe("Comp do Montanha");

    const protectCarry = analyzeTeamIdentity(
      createTeam(["Ornn", "Ivern", "Orianna", "KogMaw", "Janna"]),
    );
    const protectPlans = Object.entries(protectCarry.scores)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 3)
      .map(([condition]) => condition);
    expect(protectPlans).toEqual(
      expect.arrayContaining(["Scaling", "Protect the Carry", "Front-to-Back"]),
    );

    const primaryPlans = [
      scalingProtect,
      earlyEngage,
      splitMap,
      pokeSiege,
      womboCombo,
      protectCarry,
    ].map((identity) => identity.primaryWinCondition);
    expect(new Set(primaryPlans).size).toBeGreaterThanOrEqual(5);
  });

  it("mantém campeões e um catálogo de cartas simples", () => {
    expect(generatedChampions.length).toBeGreaterThanOrEqual(170);
    expect(rogueCards.length).toBeGreaterThanOrEqual(45);
    expect(rogueCardValidationErrors).toEqual([]);
    expect(new Set(rogueCards.map((card) => card.id)).size).toBe(rogueCards.length);
    expect(rogueCards.every((card) => card.effects.length <= 4)).toBe(true);
    ["Dive Meta", "Poke Meta", "Protect the Carry", "Resistência Final"].forEach(
      (name) => expect(rogueCards.some((card) => card.name === name)).toBe(true),
    );
  });

  it("sorteia campeões sem repetir e mantém o modo difícil aberto", () => {
    const classic = getRandomChampionsForRole("Top", ["Aatrox"]);
    expect(CHAMPION_OPTION_COUNT).toBe(10);
    expect(classic).toHaveLength(CHAMPION_OPTION_COUNT);
    expect(new Set(classic.map((champion) => champion.id)).size).toBe(
      CHAMPION_OPTION_COUNT,
    );
    expect(classic.every((champion) => champion.roles.includes("Top"))).toBe(true);
    expect(classic.some((champion) => champion.id === "Aatrox")).toBe(false);
    const hard = getRandomChampionsForRole(
      "Jungle",
      ["Aatrox"],
      championProfiles.length,
      "Hard",
    );
    expect(hard.some((champion) => !champion.roles.includes("Jungle"))).toBe(true);
  });

  it("distingue flex de escolha inviável", () => {
    expect(calculateRoleFit(getChampion("Pantheon"), "Support", "Hard").level).toBe("Flex");
    expect(calculateRoleFit(getChampion("Jinx"), "Jungle", "Hard").score).toBeLessThan(30);
  });

  it("compartilha o Refresh global por dificuldade", () => {
    expect(refreshByDifficulty).toEqual({ Classic: 3, Hard: 1 });
    expect(canUseRefresh(1)).toBe(true);
    expect(canUseRefresh(0)).toBe(false);
    expect(consumeRefresh(3)).toBe(2);
    expect(consumeRefresh(1)).toBe(0);
  });

  it("sorteia três cartas únicas e troca a mão no Refresh", () => {
    const first = getRandomRogueCardOptions([], 3);
    const refreshed = refreshRogueCardOptions([], first, 3);
    expect(first).toHaveLength(3);
    expect(new Set(first.map((card) => card.id)).size).toBe(3);
    expect(refreshed).toHaveLength(3);
    expect(
      refreshed.some((card) => first.some((previous) => previous.id === card.id)),
    ).toBe(false);
  });

  it("acumula cartas e altera atributos, nota e regras ao vivo", () => {
    const team = createTeam();
    const baseScore = calculateTeamScore(team, "Classic");
    const cards = ["meta-agressivo", "jungle-dominante"].map(
      (id) => rogueCards.find((card) => card.id === id)!,
    );
    const active = cards.reduce(
      (current, card, index) =>
        addRogueCardToCampaign(current, card, {
          matchId: `Groups-${index + 1}`,
          stage: "Groups",
          userTeam: team,
          enemyTeam: team,
          enemyName: "Teste",
          enemyArchetype: "Balanced",
          activeCards: current,
          difficulty: "Classic",
        }),
      [] as ReturnType<typeof addRogueCardToCampaign>,
    );
    const enhanced = applyRogueCardsToChampionStats(team, active, "Groups");
    const score = applyRogueCardsToTeamScore(
      calculateTeamScore(enhanced, "Classic"),
      active,
      "Groups",
    );
    const rules = applyRogueCardsToLiveMatch(active);
    expect(active).toHaveLength(2);
    expect(
      enhanced.find((build) => build.role === "Jungle")!.champion.stats
        .objectiveControl,
    ).toBeGreaterThan(
      team.find((build) => build.role === "Jungle")!.champion.stats
        .objectiveControl,
    );
    expect(
      getChampionAttributeValue(
        enhanced.find((build) => build.role === "Jungle")!.champion,
        "junglePressure",
      ),
    ).toBeGreaterThan(
      getChampionAttributeValue(
        team.find((build) => build.role === "Jungle")!.champion,
        "junglePressure",
      ),
    );
    expect(score.metrics.earlyGame).toBeGreaterThan(baseScore.metrics.earlyGame);
    expect(rules.fightChanceMultiplier).toBeGreaterThan(1);
  });

  it("faz cartas temáticas influenciarem o plano sem decidir o jogo sozinhas", () => {
    const team = createTeam();
    const baseIdentity = analyzeTeamIdentity(team);
    const baseScore = calculateTeamScore(team, "Classic");
    const cases = [
      ["poke-meta", "Poke / Siege"],
      ["dive-meta", "Dive"],
      ["late-game-absoluto", "Scaling"],
      ["top-ilha", "Split Push"],
    ] as const;

    cases.forEach(([cardId, condition]) => {
      const selected = rogueCards.find((card) => card.id === cardId)!;
      const active = addRogueCardToCampaign([], selected, {
        matchId: `Groups-${cardId}`,
        stage: "Groups",
        userTeam: team,
        enemyTeam: team,
        enemyName: "Teste",
        enemyArchetype: "Balanced",
        activeCards: [],
        difficulty: "Classic",
      });
      const enhanced = applyRogueCardsToChampionStats(
        team,
        active,
        "Groups",
        "UserTeam",
      );
      const enhancedScore = applyRogueCardsToTeamScore(
        calculateTeamScore(enhanced, "Classic"),
        active,
        "Groups",
      );

      expect(analyzeTeamIdentity(enhanced).scores[condition]).toBeGreaterThan(
        baseIdentity.scores[condition],
      );
      expect(enhancedScore.total - baseScore.total).toBeLessThanOrEqual(12);
    });
  });

  it("reduz a nota com campeões fora de rota", () => {
    const champions = ["Aatrox", "LeeSin", "Ahri", "Jinx", "Lulu"].map(getChampion);
    const naturalRoles: Role[] = ["Top", "Jungle", "Mid", "Carry", "Support"];
    const badRoles: Role[] = ["Carry", "Mid", "Support", "Jungle", "Top"];
    const teamFor = (roles: Role[]): DraftTeam =>
      champions.map((champion, index) => ({
        champion,
        role: roles[index],
        items: [],
      }));
    const natural = calculateTeamScore(teamFor(naturalRoles), "Hard");
    const bad = calculateTeamScore(teamFor(badRoles), "Hard");
    expect(bad.metrics.roleFit).toBeLessThan(natural.metrics.roleFit);
    expect(bad.total).toBeLessThan(natural.total);
    expect(bad.roleWarnings.length).toBeGreaterThan(0);
  });

  it("gera adversário competitivo com cinco picks e sem itens", () => {
    const enemy = generateCounterMetaEnemy(
      calculateTeamScore(createTeam(), "Hard"),
      "Final",
      "Hard",
    );
    expect(enemy.simulatedDraft).toHaveLength(5);
    enemy.simulatedDraft.forEach((build) => {
      expect(build.champion.roles).toContain(build.role);
      expect(build.items).toHaveLength(0);
    });
    expect(enemy.rulesAdaptation).toBeGreaterThanOrEqual(55);
    expect(validateEnemyDraft(enemy.simulatedDraft).score).toBeGreaterThanOrEqual(60);
  });

  it("avança uma partida por escolha de carta", () => {
    const initial = createRogueCampaignState(createTeam(), "Classic");
    const prepared = prepareRogueCampaignMatch(
      initial,
      getRandomRogueCardOptions([], 1)[0],
    );
    const next = advanceRogueCampaignState(initial, prepared);
    expect(prepared.match.activeCards).toHaveLength(1);
    expect(next.series).toHaveLength(1);
    expect(next.groupIndex).toBe(1);
    expect(next.matchNumber).toBe(2);
    expect(
      prepared.match.liveSimulation.enemyDraft?.map(
        (build) => build.champion.id,
      ),
    ).toEqual(
      initial.currentEnemy.simulatedDraft.map((build) => build.champion.id),
    );
  });

  it("mantém a mesma carta e os mesmos modificadores durante uma MD5", () => {
    let state = createRogueCampaignState(createTeam(), "Classic");
    for (let group = 0; group < 3; group += 1) {
      const card = getRandomRogueCardOptions(state.activeCards, 1)[0];
      const prepared = prepareRogueCampaignMatch(state, card);
      state = advanceRogueCampaignState(state, {
        ...prepared,
        match: { ...prepared.match, win: true },
      });
    }

    expect(state.currentStage).toBe("Quarterfinals");
    const seriesCard = getRandomRogueCardOptions(state.activeCards, 1)[0];
    const firstGame = prepareRogueCampaignMatch(state, seriesCard);
    const afterFirstGame = advanceRogueCampaignState(state, firstGame);
    const secondGame = prepareRogueCampaignMatch(afterFirstGame);

    expect(secondGame.activeCards).toEqual(firstGame.activeCards);
    expect(secondGame.enemy.difficulty).toBe(firstGame.enemy.difficulty);
    expect(secondGame.match.activeCards!.at(-1)?.card.id).toBe(seriesCard.id);
  });

  it("aplica cartas aos dois drafts e oculta dicas no Difícil", () => {
    const userTeam = createTeam();
    const enemy = generateCounterMetaEnemy(
      calculateTeamScore(userTeam, "Classic"),
      "Groups",
      "Classic",
    );
    const card = rogueCards.find(
      (entry) => entry.id === "jungle-dominante",
    )!;
    const active = addRogueCardToCampaign([], card, {
      matchId: "Groups-1",
      stage: "Groups",
      userTeam,
      enemyTeam: enemy.simulatedDraft,
      enemyName: enemy.name,
      enemyArchetype: enemy.archetype,
      activeCards: [],
      difficulty: "Classic",
    });
    const context = applyRogueCardsToMatchContext(
      userTeam,
      enemy.simulatedDraft,
      active,
      {
        stage: "Groups",
        gameNumber: 1,
        matchNumber: 1,
        gameLabel: "Grupos · Jogo 1",
        difficulty: "Classic",
        expectedWinner: "User",
        userPower: 55,
        seriesUserWins: 0,
        seriesEnemyWins: 0,
      },
    );
    const originalUserJungle = userTeam.find(
      (build) => build.role === "Jungle",
    )!;
    const originalEnemyJungle = enemy.simulatedDraft.find(
      (build) => build.role === "Jungle",
    )!;
    expect(
      context.userTeam?.find((build) => build.role === "Jungle")?.champion
        .stats.objectiveControl,
    ).toBeGreaterThan(originalUserJungle.champion.stats.objectiveControl);
    expect(
      context.enemyTeam?.find((build) => build.role === "Jungle")?.champion
        .stats.objectiveControl,
    ).toBeGreaterThan(originalEnemyJungle.champion.stats.objectiveControl);
  });

  it("escolhe cartas por partida nos grupos e por série nas MD5", () => {
    const result = simulateCampaign(createTeam(), "Classic");
    expect(result.series.filter((entry) => entry.stage === "Groups")).toHaveLength(3);
    expect(result.groupWins + result.groupLosses).toBe(3);
    expect(result.activeCards).toHaveLength(result.series.length);
    result.series
      .filter((entry) => entry.stage !== "Groups")
      .forEach((series) => {
        expect(
          new Set(series.games.map((match) => match.activeCards!.length)).size,
        ).toBe(1);
        expect(
          new Set(
            series.games.map((match) => match.activeCards!.at(-1)?.card.id),
          ).size,
        ).toBe(1);
      });
    result.matches.forEach((match) => {
      const live = match.liveSimulation;
      expect(live.durationMinutes).toBeGreaterThanOrEqual(18);
      expect(live.durationMinutes).toBeLessThanOrEqual(55);
      expect(live.statsByMinute).toHaveLength(live.durationMinutes + 1);
      expect(live.events.at(-1)?.type).toBe("GameEnd");
      expect(live.finalWinner).toBe(match.win ? "User" : "Enemy");
      expect(
        canDestroyNexus(
          live.statsByMinute.at(-1)!.structures,
          live.finalWinner === "User" ? "Enemy" : "User",
        ),
      ).toBe(true);
    });
  });

  it("constrói resultado final do estado incremental", () => {
    let state = createRogueCampaignState(createTeam(), "Classic");
    let guard = 0;
    while (!state.finished && guard < 30) {
      const needsCard =
        state.currentStage === "Groups" || state.currentGames.length === 0;
      const card = needsCard
        ? getRandomRogueCardOptions(state.activeCards, 1)[0]
        : undefined;
      state = advanceRogueCampaignState(
        state,
        prepareRogueCampaignMatch(state, card),
      );
      guard += 1;
    }
    const result = getCampaignResult(state);
    expect(result.matches.length).toBe(result.wins + result.losses);
    expect(result.finalDiagnosis.length).toBeGreaterThan(40);
  });

  it("aplica modificadores de duração dentro dos limites ampliados", () => {
    const score = calculateTeamScore(createTeam(), "Classic");
    const enemy = generateCounterMetaEnemy(score, "Semifinals", "Classic");
    const card = rogueCards.find((entry) => entry.id === "jogo-travado")!;
    const active = addRogueCardToCampaign([], card, {
      matchId: "Semifinals-5",
      stage: "Semifinals",
      userTeam: createTeam(),
      enemyTeam: enemy.simulatedDraft,
      enemyName: enemy.name,
      enemyArchetype: enemy.archetype,
      activeCards: [],
      difficulty: "Classic",
    });
    const duration = calculateProfessionalGameDuration(score, enemy, {
      stage: "Semifinals",
      gameNumber: 2,
      matchNumber: 5,
      gameLabel: "Semifinal · Jogo 2",
      difficulty: "Classic",
      expectedWinner: "User",
      userPower: 58,
      seriesUserWins: 1,
      seriesEnemyWins: 0,
      activeCards: active,
      rogueModifiers: applyRogueCardsToLiveMatch(active),
    });
    expect(duration).toBeGreaterThanOrEqual(18);
    expect(duration).toBeLessThanOrEqual(55);
  });

  it("atualiza estruturas e formata a diferença de ouro", () => {
    const stats = {
      minute: 12,
      userKills: 2,
      enemyKills: 1,
      userGold: 20_000,
      enemyGold: 18_000,
      userTowers: 0,
      enemyTowers: 0,
      userDragons: 0,
      enemyDragons: 0,
      userHeralds: 0,
      enemyHeralds: 0,
      userBarons: 0,
      enemyBarons: 0,
      userInhibitors: 0,
      enemyInhibitors: 0,
      structures: {
        topTowersUser: 3,
        midTowersUser: 3,
        botTowersUser: 3,
        topTowersEnemy: 3,
        midTowersEnemy: 3,
        botTowersEnemy: 3,
        topInhibitorUserDestroyed: false,
        midInhibitorUserDestroyed: false,
        botInhibitorUserDestroyed: false,
        topInhibitorEnemyDestroyed: false,
        midInhibitorEnemyDestroyed: false,
        botInhibitorEnemyDestroyed: false,
      },
    };
    const updated = applyEventToStats(stats, {
      id: "tower-1",
      minute: 12,
      type: "TowerDestroyed",
      side: "User",
      mapZone: "TopLane",
      title: "Torre",
      description: "Torre derrubada",
      goldSwing: 550,
      importance: "Medium",
    });
    expect(updated.structures.topTowersEnemy).toBe(2);
    expect(getWinningLanePath(updated.structures, "Enemy")).toBe("TopLane");
    expect(formatGoldDifference(20_000, 18_000, "User").text).toBe("+2.0k");
  });

  it("respeita os limites de duração de todos os modos", () => {
    const duration = 35;
    (["Slow", "Normal", "Fast", "UltraFast"] as const).forEach((speed) => {
      expect(calculateMatchTickMs(speed, duration) * duration).toBeLessThanOrEqual(
        matchSimulationTimeBudgetMs[speed],
      );
    });
    expect(matchSimulationTimeBudgetMs).toEqual({
      Slow: 60_000,
      Normal: 10_000,
      Fast: 5_000,
      UltraFast: 2_000,
    });
    expect(calculateMatchTickMs("UltraFast", 35)).toBe(57);
  });

  it("registra as nove cartas contextuais com mecanicas distintas", () => {
    const expected = {
      "capitao-do-time": "TeamCaptain",
      "ultima-chance": "LastChance",
      "dive-irresponsavel": "RecklessDive",
      "draft-lendario": "LegendaryDraft",
      "erro-fatal": "FatalError",
      "jungler-culpado": "JungleFocus",
      "bot-gap": "BotFocus",
      "top-ilha": "TopIsland",
      "mid-kingdom": "MidKingdom",
    } as const;

    Object.entries(expected).forEach(([id, mechanic]) => {
      const card = rogueCards.find((entry) => entry.id === id);
      expect(card?.mechanic).toBe(mechanic);
      expect(card?.description.split(/\s+/).length).toBeLessThanOrEqual(12);
    });
  });

  it("oferece Ultima Chance apenas fora dos grupos", () => {
    const groupOptions = getRandomRogueCardOptions(
      [],
      rogueCards.length,
      [],
      {
        stage: "Groups",
        seriesUserWins: 0,
        seriesEnemyWins: 0,
      },
    );
    const knockoutOptions = getRandomRogueCardOptions(
      [],
      rogueCards.length,
      [],
      {
        stage: "Quarterfinals",
        seriesUserWins: 0,
        seriesEnemyWins: 1,
      },
    );

    expect(groupOptions.some((card) => card.id === "ultima-chance")).toBe(false);
    expect(knockoutOptions.some((card) => card.id === "ultima-chance")).toBe(true);
  });

  it("aplica cartas contextuais apenas ao lado indicado", () => {
    const team = createTeam();
    const card = rogueCards.find((entry) => entry.id === "jungler-culpado")!;
    const active = addRogueCardToCampaign([], card, {
      matchId: "Groups-1",
      stage: "Groups",
      userTeam: team,
      enemyTeam: team,
      enemyName: "Teste",
      enemyArchetype: "Balanced",
      activeCards: [],
      difficulty: "Classic",
    });
    const originalJungle = team.find((build) => build.role === "Jungle")!;
    const userTeam = applyRogueCardsToChampionStats(
      team,
      active,
      "Groups",
      "UserTeam",
    );
    const enemyTeam = applyRogueCardsToChampionStats(
      team,
      active,
      "Groups",
      "EnemyTeam",
    );

    expect(
      userTeam.find((build) => build.role === "Jungle")!.champion.stats
        .objectiveControl,
    ).toBeGreaterThan(originalJungle.champion.stats.objectiveControl);
    expect(
      enemyTeam.find((build) => build.role === "Jungle")!.champion.stats
        .objectiveControl,
    ).toBe(originalJungle.champion.stats.objectiveControl);
  });

  it("ativa comeback e risco contextual sem ultrapassar os limites", () => {
    const userTeam = createTeam();
    const enemyTeam = createTeam([
      "Renekton",
      "LeeSin",
      "Pantheon",
      "Draven",
      "Nautilus",
    ]);
    const userScore = calculateTeamScore(userTeam, "Classic");
    const enemyScore = calculateTeamScore(enemyTeam, "Classic");
    const activeFor = (id: string) => [
      {
        card: rogueCards.find((entry) => entry.id === id)!,
        pickedBeforeMatchId: "Quarterfinals-1",
        pickedAtStage: "Quarterfinals" as const,
      },
    ];
    const tied = evaluateRogueCardContext({
      userTeam,
      enemyTeam,
      userScore,
      enemyScore,
      activeCards: activeFor("ultima-chance"),
      difficulty: "Classic",
      stage: "Quarterfinals",
      seriesUserWins: 1,
      seriesEnemyWins: 1,
    });
    const behind = evaluateRogueCardContext({
      userTeam,
      enemyTeam,
      userScore,
      enemyScore,
      activeCards: activeFor("ultima-chance"),
      difficulty: "Classic",
      stage: "Quarterfinals",
      seriesUserWins: 0,
      seriesEnemyWins: 2,
    });
    const dive = evaluateRogueCardContext({
      userTeam: enemyTeam,
      enemyTeam: userTeam,
      userScore: enemyScore,
      enemyScore: userScore,
      activeCards: activeFor("dive-irresponsavel"),
      difficulty: "Classic",
      stage: "Quarterfinals",
      seriesUserWins: 0,
      seriesEnemyWins: 0,
    });

    expect(tied.userPowerDelta).toBe(0);
    expect(behind.userPowerDelta).toBeGreaterThan(0);
    expect(behind.userPowerDelta).toBeLessThanOrEqual(8);
    expect(dive.fightChanceMultiplier).toBeGreaterThan(1);
    expect(dive.varianceMultiplier).toBeGreaterThan(1);
    expect(dive.userPowerDelta).toBeLessThanOrEqual(8);
    expect(dive.enemyPowerDelta).toBeLessThanOrEqual(8);
  });

  it("faz todas as mecanicas contextuais alterarem a leitura da partida", () => {
    const userTeam = createTeam([
      "Fiora",
      "Nunu",
      "TwistedFate",
      "KogMaw",
      "Janna",
    ]);
    const enemyTeam = createTeam([
      "Ornn",
      "Ivern",
      "Soraka",
      "Vayne",
      "Yuumi",
    ]);
    const userScore = calculateTeamScore(userTeam, "Classic");
    const enemyScore = calculateTeamScore(enemyTeam, "Classic");
    const impactFor = (
      id: string,
      seriesUserWins = 0,
      seriesEnemyWins = 1,
    ) =>
      evaluateRogueCardContext({
        userTeam,
        enemyTeam,
        userScore,
        enemyScore,
        activeCards: [
          {
            card: rogueCards.find((entry) => entry.id === id)!,
            pickedBeforeMatchId: "Quarterfinals-1",
            pickedAtStage: "Quarterfinals",
          },
        ],
        difficulty: "Classic",
        stage: "Quarterfinals",
        seriesUserWins,
        seriesEnemyWins,
      });

    const captain = impactFor("capitao-do-time");
    const lastChance = impactFor("ultima-chance", 0, 2);
    const recklessDive = impactFor("dive-irresponsavel");
    const legendaryDraft = impactFor("draft-lendario");
    const fatalError = impactFor("erro-fatal");
    const jungleFocus = impactFor("jungler-culpado");
    const botFocus = impactFor("bot-gap");
    const topIsland = impactFor("top-ilha");
    const midKingdom = impactFor("mid-kingdom");

    expect(captain.captainName).toBeTruthy();
    expect(captain.userPowerDelta + captain.enemyPowerDelta).toBeGreaterThan(0);
    expect(lastChance.userPowerDelta).toBeGreaterThan(0);
    expect(recklessDive.fightChanceMultiplier).toBeGreaterThan(1);
    expect(legendaryDraft.userPowerDelta).toBeGreaterThan(0);
    expect(fatalError.varianceMultiplier).toBeGreaterThan(1);
    expect(
      jungleFocus.userObjectivePower + jungleFocus.enemyObjectivePower,
    ).toBeGreaterThan(0);
    expect(botFocus.userLanePressure.BotLane ?? 0).toBeGreaterThan(0);
    expect(topIsland.userLanePressure.TopLane ?? 0).toBeGreaterThan(0);
    expect(midKingdom.userLanePressure.MidLane ?? 0).toBeGreaterThan(0);
  });

  it("calcula objetivos pela composicao completa", () => {
    const objectiveTeam = createTeam([
      "Ornn",
      "Nunu",
      "Orianna",
      "Kalista",
      "Maokai",
    ]);
    const lowControlTeam = createTeam([
      "Fiora",
      "Shaco",
      "Katarina",
      "Vayne",
      "Yuumi",
    ]);
    const objectiveScore = calculateObjectiveReadiness(
      objectiveTeam,
      "Classic",
    );
    const lowControlScore = calculateObjectiveReadiness(
      lowControlTeam,
      "Classic",
    );

    expect(objectiveScore).toBeGreaterThan(lowControlScore);
    expect(objectiveScore - lowControlScore).toBeGreaterThanOrEqual(8);
    const finalObjectiveScore = calculateTeamScore(
      objectiveTeam,
      "Classic",
    ).metrics.objectiveControl;
    const finalLowControlScore = calculateTeamScore(
      lowControlTeam,
      "Classic",
    ).metrics.objectiveControl;
    expect(finalObjectiveScore).toBeGreaterThan(finalLowControlScore);
    expect(Math.abs(finalObjectiveScore - objectiveScore)).toBeLessThanOrEqual(3);
  });
});
