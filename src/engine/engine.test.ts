import { describe, expect, it } from "vitest";
import { championProfiles } from "../data/champions/championProfiles";
import { generatedChampions } from "../data/champions/generatedChampions";
import { items } from "../data/items";
import { competitiveCompTemplates } from "../data/meta/competitiveComps";
import { enemyOrganizations } from "../data/meta/enemyOrganizations";
import type { DraftTeam, Role } from "../types/game";
import { ROLES } from "../types/game";
import { applyItemsToChampion, calculateBuildScore } from "./buildEngine";
import {
  generateCounterMetaEnemy,
  generateMetaBuildForChampion,
  getChampionMetaRoleProfile,
  getMetaWeightedChampionForRole,
  validateEnemyDraft,
} from "./competitiveEnemyEngine";
import { getRandomChampionsForRole } from "./draftEngine";
import {
  calculateItemFit,
  getRandomItemsForChampion,
} from "./itemEngine";
import {
  applyEventToStats,
  canDestroyNexus,
  calculateMatchTickMs,
  calculateProfessionalGameDuration,
  formatGoldDifference,
  generateCurrentEventSummary,
  getWinningLanePath,
  matchSimulationTimeBudgetMs,
} from "./liveMatchEngine";
import { calculateRoleFit } from "./roleEngine";
import {
  canUseRefresh,
  consumeRefresh,
  refreshByDifficulty,
} from "./refreshEngine";
import { simulateCampaign } from "./simulationEngine";
import { calculateTeamScore } from "./synergyEngine";

const getChampion = (id: string) =>
  championProfiles.find((champion) => champion.id === id)!;

const createCompetitiveTeam = (): DraftTeam => {
  const template = competitiveCompTemplates.find(
    (entry) => entry.id === "front-to-back-scaling",
  )!;
  const championIds = ["Ornn", "Vi", "Orianna", "Jinx", "Lulu"];

  return ROLES.map((role, index) => {
    const champion = getChampion(championIds[index]);
    return {
      role,
      champion,
      items: generateMetaBuildForChampion(champion, role, template, 92),
    };
  });
};

const createTemplateTeam = (
  championIds: string[],
  templateId: string,
): DraftTeam => {
  const template = competitiveCompTemplates.find(
    (entry) => entry.id === templateId,
  )!;
  return ROLES.map((role, index) => {
    const champion = getChampion(championIds[index]);
    return {
      role,
      champion,
      items: generateMetaBuildForChampion(champion, role, template, 92),
    };
  });
};

describe("MD5 engine", () => {
  it("mantem o catalogo completo e opcoes suficientes por posicao", () => {
    expect(generatedChampions.length).toBeGreaterThanOrEqual(170);
    expect(items.length).toBeGreaterThanOrEqual(150);
    ROLES.forEach((role) => {
      expect(
        championProfiles.filter((champion) => champion.roles.includes(role)).length,
      ).toBeGreaterThanOrEqual(10);
    });
  });

  it("sorteia campeoes validos sem repetir selecionados", () => {
    const options = getRandomChampionsForRole("Top", ["Aatrox"]);
    expect(options).toHaveLength(10);
    expect(options.every((champion) => champion.roles.includes("Top"))).toBe(true);
    expect(new Set(options.map((champion) => champion.id)).size).toBe(10);
    expect(options.some((champion) => champion.id === "Aatrox")).toBe(false);
  });

  it("usa todo o catalogo no sorteio do modo dificil", () => {
    const options = getRandomChampionsForRole(
      "Jungle",
      ["Aatrox"],
      championProfiles.length,
      "Hard",
    );
    expect(options).toHaveLength(championProfiles.length - 1);
    expect(options.some((champion) => !champion.roles.includes("Jungle"))).toBe(true);
    expect(options.some((champion) => champion.id === "Aatrox")).toBe(false);
  });

  it("distingue escolhas flexiveis de picks inviaveis", () => {
    const pantheon = getChampion("Pantheon");
    const jinx = getChampion("Jinx");
    expect(calculateRoleFit(pantheon, "Support", "Hard").level).toBe("Flex");
    expect(calculateRoleFit(jinx, "Jungle", "Hard").score).toBeLessThan(30);
  });

  it("oferece nove itens unicos e variados", () => {
    const champion = getChampion("Ahri");
    const options = getRandomItemsForChampion(champion);
    const scores = options.map((item) => calculateItemFit(champion, item).score);
    expect(options).toHaveLength(9);
    expect(new Set(options.map((item) => item.id)).size).toBe(9);
    expect(new Set(options.map((item) => item.category)).size).toBeGreaterThan(4);
    expect(scores.filter((score) => score >= 75)).toHaveLength(4);
    expect(scores.filter((score) => score >= 45 && score < 75)).toHaveLength(3);
    expect(scores.filter((score) => score < 45)).toHaveLength(2);
    expect(options.every((item) => item.icon.endsWith(".svg"))).toBe(true);
    expect(options.every((item) => item.displayTags.length >= 3)).toBe(true);
  });

  it("mantem itens unicos em sorteios e evita a lista anterior no refresh", () => {
    const champion = getChampion("Ahri");
    Array.from({ length: 100 }).forEach(() => {
      const options = getRandomItemsForChampion(champion);
      expect(options).toHaveLength(9);
      expect(new Set(options.map((item) => item.id)).size).toBe(9);
    });

    const firstOptions = getRandomItemsForChampion(champion);
    const refreshedOptions = getRandomItemsForChampion(
      champion,
      9,
      firstOptions.map((item) => item.id),
    );
    expect(
      refreshedOptions.some((item) =>
        firstOptions.some((previous) => previous.id === item.id),
      ),
    ).toBe(false);
  });

  it("compartilha e limita o saldo global de refresh por dificuldade", () => {
    expect(refreshByDifficulty.Classic).toBe(3);
    expect(refreshByDifficulty.Hard).toBe(1);
    expect(canUseRefresh(1)).toBe(true);
    expect(canUseRefresh(0)).toBe(false);
    expect(consumeRefresh(3)).toBe(2);
    expect(consumeRefresh(1)).toBe(0);
    expect(consumeRefresh(0)).toBe(0);
  });

  it("valoriza AP para magos mais que critico puro", () => {
    const champion = getChampion("Ahri");
    const apItem = items.find((item) => item.category === "AP")!;
    const critItem = items.find((item) => item.category === "Marksman")!;
    expect(calculateItemFit(champion, apItem).score).toBeGreaterThan(
      calculateItemFit(champion, critItem).score,
    );
  });

  it("calcula e aplica uma build completa", () => {
    const champion = getChampion("Jinx");
    const buildItems = items
      .filter((item) => ["Marksman", "AD", "Scaling"].includes(item.category))
      .slice(0, 3);
    const score = calculateBuildScore(champion, buildItems);
    const enhanced = applyItemsToChampion(champion, buildItems);
    expect(score.total).toBeGreaterThan(50);
    expect(enhanced.enhancedStats.damageAD).toBeGreaterThan(champion.stats.damageAD);
  });

  it("reduz a nota quando os mesmos campeoes sao usados fora de rota", () => {
    const champions = ["Aatrox", "LeeSin", "Ahri", "Jinx", "Lulu"].map(
      getChampion,
    );
    const categories = ["Bruiser", "Assassin", "AP", "Marksman", "Enchanter"];
    const builds = champions.map((champion, index) => ({
      champion,
      items: items.filter((item) => item.category === categories[index]).slice(0, 3),
    }));
    const naturalRoles: Role[] = ["Top", "Jungle", "Mid", "Carry", "Support"];
    const badRoles: Role[] = ["Carry", "Mid", "Support", "Jungle", "Top"];
    const naturalTeam: DraftTeam = builds.map((build, index) => ({
      ...build,
      role: naturalRoles[index],
    }));
    const badTeam: DraftTeam = builds.map((build, index) => ({
      ...build,
      role: badRoles[index],
    }));

    const naturalScore = calculateTeamScore(naturalTeam, "Hard");
    const badScore = calculateTeamScore(badTeam, "Hard");
    expect(badScore.metrics.roleFit).toBeLessThan(naturalScore.metrics.roleFit);
    expect(badScore.total).toBeLessThan(naturalScore.total);
    expect(badScore.roleWarnings.length).toBeGreaterThan(0);
  });

  it("calibra oito cenarios de drafts bons e ruins", () => {
    const balanced = createCompetitiveTeam();
    const protectCarry = createTemplateTeam(
      ["Ornn", "Sejuani", "Orianna", "Jinx", "Lulu"],
      "protect-carry",
    );
    const poke = createTemplateTeam(
      ["Jayce", "Nidalee", "Ziggs", "Ezreal", "Karma"],
      "poke-siege",
    );
    const dive = createTemplateTeam(
      ["Camille", "Vi", "Ahri", "Kaisa", "Nautilus"],
      "dive-comp",
    );
    const fullAD = createTemplateTeam(
      ["Aatrox", "LeeSin", "Zed", "Jinx", "Pyke"],
      "early-objective",
    );
    const fragile = createTemplateTeam(
      ["Teemo", "Shaco", "Zed", "Jinx", "Senna"],
      "front-to-back-scaling",
    );
    const badCarry = protectCarry.map((build) =>
      build.role === "Carry"
        ? {
            ...build,
            items: items.filter((item) => item.category === "Tank").slice(0, 3),
          }
        : build,
    );
    const badJungle = balanced.map((build) =>
      build.role === "Jungle"
        ? {
            ...build,
            champion: getChampion("Jinx"),
            items: items
              .filter((item) => item.category === "Marksman")
              .slice(0, 3),
          }
        : build,
    );

    const scores = {
      balanced: calculateTeamScore(balanced, "Hard"),
      protectCarry: calculateTeamScore(protectCarry, "Hard"),
      poke: calculateTeamScore(poke, "Hard"),
      dive: calculateTeamScore(dive, "Hard"),
      fullAD: calculateTeamScore(fullAD, "Hard"),
      fragile: calculateTeamScore(fragile, "Hard"),
      badCarry: calculateTeamScore(badCarry, "Hard"),
      badJungle: calculateTeamScore(badJungle, "Hard"),
    };

    expect(scores.balanced.total).toBeGreaterThanOrEqual(78);
    expect(scores.protectCarry.total).toBeGreaterThanOrEqual(76);
    expect(scores.poke.total).toBeGreaterThanOrEqual(72);
    expect(scores.dive.total).toBeGreaterThanOrEqual(72);
    expect(scores.fullAD.total).toBeLessThanOrEqual(80);
    expect(scores.fragile.total).toBeLessThanOrEqual(62);
    expect(scores.badCarry.total).toBeLessThanOrEqual(60);
    expect(scores.badJungle.total).toBeLessThanOrEqual(65);
    expect(scores.badCarry.rawTotal).toBeGreaterThan(scores.badCarry.total);
    expect(scores.badCarry.warnings.length).toBeGreaterThan(0);
    expect(scores.badJungle.warnings.length).toBeGreaterThan(0);
  });

  it("mantem dez templates competitivos e vinte e quatro organizacoes", () => {
    expect(competitiveCompTemplates).toHaveLength(10);
    expect(new Set(competitiveCompTemplates.map((template) => template.id)).size).toBe(
      10,
    );
    expect(enemyOrganizations).toHaveLength(24);
    expect(new Set(enemyOrganizations.map((organization) => organization.id)).size).toBe(
      24,
    );
    expect(
      enemyOrganizations.some((organization) => organization.tier === "Champion"),
    ).toBe(true);
  });

  it("favorece picks S e A em alta dificuldade sem fixar um campeao", () => {
    const samples = Array.from({ length: 240 }, () => {
      const champion = getMetaWeightedChampionForRole(
        "Carry",
        96,
        "Protect the Carry",
        [],
      );
      return {
        id: champion.id,
        tier: getChampionMetaRoleProfile(champion, "Carry").tier,
      };
    });
    const highTierRate =
      samples.filter(({ tier }) => tier === "S" || tier === "A").length /
      samples.length;

    expect(highTierRate).toBeGreaterThan(0.62);
    expect(new Set(samples.map(({ id }) => id)).size).toBeGreaterThan(5);
  });

  it("gera finalista com picks funcionais, builds completas e draft validado", () => {
    const team = createCompetitiveTeam();
    const score = calculateTeamScore(team, "Hard");
    const enemy = generateCounterMetaEnemy(score, "Final", "Hard");
    const validation = validateEnemyDraft(enemy.simulatedDraft);

    expect(enemy.simulatedDraft).toHaveLength(5);
    expect(new Set(enemy.simulatedDraft.map((build) => build.champion.id)).size).toBe(5);
    enemy.simulatedDraft.forEach((build) => {
      expect(build.champion.roles).toContain(build.role);
      expect(build.items).toHaveLength(3);
      expect(new Set(build.items.map((item) => item.id)).size).toBe(3);
    });
    expect(enemy.tier === "Elite" || enemy.tier === "Champion").toBe(true);
    expect(enemy.metaRating).toBeGreaterThanOrEqual(65);
    expect(enemy.draftCoherence).toBeGreaterThanOrEqual(65);
    expect(enemy.itemizationQuality).toBeGreaterThanOrEqual(65);
    expect(validation.score).toBeGreaterThanOrEqual(70);
  });

  it("simula grupos e series MD5 quando o time avanca", () => {
    const result = simulateCampaign(createCompetitiveTeam(), "Classic");
    const groupSeries = result.series.filter((series) => series.stage === "Groups");
    const knockoutSeries = result.series.filter((series) => series.stage !== "Groups");

    expect(groupSeries).toHaveLength(3);
    expect(groupSeries.every((series) => series.games.length === 1)).toBe(true);
    expect(result.groupWins + result.groupLosses).toBe(3);
    expect(result.series.length).toBeGreaterThanOrEqual(3);
    expect(result.series.length).toBeLessThanOrEqual(6);
    knockoutSeries.forEach((series) => {
      expect(Math.max(series.userWins, series.enemyWins)).toBe(3);
      expect(series.games.length).toBeGreaterThanOrEqual(3);
      expect(series.games.length).toBeLessThanOrEqual(5);
    });
    result.matches.forEach((match) => {
      const live = match.liveSimulation;
      expect(live.durationMinutes).toBeGreaterThanOrEqual(23);
      expect(live.durationMinutes).toBeLessThanOrEqual(48);
      expect(live.statsByMinute).toHaveLength(live.durationMinutes + 1);
      expect(live.events.at(-1)?.type).toBe("GameEnd");
      expect(live.events.every((event) => Boolean(event.mapZone))).toBe(true);
      expect(live.finalWinner).toBe(match.win ? "User" : "Enemy");
      expect(
        live.events
          .filter((event) => event.type === "BaronTaken")
          .every((event) => event.minute >= 20),
      ).toBe(true);
      const loserSide = live.finalWinner === "User" ? "Enemy" : "User";
      expect(
        canDestroyNexus(live.statsByMinute.at(-1)!.structures, loserSide),
      ).toBe(true);
      live.events
        .filter((event) => event.type === "InhibitorDestroyed")
        .forEach((event) => {
          const lane =
            event.mapZone === "TopLane"
              ? "top"
              : event.mapZone === "BotLane"
                ? "bot"
                : "mid";
          const defendingSide = event.side === "User" ? "Enemy" : "User";
          const towerKey =
            `${lane}Towers${defendingSide}` as keyof (typeof live.statsByMinute)[number]["structures"];
          expect(
            live.statsByMinute[event.minute].structures[towerKey],
          ).toBe(0);
        });
    });
  });

  it("concentra duracoes profissionais entre 28 e 38 minutos", () => {
    const team = createCompetitiveTeam();
    const score = calculateTeamScore(team, "Classic");
    const enemy = generateCounterMetaEnemy(score, "Semifinals", "Classic");
    const context = {
      stage: "Semifinals" as const,
      gameNumber: 2,
      matchNumber: 5,
      gameLabel: "Semifinal · Jogo 2",
      difficulty: "Classic" as const,
      expectedWinner: "User" as const,
      userPower: 58,
      seriesUserWins: 1,
      seriesEnemyWins: 0,
    };
    const durations = Array.from({ length: 240 }, () =>
      calculateProfessionalGameDuration(score, enemy, context),
    );
    const commonRate =
      durations.filter((duration) => duration >= 28 && duration <= 38).length /
      durations.length;

    expect(Math.min(...durations)).toBeGreaterThanOrEqual(23);
    expect(Math.max(...durations)).toBeLessThanOrEqual(48);
    expect(commonRate).toBeGreaterThan(0.6);
  });

  it("atualiza estruturas, resume eventos e formata diferenca de ouro", () => {
    const baseStats = {
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
    const towerEvent = {
      id: "tower-1",
      minute: 12,
      type: "TowerDestroyed" as const,
      side: "User" as const,
      mapZone: "TopLane" as const,
      title: "Torre derrubada",
      description: "MD5 derrubou a torre do Top.",
      goldSwing: 550,
      importance: "Medium" as const,
    };
    const updated = applyEventToStats(baseStats, towerEvent);
    const blockedInhibitor = applyEventToStats(updated, {
      ...towerEvent,
      id: "inhibitor-blocked",
      type: "InhibitorDestroyed",
      importance: "Critical",
    });

    expect(updated.structures.topTowersEnemy).toBe(2);
    expect(updated.userTowers).toBe(1);
    expect(blockedInhibitor.structures.topInhibitorEnemyDestroyed).toBe(false);
    expect(blockedInhibitor.userInhibitors).toBe(0);
    expect(getWinningLanePath(updated.structures, "Enemy")).toBe("TopLane");
    expect(canDestroyNexus(updated.structures, "Enemy")).toBe(false);
    expect(formatGoldDifference(20_000, 18_000, "User")).toEqual({
      text: "+2.0k",
      status: "Ahead",
    });
    expect(generateCurrentEventSummary([towerEvent], 12)).toContain(
      towerEvent.description,
    );
  });

  it("respeita o orçamento individual de cada partida", () => {
    const matchDuration = 35;
    (
      ["Slow", "Normal", "Fast", "UltraFast"] as const
    ).forEach((speed) => {
      const tickMs = calculateMatchTickMs(speed, matchDuration);
      expect(tickMs * matchDuration).toBeLessThanOrEqual(
        matchSimulationTimeBudgetMs[speed],
      );
    });
    expect(matchSimulationTimeBudgetMs.Fast).toBe(10_000);
    expect(matchSimulationTimeBudgetMs.UltraFast).toBe(5_000);
    expect(calculateMatchTickMs("Fast", 35)).toBe(200);
    expect(calculateMatchTickMs("UltraFast", 35)).toBe(85);
  });
});
