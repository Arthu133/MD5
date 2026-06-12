import type {
  ChampionMetaProfile,
  ChampionMetaRoleProfile,
  GameDifficulty,
  MetaPlaystyle,
  MetaTier,
  Role,
  TournamentStage,
} from "../../types/game";

const roleProfile = (
  tier: MetaTier,
  priority: number,
  options: Partial<Omit<ChampionMetaRoleProfile, "tier" | "priority">> = {},
): ChampionMetaRoleProfile => ({
  tier,
  priority,
  proPresence: options.proPresence ?? priority,
  blindPickSafety: options.blindPickSafety ?? Math.max(35, priority - 6),
  counterPickPower: options.counterPickPower ?? Math.max(35, priority - 2),
  scalingReliability: options.scalingReliability ?? 65,
  earlyGameReliability: options.earlyGameReliability ?? 65,
});

const profile = (
  championId: string,
  roles: Partial<Record<Role, ChampionMetaRoleProfile>>,
  playstyles: MetaPlaystyle[],
  defaultBuildArchetypes: ChampionMetaProfile["defaultBuildArchetypes"],
  options: Partial<
    Pick<
      ChampionMetaProfile,
      | "strongWith"
      | "weakWith"
      | "goodAgainstArchetypes"
      | "badAgainstArchetypes"
    >
  > = {},
): ChampionMetaProfile => ({
  championId,
  championName: championId,
  roles,
  playstyles,
  strongWith: options.strongWith ?? [],
  weakWith: options.weakWith ?? [],
  goodAgainstArchetypes: options.goodAgainstArchetypes ?? [],
  badAgainstArchetypes: options.badAgainstArchetypes ?? [],
  defaultBuildArchetypes,
});

export const tierWeights: Record<MetaTier, number> = {
  S: 10,
  A: 7,
  B: 4,
  C: 1.7,
  OffMeta: 0.35,
};

export const competitiveMetaProfiles: ChampionMetaProfile[] = [
  profile("KSante", { Top: roleProfile("S", 94, { blindPickSafety: 95 }) }, ["StrongSideTop", "FrontToBack", "Dive"], ["Tank", "Engage", "AntiBurst"]),
  profile("Ornn", { Top: roleProfile("S", 91, { scalingReliability: 94 }) }, ["FrontToBack", "ObjectiveStacking"], ["Tank", "Engage", "Scaling"]),
  profile("Renekton", { Top: roleProfile("A", 85, { earlyGameReliability: 92 }) }, ["StrongSideTop", "Dive"], ["Bruiser", "EarlyGame", "Sustain"]),
  profile("Gnar", { Top: roleProfile("A", 84, { blindPickSafety: 88 }) }, ["StrongSideTop", "FrontToBack"], ["Bruiser", "Engage", "Scaling"]),
  profile("Jax", { Top: roleProfile("A", 82, { counterPickPower: 90 }) }, ["StrongSideTop", "SplitMap"], ["Bruiser", "SplitPush", "Scaling"]),
  profile("Poppy", { Top: roleProfile("A", 80), Jungle: roleProfile("S", 91), Support: roleProfile("A", 78) }, ["Dive", "FrontToBack", "ObjectiveStacking"], ["Tank", "Engage", "ObjectiveControl"]),
  profile("Gragas", { Top: roleProfile("A", 82), Jungle: roleProfile("A", 86), Support: roleProfile("B", 66) }, ["Dive", "FrontToBack", "PickComp"], ["Tank", "Engage", "Controller"]),
  profile("Rumble", { Top: roleProfile("S", 90), Mid: roleProfile("B", 68) }, ["StrongSideTop", "Poke", "ObjectiveStacking"], ["AP", "WaveClear", "EarlyGame"]),
  profile("Camille", { Top: roleProfile("A", 80, { counterPickPower: 92 }) }, ["StrongSideTop", "Dive", "SplitMap"], ["Bruiser", "SplitPush", "Mobility"]),
  profile("Sion", { Top: roleProfile("B", 72, { scalingReliability: 88 }) }, ["FrontToBack", "SplitMap"], ["Tank", "Scaling", "Engage"]),

  profile("Sejuani", { Jungle: roleProfile("S", 92, { blindPickSafety: 92 }) }, ["CarryJungle", "Dive", "FrontToBack"], ["Tank", "Engage", "ObjectiveControl"]),
  profile("Maokai", { Jungle: roleProfile("S", 90), Support: roleProfile("A", 78) }, ["ObjectiveStacking", "FrontToBack", "PickComp"], ["Tank", "Controller", "ObjectiveControl"]),
  profile("Vi", { Jungle: roleProfile("A", 86) }, ["Dive", "PickComp", "CarryJungle"], ["Bruiser", "Engage", "Mobility"]),
  profile("XinZhao", { Jungle: roleProfile("A", 84, { earlyGameReliability: 90 }) }, ["CarryJungle", "Dive", "ObjectiveStacking"], ["Bruiser", "EarlyGame", "ObjectiveControl"]),
  profile("LeeSin", { Jungle: roleProfile("A", 82, { earlyGameReliability: 94 }) }, ["CarryJungle", "Dive", "PickComp"], ["Bruiser", "Mobility", "EarlyGame"]),
  profile("MonkeyKing", { Jungle: roleProfile("A", 83) }, ["Dive", "FrontToBack"], ["Bruiser", "Engage", "Mobility"]),
  profile("Nocturne", { Jungle: roleProfile("A", 80) }, ["Dive", "PickComp"], ["Assassin", "Engage", "ObjectiveControl"]),
  profile("Lillia", { Jungle: roleProfile("A", 82, { scalingReliability: 88 }) }, ["CarryJungle", "FrontToBack"], ["AP", "Scaling", "Mobility"]),
  profile("JarvanIV", { Jungle: roleProfile("A", 84, { earlyGameReliability: 91 }) }, ["Dive", "ObjectiveStacking"], ["Engage", "EarlyGame", "ObjectiveControl"]),
  profile("Ivern", { Jungle: roleProfile("B", 70, { scalingReliability: 86 }) }, ["EnchanterScaling", "FrontToBack"], ["Enchanter", "Peel", "Utility"]),

  profile("Azir", { Mid: roleProfile("S", 93, { scalingReliability: 97 }) }, ["ControlMid", "FrontToBack", "ScalingBot"], ["AP", "Scaling", "WaveClear"]),
  profile("Orianna", { Mid: roleProfile("S", 91, { blindPickSafety: 92 }) }, ["ControlMid", "FrontToBack"], ["AP", "Controller", "WaveClear"]),
  profile("Syndra", { Mid: roleProfile("A", 86) }, ["ControlMid", "PickComp"], ["AP", "Controller", "AntiTank"]),
  profile("Taliyah", { Mid: roleProfile("A", 85), Jungle: roleProfile("B", 70) }, ["ControlMid", "PickComp", "ObjectiveStacking"], ["AP", "Controller", "WaveClear"]),
  profile("Ahri", { Mid: roleProfile("A", 84, { blindPickSafety: 87 }) }, ["ControlMid", "PickComp", "Dive"], ["AP", "Mobility", "Controller"]),
  profile("Tristana", { Mid: roleProfile("A", 83), Carry: roleProfile("A", 84) }, ["LaneDominantBot", "StrongSideTop", "ObjectiveStacking"], ["Marksman", "EarlyGame", "ObjectiveControl"]),
  profile("Corki", { Mid: roleProfile("A", 82), Carry: roleProfile("B", 70) }, ["Poke", "ControlMid", "ScalingBot"], ["AD", "Scaling", "WaveClear"]),
  profile("Galio", { Mid: roleProfile("A", 80), Support: roleProfile("B", 70) }, ["Dive", "ControlMid", "FrontToBack"], ["Tank", "Engage", "Controller"]),
  profile("Sylas", { Mid: roleProfile("A", 81, { counterPickPower: 92 }) }, ["Dive", "PickComp"], ["AP", "Bruiser", "Mobility"]),
  profile("Hwei", { Mid: roleProfile("A", 82, { scalingReliability: 89 }) }, ["Poke", "ControlMid"], ["AP", "WaveClear", "Controller"]),

  profile("Kaisa", { Carry: roleProfile("S", 93, { scalingReliability: 94 }) }, ["ScalingBot", "Dive", "FrontToBack"], ["Marksman", "Scaling", "AntiTank"]),
  profile("Aphelios", { Carry: roleProfile("S", 91, { scalingReliability: 97 }) }, ["ScalingBot", "FrontToBack"], ["Marksman", "Scaling", "AntiTank"]),
  profile("Jinx", { Carry: roleProfile("S", 90, { scalingReliability: 97 }) }, ["ScalingBot", "FrontToBack"], ["Marksman", "Scaling", "WaveClear"]),
  profile("Xayah", { Carry: roleProfile("A", 86, { blindPickSafety: 90 }) }, ["FrontToBack", "LaneDominantBot"], ["Marksman", "Scaling", "AntiBurst"]),
  profile("Ezreal", { Carry: roleProfile("A", 84, { blindPickSafety: 94 }) }, ["Poke", "ScalingBot"], ["Marksman", "WaveClear", "Scaling"]),
  profile("Varus", { Carry: roleProfile("S", 89), Mid: roleProfile("C", 45) }, ["Poke", "LaneDominantBot", "PickComp"], ["Marksman", "EarlyGame", "AntiTank"]),
  profile("Kalista", { Carry: roleProfile("A", 84, { earlyGameReliability: 95 }) }, ["LaneDominantBot", "ObjectiveStacking"], ["Marksman", "EarlyGame", "ObjectiveControl"]),
  profile("Lucian", { Carry: roleProfile("A", 82, { earlyGameReliability: 91 }) }, ["LaneDominantBot", "Dive"], ["Marksman", "EarlyGame", "Mobility"]),
  profile("Caitlyn", { Carry: roleProfile("A", 81) }, ["LaneDominantBot", "Poke", "ObjectiveStacking"], ["Marksman", "EarlyGame", "WaveClear"]),
  profile("Zeri", { Carry: roleProfile("A", 83, { scalingReliability: 95 }) }, ["ScalingBot", "FrontToBack"], ["Marksman", "Scaling", "Mobility"]),

  profile("Rell", { Support: roleProfile("S", 94, { proPresence: 96 }) }, ["EngageSupport", "Dive", "FrontToBack"], ["Tank", "Engage", "ObjectiveControl"]),
  profile("Nautilus", { Support: roleProfile("S", 91) }, ["EngageSupport", "Dive", "PickComp"], ["Tank", "Engage", "Controller"]),
  profile("Leona", { Support: roleProfile("A", 86, { earlyGameReliability: 91 }) }, ["EngageSupport", "Dive", "LaneDominantBot"], ["Tank", "Engage", "EarlyGame"]),
  profile("Alistar", { Support: roleProfile("A", 84) }, ["EngageSupport", "FrontToBack"], ["Tank", "Engage", "Peel"]),
  profile("Braum", { Support: roleProfile("A", 85, { counterPickPower: 91 }) }, ["FrontToBack", "EnchanterScaling"], ["Tank", "Peel", "AntiBurst"]),
  profile("Renata", { Support: roleProfile("S", 89, { scalingReliability: 92 }) }, ["EnchanterScaling", "FrontToBack"], ["Enchanter", "Peel", "Controller"]),
  profile("Milio", { Support: roleProfile("A", 84, { scalingReliability: 94 }) }, ["EnchanterScaling", "ScalingBot"], ["Enchanter", "Peel", "Scaling"]),
  profile("Lulu", { Support: roleProfile("A", 83, { scalingReliability: 93 }) }, ["EnchanterScaling", "ScalingBot", "FrontToBack"], ["Enchanter", "Peel", "Utility"]),
  profile("Rakan", { Support: roleProfile("A", 87) }, ["EngageSupport", "Dive", "FrontToBack"], ["Engage", "Mobility", "Peel"]),
  profile("Thresh", { Support: roleProfile("A", 84, { blindPickSafety: 86 }) }, ["EngageSupport", "PickComp"], ["Controller", "Engage", "Peel"]),
];

export const competitiveMetaByChampion = new Map(
  competitiveMetaProfiles.map((entry) => [entry.championId, entry]),
);

export const tournamentDifficultyScaling: Record<
  GameDifficulty,
  {
    stages: Record<TournamentStage, number>;
    badItemPenaltyMultiplier: number;
    badCompPenaltyMultiplier: number;
  }
> = {
  Classic: {
    stages: {
      Groups: 0,
      Quarterfinals: 6,
      Semifinals: 11,
      Final: 16,
    },
    badItemPenaltyMultiplier: 1.15,
    badCompPenaltyMultiplier: 1,
  },
  Hard: {
    stages: {
      Groups: 6,
      Quarterfinals: 16,
      Semifinals: 24,
      Final: 31,
    },
    badItemPenaltyMultiplier: 1.4,
    badCompPenaltyMultiplier: 1.36,
  },
};

export const randomVarianceByStage: Record<
  GameDifficulty,
  Record<TournamentStage, number>
> = {
  Classic: {
    Groups: 8,
    Quarterfinals: 6,
    Semifinals: 5,
    Final: 4,
  },
  Hard: {
    Groups: 7,
    Quarterfinals: 5,
    Semifinals: 4,
    Final: 3,
  },
};
