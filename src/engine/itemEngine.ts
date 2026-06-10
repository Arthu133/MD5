import { items } from "../data/items";
import type {
  ChampionClass,
  ChampionProfile,
  Item,
  ItemFitLevel,
  ItemFitResult,
} from "../types/game";
import { shuffle } from "./draftEngine";

const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)));

const levelFromScore = (score: number): ItemFitLevel => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 55) return "Average";
  if (score >= 30) return "Poor";
  return "Terrible";
};

const intersects = <T,>(left: T[], right?: T[]) =>
  Boolean(right?.some((value) => left.includes(value)));

const addReason = (
  reasons: string[],
  message: string,
  condition: boolean,
  score: number,
) => {
  if (condition) reasons.push(message);
  return condition ? score : 0;
};

const addPenalty = (
  penalties: string[],
  message: string,
  condition: boolean,
  score: number,
) => {
  if (condition) penalties.push(message);
  return condition ? score : 0;
};

export function calculateItemFit(
  champion: ChampionProfile,
  item: Item,
): ItemFitResult {
  let score = 50;
  const reasons: string[] = [];
  const penalties: string[] = [];
  const preferences = champion.itemPreferences;

  score += addReason(reasons, "A categoria combina com a classe do campeão.", intersects(champion.classes, item.bestFor.classes), 14);
  score += addReason(reasons, "O item favorece este tipo de dano.", item.bestFor.damageProfiles?.includes(champion.damageProfile) ?? false, 13);
  score += addReason(reasons, "O item funciona bem nesta posição.", item.bestFor.roles?.includes(champion.primaryRole) ?? false, 8);
  score += addReason(reasons, "Os atributos reforçam dano físico relevante.", preferences.prefersAD && Boolean(item.stats.bonusAD || item.stats.lethality), 10);
  score += addReason(reasons, "Os atributos reforçam dano mágico relevante.", preferences.prefersAP && Boolean(item.stats.bonusAP || item.stats.magicPen), 10);
  score += addReason(reasons, "Velocidade, crítico e DPS reforçam o dano contínuo.", preferences.prefersAttackSpeed && Boolean(item.stats.attackSpeed || item.stats.crit || item.stats.dps), 12);
  score += addReason(reasons, "Vida e resistências reforçam a linha de frente.", preferences.prefersTank && Boolean(item.stats.health || item.stats.armor || item.stats.magicResist), 11);
  score += addReason(reasons, "Aceleração melhora o padrão de habilidades.", preferences.prefersAbilityHaste && Boolean(item.stats.abilityHaste), 8);
  score += addReason(reasons, "Cura, escudo e proteção combinam com sua função.", preferences.prefersHealShieldPower && Boolean(item.stats.healShieldPower || item.stats.peel), 14);
  score += addReason(reasons, "O item amplia sua capacidade de iniciação.", preferences.prefersEngage && Boolean(item.stats.engage), 11);
  score += addReason(reasons, "O item melhora sua capacidade de proteção.", preferences.prefersPeel && Boolean(item.stats.peel), 10);
  score += addReason(reasons, "Controle de visão e rotação favorecem esta posição.", ["Jungle", "Support"].includes(champion.primaryRole) && Boolean(item.stats.visionControl || item.stats.roaming), 10);
  score += addReason(reasons, "Pressão de objetivos combina com a função no mapa.", champion.primaryRole === "Jungle" && Boolean(item.stats.objectiveControl || item.stats.antiTank), 10);
  score += addReason(reasons, "Pressão lateral reforça o plano de split push.", champion.stats.splitPush >= 60 && Boolean(item.stats.splitPush || item.stats.siege || item.stats.sustain), 9);
  score += addReason(reasons, "Mobilidade e snowball ampliam janelas de pickoff.", champion.stats.pickoff >= 60 && Boolean(item.stats.mobility || item.stats.snowball || item.stats.roaming), 9);
  score += addReason(reasons, "Disengage e tenacidade ajudam a estabilizar lutas.", (preferences.prefersPeel || preferences.prefersTank) && Boolean(item.stats.disengage || item.stats.tenacity || item.stats.antiBurst), 8);

  score -= addPenalty(penalties, "Dano mágico tem baixa eficiência neste campeão AD.", champion.damageProfile === "AD" && Boolean(item.stats.bonusAP) && !item.stats.bonusAD, 26);
  score -= addPenalty(penalties, "Dano físico tem baixa eficiência neste campeão AP.", champion.damageProfile === "AP" && Boolean(item.stats.bonusAD) && !item.stats.bonusAP, 24);
  score -= addPenalty(penalties, "Crítico não conversa com a identidade deste campeão.", !preferences.prefersCrit && Boolean(item.stats.crit), 23);
  score -= addPenalty(penalties, "Letalidade não contribui para este perfil de dano.", !preferences.prefersLethality && Boolean(item.stats.lethality), 20);
  score -= addPenalty(penalties, "Mana é parcialmente desperdiçada por este campeão.", champion.tags.includes("sem-mana") && Boolean(item.stats.mana), 15);
  score -= addPenalty(penalties, "O item conflita com a classe principal.", intersects(champion.classes, item.badFor.classes), 18);
  score -= addPenalty(penalties, "O item conflita com o tipo de dano.", item.badFor.damageProfiles?.includes(champion.damageProfile) ?? false, 20);
  score -= addPenalty(penalties, "Defesa em excesso reduz a função de dano do atirador.", champion.classes.includes("Marksman") && item.category === "Tank", 13);
  score -= addPenalty(penalties, "Utilidade defensiva tem pouco valor para um assassino.", champion.classes.includes("Assassin") && item.category === "Peel", 14);
  score -= addPenalty(penalties, "A itemização ofensiva enfraquece a função de linha de frente.", (champion.classes.includes("Tank") || champion.classes.includes("Engager")) && ["Assassin", "Marksman"].includes(item.category), 12);
  score -= addPenalty(penalties, "O item oferece pouca pressão ofensiva para a condição de vitória.", champion.classes.includes("Marksman") && Boolean(item.stats.antiBurst) && !item.stats.dps && !item.stats.attackSpeed && !item.stats.crit, 8);
  score -= addPenalty(penalties, "Cura e escudo têm baixo aproveitamento sem ferramentas de suporte.", !preferences.prefersHealShieldPower && Boolean(item.stats.healShieldPower) && !item.stats.sustain, 10);

  const normalizedScore = clamp(score);
  if (!reasons.length && normalizedScore >= 55) {
    reasons.push("O item oferece atributos gerais, mas não define a build.");
  }
  if (!penalties.length && normalizedScore < 55) {
    penalties.push("O item contribui pouco para a identidade principal.");
  }

  return {
    score: normalizedScore,
    level: levelFromScore(normalizedScore),
    reasons,
    penalties,
  };
}

const takeUniqueCategories = (
  source: Item[],
  amount: number,
  selected: Item[],
) => {
  const result: Item[] = [];
  const usedCategories = new Set(selected.map((item) => item.category));

  for (const item of shuffle(source)) {
    if (selected.some((selectedItem) => selectedItem.id === item.id)) continue;
    if (usedCategories.has(item.category) && result.length < amount - 1) continue;
    result.push(item);
    usedCategories.add(item.category);
    if (result.length === amount) break;
  }

  if (result.length < amount) {
    const fallback = shuffle(source).filter(
      (item) =>
        !selected.some((selectedItem) => selectedItem.id === item.id) &&
        !result.some((selectedItem) => selectedItem.id === item.id),
    );
    result.push(...fallback.slice(0, amount - result.length));
  }

  return result;
};

export function getRandomItemsForChampion(
  champion: ChampionProfile,
  count = 9,
): Item[] {
  const scored = items.map((item) => ({
    item,
    score: calculateItemFit(champion, item).score,
  }));
  const good = scored.filter(({ score }) => score >= 75).map(({ item }) => item);
  const average = scored.filter(({ score }) => score >= 45 && score < 75).map(({ item }) => item);
  const risky = scored.filter(({ score }) => score < 45).map(({ item }) => item);
  const selected: Item[] = [];

  const goodAmount = Math.min(Math.max(4, Math.ceil(count * 0.5)), count);
  const averageAmount = Math.min(
    Math.max(2, Math.ceil(count * 0.3)),
    count - goodAmount,
  );

  selected.push(...takeUniqueCategories(good.length ? good : average, goodAmount, selected));
  selected.push(...takeUniqueCategories(average.length ? average : items, averageAmount, selected));
  selected.push(...takeUniqueCategories(risky.length ? risky : average, count - selected.length, selected));

  if (selected.length < count) {
    selected.push(
      ...shuffle(items)
        .filter((item) => !selected.some((selectedItem) => selectedItem.id === item.id))
        .slice(0, count - selected.length),
    );
  }

  return shuffle(selected).slice(0, count);
}

export const championHasClass = (
  champion: ChampionProfile,
  championClass: ChampionClass,
) => champion.classes.includes(championClass);
