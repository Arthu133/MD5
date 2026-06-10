import type {
  BuildScore,
  ChampionProfile,
  EnhancedChampion,
  GamePhase,
  Item,
  StrategicStats,
} from "../types/game";
import { calculateItemFit } from "./itemEngine";

const clamp = (value: number, min = 0, max = 100) =>
  Math.round(Math.max(min, Math.min(max, value)));

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const detectSpike = (items: Item[]): GamePhase => {
  const early = items.filter((item) => item.category === "EarlyGame").length;
  const late = items.filter((item) => item.category === "Scaling").length;
  if (early > late) return "Early";
  if (late > early) return "Late";
  return "Mid";
};

export function calculateBuildScore(
  champion: ChampionProfile,
  selectedItems: Item[],
): BuildScore {
  const fits = selectedItems.map((item) => calculateItemFit(champion, item));
  const averageItemFit = fits.length
    ? sum(fits.map((fit) => fit.score)) / fits.length
    : 0;
  const offensivePower = clamp(
    sum(
      selectedItems.map((item) =>
        (item.stats.bonusAD ?? 0) / 3 +
        (item.stats.bonusAP ?? 0) / 3.5 +
        (item.stats.attackSpeed ?? 0) / 3 +
        (item.stats.crit ?? 0) / 3 +
        (item.stats.lethality ?? 0) / 2 +
        (item.stats.armorPen ?? 0) / 2 +
        (item.stats.magicPen ?? 0) / 2 +
        (item.stats.dps ?? 0) +
        (item.stats.antiTank ?? 0) / 2 +
        (item.stats.burst ?? 0),
      ),
    ),
  );
  const defensivePower = clamp(
    sum(
      selectedItems.map((item) =>
        (item.stats.health ?? 0) / 35 +
        (item.stats.armor ?? 0) / 3 +
        (item.stats.magicResist ?? 0) / 3 +
        (item.stats.tankiness ?? 0) +
        (item.stats.sustain ?? 0) / 2 +
        (item.stats.antiBurst ?? 0) +
        (item.stats.tenacity ?? 0) / 2 +
        (item.stats.comeback ?? 0) / 3,
      ),
    ),
  );
  const utilityPower = clamp(
    sum(
      selectedItems.map((item) =>
        (item.stats.utility ?? 0) +
        (item.stats.peel ?? 0) +
        (item.stats.engage ?? 0) +
        (item.stats.crowdControl ?? 0) / 2 +
        (item.stats.objectiveControl ?? 0) / 2 +
        (item.stats.antiHeal ?? 0) / 2 +
        (item.stats.antiShield ?? 0) / 2 +
        (item.stats.visionControl ?? 0) +
        (item.stats.roaming ?? 0) / 2 +
        (item.stats.disengage ?? 0) +
        (item.stats.siege ?? 0) / 2 +
        (item.stats.snowball ?? 0) / 3,
      ),
    ),
  );
  const fitVariance = fits.length
    ? sum(fits.map((fit) => Math.abs(fit.score - averageItemFit))) / fits.length
    : 30;
  const categoryCount = new Set(selectedItems.map((item) => item.category)).size;
  const consistency = clamp(88 - fitVariance * 0.65 + (categoryCount >= 2 ? 6 : -4));
  const identityAlignment = clamp(
    averageItemFit * 0.72 +
      (champion.itemPreferences.prefersAD ? offensivePower * 0.12 : 0) +
      (champion.itemPreferences.prefersAP ? offensivePower * 0.12 : 0) +
      (champion.itemPreferences.prefersTank ? defensivePower * 0.15 : 0) +
      (champion.itemPreferences.prefersUtility ? utilityPower * 0.15 : 0),
  );
  const total = clamp(
    averageItemFit * 0.57 +
      consistency * 0.18 +
      identityAlignment * 0.17 +
      Math.max(offensivePower, defensivePower, utilityPower) * 0.08,
  );

  const reasons = fits
    .flatMap((fit) => fit.reasons.slice(0, 1))
    .filter((reason, index, values) => values.indexOf(reason) === index)
    .slice(0, 3);
  const warnings = fits
    .flatMap((fit, index) =>
      fit.score < 55
        ? [`${selectedItems[index].name}: ${fit.penalties[0] ?? "baixa eficiência."}`]
        : [],
    )
    .slice(0, 3);

  if (selectedItems.length === 3 && warnings.length === 0) {
    reasons.push("Os três itens formam uma build coerente.");
  }
  if (selectedItems.length !== 3) {
    warnings.push("A build precisa de exatamente três itens.");
  }

  return {
    total,
    averageItemFit: clamp(averageItemFit),
    offensivePower,
    defensivePower,
    utilityPower,
    identityAlignment,
    consistency,
    spikeTiming: detectSpike(selectedItems),
    reasons,
    warnings,
  };
}

const applyUniversalStat = (
  current: StrategicStats,
  key: keyof StrategicStats,
  value: number | undefined,
  multiplier: number,
) => {
  if (value === undefined) return;
  current[key] += value * multiplier;
};

export function applyItemsToChampion(
  champion: ChampionProfile,
  selectedItems: Item[],
): EnhancedChampion {
  const enhancedStats = { ...champion.stats };

  selectedItems.forEach((item) => {
    const fit = calculateItemFit(champion, item);
    const efficiency = fit.score / 100;
    const universalEfficiency = 0.2 + efficiency * 0.55;

    enhancedStats.damageAD += (item.stats.bonusAD ?? 0) / 3.2 * efficiency;
    enhancedStats.damageAP += (item.stats.bonusAP ?? 0) / 3.5 * efficiency;
    enhancedStats.damageAD += (item.stats.attackSpeed ?? 0) / 6 * efficiency;
    enhancedStats.damageAD += (item.stats.crit ?? 0) / 6 * efficiency;
    enhancedStats.burst += (item.stats.lethality ?? 0) / 2 * efficiency;
    enhancedStats.burst += (item.stats.armorPen ?? 0) / 2.4 * efficiency;
    enhancedStats.burst += (item.stats.magicPen ?? 0) / 2 * efficiency;
    enhancedStats.damageAD += (item.stats.dps ?? 0) * 0.6 * efficiency;
    enhancedStats.damageAP += (item.stats.dps ?? 0) * 0.35 * efficiency;
    enhancedStats.tankiness += (item.stats.health ?? 0) / 45 * universalEfficiency;
    enhancedStats.tankiness += (item.stats.armor ?? 0) / 5 * universalEfficiency;
    enhancedStats.tankiness += (item.stats.magicResist ?? 0) / 5 * universalEfficiency;
    enhancedStats.utility += (item.stats.abilityHaste ?? 0) / 4 * universalEfficiency;
    enhancedStats.utility += (item.stats.healShieldPower ?? 0) / 2 * universalEfficiency;
    enhancedStats.utility += ((item.stats.antiHeal ?? 0) + (item.stats.antiShield ?? 0)) / 3 * universalEfficiency;
    enhancedStats.utility += (item.stats.visionControl ?? 0) * 0.7 * universalEfficiency;
    enhancedStats.objectiveControl += ((item.stats.visionControl ?? 0) + (item.stats.antiTank ?? 0) + (item.stats.siege ?? 0)) * 0.45 * efficiency;
    enhancedStats.mobility += (item.stats.roaming ?? 0) * 0.65 * efficiency;
    enhancedStats.earlyPressure += ((item.stats.roaming ?? 0) + (item.stats.snowball ?? 0)) * 0.55 * efficiency;
    enhancedStats.peel += (item.stats.disengage ?? 0) * 0.8 * universalEfficiency;
    enhancedStats.waveClear += (item.stats.siege ?? 0) * 0.45 * efficiency;
    enhancedStats.splitPush += (item.stats.siege ?? 0) * 0.55 * efficiency;
    enhancedStats.scaling += (item.stats.comeback ?? 0) * 0.6 * efficiency;
    enhancedStats.tankiness += ((item.stats.antiBurst ?? 0) + (item.stats.tenacity ?? 0)) * 0.55 * universalEfficiency;

    const strategicKeys: (keyof StrategicStats)[] = [
      "damageAD", "damageAP", "tankiness", "engage", "peel", "crowdControl",
      "mobility", "waveClear", "objectiveControl", "scaling", "earlyPressure",
      "teamFight", "splitPush", "pickoff", "sustain", "burst", "utility",
    ];
    strategicKeys.forEach((key) => {
      const isUniversal = ["tankiness", "mobility", "utility", "peel"].includes(key);
      applyUniversalStat(
        enhancedStats,
        key,
        item.stats[key],
        isUniversal ? universalEfficiency : efficiency,
      );
      applyUniversalStat(
        enhancedStats,
        key,
        item.uniqueEffect?.effects[key],
        isUniversal ? universalEfficiency : efficiency,
      );
    });
  });

  (Object.keys(enhancedStats) as (keyof StrategicStats)[]).forEach((key) => {
    enhancedStats[key] = clamp(enhancedStats[key]);
  });

  return {
    ...champion,
    selectedItems,
    buildScore: calculateBuildScore(champion, selectedItems),
    enhancedStats,
  };
}
