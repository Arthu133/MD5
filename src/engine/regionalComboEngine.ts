import { regionalComboList } from "../data/combos/regionalCombos";
import type {
  DraftTeam,
  RegionalComboMatch,
  RegionalComboStatus,
} from "../types/game";

const statusFor = (matchCount: number): RegionalComboStatus =>
  matchCount >= 5 ? "Complete" : matchCount >= 4 ? "Active" : "Thematic";

const scoreBonusFor = (status: RegionalComboStatus) =>
  status === "Complete" ? 2 : status === "Active" ? 1 : 0;

const cardSynergyBonusFor = (status: RegionalComboStatus) =>
  status === "Complete" ? 2 : status === "Active" ? 1 : 0;

export function analyzeRegionalCombo(
  team: DraftTeam,
): RegionalComboMatch | undefined {
  const championIds = new Set(team.map(({ champion }) => champion.id));
  const matches = regionalComboList
    .map((combo) => {
      const matchedChampionIds = combo.champions.filter((id) =>
        championIds.has(id),
      );
      const matchCount = matchedChampionIds.length;
      const status = statusFor(matchCount);
      return {
        ...combo,
        matchedChampionIds,
        matchCount,
        status,
        scoreBonus: scoreBonusFor(status),
        cardSynergyBonus: cardSynergyBonusFor(status),
      } satisfies RegionalComboMatch;
    })
    .filter((combo) => combo.matchCount >= 3)
    .sort(
      (left, right) =>
        right.matchCount - left.matchCount ||
        right.scoreBonus - left.scoreBonus ||
        left.name.localeCompare(right.name),
    );

  return matches[0];
}

export function getRegionalCardBonus(
  regionalCombo: RegionalComboMatch | undefined,
  activeCardNames: string[],
) {
  if (!regionalCombo || regionalCombo.status === "Thematic") return 0;
  const hasCompatibleCard = activeCardNames.some((name) =>
    regionalCombo.compatibleCards.includes(name),
  );
  if (!hasCompatibleCard) return 0;
  return regionalCombo.status === "Complete" ? 2 : 1;
}
