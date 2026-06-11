import { championAttributeLabels } from "../data/champions/championAttributes";
import type {
  ChampionAttributeKey,
  ChampionProfile,
  StrategicStats,
} from "../types/game";

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)));

const statInfluence: Partial<
  Record<ChampionAttributeKey, Partial<Record<keyof StrategicStats, number>>>
> = {
  tank: { tankiness: 0.45 },
  engage: { engage: 0.55, crowdControl: 0.18, teamFight: 0.12 },
  disengage: { peel: 0.45, crowdControl: 0.18 },
  peel: { peel: 0.55, utility: 0.15 },
  burst: { burst: 0.55, pickoff: 0.16 },
  dps: { teamFight: 0.24, objectiveControl: 0.18, scaling: 0.12 },
  poke: { waveClear: 0.18, pickoff: 0.2, earlyPressure: 0.12 },
  siege: { waveClear: 0.28, objectiveControl: 0.12 },
  waveClear: { waveClear: 0.6 },
  splitPush: { splitPush: 0.6, objectiveControl: 0.08 },
  sustain: { sustain: 0.6, tankiness: 0.1 },
  healing: { sustain: 0.35, utility: 0.2, peel: 0.12 },
  shielding: { peel: 0.34, utility: 0.22 },
  mobility: { mobility: 0.6, pickoff: 0.1 },
  crowdControl: { crowdControl: 0.6, teamFight: 0.1 },
  pickoff: { pickoff: 0.6, burst: 0.1 },
  frontline: { tankiness: 0.55, teamFight: 0.1 },
  scaling: { scaling: 0.6 },
  earlyGame: { earlyPressure: 0.6 },
  lateGame: { scaling: 0.38, teamFight: 0.18 },
  snowball: { earlyPressure: 0.3, pickoff: 0.2 },
  comeback: { scaling: 0.25, waveClear: 0.2 },
  objectiveControl: { objectiveControl: 0.6 },
  teamFight: { teamFight: 0.6 },
  duelist: { splitPush: 0.25, sustain: 0.2, damageAD: 0.08 },
  antiTank: { objectiveControl: 0.16, teamFight: 0.12 },
  utility: { utility: 0.6 },
  roaming: { mobility: 0.22, earlyPressure: 0.18, pickoff: 0.14 },
  junglePressure: { objectiveControl: 0.24, earlyPressure: 0.24 },
  laneBully: { earlyPressure: 0.42 },
  hypercarry: { scaling: 0.35, teamFight: 0.2 },
  protectCarry: { peel: 0.34, teamFight: 0.16 },
  dive: { engage: 0.28, mobility: 0.2, burst: 0.12 },
  zoneControl: { crowdControl: 0.24, teamFight: 0.2, waveClear: 0.12 },
  visionControl: { utility: 0.22, pickoff: 0.14, objectiveControl: 0.12 },
  globalPressure: { mobility: 0.12, objectiveControl: 0.13, splitPush: 0.12 },
  resetChampion: { teamFight: 0.16 },
  longRange: { waveClear: 0.12, pickoff: 0.08 },
};

export function applyChampionAttributeDelta(
  champion: ChampionProfile,
  key: ChampionAttributeKey,
  delta: number,
): ChampionProfile {
  const attributes = champion.attributes.map((attribute) =>
    attribute.key === key
      ? { ...attribute, value: clamp(attribute.value + delta) }
      : attribute,
  );
  if (!attributes.some((attribute) => attribute.key === key)) {
    attributes.push({
      key,
      label: championAttributeLabels[key],
      value: clamp(delta),
    });
  }
  attributes.sort((left, right) => right.value - left.value);

  const stats = { ...champion.stats };
  Object.entries(statInfluence[key] ?? {}).forEach(([rawStat, influence]) => {
    const stat = rawStat as keyof StrategicStats;
    stats[stat] = clamp(stats[stat] + delta * (influence ?? 0));
  });

  return { ...champion, attributes, stats };
}
