import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type DataDragonChampion = {
  id: string;
  key: string;
  name: string;
  title: string;
  image: { full: string };
  tags: string[];
  info: { difficulty: number };
  partype: string;
};

type ChampionResponse = {
  data: Record<string, DataDragonChampion>;
};

const requestJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao buscar ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const serialize = (value: unknown) =>
  JSON.stringify(value, null, 2)
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");

const run = async () => {
  const versions = await requestJson<string[]>(
    "https://ddragon.leagueoflegends.com/api/versions.json",
  );
  const version = versions[0];
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`;
  const payload = await requestJson<ChampionResponse>(url);
  const champions = Object.values(payload.data)
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
    .map((champion) => ({
      id: champion.id,
      key: champion.key,
      name: champion.name,
      title: champion.title,
      image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`,
      tags: champion.tags,
      difficulty: champion.info.difficulty || 5,
      resource: champion.partype,
    }));

  const source = `export const DATA_DRAGON_VERSION = ${serialize(version)};

export type GeneratedChampion = {
  id: string;
  key: string;
  name: string;
  title: string;
  image: string;
  tags: string[];
  difficulty: number;
  resource: string;
};

// Arquivo gerado por scripts/syncChampions.ts. Não editar manualmente.
export const generatedChampions: GeneratedChampion[] = ${serialize(champions)};
`;

  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(
    currentDirectory,
    "../src/data/champions/generatedChampions.ts",
  );
  await writeFile(outputPath, source, "utf8");
  console.log(`Gerados ${champions.length} campeões do Data Dragon ${version}.`);
};

run().catch((error: unknown) => {
  console.error(
    "Não foi possível atualizar o catálogo. O fallback local foi preservado.",
  );
  console.error(error);
  process.exitCode = 1;
});
