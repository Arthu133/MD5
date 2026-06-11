import type {
  ChampionAttribute,
  ChampionAttributeKey,
  ChampionClass,
  ChampionProfile,
  Role,
  StrategicStats,
} from "../../types/game";

export const championAttributeLabels: Record<ChampionAttributeKey, string> = {
  tank: "Tank",
  fighter: "Fighter",
  mage: "Mage",
  assassin: "Assassin",
  marksman: "Marksman",
  support: "Support",
  enchanter: "Enchanter",
  controller: "Controller",
  engage: "Engage",
  disengage: "Disengage",
  peel: "Peel",
  burst: "Burst",
  dps: "DPS",
  poke: "Poke",
  siege: "Siege",
  waveClear: "Wave Clear",
  splitPush: "Split Push",
  sustain: "Sustain",
  healing: "Healing",
  shielding: "Shielding",
  mobility: "Mobility",
  crowdControl: "Crowd Control",
  pickoff: "Pickoff",
  frontline: "Frontline",
  backline: "Backline",
  scaling: "Scaling",
  earlyGame: "Early Game",
  lateGame: "Late Game",
  snowball: "Snowball",
  comeback: "Comeback",
  objectiveControl: "Objective Control",
  teamFight: "Team Fight",
  duelist: "Duelist",
  antiTank: "Anti-Tank",
  utility: "Utility",
  roaming: "Roaming",
  junglePressure: "Jungle Pressure",
  laneBully: "Lane Bully",
  hypercarry: "Hypercarry",
  protectCarry: "Protect Carry",
  dive: "Dive",
  zoneControl: "Zone Control",
  visionControl: "Vision Control",
  globalPressure: "Global Pressure",
  resetChampion: "Reset Champion",
  highRisk: "High Risk",
  lowRange: "Low Range",
  longRange: "Long Range",
};

const validAttributeKeys = new Set<ChampionAttributeKey>(
  Object.keys(championAttributeLabels) as ChampionAttributeKey[],
);

const set = (...ids: string[]) => new Set(ids);

const traitGroups: Partial<Record<ChampionAttributeKey, Set<string>>> = {
  disengage: set("Alistar", "Anivia", "Ashe", "Bard", "Braum", "Gragas", "Janna", "Jayce", "Karma", "Kindred", "Lissandra", "Lulu", "Maokai", "Milio", "Nami", "Orianna", "Poppy", "Renata", "Seraphine", "Syndra", "TahmKench", "Taliyah", "Thresh", "Trundle", "Veigar", "Vex", "Xayah", "Zilean", "Zyra"),
  poke: set("Ahri", "Akshan", "Anivia", "Ashe", "Aurora", "Caitlyn", "Corki", "Ezreal", "Gangplank", "Heimerdinger", "Hwei", "Jayce", "Jhin", "Kaisa", "Karma", "KogMaw", "Leblanc", "Lux", "Mel", "MissFortune", "Nidalee", "Orianna", "Senna", "Seraphine", "Smolder", "Syndra", "Taliyah", "Teemo", "Varus", "Velkoz", "Viktor", "Xerath", "Ziggs", "Zoe", "Zyra"),
  siege: set("Anivia", "Azir", "Caitlyn", "Corki", "Ezreal", "Heimerdinger", "Jayce", "Jinx", "KogMaw", "Lux", "Mel", "Seraphine", "Sivir", "Smolder", "Tristana", "Varus", "Velkoz", "Viktor", "Xerath", "Ziggs"),
  healing: set("Aatrox", "Briar", "DrMundo", "Fiora", "Gwen", "Ivern", "Milio", "Nami", "Nilah", "Olaf", "Renata", "Senna", "Seraphine", "Sona", "Soraka", "Swain", "Sylas", "Taric", "Vladimir", "Volibear", "Warwick", "Yuumi", "Zac"),
  shielding: set("Braum", "Ivern", "Janna", "Karma", "LeeSin", "Lulu", "Lux", "Mel", "Milio", "Morgana", "Orianna", "Rakan", "Renata", "Seraphine", "Shen", "Sona", "TahmKench", "Taric", "Yuumi"),
  roaming: set("Ahri", "Akshan", "Bard", "Blitzcrank", "Galio", "Hecarim", "Katarina", "Kled", "Leblanc", "LeeSin", "Nautilus", "Pantheon", "Pyke", "Qiyana", "Quinn", "Rakan", "Shen", "Taliyah", "Talon", "Thresh", "TwistedFate", "Zed"),
  junglePressure: set("Belveth", "Briar", "Diana", "Elise", "Evelynn", "Graves", "Hecarim", "JarvanIV", "Karthus", "Kayn", "Khazix", "Kindred", "LeeSin", "Nidalee", "Nocturne", "Nunu", "RekSai", "Rengar", "Shyvana", "Udyr", "Vi", "Viego", "Volibear", "Warwick", "XinZhao"),
  laneBully: set("Akshan", "Azir", "Caitlyn", "Cassiopeia", "Darius", "Draven", "Gangplank", "Heimerdinger", "Illaoi", "Jayce", "Karma", "Kalista", "Kennen", "Kled", "Lucian", "Olaf", "Pantheon", "Quinn", "Renekton", "Rumble", "Sett", "Teemo", "Tristana", "Urgot", "Varus", "Volibear", "XinZhao"),
  hypercarry: set("Aphelios", "AurelionSol", "Azir", "Belveth", "Cassiopeia", "Jinx", "Kaisa", "Karthus", "Kassadin", "Kayle", "Kindred", "KogMaw", "MasterYi", "Nilah", "Ryze", "Smolder", "Tristana", "Twitch", "Vayne", "Veigar", "Viego", "Vladimir", "Yasuo", "Yone", "Zeri"),
  protectCarry: set("Alistar", "Braum", "Galio", "Ivern", "Janna", "Karma", "Lulu", "Milio", "Nami", "Orianna", "Poppy", "Renata", "Seraphine", "Shen", "Sona", "Soraka", "TahmKench", "Taric", "Thresh", "Yuumi", "Zilean"),
  dive: set("Aatrox", "Akali", "Alistar", "Ambessa", "Camille", "Diana", "Ekko", "Fizz", "Galio", "Hecarim", "Irelia", "JarvanIV", "Jax", "Kaisa", "Katarina", "Kayn", "Kled", "LeeSin", "Leona", "Malphite", "Naafiri", "Nocturne", "Pantheon", "Qiyana", "Rakan", "RekSai", "Renekton", "Rengar", "Riven", "Samira", "Sejuani", "Vi", "Viego", "Volibear", "MonkeyKing", "XinZhao", "Yasuo", "Yone", "Zac", "Zed"),
  zoneControl: set("Anivia", "Annie", "AurelionSol", "Azir", "Brand", "Cassiopeia", "Fiddlesticks", "Gangplank", "Heimerdinger", "Hwei", "Illaoi", "Karthus", "Kennen", "Lissandra", "Lux", "Malzahar", "Mel", "MissFortune", "Morgana", "Neeko", "Orianna", "Rumble", "Seraphine", "Singed", "Syndra", "Taliyah", "Teemo", "Veigar", "Velkoz", "Viktor", "Ziggs", "Zyra"),
  visionControl: set("Ashe", "Bard", "Caitlyn", "Fiddlesticks", "Graves", "Ivern", "Jhin", "Kalista", "Khazix", "Kindred", "LeeSin", "Maokai", "Nidalee", "Pyke", "Quinn", "Rengar", "Senna", "Shaco", "Teemo", "Thresh", "TwistedFate"),
  globalPressure: set("Akshan", "Ashe", "AurelionSol", "Briar", "Gangplank", "Galio", "Karthus", "Kled", "Nocturne", "Pantheon", "Quinn", "Ryze", "Senna", "Shen", "Soraka", "Taliyah", "TwistedFate"),
  resetChampion: set("Ahri", "Akshan", "Belveth", "Briar", "Darius", "Jinx", "Katarina", "Khazix", "MasterYi", "Naafiri", "Nilah", "Pyke", "Samira", "Tristana", "Viego"),
  duelist: set("Aatrox", "Akali", "Ambessa", "Belveth", "Camille", "Darius", "Fiora", "Fizz", "Gwen", "Illaoi", "Irelia", "Jax", "KSante", "Kled", "MasterYi", "Mordekaiser", "Nasus", "Nilah", "Olaf", "Renekton", "Riven", "Sett", "Trundle", "Tryndamere", "Udyr", "Vayne", "Viego", "Volibear", "Warwick", "XinZhao", "Yasuo", "Yone", "Yorick"),
  antiTank: set("Aatrox", "Belveth", "Brand", "Camille", "Cassiopeia", "Darius", "Fiora", "Gwen", "Kaisa", "KogMaw", "MasterYi", "Mordekaiser", "Nilah", "Olaf", "Trundle", "Varus", "Vayne", "Velkoz"),
  highRisk: set("Akali", "Ambessa", "Aphelios", "Azir", "Draven", "Fiora", "Gangplank", "Irelia", "Kalista", "Katarina", "LeeSin", "Nidalee", "Qiyana", "Rengar", "Riven", "Samira", "Shaco", "Singed", "Vayne", "Yasuo", "Yone", "Zed", "Zeri"),
  lowRange: set("Aatrox", "Akali", "Alistar", "Ambessa", "Amumu", "Belveth", "Briar", "Camille", "Darius", "Diana", "DrMundo", "Ekko", "Fiora", "Fizz", "Galio", "Garen", "Gwen", "Hecarim", "Illaoi", "Irelia", "JarvanIV", "Jax", "Kassadin", "Katarina", "Kayn", "Kled", "LeeSin", "Leona", "Malphite", "MasterYi", "Mordekaiser", "Naafiri", "Nautilus", "Nilah", "Olaf", "Pantheon", "Poppy", "Pyke", "Qiyana", "Rakan", "Rammus", "RekSai", "Rell", "Renekton", "Rengar", "Riven", "Samira", "Sejuani", "Sett", "Shen", "Singed", "Skarner", "Sylas", "TahmKench", "Talon", "Taric", "Trundle", "Tryndamere", "Udyr", "Vi", "Viego", "Volibear", "Warwick", "MonkeyKing", "XinZhao", "Yasuo", "Yone", "Yorick", "Zac", "Zed"),
  longRange: set("Anivia", "Aphelios", "Ashe", "AurelionSol", "Azir", "Caitlyn", "Corki", "Ezreal", "Heimerdinger", "Hwei", "Jayce", "Jhin", "Jinx", "Kaisa", "Karma", "KogMaw", "Lux", "Mel", "Milio", "Nidalee", "Orianna", "Senna", "Seraphine", "Smolder", "Syndra", "Taliyah", "Varus", "Velkoz", "Viktor", "Xerath", "Ziggs", "Zoe"),
};

const classAttributes: Partial<Record<ChampionClass, ChampionAttributeKey>> = {
  Tank: "tank",
  Fighter: "fighter",
  Mage: "mage",
  Assassin: "assassin",
  Marksman: "marksman",
  Enchanter: "enchanter",
  Controller: "controller",
  Engager: "engage",
};

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)));

const add = (
  values: Partial<Record<ChampionAttributeKey, number>>,
  key: ChampionAttributeKey,
  value: number,
) => {
  values[key] = Math.max(values[key] ?? 0, clamp(value));
};

const addStatAttributes = (
  values: Partial<Record<ChampionAttributeKey, number>>,
  stats: StrategicStats,
) => {
  add(values, "frontline", stats.tankiness);
  add(values, "engage", stats.engage);
  add(values, "peel", stats.peel);
  add(values, "crowdControl", stats.crowdControl);
  add(values, "mobility", stats.mobility);
  add(values, "waveClear", stats.waveClear);
  add(values, "objectiveControl", stats.objectiveControl);
  add(values, "scaling", stats.scaling);
  add(values, "earlyGame", stats.earlyPressure);
  add(values, "teamFight", stats.teamFight);
  add(values, "splitPush", stats.splitPush);
  add(values, "pickoff", stats.pickoff);
  add(values, "sustain", stats.sustain);
  add(values, "burst", stats.burst);
  add(values, "utility", stats.utility);
  add(values, "dps", Math.max(stats.damageAD, stats.damageAP) * 0.62 + stats.scaling * 0.38);
  add(values, "snowball", stats.earlyPressure * 0.6 + stats.pickoff * 0.4);
  if (stats.scaling >= 62) {
    add(values, "lateGame", stats.scaling * 0.78 + stats.teamFight * 0.22);
  }
  if (stats.scaling >= 70 && stats.waveClear >= 55) {
    add(values, "comeback", stats.scaling * 0.58 + stats.waveClear * 0.42);
  }
  add(values, "backline", Math.max(stats.damageAD, stats.damageAP) * 0.55 + stats.scaling * 0.45);
};

const championOverrides: Record<string, Partial<Record<ChampionAttributeKey, number>>> = {
  Trundle: {
    fighter: 88,
    tank: 72,
    sustain: 90,
    splitPush: 85,
    duelist: 88,
    antiTank: 92,
    objectiveControl: 82,
  },
  Malphite: { tank: 92, engage: 97, teamFight: 94, frontline: 93, crowdControl: 90, burst: 78, antiTank: 76 },
  Fiora: { duelist: 98, splitPush: 96, antiTank: 92, sustain: 76, teamFight: 38 },
  Jinx: { hypercarry: 96, scaling: 94, dps: 94, resetChampion: 92, siege: 85 },
  Nidalee: { poke: 91, junglePressure: 90, mobility: 88, snowball: 86, objectiveControl: 68 },
  Orianna: { teamFight: 93, zoneControl: 90, protectCarry: 82, scaling: 86, crowdControl: 87, burst: 78 },
  Bard: { roaming: 96, utility: 91, pickoff: 82, visionControl: 86, highRisk: 74 },
  KogMaw: { hypercarry: 97, scaling: 95, lateGame: 96, antiTank: 94, dps: 96, longRange: 86, lowRange: 30 },
  LeeSin: { junglePressure: 94, earlyGame: 91, mobility: 94, dive: 86, scaling: 38 },
  Soraka: { healing: 99, sustain: 95, protectCarry: 92, utility: 94, globalPressure: 80 },
  Ornn: { tank: 94, frontline: 96, engage: 88, crowdControl: 90, scaling: 88, lateGame: 92, teamFight: 88 },
  Vi: { dive: 93, pickoff: 90, engage: 86, junglePressure: 82, earlyGame: 75, mobility: 78 },
  Lulu: { protectCarry: 98, peel: 96, shielding: 92, utility: 94, scaling: 82, disengage: 88 },
  Renekton: { earlyGame: 94, laneBully: 92, dive: 88, snowball: 90, duelist: 86, scaling: 35 },
  Pantheon: { earlyGame: 95, snowball: 92, dive: 90, roaming: 91, pickoff: 86, scaling: 32 },
  Draven: { earlyGame: 95, laneBully: 96, snowball: 98, dps: 88, highRisk: 86, scaling: 48 },
  Nautilus: { engage: 96, crowdControl: 96, pickoff: 90, frontline: 84, dive: 82, earlyGame: 80 },
  TwistedFate: { globalPressure: 98, roaming: 94, pickoff: 88, waveClear: 82, utility: 80 },
  Ezreal: { poke: 88, mobility: 92, longRange: 84, siege: 76, waveClear: 72 },
  Jayce: { poke: 96, siege: 92, laneBully: 90, longRange: 88, earlyGame: 88, waveClear: 82 },
  Xerath: { poke: 98, siege: 94, longRange: 98, waveClear: 90, zoneControl: 84 },
  Caitlyn: { siege: 96, longRange: 94, laneBully: 90, poke: 88, objectiveControl: 76 },
  Karma: { poke: 84, siege: 78, shielding: 90, protectCarry: 84, utility: 92, earlyGame: 82 },
  JarvanIV: { engage: 94, dive: 92, junglePressure: 88, earlyGame: 84, teamFight: 86, crowdControl: 82 },
  MissFortune: { teamFight: 94, zoneControl: 88, burst: 86, earlyGame: 78, longRange: 76 },
  Leona: { engage: 98, crowdControl: 97, dive: 91, frontline: 88, earlyGame: 88 },
  Ivern: { protectCarry: 94, shielding: 96, utility: 95, junglePressure: 74, peel: 90, disengage: 82 },
  Janna: { disengage: 99, peel: 98, protectCarry: 96, shielding: 94, utility: 96, scaling: 80 },
};

export type ChampionIdentityData = {
  tags: ChampionAttributeKey[];
  weights: ChampionAttribute[];
};

export function buildChampionIdentity(input: {
  id: string;
  roles: Role[];
  classes: ChampionClass[];
  stats: StrategicStats;
}): ChampionIdentityData {
  const values: Partial<Record<ChampionAttributeKey, number>> = {};
  addStatAttributes(values, input.stats);

  input.classes.forEach((championClass, index) => {
    const key = classAttributes[championClass];
    if (key) add(values, key, index === 0 ? 76 : 64);
  });
  if (input.roles[0] === "Support") add(values, "support", 76);
  if (input.roles.includes("Jungle")) add(values, "junglePressure", input.stats.earlyPressure * 0.55 + input.stats.objectiveControl * 0.45);

  Object.entries(traitGroups).forEach(([rawKey, ids]) => {
    const key = rawKey as ChampionAttributeKey;
    if (!ids?.has(input.id)) return;
    const base =
      key === "highRisk"
        ? 70 + Math.min(20, input.stats.mobility * 0.15)
        : key === "lowRange" || key === "longRange"
          ? 82
          : 76 + ((input.id.charCodeAt(0) + input.id.length) % 17);
    add(values, key, base);
  });

  Object.entries(championOverrides[input.id] ?? {}).forEach(([rawKey, value]) => {
    add(values, rawKey as ChampionAttributeKey, value ?? 0);
  });

  const weights = Object.entries(values)
    .map(([key, value]) => ({
      key: key as ChampionAttributeKey,
      label: championAttributeLabels[key as ChampionAttributeKey],
      value: clamp(value),
    }))
    .filter((attribute) => attribute.value >= 45)
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  return {
    tags: [
      ...new Set([
        ...weights
          .filter((attribute) => attribute.value >= 58)
          .map((attribute) => attribute.key),
        ...weights.slice(0, 5).map((attribute) => attribute.key),
      ]),
    ],
    weights,
  };
}

export function buildChampionAttributes(input: {
  id: string;
  roles: Role[];
  classes: ChampionClass[];
  stats: StrategicStats;
}): ChampionAttribute[] {
  return buildChampionIdentity(input).weights;
}

export function getChampionAttributeValue(
  champion: Pick<ChampionProfile, "attributes">,
  key: ChampionAttributeKey,
): number {
  return champion.attributes.find((attribute) => attribute.key === key)?.value ?? 0;
}

export function getTopChampionAttributes(
  champion: Pick<ChampionProfile, "attributes">,
  count = 3,
): ChampionAttribute[] {
  return champion.attributes.slice(0, count);
}

export function validateChampionAttributes(
  champions: Pick<ChampionProfile, "id" | "attributeTags" | "attributes">[],
): string[] {
  const errors: string[] = [];
  champions.forEach((champion) => {
    if (champion.attributes.length < 5) {
      errors.push(`${champion.id}: menos de 5 atributos`);
    }
    if (champion.attributeTags.length < 5) {
      errors.push(`${champion.id}: menos de 5 tags qualitativas`);
    }
    if (new Set(champion.attributeTags).size !== champion.attributeTags.length) {
      errors.push(`${champion.id}: tag qualitativa duplicada`);
    }
    champion.attributeTags.forEach((key) => {
      if (!validAttributeKeys.has(key)) {
        errors.push(`${champion.id}: tag qualitativa invalida ${key}`);
      }
      if (!champion.attributes.some((attribute) => attribute.key === key)) {
        errors.push(`${champion.id}: tag qualitativa sem peso ${key}`);
      }
    });
    const seen = new Set<ChampionAttributeKey>();
    champion.attributes.forEach((attribute) => {
      if (!validAttributeKeys.has(attribute.key)) {
        errors.push(`${champion.id}: atributo invalido ${attribute.key}`);
      }
      if (seen.has(attribute.key)) {
        errors.push(`${champion.id}: atributo duplicado ${attribute.key}`);
      }
      if (attribute.value < 0 || attribute.value > 100) {
        errors.push(`${champion.id}: valor fora da escala em ${attribute.key}`);
      }
      seen.add(attribute.key);
    });
  });
  return errors;
}
