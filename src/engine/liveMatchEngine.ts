import type {
  CompetitiveEnemyTeam,
  EventImportance,
  LiveMatchEvent,
  LiveMatchSimulation,
  LiveMatchStats,
  MapZone,
  MatchContext,
  MatchSide,
  SimulationSpeed,
  StructureState,
  TeamScore,
} from "../types/game";
import { getRogueCardSummaryForMatch } from "./rogueCardEngine";

export const matchSimulationTimeBudgetMs: Record<SimulationSpeed, number> = {
  Slow: 20_000,
  Normal: 10_000,
  Fast: 5_000,
  UltraFast: 2_000,
};

export function calculateMatchTickMs(
  speed: SimulationSpeed,
  matchDurationMinutes: number,
): number {
  const budget = matchSimulationTimeBudgetMs[speed];
  return Math.max(
    20,
    Math.floor(budget / Math.max(matchDurationMinutes, 1)),
  );
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const randomBetween = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

const pickRandom = <T,>(values: readonly T[]): T =>
  values[Math.floor(Math.random() * values.length)];

const sideName = (side: MatchSide, enemy: CompetitiveEnemyTeam) =>
  side === "User" ? "MD5" : enemy.name;

const opposingSide = (side: MatchSide): MatchSide =>
  side === "User" ? "Enemy" : "User";

const laneZones = ["TopLane", "MidLane", "BotLane"] as const;
type LaneZone = (typeof laneZones)[number];
type LaneName = "top" | "mid" | "bot";
const skirmishZones = [
  "TopLane",
  "MidLane",
  "BotLane",
  "TopJungle",
  "BotJungle",
  "River",
] as const;

const createEvent = (
  minute: number,
  type: LiveMatchEvent["type"],
  side: MatchSide,
  mapZone: MapZone,
  title: string,
  description: string,
  importance: EventImportance,
  goldSwing = 0,
): LiveMatchEvent => ({
  id: `${minute}-${type}-${side}-${Math.random().toString(36).slice(2, 8)}`,
  minute,
  type,
  side,
  mapZone,
  title,
  description,
  importance,
  goldSwing,
});

const initialStructures = (): StructureState => ({
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
});

const initialStats = (): LiveMatchStats => ({
  minute: 0,
  userKills: 0,
  enemyKills: 0,
  userGold: 2_500,
  enemyGold: 2_500,
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
  structures: initialStructures(),
});

const calculateSidePower = (
  side: MatchSide,
  minute: number,
  stats: LiveMatchStats,
  userTeamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  context: MatchContext,
) => {
  const lateGame = minute >= 28;
  const userMetrics = userTeamScore.metrics;
  const modifiers = context.rogueModifiers;
  const goldDifference = stats.userGold - stats.enemyGold;
  const userPower =
    userTeamScore.total * 0.4 +
    userMetrics.cardSynergy * 0.08 +
    userMetrics.rulesAdaptation * 0.06 +
    userMetrics.objectiveControl * 0.12 +
    userMetrics.waveClear * 0.05 +
    (lateGame ? userMetrics.scaling : userMetrics.earlyGame) * 0.18 +
    userMetrics.consistency * 0.07 +
    (goldDifference / 900) *
      (goldDifference > 0 ? modifiers?.snowballMultiplier ?? 1 : 1) +
    Math.max(0, -goldDifference / 1400) *
      (modifiers?.comebackMultiplier ?? 1);
  const enemyPower =
    enemy.difficulty * 0.35 +
    enemy.draftCoherence * 0.16 +
    enemy.rulesAdaptation * 0.15 +
    enemy.modifiers.objectiveControl * 1.2 +
    (lateGame ? enemy.modifiers.scaling : enemy.modifiers.earlyPressure) * 1.4 +
    (-goldDifference / 900) *
      (goldDifference < 0 ? modifiers?.snowballMultiplier ?? 1 : 1) +
    Math.max(0, goldDifference / 1400) *
      (modifiers?.comebackMultiplier ?? 1);
  const expectedBias =
    context.expectedWinner === side
      ? minute < 18
        ? 2
        : minute < 28
          ? 5
          : 10
      : 0;

  return (side === "User" ? userPower : enemyPower) + expectedBias;
};

const chooseSide = (
  minute: number,
  stats: LiveMatchStats,
  userTeamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  context: MatchContext,
  objectiveBias = 0,
): MatchSide => {
  const userPower =
    calculateSidePower("User", minute, stats, userTeamScore, enemy, context) +
    userTeamScore.metrics.objectiveControl * objectiveBias;
  const enemyPower =
    calculateSidePower("Enemy", minute, stats, userTeamScore, enemy, context) +
    enemy.modifiers.objectiveControl * 10 * objectiveBias;
  const userChance = clamp(50 + (userPower - enemyPower) * 1.2, 18, 82);
  return Math.random() * 100 < userChance ? "User" : "Enemy";
};

const incrementSideStat = (
  stats: LiveMatchStats,
  side: MatchSide,
  userKey:
    | "userKills"
    | "userTowers"
    | "userDragons"
    | "userHeralds"
    | "userBarons"
    | "userInhibitors",
  enemyKey:
    | "enemyKills"
    | "enemyTowers"
    | "enemyDragons"
    | "enemyHeralds"
    | "enemyBarons"
    | "enemyInhibitors",
  amount = 1,
) => {
  if (side === "User") stats[userKey] += amount;
  else stats[enemyKey] += amount;
};

const laneKey = (zone: MapZone): LaneName =>
  zone === "TopLane" ? "top" : zone === "BotLane" ? "bot" : "mid";

const towerKey = (lane: LaneName, side: MatchSide) =>
  `${lane}Towers${side}` as
    | "topTowersUser"
    | "midTowersUser"
    | "botTowersUser"
    | "topTowersEnemy"
    | "midTowersEnemy"
    | "botTowersEnemy";

const inhibitorKey = (lane: LaneName, side: MatchSide) =>
  `${lane}Inhibitor${side}Destroyed` as
    | "topInhibitorUserDestroyed"
    | "midInhibitorUserDestroyed"
    | "botInhibitorUserDestroyed"
    | "topInhibitorEnemyDestroyed"
    | "midInhibitorEnemyDestroyed"
    | "botInhibitorEnemyDestroyed";

const getLaneTowerCount = (
  structures: StructureState,
  lane: LaneZone,
  side: MatchSide,
) => structures[towerKey(laneKey(lane), side)];

const isLaneInhibitorDestroyed = (
  structures: StructureState,
  lane: LaneZone,
  side: MatchSide,
) => structures[inhibitorKey(laneKey(lane), side)];

export function canDestroyNexus(
  structures: StructureState,
  targetSide: MatchSide,
): boolean {
  return laneZones.some(
    (lane) =>
      getLaneTowerCount(structures, lane, targetSide) === 0 &&
      isLaneInhibitorDestroyed(structures, lane, targetSide),
  );
}

export function getWinningLanePath(
  structures: StructureState,
  loserSide: MatchSide,
): LaneZone {
  return [...laneZones].sort((left, right) => {
    const leftProgress =
      getLaneTowerCount(structures, left, loserSide) -
      Number(isLaneInhibitorDestroyed(structures, left, loserSide));
    const rightProgress =
      getLaneTowerCount(structures, right, loserSide) -
      Number(isLaneInhibitorDestroyed(structures, right, loserSide));
    return leftProgress - rightProgress;
  })[0];
}

const canDestroyInhibitor = (
  structures: StructureState,
  targetSide: MatchSide,
  lane: LaneZone,
) =>
  getLaneTowerCount(structures, lane, targetSide) === 0 &&
  !isLaneInhibitorDestroyed(structures, lane, targetSide);

const updateStructureState = (
  structures: StructureState,
  event: LiveMatchEvent,
): boolean => {
  const lane = laneKey(event.mapZone);
  const defendingSide = event.side === "User" ? "Enemy" : "User";

  if (event.type === "TowerDestroyed") {
    const key = towerKey(lane, defendingSide);
    const current = structures[key];
    if (current <= 0) return false;
    structures[key] = current - 1;
    return true;
  }

  if (event.type === "InhibitorDestroyed") {
    const laneZone = event.mapZone as LaneZone;
    if (!canDestroyInhibitor(structures, defendingSide, laneZone)) return false;
    structures[inhibitorKey(lane, defendingSide)] = true;
    return true;
  }

  return false;
};

export function applyEventToStats(
  stats: LiveMatchStats,
  event: LiveMatchEvent,
): LiveMatchStats {
  const next: LiveMatchStats = {
    ...stats,
    structures: { ...stats.structures },
  };

  if (event.type === "FirstBlood" || event.type === "Kill") {
    incrementSideStat(next, event.side, "userKills", "enemyKills");
  }
  if (event.type === "TeamFight") {
    incrementSideStat(
      next,
      event.side,
      "userKills",
      "enemyKills",
      event.importance === "Critical" ? 4 : 3,
    );
  }
  if (event.type === "Ace") {
    incrementSideStat(next, event.side, "userKills", "enemyKills", 5);
  }
  if (event.type === "TowerDestroyed") {
    if (updateStructureState(next.structures, event)) {
      incrementSideStat(next, event.side, "userTowers", "enemyTowers");
      next.userTowers = Math.min(next.userTowers, 9);
      next.enemyTowers = Math.min(next.enemyTowers, 9);
    }
  }
  if (event.type === "DragonTaken") {
    incrementSideStat(next, event.side, "userDragons", "enemyDragons");
  }
  if (event.type === "HeraldTaken") {
    incrementSideStat(next, event.side, "userHeralds", "enemyHeralds");
  }
  if (event.type === "BaronTaken" || event.type === "ObjectiveSteal") {
    incrementSideStat(next, event.side, "userBarons", "enemyBarons");
  }
  if (event.type === "InhibitorDestroyed") {
    if (updateStructureState(next.structures, event)) {
      incrementSideStat(next, event.side, "userInhibitors", "enemyInhibitors");
      next.userInhibitors = Math.min(next.userInhibitors, 3);
      next.enemyInhibitors = Math.min(next.enemyInhibitors, 3);
    }
  }
  if (event.goldSwing) {
    if (event.side === "User") next.userGold += event.goldSwing;
    else next.enemyGold += event.goldSwing;
  }

  return next;
}

const objectiveEvent = (
  minute: number,
  type: "DragonTaken" | "HeraldTaken" | "BaronTaken",
  side: MatchSide,
  enemy: CompetitiveEnemyTeam,
  valueMultiplier = 1,
) => {
  const team = sideName(side, enemy);
  if (type === "DragonTaken") {
    return createEvent(
      minute,
      type,
      side,
      "DragonPit",
      "Dragão garantido",
      `${team} controlou o rio e confirmou o dragão antes da contestação.`,
      "High",
      Math.round(650 * valueMultiplier),
    );
  }
  if (type === "HeraldTaken") {
    return createEvent(
      minute,
      type,
      side,
      "BaronPit",
      "Arauto conquistado",
      `${team} transformou prioridade de rota em controle do Arauto.`,
      "Medium",
      Math.round(500 * valueMultiplier),
    );
  }
  return createEvent(
    minute,
    type,
    side,
    "BaronPit",
    "Barão garantido",
    `${team} encontrou a janela e saiu do covil com o bônus do Barão.`,
    "Critical",
    Math.round(1_500 * valueMultiplier),
  );
};

export function generateMinuteEvents(
  minute: number,
  currentStats: LiveMatchStats,
  userTeamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  context: MatchContext,
): LiveMatchEvent[] {
  const events: LiveMatchEvent[] = [];
  const modifiers = context.rogueModifiers;
  const totalKills = currentStats.userKills + currentStats.enemyKills;
  const objectiveOffset = Math.round(modifiers?.earlyObjectiveOffset ?? 0);
  const dragonMinutes = [6, 12, 18, 24, 30, 36, 42, 48].map((value) =>
    Math.max(3, value + objectiveOffset),
  );
  const heraldMinutes = [9, 15].map((value) =>
    Math.max(5, value + objectiveOffset),
  );
  const baronMinutes = [23, 30, 37, 44].map((value) =>
    Math.max(20, value + objectiveOffset),
  );

  if (minute >= 3 && minute <= 6 && totalKills === 0) {
    const mustHappen = minute === 6;
    if (mustHappen || Math.random() < 0.34) {
      const side = chooseSide(
        minute,
        currentStats,
        userTeamScore,
        enemy,
        context,
      );
      events.push(
        createEvent(
          minute,
          "FirstBlood",
          side,
          "River",
          "First blood",
          `${sideName(side, enemy)} encontrou o primeiro abate após pressão no rio.`,
          "High",
          Math.round(
            700 *
              (modifiers?.killGoldMultiplier ?? 1) *
              (modifiers?.snowballMultiplier ?? 1),
          ),
        ),
      );
    }
  }

  if (dragonMinutes.includes(minute)) {
    const side = chooseSide(
      minute,
      currentStats,
      userTeamScore,
      enemy,
      context,
      0.08,
    );
    events.push(
      objectiveEvent(
        minute,
        "DragonTaken",
        side,
        enemy,
        (modifiers?.objectiveValueMultiplier ?? 1) *
          (modifiers?.dragonValueMultiplier ?? 1),
      ),
    );
  }

  if (heraldMinutes.includes(minute)) {
    const side = chooseSide(
      minute,
      currentStats,
      userTeamScore,
      enemy,
      context,
      0.06,
    );
    events.push(
      objectiveEvent(
        minute,
        "HeraldTaken",
        side,
        enemy,
        modifiers?.objectiveValueMultiplier ?? 1,
      ),
    );
  }

  if (baronMinutes.includes(minute)) {
    const side = chooseSide(
      minute,
      currentStats,
      userTeamScore,
      enemy,
      context,
      0.1,
    );
    const stealChance =
      Math.abs(currentStats.userGold - currentStats.enemyGold) < 2_500
        ? 0.08 + (modifiers?.objectiveStealChance ?? 0)
        : 0.03 + (modifiers?.objectiveStealChance ?? 0);
    events.push(
      Math.random() < stealChance
        ? createEvent(
            minute,
            "ObjectiveSteal",
            side,
            "BaronPit",
            "Roubo de Barão",
            `${sideName(side, enemy)} virou a disputa com um roubo no último instante.`,
            "Critical",
            Math.round(
              1_800 * (modifiers?.objectiveValueMultiplier ?? 1),
            ),
          )
        : objectiveEvent(
            minute,
            "BaronTaken",
            side,
            enemy,
            (modifiers?.objectiveValueMultiplier ?? 1) *
              (modifiers?.baronPressureMultiplier ?? 1),
          ),
    );
  }

  const fightChance =
    (minute < 14 ? 0.09 : minute < 28 ? 0.16 : 0.2) *
    (modifiers?.fightChanceMultiplier ?? 1);
  if (minute > 7 && Math.random() < fightChance) {
    const side = chooseSide(
      minute,
      currentStats,
      userTeamScore,
      enemy,
      context,
    );
    const zone = pickRandom(skirmishZones);
    const team = sideName(side, enemy);
    if (minute >= 25 && Math.random() < 0.18) {
      events.push(
        createEvent(
          minute,
          "Ace",
          side,
          zone,
          "Ace na luta",
          `${team} eliminou os cinco adversários e abriu o mapa por completo.`,
          "Critical",
          Math.round(2_100 * (modifiers?.killGoldMultiplier ?? 1)),
        ),
      );
    } else if (minute >= 14) {
      events.push(
        createEvent(
          minute,
          "TeamFight",
          side,
          zone,
          "Luta vencida",
          `${team} executou melhor a luta em equipe e ganhou espaço no mapa.`,
          minute >= 28 ? "High" : "Medium",
          Math.round(
            (minute >= 28 ? 1_350 : 950) *
              (modifiers?.killGoldMultiplier ?? 1),
          ),
        ),
      );
    } else {
      events.push(
        createEvent(
          minute,
          "Kill",
          side,
          zone,
          "Pickoff encontrado",
          `${team} isolou um alvo durante a rotação e abriu vantagem.`,
          "Medium",
          Math.round(420 * (modifiers?.killGoldMultiplier ?? 1)),
        ),
      );
    }
    events.push(
      createEvent(
        minute,
        "Assist",
        side,
        zone,
        "Assistências na jogada",
        `${team} coordenou a rotação e distribuiu assistências.`,
        "Low",
      ),
      createEvent(
        minute,
        "Death",
        opposingSide(side),
        zone,
        "Baixas na rotação",
        `${sideName(opposingSide(side), enemy)} perdeu jogadores na troca.`,
        "Low",
      ),
    );
  }

  const baronLead = currentStats.userBarons - currentStats.enemyBarons;
  const towerChance =
    ((minute < 10 ? 0 : minute < 22 ? 0.11 : 0.18) +
      (baronLead !== 0
        ? 0.07 * (modifiers?.baronPressureMultiplier ?? 1)
        : 0)) *
    (modifiers?.towerChanceMultiplier ?? 1) *
    Math.max(0.3, 1 - (modifiers?.towerResistance ?? 0));
  if (Math.random() < towerChance) {
    const side = chooseSide(
      minute,
      currentStats,
      userTeamScore,
      enemy,
      context,
    );
    const defendingSide = opposingSide(side);
    const availableLanes = laneZones.filter(
      (lane) =>
        getLaneTowerCount(currentStats.structures, lane, defendingSide) > 0,
    );
    if (availableLanes.length) {
      const zone = pickRandom(availableLanes);
      events.push(
        createEvent(
          minute,
          "TowerDestroyed",
          side,
          zone,
          "Torre derrubada",
          `${sideName(side, enemy)} converteu a pressão em uma torre na rota.`,
          "Medium",
          550,
        ),
      );
    }
  }

  if ([8, 14, 21, 28, 35, 42].includes(minute)) {
    const side = chooseSide(
      minute,
      currentStats,
      userTeamScore,
      enemy,
      context,
    );
    const zone = pickRandom(skirmishZones);
    const isSpike =
      (side === "User" &&
        ((minute < 18 && userTeamScore.metrics.earlyGame >= 62) ||
          (minute >= 25 && userTeamScore.metrics.scaling >= 65))) ||
      (side === "Enemy" &&
        ((minute < 18 && enemy.modifiers.earlyPressure >= 7) ||
          (minute >= 25 && enemy.modifiers.scaling >= 7)));
    events.push(
      createEvent(
        minute,
        isSpike ? "PowerSpike" : "MapPressure",
        side,
        zone,
        isSpike ? "Pico de poder" : "Controle de mapa",
        isSpike
          ? `${sideName(side, enemy)} completou itens importantes e mudou o ritmo da partida.`
          : `${sideName(side, enemy)} avançou visão e passou a ditar as rotações.`,
        "Low",
        250,
      ),
    );
  }

  if (
    minute >= 28 &&
    Math.random() <
      0.08 * Math.max(0.25, 1 - (modifiers?.inhibitorResistance ?? 0))
  ) {
    const side = chooseSide(
      minute,
      currentStats,
      userTeamScore,
      enemy,
      context,
    );
    const defendingSide = opposingSide(side);
    const exposedLanes = laneZones.filter((lane) =>
      canDestroyInhibitor(currentStats.structures, defendingSide, lane),
    );
    if (exposedLanes.length) {
      const zone = pickRandom(exposedLanes);
      events.push(
        createEvent(
          minute,
          "InhibitorDestroyed",
          side,
          zone,
          "Inibidor destruído",
          `${sideName(side, enemy)} rompeu a base pela rota e colocou supertropas no mapa.`,
          "Critical",
          1_100,
        ),
      );
    }
  }

  const goldLead = currentStats.userGold - currentStats.enemyGold;
  if (minute > 10 && minute % 7 === 0 && Math.abs(goldLead) >= 1_800) {
    const side: MatchSide = goldLead > 0 ? "User" : "Enemy";
    events.push(
      createEvent(
        minute,
        "GoldLead",
        side,
        "River",
        "Vantagem de ouro",
        `${sideName(side, enemy)} consolidou uma vantagem relevante de recursos.`,
        "Low",
      ),
    );
  }

  return events;
}

export function determineLiveMatchWinner(
  stats: LiveMatchStats,
  userTeamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  context: MatchContext,
): MatchSide {
  const userMapScore =
    stats.userKills * 2 +
    stats.userTowers * 3 +
    stats.userDragons * 4 +
    stats.userBarons * 7 +
    stats.userInhibitors * 8 +
    userTeamScore.metrics.scaling * 0.08;
  const enemyMapScore =
    stats.enemyKills * 2 +
    stats.enemyTowers * 3 +
    stats.enemyDragons * 4 +
    stats.enemyBarons * 7 +
    stats.enemyInhibitors * 8 +
    enemy.modifiers.scaling * 0.8;

  if (Math.abs(userMapScore - enemyMapScore) < 9) {
    return context.expectedWinner;
  }
  const mapWinner: MatchSide =
    userMapScore > enemyMapScore ? "User" : "Enemy";
  return mapWinner === context.expectedWinner
    ? mapWinner
    : context.expectedWinner;
}

export function calculateProfessionalGameDuration(
  userTeamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  context: MatchContext,
): number {
  const roll = Math.random();
  let duration =
    roll < 0.1
      ? randomBetween(23, 27)
      : roll < 0.32
        ? randomBetween(28, 31)
        : roll < 0.8
          ? randomBetween(32, 36)
          : roll < 0.96
            ? randomBetween(37, 42)
            : randomBetween(43, 47);
  const powerGap = Math.abs(context.userPower - 50);
  const userMetrics = userTeamScore.metrics;
  const winnerIsUser = context.expectedWinner === "User";
  const winningArchetype = winnerIsUser
    ? userTeamScore.archetype
    : enemy.archetype;
  const bothScale =
    ["Scaling", "Protect the Carry"].includes(userTeamScore.archetype) &&
    ["Scaling", "Protect the Carry"].includes(enemy.archetype);
  const winnerObjectiveControl = winnerIsUser
    ? userMetrics.objectiveControl
    : enemy.modifiers.objectiveControl * 10;
  const winnerAdaptation = winnerIsUser
    ? userMetrics.rulesAdaptation
    : enemy.rulesAdaptation;

  if (powerGap >= 30) duration -= 4;
  else if (powerGap >= 20) duration -= 2;
  else if (powerGap <= 8) duration += 2;

  if (winningArchetype === "Early Snowball") duration -= 3;
  if (bothScale) duration += 3;
  else if (winningArchetype === "Scaling") duration += 2;

  if (winnerObjectiveControl >= 72) duration -= 1;
  if (winnerAdaptation >= 82) duration -= 1;
  if (winnerAdaptation < 58) duration += 2;
  if (context.stage === "Final" && powerGap <= 12) duration += 2;
  duration += context.rogueModifiers?.durationMinutes ?? 0;
  duration += Math.round((context.rogueModifiers?.nexusResistance ?? 0) * 4);

  return Math.round(clamp(duration, 18, 55));
}

const summaryPriority: Record<LiveMatchEvent["type"], number> = {
  GameEnd: 100,
  Ace: 95,
  BaronTaken: 90,
  ObjectiveSteal: 88,
  InhibitorDestroyed: 85,
  DragonTaken: 80,
  TeamFight: 75,
  TowerDestroyed: 65,
  FirstBlood: 60,
  Kill: 50,
  GoldLead: 40,
  MapPressure: 30,
  HeraldTaken: 55,
  PowerSpike: 35,
  Assist: 10,
  Death: 10,
};

export function generateCurrentEventSummary(
  visibleEvents: LiveMatchEvent[],
  currentMinute: number,
): string {
  const recentEvents = visibleEvents
    .filter(
      (event) =>
        event.minute <= currentMinute && event.minute >= currentMinute - 2,
    )
    .sort(
      (left, right) =>
        summaryPriority[right.type] - summaryPriority[left.type] ||
        right.minute - left.minute,
    );
  const event = recentEvents[0];

  if (event) {
    return `Minuto ${currentMinute} — ${event.description}`;
  }
  if (currentMinute < 8) {
    return `Minuto ${currentMinute} — As equipes disputam espaço nas rotas e visão no rio.`;
  }
  if (currentMinute < 22) {
    return `Minuto ${currentMinute} — O jogo segue equilibrado enquanto os times preparam o próximo objetivo.`;
  }
  return `Minuto ${currentMinute} — As equipes avançam a visão e procuram uma luta capaz de decidir o mapa.`;
}

export function formatGoldDifference(
  userGold: number,
  enemyGold: number,
  side: MatchSide,
): {
  text: string;
  status: "Ahead" | "Behind" | "Even";
} {
  const rawDifference = userGold - enemyGold;
  const difference = side === "User" ? rawDifference : -rawDifference;
  if (Math.abs(difference) < 250) {
    return { text: "equilíbrio", status: "Even" };
  }
  return {
    text: `${difference > 0 ? "+" : "-"}${(Math.abs(difference) / 1000).toFixed(1)}k`,
    status: difference > 0 ? "Ahead" : "Behind",
  };
}

export function generateLiveMatchEndReason(
  simulation: LiveMatchSimulation,
  userTeamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
): string {
  const finalStats = simulation.statsByMinute.at(-1)!;
  const winnerName =
    simulation.finalWinner === "User" ? "MD5" : simulation.enemyName;
  const winnerObjectives =
    simulation.finalWinner === "User"
      ? finalStats.userDragons + finalStats.userBarons
      : finalStats.enemyDragons + finalStats.enemyBarons;
  const loserObjectives =
    simulation.finalWinner === "User"
      ? finalStats.enemyDragons + finalStats.enemyBarons
      : finalStats.userDragons + finalStats.userBarons;
  const winningLane = getWinningLanePath(
    finalStats.structures,
    opposingSide(simulation.finalWinner),
  );
  const laneLabel =
    winningLane === "TopLane"
      ? "rota superior"
      : winningLane === "BotLane"
        ? "rota inferior"
        : "rota do meio";

  if (winnerObjectives > loserObjectives) {
    return `${winnerName} venceu pelo controle de objetivos e converteu a pressão pela ${laneLabel} até o núcleo.`;
  }
  if (
    simulation.finalWinner === "User" &&
    userTeamScore.metrics.scaling >= 65 &&
    simulation.durationMinutes >= 34
  ) {
    return "MD5 absorveu a pressão inicial, alcançou seu pico de composição e venceu a luta decisiva no late game.";
  }
  if (
    simulation.finalWinner === "Enemy" &&
    enemy.punishProfile.punishesNoEngage
  ) {
    return `${enemy.name} controlou o mapa e puniu a dificuldade do MD5 para iniciar lutas favoráveis.`;
  }
  if (
    simulation.finalWinner === "Enemy" &&
    enemy.punishProfile.punishesLowPeel
  ) {
    return `${enemy.name} alcançou os carregadores do MD5 e decidiu a partida em lutas rápidas.`;
  }
  return `${winnerName} executou melhor as lutas decisivas e fechou a partida pela ${laneLabel}.`;
}

export function simulateLiveMatch(
  userTeamScore: TeamScore,
  enemy: CompetitiveEnemyTeam,
  context: MatchContext,
): LiveMatchSimulation {
  const durationMinutes = calculateProfessionalGameDuration(
    userTeamScore,
    enemy,
    context,
  );
  const events: LiveMatchEvent[] = [];
  const statsByMinute: LiveMatchStats[] = [initialStats()];
  let stats = statsByMinute[0];
  let closingLane: LaneZone | null = null;

  for (let minute = 1; minute <= durationMinutes; minute += 1) {
    const userFarmEdge =
      calculateSidePower(
        "User",
        minute,
        stats,
        userTeamScore,
        enemy,
        context,
      ) -
      calculateSidePower(
        "Enemy",
        minute,
        stats,
        userTeamScore,
        enemy,
        context,
      );
    stats = {
      ...stats,
      minute,
      userGold:
        stats.userGold +
        1_280 +
        randomBetween(0, 140) +
        Math.max(0, userFarmEdge * 2),
      enemyGold:
        stats.enemyGold +
        1_280 +
        randomBetween(0, 140) +
        Math.max(0, -userFarmEdge * 2),
    };

    const minuteEvents =
      minute >= durationMinutes - 4
        ? []
        : generateMinuteEvents(
            minute,
            stats,
            userTeamScore,
            enemy,
            context,
          );
    minuteEvents.forEach((event) => {
      stats = applyEventToStats(stats, event);
      events.push(event);
    });

    if (minute === durationMinutes - 4) {
      closingLane = getWinningLanePath(
        stats.structures,
        opposingSide(context.expectedWinner),
      );
    }

    if (minute === durationMinutes - 2) {
      const decisiveFight = createEvent(
        minute,
        "TeamFight",
        context.expectedWinner,
        "River",
        "Luta decisiva",
        `${sideName(context.expectedWinner, enemy)} venceu a luta que abriu o caminho para a base.`,
        "Critical",
        1_800,
      );
      stats = applyEventToStats(stats, decisiveFight);
      events.push(decisiveFight);
    }

    if (
      minute >= durationMinutes - 4 &&
      minute <= durationMinutes - 2 &&
      closingLane
    ) {
      const defendingSide = opposingSide(context.expectedWinner);
      if (getLaneTowerCount(stats.structures, closingLane, defendingSide) > 0) {
        const tower = createEvent(
          minute,
          "TowerDestroyed",
          context.expectedWinner,
          closingLane,
          "Rota aberta",
          `${sideName(context.expectedWinner, enemy)} avançou pela rota decisiva e derrubou mais uma torre.`,
          "High",
          550,
        );
        stats = applyEventToStats(stats, tower);
        events.push(tower);
      }
    }

    if (minute === durationMinutes - 1) {
      const defendingSide = opposingSide(context.expectedWinner);
      closingLane ??= getWinningLanePath(stats.structures, defendingSide);
      if (canDestroyInhibitor(stats.structures, defendingSide, closingLane)) {
        const inhibitor = createEvent(
          minute,
          "InhibitorDestroyed",
          context.expectedWinner,
          closingLane,
          "Base exposta",
          `${sideName(context.expectedWinner, enemy)} destruiu o inibidor da rota e iniciou o avanço final.`,
          "Critical",
          1_000,
        );
        stats = applyEventToStats(stats, inhibitor);
        events.push(inhibitor);
      }
    }

    if (minute === durationMinutes) {
      const defendingSide = opposingSide(context.expectedWinner);
      if (canDestroyNexus(stats.structures, defendingSide)) {
        events.push(
          createEvent(
            minute,
            "GameEnd",
            context.expectedWinner,
            context.expectedWinner === "User" ? "EnemyBase" : "UserBase",
            "Fim de jogo",
            `${sideName(context.expectedWinner, enemy)} destruiu o núcleo adversário pela rota aberta.`,
            "Critical",
          ),
        );
      }
    }

    statsByMinute.push({
      ...stats,
      structures: { ...stats.structures },
      userGold: Math.round(stats.userGold),
      enemyGold: Math.round(stats.enemyGold),
    });
  }

  const finalWinner = determineLiveMatchWinner(
    statsByMinute.at(-1)!,
    userTeamScore,
    enemy,
    context,
  );
  const simulation: LiveMatchSimulation = {
    id: `live-${context.matchNumber}-${enemy.id}`,
    stage: context.stage,
    gameLabel: context.gameLabel,
    gameNumber: context.gameNumber,
    matchNumber: context.matchNumber,
    userTeamName: "MD5",
    enemyName: enemy.name,
    enemyTier: enemy.tier,
    enemyArchetype: enemy.archetype,
    userDraft: context.userTeam,
    enemyDraft: context.enemyTeam,
    durationMinutes,
    finalWinner,
    finalReason: "",
    events,
    statsByMinute,
    activeCards: context.activeCards,
    rogueCardSummary: getRogueCardSummaryForMatch(
      context.activeCards ?? [],
    ),
  };
  simulation.finalReason = generateLiveMatchEndReason(
    simulation,
    userTeamScore,
    enemy,
  );
  return simulation;
}

export function eventIsVisibleAtSpeed(
  event: LiveMatchEvent,
  speed: SimulationSpeed,
) {
  if (speed === "Slow") return true;
  if (speed === "Normal") return event.importance !== "Low";
  if (speed === "Fast") {
    return (
      event.importance === "High" ||
      event.importance === "Critical" ||
      (event.importance === "Medium" && event.type === "TeamFight")
    );
  }
  return (
    event.importance === "Critical" ||
    event.type === "DragonTaken" ||
    event.type === "BaronTaken" ||
    event.type === "GameEnd"
  );
}
