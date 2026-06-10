import type { Role } from "../../types/game";

const rolePools: Record<Role, string[]> = {
  Top: [
    "Aatrox", "Akali", "Ambessa", "Aurora", "Camille", "Chogath", "Darius",
    "DrMundo", "Fiora", "Gangplank", "Garen", "Gnar", "Gragas", "Gwen",
    "Heimerdinger", "Illaoi", "Irelia", "Jax", "Jayce", "Kayle", "Kennen",
    "Kled", "KSante", "Malphite", "Mordekaiser", "Nasus", "Olaf", "Ornn",
    "Pantheon", "Poppy", "Quinn", "Renekton", "Riven", "Rumble", "Sett",
    "Shen", "Singed", "Sion", "Skarner", "TahmKench", "Teemo", "Trundle",
    "Tryndamere", "Udyr", "Urgot", "Vayne", "Vladimir", "Volibear",
    "MonkeyKing", "Yone", "Yorick", "Zaahen"
  ],
  Jungle: [
    "Amumu", "Belveth", "Briar", "Diana", "Ekko", "Elise", "Evelynn",
    "Fiddlesticks", "Gragas", "Graves", "Hecarim", "Ivern", "JarvanIV",
    "Jax", "Karthus", "Kayn", "Khazix", "Kindred", "LeeSin", "Lillia",
    "MasterYi", "Maokai", "Morgana", "Naafiri", "Nidalee", "Nocturne",
    "Nunu", "Olaf", "Poppy", "Rammus", "RekSai", "Rengar", "Sejuani",
    "Shaco", "Shyvana", "Skarner", "Taliyah", "Talon", "Trundle", "Udyr",
    "Vi", "Viego", "Volibear", "Warwick", "MonkeyKing", "XinZhao", "Zac",
    "Zed", "Zyra"
  ],
  Mid: [
    "Ahri", "Akali", "Akshan", "Anivia", "Annie", "AurelionSol", "Aurora",
    "Azir", "Brand", "Cassiopeia", "Corki", "Diana", "Ekko", "Fizz",
    "Galio", "Heimerdinger", "Hwei", "Irelia", "Jayce", "Karma", "Kassadin",
    "Katarina", "Leblanc", "Lissandra", "Lux", "Malzahar", "Mel", "Naafiri",
    "Neeko", "Orianna", "Pantheon", "Qiyana", "Rumble", "Ryze", "Seraphine",
    "Swain", "Sylas", "Syndra", "Taliyah", "Talon", "Tristana",
    "TwistedFate", "Veigar", "Velkoz", "Vex", "Viktor", "Vladimir",
    "Xerath", "Yasuo", "Yone", "Zed", "Ziggs", "Zilean", "Zoe"
  ],
  Carry: [
    "Aphelios", "Ashe", "Caitlyn", "Corki", "Draven", "Ezreal", "Jhin",
    "Jinx", "Kaisa", "Kalista", "KogMaw", "Lucian", "MissFortune", "Nilah",
    "Samira", "Senna", "Seraphine", "Sivir", "Smolder", "Swain", "Tristana",
    "Twitch", "Varus", "Vayne", "Xayah", "Yasuo", "Yunara", "Zeri", "Ziggs"
  ],
  Support: [
    "Alistar", "Amumu", "Ashe", "Bard", "Blitzcrank", "Brand", "Braum",
    "Galio", "Janna", "Karma", "Leona", "Lulu", "Lux", "Maokai", "Milio",
    "Morgana", "Nami", "Nautilus", "Neeko", "Pantheon", "Poppy", "Pyke",
    "Rakan", "Rell", "Renata", "Senna", "Seraphine", "Shaco", "Shen",
    "Sona", "Soraka", "Swain", "TahmKench", "Taric", "Thresh", "Velkoz",
    "Xerath", "Yuumi", "Zilean", "Zyra"
  ],
};

export const championRoleOverrides = Object.entries(rolePools).reduce<
  Record<string, Role[]>
>((result, [role, championIds]) => {
  championIds.forEach((championId) => {
    const current = result[championId] ?? [];
    if (!current.includes(role as Role)) {
      result[championId] = [...current, role as Role];
    }
  });
  return result;
}, {});

export const championsByRole = rolePools;
