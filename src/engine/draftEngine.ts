import { championProfiles } from "../data/champions/championProfiles";
import type { ChampionProfile, GameDifficulty, Role } from "../types/game";

export const shuffle = <T,>(values: T[]): T[] => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

export function getRandomChampionsForRole(
  role: Role,
  selectedChampionIds: string[],
  count = 10,
  difficulty: GameDifficulty = "Classic",
): ChampionProfile[] {
  const available = championProfiles.filter(
    (champion) =>
      !selectedChampionIds.includes(champion.id) &&
      (difficulty === "Hard" || champion.roles.includes(role)),
  );

  return shuffle(available).slice(0, count);
}
