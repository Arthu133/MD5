import type { CampaignResult, DraftTeam } from "../types/game";
import type { FinalRunScore } from "../scoring/finalScore";

const STORAGE_KEY = "md5-local-records-v1";

export type LocalRunRecord = {
  score: number;
  rank: string;
  champion: boolean;
  difficulty: CampaignResult["difficulty"];
  wins: number;
  losses: number;
};

export type LocalRecords = {
  bestScore: number;
  bestRank: string;
  bestCampaignWins: number;
  hardModeWins: number;
  lastRun: LocalRunRecord | null;
  championPicks: Record<string, number>;
  cardPicks: Record<string, number>;
  lastRecordedSignature: string | null;
};

const emptyRecords: LocalRecords = {
  bestScore: 0,
  bestRank: "Ferro IV",
  bestCampaignWins: 0,
  hardModeWins: 0,
  lastRun: null,
  championPicks: {},
  cardPicks: {},
  lastRecordedSignature: null,
};

export function loadLocalRecords(): LocalRecords {
  if (typeof window === "undefined") return emptyRecords;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored
      ? { ...emptyRecords, ...(JSON.parse(stored) as Partial<LocalRecords>) }
      : emptyRecords;
  } catch {
    return emptyRecords;
  }
}

const runSignature = (result: CampaignResult) =>
  [
    result.difficulty,
    result.champion ? "champion" : result.eliminatedAt,
    result.wins,
    result.losses,
    result.matches.map((match) => `${match.enemyName}:${match.win}`).join("|"),
    result.activeCards?.map(({ card }) => card.id).join("|"),
  ].join("::");

export function recordLocalRun(
  result: CampaignResult,
  team: DraftTeam,
  score: FinalRunScore,
): LocalRecords {
  const current = loadLocalRecords();
  const signature = runSignature(result);
  if (current.lastRecordedSignature === signature) return current;

  const championPicks = { ...current.championPicks };
  team.forEach(({ champion }) => {
    championPicks[champion.name] = (championPicks[champion.name] ?? 0) + 1;
  });
  const cardPicks = { ...current.cardPicks };
  result.activeCards?.forEach(({ card }) => {
    cardPicks[card.name] = (cardPicks[card.name] ?? 0) + 1;
  });

  const next: LocalRecords = {
    bestScore: Math.max(current.bestScore, score.totalPoints),
    bestRank:
      score.totalPoints >= current.bestScore ? score.rank.name : current.bestRank,
    bestCampaignWins: Math.max(current.bestCampaignWins, result.wins),
    hardModeWins:
      current.hardModeWins +
      (result.difficulty === "Hard" ? result.wins : 0),
    lastRun: {
      score: score.totalPoints,
      rank: score.rank.name,
      champion: result.champion,
      difficulty: result.difficulty,
      wins: result.wins,
      losses: result.losses,
    },
    championPicks,
    cardPicks,
    lastRecordedSignature: signature,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}

export const mostUsedEntry = (entries: Record<string, number>) =>
  Object.entries(entries).sort((left, right) => right[1] - left[1])[0]?.[0] ??
  null;
