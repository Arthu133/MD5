export const ROLES = ["Top", "Jungle", "Mid", "Carry", "Support"] as const;

export type Role = (typeof ROLES)[number];

export type DamageProfile = "AD" | "AP" | "Hybrid" | "TrueDamage" | "Utility";

export type ChampionClass =
  | "Tank"
  | "Fighter"
  | "Assassin"
  | "Mage"
  | "Marksman"
  | "Enchanter"
  | "Controller"
  | "Engager"
  | "Specialist";

export type GamePhase = "Early" | "Mid" | "Late";

export type GameDifficulty = "Classic" | "Hard";

export type RoleFitLevel = "Natural" | "Flex" | "OffMeta" | "Bad" | "Terrible";

export type RoleFitResult = {
  score: number;
  level: RoleFitLevel;
  reasons: string[];
  penalties: string[];
};

export type StrategicStats = {
  damageAD: number;
  damageAP: number;
  tankiness: number;
  engage: number;
  peel: number;
  crowdControl: number;
  mobility: number;
  waveClear: number;
  objectiveControl: number;
  scaling: number;
  earlyPressure: number;
  teamFight: number;
  splitPush: number;
  pickoff: number;
  sustain: number;
  burst: number;
  utility: number;
};

export type ItemPreferences = {
  prefersAD: boolean;
  prefersAP: boolean;
  prefersAttackSpeed: boolean;
  prefersCrit: boolean;
  prefersLethality: boolean;
  prefersTank: boolean;
  prefersHealth: boolean;
  prefersArmor: boolean;
  prefersMagicResist: boolean;
  prefersAbilityHaste: boolean;
  prefersMana: boolean;
  prefersHealShieldPower: boolean;
  prefersUtility: boolean;
  prefersEngage: boolean;
  prefersPeel: boolean;
};

export type ChampionProfile = {
  id: string;
  key: string;
  name: string;
  title?: string;
  image?: string;
  roles: Role[];
  primaryRole: Role;
  classes: ChampionClass[];
  damageProfile: DamageProfile;
  difficulty: number;
  stats: StrategicStats;
  tags: string[];
  itemPreferences: ItemPreferences;
  weaknesses: string[];
  summary: string;
  resource: string;
};

export type ItemCategory =
  | "AD"
  | "AP"
  | "Tank"
  | "Bruiser"
  | "Assassin"
  | "Marksman"
  | "Enchanter"
  | "Controller"
  | "Engage"
  | "Peel"
  | "Utility"
  | "Scaling"
  | "EarlyGame"
  | "ObjectiveControl"
  | "AntiBurst"
  | "AntiTank"
  | "Sustain"
  | "Mobility"
  | "WaveClear"
  | "SplitPush";

export type ItemDisplayTag =
  | "AD"
  | "AP"
  | "CURA"
  | "ESCUDO"
  | "ARMADURA"
  | "RESISTÊNCIA MÁGICA"
  | "VIDA"
  | "MANA"
  | "CRÍTICO"
  | "VELOCIDADE DE ATAQUE"
  | "PENETRAÇÃO"
  | "LETALIDADE"
  | "ACELERAÇÃO"
  | "EXPLOSÃO"
  | "SUSTAIN"
  | "MOBILIDADE"
  | "ENGAGE"
  | "PEEL"
  | "CONTROLE"
  | "CLEAR WAVE"
  | "OBJETIVOS"
  | "SCALING"
  | "ANTI-TANK"
  | "ANTI-BURST"
  | "SPLIT PUSH"
  | "ANTI-CURA"
  | "ANTI-ESCUDO"
  | "VISAO"
  | "ROAMING"
  | "DISENGAGE"
  | "DPS"
  | "SIEGE"
  | "SNOWBALL"
  | "COMEBACK"
  | "TENACIDADE";

export type ItemStats = Partial<
  StrategicStats & {
    bonusAD: number;
    bonusAP: number;
    attackSpeed: number;
    crit: number;
    lethality: number;
    armorPen: number;
    magicPen: number;
    health: number;
    armor: number;
    magicResist: number;
    abilityHaste: number;
    mana: number;
    healShieldPower: number;
    antiHeal: number;
    antiShield: number;
    antiTank: number;
    antiBurst: number;
    visionControl: number;
    roaming: number;
    disengage: number;
    siege: number;
    dps: number;
    snowball: number;
    comeback: number;
    tenacity: number;
  }
>;

export type Item = {
  id: string;
  name: string;
  icon: string;
  category: ItemCategory;
  description: string;
  displayTags: ItemDisplayTag[];
  stats: ItemStats;
  tags: string[];
  bestFor: {
    roles?: Role[];
    classes?: ChampionClass[];
    damageProfiles?: DamageProfile[];
    championTags?: string[];
  };
  badFor: {
    roles?: Role[];
    classes?: ChampionClass[];
    damageProfiles?: DamageProfile[];
    championTags?: string[];
  };
  uniqueEffect?: {
    name: string;
    description: string;
    effects: Partial<StrategicStats>;
  };
};

export type ItemFitLevel = "Excellent" | "Good" | "Average" | "Poor" | "Terrible";

export type ItemFitResult = {
  score: number;
  level: ItemFitLevel;
  reasons: string[];
  penalties: string[];
};

export type BuildScore = {
  total: number;
  averageItemFit: number;
  offensivePower: number;
  defensivePower: number;
  utilityPower: number;
  identityAlignment: number;
  consistency: number;
  spikeTiming: GamePhase;
  reasons: string[];
  warnings: string[];
};

export type EnhancedChampion = ChampionProfile & {
  selectedItems: Item[];
  buildScore: BuildScore;
  enhancedStats: StrategicStats;
};

export type ChampionBuild = {
  role: Role;
  champion: ChampionProfile;
  items: Item[];
};

export type DraftTeam = ChampionBuild[];

export type TeamArchetype =
  | "Team Fight"
  | "Pickoff"
  | "Split Push"
  | "Poke"
  | "Protect the Carry"
  | "Early Snowball"
  | "Scaling"
  | "Balanced";

export type MetaTier = "S" | "A" | "B" | "C" | "OffMeta";

export type MetaPlaystyle =
  | "StrongSideTop"
  | "CarryJungle"
  | "ControlMid"
  | "ScalingBot"
  | "LaneDominantBot"
  | "EngageSupport"
  | "EnchanterScaling"
  | "Dive"
  | "Poke"
  | "FrontToBack"
  | "PickComp"
  | "SplitMap"
  | "ObjectiveStacking";

export type ChampionMetaRoleProfile = {
  tier: MetaTier;
  priority: number;
  proPresence: number;
  blindPickSafety: number;
  counterPickPower: number;
  scalingReliability: number;
  earlyGameReliability: number;
};

export type ChampionMetaProfile = {
  championId: string;
  championName: string;
  roles: Partial<Record<Role, ChampionMetaRoleProfile>>;
  playstyles: MetaPlaystyle[];
  strongWith: string[];
  weakWith: string[];
  goodAgainstArchetypes: TeamArchetype[];
  badAgainstArchetypes: TeamArchetype[];
  defaultBuildArchetypes: ItemCategory[];
};

export type CompetitiveCompTemplate = {
  id: string;
  name: string;
  archetype: TeamArchetype;
  difficultyWeight: number;
  requiredTraits: {
    minFrontline: number;
    minEngage: number;
    minPeel: number;
    minCrowdControl: number;
    minWaveClear: number;
    minObjectiveControl: number;
    minScaling: number;
  };
  preferredRoleProfiles: Record<Role, MetaPlaystyle[]>;
  description: string;
  strengths: string[];
  weaknesses: string[];
  winCondition: string;
};

export type TeamMetrics = {
  physicalDamage: number;
  magicDamage: number;
  frontline: number;
  engage: number;
  peel: number;
  crowdControl: number;
  scaling: number;
  earlyGame: number;
  objectiveControl: number;
  itemization: number;
  consistency: number;
  executionDifficulty: number;
  teamFight: number;
  pickoff: number;
  splitPush: number;
  waveClear: number;
  roleFit: number;
};

export type ScoreCapReason = {
  cap: number;
  reason: string;
};

export type ScoreCapResult = {
  finalCap: number;
  reasons: ScoreCapReason[];
};

export type TeamScore = {
  total: number;
  rawTotal: number;
  scoreCap?: ScoreCapResult;
  archetype: TeamArchetype;
  metrics: TeamMetrics;
  synergyBonus: number;
  championStrength: number;
  buildCoherence: number;
  damageBalance: number;
  winConditionClarity: number;
  strengths: string[];
  weaknesses: string[];
  warnings: string[];
  itemWarnings: string[];
  roleWarnings: string[];
  winCondition: string;
};

export type EnemyTeam = {
  id: string;
  name: string;
  difficulty: number;
  archetype: TeamArchetype;
  strengths: string[];
  weaknesses: string[];
  modifiers: {
    earlyPressure: number;
    scaling: number;
    teamFight: number;
    pickoff: number;
    objectiveControl: number;
    antiAD: number;
    antiAP: number;
    punishNoFrontline: number;
    punishBadItems: number;
  };
};

export type TournamentStage =
  | "Groups"
  | "Quarterfinals"
  | "Semifinals"
  | "Final";

export type EnemyTier = "Wildcard" | "Regional" | "Major" | "Elite" | "Champion";

export type EnemyOrganizationProfile = {
  id: string;
  name: string;
  tier: EnemyTier;
  preferredTemplates: string[];
  aggression: number;
  scalingPreference: number;
  objectiveFocus: number;
  draftDiscipline: number;
  itemizationDiscipline: number;
  adaptability: number;
};

export type CompetitiveEnemyTeam = EnemyTeam & {
  tier: EnemyTier;
  stage: TournamentStage;
  templateId: string;
  templateName: string;
  metaRating: number;
  draftCoherence: number;
  itemizationQuality: number;
  simulatedDraft: DraftTeam;
  winCondition: string;
  mainThreat: string;
  punishProfile: {
    punishesNoFrontline: boolean;
    punishesLowPeel: boolean;
    punishesFullAD: boolean;
    punishesFullAP: boolean;
    punishesBadItems: boolean;
    punishesLowWaveClear: boolean;
    punishesNoEngage: boolean;
    punishesLowScaling: boolean;
  };
};

export type DraftValidationResult = {
  valid: boolean;
  score: number;
  problems: string[];
};

export type MatchResult = {
  matchNumber: number;
  gameNumber: number;
  stage: TournamentStage;
  enemyName: string;
  enemyArchetype: TeamArchetype;
  enemyTier: EnemyTier;
  userPower: number;
  enemyPower: number;
  win: boolean;
  reason: string;
  liveSimulation: LiveMatchSimulation;
};

export type SeriesResult = {
  stage: TournamentStage;
  enemy: CompetitiveEnemyTeam;
  userWins: number;
  enemyWins: number;
  won: boolean;
  games: MatchResult[];
  seriesConsistencyPenalty: number;
};

export type CampaignResult = {
  difficulty: GameDifficulty;
  wins: number;
  losses: number;
  perfectRun: boolean;
  champion: boolean;
  eliminatedAt?: TournamentStage;
  groupWins: number;
  groupLosses: number;
  teamScore: TeamScore;
  matches: MatchResult[];
  series: SeriesResult[];
  finalDiagnosis: string;
};

export type MatchEventType =
  | "Kill"
  | "Death"
  | "Assist"
  | "FirstBlood"
  | "TowerDestroyed"
  | "DragonTaken"
  | "HeraldTaken"
  | "BaronTaken"
  | "ObjectiveSteal"
  | "InhibitorDestroyed"
  | "TeamFight"
  | "Ace"
  | "GoldLead"
  | "MapPressure"
  | "PowerSpike"
  | "GameEnd";

export type MatchSide = "User" | "Enemy";

export type EventImportance = "Low" | "Medium" | "High" | "Critical";

export type MapZone =
  | "TopLane"
  | "MidLane"
  | "BotLane"
  | "TopJungle"
  | "BotJungle"
  | "River"
  | "DragonPit"
  | "BaronPit"
  | "UserBase"
  | "EnemyBase";

export type LiveMatchEvent = {
  id: string;
  minute: number;
  type: MatchEventType;
  side: MatchSide;
  mapZone: MapZone;
  title: string;
  description: string;
  goldSwing?: number;
  importance: EventImportance;
};

export type StructureState = {
  topTowersUser: number;
  midTowersUser: number;
  botTowersUser: number;
  topTowersEnemy: number;
  midTowersEnemy: number;
  botTowersEnemy: number;
  topInhibitorUserDestroyed: boolean;
  midInhibitorUserDestroyed: boolean;
  botInhibitorUserDestroyed: boolean;
  topInhibitorEnemyDestroyed: boolean;
  midInhibitorEnemyDestroyed: boolean;
  botInhibitorEnemyDestroyed: boolean;
};

export type LiveMatchStats = {
  minute: number;
  userKills: number;
  enemyKills: number;
  userGold: number;
  enemyGold: number;
  userTowers: number;
  enemyTowers: number;
  userDragons: number;
  enemyDragons: number;
  userHeralds: number;
  enemyHeralds: number;
  userBarons: number;
  enemyBarons: number;
  userInhibitors: number;
  enemyInhibitors: number;
  structures: StructureState;
};

export type SimulationMode = "Manual" | "Automatic";

export type SimulationSpeed = "Slow" | "Normal" | "Fast" | "UltraFast";

export type MatchContext = {
  stage: TournamentStage;
  gameNumber: number;
  matchNumber: number;
  gameLabel: string;
  difficulty: GameDifficulty;
  expectedWinner: MatchSide;
  userPower: number;
  seriesUserWins: number;
  seriesEnemyWins: number;
};

export type LiveMatchSimulation = {
  id: string;
  stage: TournamentStage;
  gameLabel: string;
  gameNumber: number;
  matchNumber: number;
  userTeamName: string;
  enemyName: string;
  enemyTier: EnemyTier;
  enemyArchetype: TeamArchetype;
  durationMinutes: number;
  finalWinner: MatchSide;
  finalReason: string;
  events: LiveMatchEvent[];
  statsByMinute: LiveMatchStats[];
};
