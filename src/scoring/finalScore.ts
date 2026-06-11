import type { CampaignResult } from "../types/game";

export type FinalRank = {
  name: string;
  tier:
    | "Iron"
    | "Bronze"
    | "Silver"
    | "Gold"
    | "Platinum"
    | "Emerald"
    | "Diamond"
    | "Master"
    | "Grandmaster"
    | "Challenger";
  division: "IV" | "III" | "II" | "I" | null;
  minPoints: number;
  maxPoints: number;
  message: string;
};

export type FinalScoreBreakdown = {
  campaign: number;
  matches: number;
  draft: number;
  cards: number;
  difficulty: number;
  bonus: number;
};

export type FinalRunScore = {
  totalPoints: number;
  rank: FinalRank;
  breakdown: FinalScoreBreakdown;
  progressPercent: number;
  pointsToNextRank: number | null;
  nextRankName: string | null;
  title: string;
};

const rankMessages: Record<FinalRank["tier"], string> = {
  Iron: "Você sobreviveu ao caos, mas precisa de drafts mais consistentes.",
  Bronze: "Você começou a entender o ritmo da MD5.",
  Silver: "Boa leitura de draft, com espaço para evoluir.",
  Gold: "Você já monta composições competitivas.",
  Platinum: "Draft sólido e boas decisões nas regras.",
  Emerald: "Você está jogando em alto nível estratégico.",
  Diamond: "Excelente leitura de composição e adaptação.",
  Master: "Você domina o ritmo da série.",
  Grandmaster: "Você joga como estrategista de elite.",
  Challenger: "Draft perfeito, leitura absurda e execução dominante.",
};

const divisionRanks = (
  tier: FinalRank["tier"],
  label: string,
  start: number,
): FinalRank[] =>
  (["IV", "III", "II", "I"] as const).map((division, index) => ({
    name: `${label} ${division}`,
    tier,
    division,
    minPoints: start + index * 250,
    maxPoints: start + index * 250 + 249,
    message: rankMessages[tier],
  }));

export const finalRanks: FinalRank[] = [
  ...divisionRanks("Iron", "Ferro", 0),
  ...divisionRanks("Bronze", "Bronze", 1000),
  ...divisionRanks("Silver", "Prata", 2000),
  ...divisionRanks("Gold", "Ouro", 3000),
  ...divisionRanks("Platinum", "Platina", 4000),
  ...divisionRanks("Emerald", "Esmeralda", 5000),
  ...divisionRanks("Diamond", "Diamante", 6000),
  {
    name: "Mestre",
    tier: "Master",
    division: null,
    minPoints: 7000,
    maxPoints: 7999,
    message: rankMessages.Master,
  },
  {
    name: "Grão-Mestre",
    tier: "Grandmaster",
    division: null,
    minPoints: 8000,
    maxPoints: 8999,
    message: rankMessages.Grandmaster,
  },
  {
    name: "Desafiante",
    tier: "Challenger",
    division: null,
    minPoints: 9000,
    maxPoints: 10000,
    message: rankMessages.Challenger,
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const campaignPoints = (result: CampaignResult) => {
  if (result.champion) return 3000;
  if (result.eliminatedAt === "Final") return 2500;
  if (result.eliminatedAt === "Semifinals") return 1900;
  if (result.eliminatedAt === "Quarterfinals") return 1300;
  return 500 + result.groupWins * 200;
};

const objectivePerformance = (result: CampaignResult) => {
  const totals = result.matches.reduce(
    (summary, match) => {
      const finalStats =
        match.liveSimulation.statsByMinute[
          match.liveSimulation.durationMinutes
        ];
      if (!finalStats) return summary;
      return {
        dragons: summary.dragons + finalStats.userDragons,
        barons: summary.barons + finalStats.userBarons,
        towers: summary.towers + finalStats.userTowers,
      };
    },
    { dragons: 0, barons: 0, towers: 0 },
  );

  return clamp(
    totals.dragons * 12 + totals.barons * 25 + totals.towers * 4,
    0,
    350,
  );
};

const performancePoints = (result: CampaignResult) => {
  const totalGames = Math.max(1, result.wins + result.losses);
  const winRate = result.wins / totalGames;
  const quickWins = result.matches.filter(
    (match) => match.win && match.liveSimulation.durationMinutes <= 30,
  ).length;

  return clamp(
    Math.round(
      winRate * 1500 +
        Math.min(result.wins * 90, 600) +
        (result.perfectRun ? 250 : 0) +
        quickWins * 30,
    ),
    0,
    2500,
  );
};

const draftPoints = (result: CampaignResult) =>
  clamp(
    Math.round(
      result.teamScore.total * 10 +
        result.teamScore.metrics.consistency * 2.5 +
        result.teamScore.metrics.roleFit * 2.5,
    ),
    0,
    1500,
  );

const cardPoints = (result: CampaignResult) =>
  clamp(
    Math.round(
      result.teamScore.cardSynergy * 5 +
        Math.min((result.activeCards?.length ?? 0) * 100, 500),
    ),
    0,
    1000,
  );

const bonusPoints = (result: CampaignResult) => {
  const knockoutWins = result.series.filter(
    (series) => series.stage !== "Groups" && series.won,
  ).length;
  const comebackSeries = result.series.filter(
    (series) =>
      series.stage !== "Groups" &&
      series.won &&
      series.games.some((_game, index) => {
        const previous = series.games.slice(0, index);
        const userLosses = previous.filter((entry) => !entry.win).length;
        const userWins = previous.length - userLosses;
        return userLosses > userWins;
      }),
  ).length;

  return clamp(
    Math.round(
      objectivePerformance(result) +
        result.groupWins * 60 +
        knockoutWins * 120 +
        comebackSeries * 100 +
        result.teamScore.rulesAdaptation * 2,
    ),
    0,
    1000,
  );
};

export const getRankForPoints = (points: number) => {
  const normalized = clamp(Math.round(points), 0, 10000);
  return (
    finalRanks.find(
      (rank) =>
        normalized >= rank.minPoints && normalized <= rank.maxPoints,
    ) ?? finalRanks[0]
  );
};

const titleForRank = (tier: FinalRank["tier"]) => {
  if (tier === "Challenger") return "Lenda da MD5";
  if (tier === "Grandmaster") return "Estrategista de Elite";
  if (tier === "Master") return "Mestre da Série";
  if (["Diamond", "Emerald"].includes(tier)) return "Comandante de Draft";
  if (["Platinum", "Gold"].includes(tier)) return "Capitão Competitivo";
  return "Aspirante da MD5";
};

export function calculateFinalRunScore(
  result: CampaignResult,
): FinalRunScore {
  const breakdown: FinalScoreBreakdown = {
    campaign: campaignPoints(result),
    matches: performancePoints(result),
    draft: draftPoints(result),
    cards: cardPoints(result),
    difficulty: result.difficulty === "Hard" ? 1000 : 500,
    bonus: bonusPoints(result),
  };
  const totalPoints = clamp(
    Object.values(breakdown).reduce((total, value) => total + value, 0),
    0,
    10000,
  );
  const rank = getRankForPoints(totalPoints);
  const rankIndex = finalRanks.indexOf(rank);
  const nextRank = finalRanks[rankIndex + 1] ?? null;
  const range = Math.max(1, rank.maxPoints - rank.minPoints + 1);
  const progressPercent =
    rank.tier === "Challenger"
      ? 100
      : clamp(
          Math.round(((totalPoints - rank.minPoints) / range) * 100),
          0,
          100,
        );

  return {
    totalPoints,
    rank,
    breakdown,
    progressPercent,
    pointsToNextRank: nextRank
      ? Math.max(0, nextRank.minPoints - totalPoints)
      : null,
    nextRankName: nextRank?.name ?? null,
    title: titleForRank(rank.tier),
  };
}
