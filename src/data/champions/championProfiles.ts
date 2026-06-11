import type {
  ChampionClass,
  ChampionProfile,
  DamageProfile,
  ItemPreferences,
  Role,
  StrategicStats,
} from "../../types/game";
import { championRoleOverrides } from "./championRoleOverrides";
import {
  buildChampionAttributes,
  validateChampionAttributes,
} from "./championAttributes";
import { generatedChampions } from "./generatedChampions";

const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)));

const baseStats: Record<ChampionClass, StrategicStats> = {
  Tank: {
    damageAD: 28, damageAP: 25, tankiness: 82, engage: 66, peel: 58,
    crowdControl: 72, mobility: 32, waveClear: 40, objectiveControl: 54,
    scaling: 60, earlyPressure: 48, teamFight: 78, splitPush: 28,
    pickoff: 42, sustain: 48, burst: 34, utility: 64,
  },
  Fighter: {
    damageAD: 72, damageAP: 18, tankiness: 58, engage: 52, peel: 24,
    crowdControl: 38, mobility: 52, waveClear: 55, objectiveControl: 62,
    scaling: 61, earlyPressure: 64, teamFight: 55, splitPush: 72,
    pickoff: 54, sustain: 62, burst: 58, utility: 28,
  },
  Assassin: {
    damageAD: 68, damageAP: 26, tankiness: 24, engage: 38, peel: 12,
    crowdControl: 24, mobility: 84, waveClear: 54, objectiveControl: 38,
    scaling: 53, earlyPressure: 69, teamFight: 38, splitPush: 58,
    pickoff: 88, sustain: 28, burst: 90, utility: 18,
  },
  Mage: {
    damageAD: 12, damageAP: 82, tankiness: 25, engage: 34, peel: 40,
    crowdControl: 58, mobility: 28, waveClear: 78, objectiveControl: 45,
    scaling: 75, earlyPressure: 48, teamFight: 70, splitPush: 30,
    pickoff: 58, sustain: 26, burst: 72, utility: 48,
  },
  Marksman: {
    damageAD: 88, damageAP: 12, tankiness: 18, engage: 10, peel: 8,
    crowdControl: 22, mobility: 42, waveClear: 64, objectiveControl: 78,
    scaling: 86, earlyPressure: 48, teamFight: 72, splitPush: 58,
    pickoff: 30, sustain: 24, burst: 56, utility: 18,
  },
  Enchanter: {
    damageAD: 8, damageAP: 36, tankiness: 22, engage: 20, peel: 88,
    crowdControl: 56, mobility: 38, waveClear: 34, objectiveControl: 48,
    scaling: 78, earlyPressure: 42, teamFight: 78, splitPush: 12,
    pickoff: 28, sustain: 68, burst: 28, utility: 92,
  },
  Controller: {
    damageAD: 10, damageAP: 64, tankiness: 28, engage: 44, peel: 68,
    crowdControl: 82, mobility: 24, waveClear: 68, objectiveControl: 58,
    scaling: 73, earlyPressure: 50, teamFight: 80, splitPush: 20,
    pickoff: 61, sustain: 30, burst: 56, utility: 72,
  },
  Engager: {
    damageAD: 24, damageAP: 24, tankiness: 72, engage: 90, peel: 54,
    crowdControl: 84, mobility: 48, waveClear: 32, objectiveControl: 58,
    scaling: 56, earlyPressure: 64, teamFight: 85, splitPush: 18,
    pickoff: 62, sustain: 38, burst: 38, utility: 66,
  },
  Specialist: {
    damageAD: 48, damageAP: 48, tankiness: 42, engage: 38, peel: 38,
    crowdControl: 45, mobility: 45, waveClear: 55, objectiveControl: 52,
    scaling: 62, earlyPressure: 55, teamFight: 58, splitPush: 55,
    pickoff: 52, sustain: 45, burst: 55, utility: 45,
  },
};

const apFighters = new Set([
  "Akali", "Diana", "Ekko", "Evelynn", "Fizz", "Gwen", "Kassadin",
  "Katarina", "Lillia", "Mordekaiser", "Rumble", "Shyvana", "Sylas",
]);
const hybridChampions = new Set([
  "Akali", "Corki", "Ezreal", "Jax", "Kaisa", "Kayle", "Katarina",
  "KogMaw", "Shyvana", "Smolder", "Varus", "Yone",
]);
const utilityChampions = new Set([
  "Bard", "Ivern", "Janna", "Lulu", "Milio", "Nami", "Renata", "Sona",
  "Soraka", "Taric", "Yuumi", "Zilean",
]);
const engageChampions = new Set([
  "Alistar", "Amumu", "Blitzcrank", "Galio", "JarvanIV", "Leona",
  "Malphite", "Maokai", "Nautilus", "Ornn", "Rakan", "Rell", "Sejuani",
  "Skarner", "Thresh", "Vi", "Zac",
]);
const pokeChampions = new Set([
  "Caitlyn", "Ezreal", "Hwei", "Jayce", "Jhin", "Karma",
  "Lux", "Mel", "Nidalee", "Seraphine", "Varus", "Velkoz", "Xerath",
  "Ziggs", "Zoe",
]);
const noManaChampions = new Set([
  "Aatrox", "Akali", "Ambessa", "Briar", "DrMundo", "Garen", "Gnar",
  "Katarina", "Kennen", "Kled", "LeeSin", "Mordekaiser", "RekSai",
  "Renekton", "Rengar", "Riven", "Rumble", "Sett", "Shen", "Tryndamere",
  "Viego", "Vladimir", "Yasuo", "Yone", "Zac", "Zed",
]);

const averageStats = (classes: ChampionClass[]) => {
  const keys = Object.keys(baseStats.Specialist) as (keyof StrategicStats)[];
  const sources = classes.length ? classes : ["Specialist" as const];
  return keys.reduce<StrategicStats>((result, key) => {
    result[key] = clamp(
      sources.reduce((sum, championClass) => sum + baseStats[championClass][key], 0) /
        sources.length,
    );
    return result;
  }, { ...baseStats.Specialist });
};

const inferClasses = (id: string, tags: string[]): ChampionClass[] => {
  const classes: ChampionClass[] = [];
  if (tags.includes("Tank")) classes.push("Tank");
  if (tags.includes("Fighter")) classes.push("Fighter");
  if (tags.includes("Assassin")) classes.push("Assassin");
  if (tags.includes("Mage")) classes.push("Mage");
  if (tags.includes("Marksman")) classes.push("Marksman");
  if (utilityChampions.has(id)) classes.push("Enchanter");
  if (engageChampions.has(id)) classes.push("Engager");
  if (
    tags.includes("Support") &&
    !classes.includes("Enchanter") &&
    !classes.includes("Engager")
  ) {
    classes.push("Controller");
  }
  const inferredClasses: ChampionClass[] = classes.length
    ? classes
    : ["Specialist"];
  return [...new Set<ChampionClass>(inferredClasses)];
};

const inferDamageProfile = (
  id: string,
  tags: string[],
  classes: ChampionClass[],
): DamageProfile => {
  if (utilityChampions.has(id)) return "Utility";
  if (hybridChampions.has(id)) return "Hybrid";
  if (tags.includes("Mage") || apFighters.has(id)) return "AP";
  if (classes.includes("Marksman") || classes.includes("Fighter") || classes.includes("Assassin")) {
    return "AD";
  }
  return "Hybrid";
};

const inferFallbackRole = (tags: string[]): Role => {
  // TODO: campeões novos sem override usam esta heurística até uma curadoria manual.
  if (tags.includes("Marksman")) return "Carry";
  if (tags.includes("Support")) return "Support";
  if (tags.includes("Assassin") || tags.includes("Mage")) return "Mid";
  if (tags.includes("Tank")) return "Top";
  return "Top";
};

const adjustStats = (
  id: string,
  roles: Role[],
  classes: ChampionClass[],
  stats: StrategicStats,
) => {
  const result = { ...stats };
  if (engageChampions.has(id)) {
    result.engage += 12;
    result.crowdControl += 8;
    result.teamFight += 7;
  }
  if (pokeChampions.has(id)) {
    result.waveClear += 8;
    result.pickoff += 5;
    result.earlyPressure += 4;
  }
  if (roles.includes("Jungle")) {
    result.objectiveControl += 8;
    result.pickoff += 4;
  }
  if (roles.includes("Support")) {
    result.utility += 7;
    result.peel += 5;
  }
  if (classes.includes("Marksman")) result.scaling += 5;
  if (classes.includes("Assassin")) result.burst += 5;

  (Object.keys(result) as (keyof StrategicStats)[]).forEach((key) => {
    result[key] = clamp(result[key]);
  });
  return result;
};

const buildPreferences = (
  damageProfile: DamageProfile,
  classes: ChampionClass[],
  resource: string,
): ItemPreferences => ({
  prefersAD: damageProfile === "AD" || damageProfile === "Hybrid",
  prefersAP: damageProfile === "AP" || damageProfile === "Hybrid",
  prefersAttackSpeed: classes.includes("Marksman"),
  prefersCrit: classes.includes("Marksman"),
  prefersLethality: classes.includes("Assassin") && damageProfile !== "AP",
  prefersTank: classes.includes("Tank") || classes.includes("Engager"),
  prefersHealth: classes.includes("Tank") || classes.includes("Fighter") || classes.includes("Engager"),
  prefersArmor: classes.includes("Tank"),
  prefersMagicResist: classes.includes("Tank"),
  prefersAbilityHaste:
    classes.includes("Mage") ||
    classes.includes("Controller") ||
    classes.includes("Enchanter") ||
    classes.includes("Engager"),
  prefersMana: resource.toLowerCase().includes("mana"),
  prefersHealShieldPower: classes.includes("Enchanter"),
  prefersUtility: classes.includes("Enchanter") || classes.includes("Controller"),
  prefersEngage: classes.includes("Engager"),
  prefersPeel:
    classes.includes("Enchanter") ||
    classes.includes("Controller") ||
    classes.includes("Tank"),
});

const inferWeaknesses = (stats: StrategicStats, difficulty: number) => {
  const weaknesses: string[] = [];
  if (stats.tankiness < 32) weaknesses.push("fragilidade");
  if (stats.mobility < 32) weaknesses.push("baixa mobilidade");
  if (stats.earlyPressure < 45) weaknesses.push("início vulnerável");
  if (stats.scaling < 50) weaknesses.push("queda no fim do jogo");
  if (difficulty >= 8) weaknesses.push("execução exigente");
  return weaknesses.length ? weaknesses : ["depende de boa execução"];
};

const buildSummary = (classes: ChampionClass[], stats: StrategicStats) => {
  if (classes.includes("Enchanter")) {
    return "Especialista em amplificar aliados e controlar o ritmo das lutas.";
  }
  if (classes.includes("Engager")) {
    return "Iniciador resistente que cria lutas e abre espaço para o time.";
  }
  if (classes.includes("Marksman")) {
    return "Fonte de dano constante que cresce e domina lutas prolongadas.";
  }
  if (classes.includes("Assassin")) {
    return "Ameaça móvel de explosão, forte ao encontrar alvos isolados.";
  }
  if (classes.includes("Mage")) {
    return stats.crowdControl >= 60
      ? "Mago de controle com dano mágico e forte presença em lutas."
      : "Mago ofensivo com pressão, alcance e alto potencial de dano.";
  }
  if (classes.includes("Tank")) {
    return "Linha de frente confiável, feita para absorver pressão e proteger aliados.";
  }
  return "Combatente versátil que alterna pressão lateral e presença nas lutas.";
};

export const championProfiles: ChampionProfile[] = generatedChampions.map((champion) => {
  const roles = championRoleOverrides[champion.id] ?? [inferFallbackRole(champion.tags)];
  const classes = inferClasses(champion.id, champion.tags);
  const damageProfile = inferDamageProfile(champion.id, champion.tags, classes);
  const stats = adjustStats(champion.id, roles, classes, averageStats(classes));
  const difficulty = champion.difficulty || 5;

  return {
    ...champion,
    roles,
    primaryRole: roles[0],
    classes,
    damageProfile,
    difficulty,
    stats,
    attributes: buildChampionAttributes({
      id: champion.id,
      roles,
      classes,
      stats,
    }),
    tags: [
      ...champion.tags.map((tag) => tag.toLowerCase()),
      ...(pokeChampions.has(champion.id) ? ["poke"] : []),
      ...(engageChampions.has(champion.id) ? ["engage"] : []),
      ...(noManaChampions.has(champion.id) ? ["sem-mana"] : []),
    ],
    itemPreferences: buildPreferences(damageProfile, classes, champion.resource),
    weaknesses: inferWeaknesses(stats, difficulty),
    summary: buildSummary(classes, stats),
    resource: champion.resource,
  };
});

export const championAttributeValidationErrors =
  validateChampionAttributes(championProfiles);

if (championAttributeValidationErrors.length) {
  throw new Error(
    `Atributos invalidos de campeoes:\n${championAttributeValidationErrors.join("\n")}`,
  );
}
