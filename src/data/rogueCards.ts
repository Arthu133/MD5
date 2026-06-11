import type {
  RogueCard,
  RogueCardEffect,
  RogueCardRarity,
} from "../types/game";

const effect = (
  type: RogueCardEffect["type"],
  key: "stat" | "attribute" | "metric" | "rule",
  name: string,
  value: number,
  operation: RogueCardEffect["operation"] = "add",
  condition?: RogueCardEffect["condition"],
): RogueCardEffect => ({
  type,
  [key]: name,
  value,
  operation,
  condition,
});

const card = (
  id: string,
  name: string,
  description: string,
  rarity: RogueCardRarity,
  effects: RogueCardEffect[],
  tags: string[] = [],
): RogueCard => ({
  id,
  name,
  description,
  rarity,
  timing: ["Campaign", "Match", "Simulation"],
  target: ["BothTeams", "Tournament", "LiveMatchEngine"],
  tags,
  effects,
});

const metric = (
  name: string,
  value: number,
  condition?: RogueCardEffect["condition"],
) => effect("TeamScoreModifier", "metric", name, value, "add", condition);

const stat = (
  name: string,
  value: number,
  condition?: RogueCardEffect["condition"],
) => effect("ChampionStatModifier", "stat", name, value, "add", condition);

const attribute = (
  name: NonNullable<RogueCardEffect["attribute"]>,
  value: number,
  condition?: RogueCardEffect["condition"],
) =>
  effect(
    "ChampionAttributeModifier",
    "attribute",
    name,
    value,
    "add",
    condition,
  );

const rule = (
  name: string,
  value: number,
  operation: RogueCardEffect["operation"] = "add",
  condition?: RogueCardEffect["condition"],
) => effect("DraftRuleModifier", "rule", name, value, operation, condition);

export const rogueCards: RogueCard[] = [
  card("meta-agressivo", "Meta Agressivo", "Mais pressão cedo, lutas e snowball.", "Common", [
    metric("earlyGame", 10),
    rule("fightChanceMultiplier", 1.18, "multiply"),
    rule("snowballMultiplier", 1.15, "multiply"),
    rule("durationMinutes", -2),
  ], ["early", "fight"]),
  card("late-game-absoluto", "Late Game Absoluto", "O jogo desacelera e o scaling ganha enorme valor.", "Rare", [
    metric("scaling", 14),
    metric("earlyGame", -6),
    rule("durationMinutes", 5),
  ], ["late", "scaling"]),
  card("sem-frontline", "Sem Frontline", "Tanques perdem espaço e o dano passa a decidir tudo.", "Rare", [
    metric("frontline", -18),
    metric("pickoff", 9),
    attribute("frontline", -14),
    attribute("mobility", 7),
    attribute("pickoff", 7),
    rule("fightChanceMultiplier", 1.12, "multiply"),
  ], ["chaos", "damage"]),
  card("guerra-de-dragoes", "Guerra de Dragões", "Dragões aparecem antes e valem muito mais.", "Common", [
    metric("objectiveControl", 10),
    rule("dragonValueMultiplier", 1.55, "multiply"),
    rule("earlyObjectiveOffset", -2),
  ], ["objective", "dragon"]),
  card("barao-decisivo", "Barão Decisivo", "O Barão cria pressão de mapa e encerra jogos com mais força.", "Rare", [
    rule("baronPressureMultiplier", 1.6, "multiply"),
    rule("towerChanceMultiplier", 1.18, "multiply"),
    rule("durationMinutes", -2),
  ], ["objective", "baron"]),
  card("draft-cego", "Draft Cego", "Encaixes naturais importam menos e escolhas inesperadas ganham valor.", "Common", [
    rule("roleFitModifier", -6),
    rule("offMetaModifier", 12),
    metric("rulesAdaptation", 8),
  ], ["draft", "offmeta"]),
  card("cartas-instaveis", "Cartas Instáveis", "Todos os demais efeitos ficam 25% mais intensos.", "Legendary", [
    rule("varianceMultiplier", 1.25, "multiply"),
  ], ["chaos", "amplifier"]),
  card("full-dano", "Full Dano", "Dano e abates aumentam, mas a proteção desaba.", "Rare", [
    stat("damageAD", 8),
    stat("damageAP", 8),
    metric("frontline", -10),
    metric("peel", -8),
    rule("killGoldMultiplier", 1.2, "multiply"),
  ], ["damage", "fight"]),
  card("jogo-travado", "Jogo Travado", "Estruturas resistem e as partidas ficam mais longas.", "Common", [
    rule("towerResistance", 0.22),
    rule("inhibitorResistance", 0.2),
    rule("durationMinutes", 5),
    rule("fightChanceMultiplier", 0.86, "multiply"),
  ], ["map", "late"]),
  card("ritmo-acelerado", "Ritmo Acelerado", "Objetivos e lutas acontecem mais cedo.", "Common", [
    rule("durationMinutes", -4),
    rule("earlyObjectiveOffset", -2),
    rule("fightChanceMultiplier", 1.16, "multiply"),
  ], ["tempo", "early"]),
  card("controle-de-mapa", "Controle de Mapa", "Visão, wave clear e objetivos recebem bônus.", "Common", [
    metric("waveClear", 9),
    metric("objectiveControl", 9),
    metric("consistency", 5),
  ], ["map", "objective"]),
  card("bot-lane-forte", "Bot Lane Forte", "Carry e Support definem mais o resultado.", "Common", [
    stat("teamFight", 9, { roles: ["Carry", "Support"] }),
    stat("peel", 8, { roles: ["Carry", "Support"] }),
    metric("scaling", 5),
  ], ["bot", "teamfight"]),
  card("top-ilha", "Top Ilha", "A rota superior vira um duelo de pressão lateral.", "Common", [
    stat("splitPush", 13, { roles: ["Top"] }),
    stat("sustain", 9, { roles: ["Top"] }),
    metric("splitPush", 8),
  ], ["top", "split"]),
  card("jungle-dominante", "Jungle Dominante", "A Jungle controla ritmo e objetivos.", "Rare", [
    stat("objectiveControl", 14, { roles: ["Jungle"] }),
    stat("earlyPressure", 10, { roles: ["Jungle"] }),
    attribute("junglePressure", 14, { roles: ["Jungle"] }),
    attribute("objectiveControl", 10, { roles: ["Jungle"] }),
    attribute("roaming", 8, { roles: ["Jungle"] }),
    metric("objectiveControl", 8),
  ], ["jungle", "objective"]),
  card("mid-prioridade", "Mid Prioridade", "Prioridade no meio acelera rotações e pickoffs.", "Common", [
    stat("waveClear", 11, { roles: ["Mid"] }),
    stat("pickoff", 9, { roles: ["Mid"] }),
    metric("earlyGame", 5),
  ], ["mid", "tempo"]),
  card("sem-escapatoria", "Sem Escapatória", "Controle e pickoff ficam mais fortes.", "Rare", [
    metric("crowdControl", 10),
    metric("pickoff", 12),
    rule("fightChanceMultiplier", 1.08, "multiply"),
  ], ["pickoff", "cc"]),
  card("dive-meta", "Dive Meta", "Engage, mobilidade e pressão inicial dominam.", "Rare", [
    metric("engage", 12),
    metric("earlyGame", 8),
    stat("mobility", 7),
    attribute("dive", 14),
    attribute("engage", 10),
    attribute("burst", 7),
  ], ["dive", "engage"]),
  card("poke-meta", "Poke Meta", "Wave clear e desgaste antes de objetivos são premiados.", "Rare", [
    metric("waveClear", 12),
    metric("pickoff", 6),
    attribute("poke", 14),
    attribute("siege", 10),
    attribute("longRange", 8),
    rule("fightChanceMultiplier", 0.92, "multiply"),
  ], ["poke", "map"]),
  card("protect-the-carry", "Protect the Carry", "Peel, frontline e scaling formam a condição central.", "Rare", [
    metric("peel", 13),
    metric("frontline", 8),
    metric("scaling", 7),
    attribute("protectCarry", 14),
    attribute("peel", 10),
    attribute("shielding", 8),
    attribute("hypercarry", 6),
  ], ["protect", "late"]),
  card("caos-no-draft", "Caos no Draft", "Off-meta é valorizado e a execução fica imprevisível.", "Epic", [
    rule("offMetaModifier", 18),
    rule("varianceMultiplier", 1.3, "multiply"),
    metric("executionDifficulty", 9),
  ], ["draft", "chaos"]),
  card("meta-estrito", "Meta Estrito", "Encaixe de rota e composições tradicionais valem mais.", "Rare", [
    rule("roleFitModifier", 10),
    rule("offMetaModifier", -15),
    metric("consistency", 7),
  ], ["draft", "meta"]),
  card("economia-apertada", "Economia Apertada", "Abates valem menos e objetivos ganham importância.", "Common", [
    rule("killGoldMultiplier", 0.72, "multiply"),
    rule("objectiveValueMultiplier", 1.25, "multiply"),
    metric("objectiveControl", 6),
  ], ["economy", "objective"]),
  card("power-spike-cedo", "Power Spike Cedo", "O pico de poder chega nas primeiras rotações.", "Common", [
    stat("earlyPressure", 9),
    metric("earlyGame", 10),
    metric("scaling", -5),
  ], ["early", "spike"]),
  card("escalada-tardia", "Escalada Tardia", "Campeões de late crescem ainda mais.", "Common", [
    stat("scaling", 10),
    metric("scaling", 9),
    rule("durationMinutes", 3),
  ], ["late", "scaling"]),
  card("sem-volta", "Sem Volta", "Vantagens são mais difíceis de reverter.", "Rare", [
    rule("snowballMultiplier", 1.35, "multiply"),
    rule("comebackMultiplier", 0.7, "multiply"),
  ], ["snowball"]),
  card("virada-epica", "Virada Épica", "Times atrás em ouro recebem força para reagir.", "Epic", [
    rule("comebackMultiplier", 1.65, "multiply"),
    rule("varianceMultiplier", 1.12, "multiply"),
    rule("durationMinutes", 2),
  ], ["comeback", "chaos"]),
  card("lutas-constantes", "Lutas Constantes", "A frequência de confrontos aumenta drasticamente.", "Rare", [
    rule("fightChanceMultiplier", 1.55, "multiply"),
    rule("killGoldMultiplier", 1.08, "multiply"),
    rule("durationMinutes", -2),
  ], ["fight", "chaos"]),
  card("mapa-aberto", "Mapa Aberto", "Torres caem mais rápido e o mapa se abre cedo.", "Common", [
    rule("towerChanceMultiplier", 1.45, "multiply"),
    rule("towerResistance", -0.12),
    rule("durationMinutes", -3),
  ], ["map", "tower"]),
  card("base-blindada", "Base Blindada", "Inibidores e Nexus resistem a investidas.", "Rare", [
    rule("inhibitorResistance", 0.35),
    rule("nexusResistance", 0.3),
    rule("durationMinutes", 4),
  ], ["base", "defense"]),
  card("objetivo-roubado", "Objetivo Roubado", "Roubos de objetivos ficam muito mais frequentes.", "Epic", [
    rule("objectiveStealChance", 0.18),
    rule("varianceMultiplier", 1.12, "multiply"),
  ], ["objective", "steal"]),
  card("serie-mental", "Série Mental", "Derrotas pesam menos entre jogos de uma MD5.", "Rare", [
    rule("mentalReset", 8),
    metric("consistency", 7),
  ], ["series", "mental"]),
  card("momentum", "Momentum", "Vitórias em sequência aumentam o poder do time.", "Rare", [
    rule("momentum", 5),
    rule("snowballMultiplier", 1.1, "multiply"),
  ], ["series", "momentum"]),
  card("meta-de-mundial", "Meta de Mundial", "A IA adversária escolhe drafts mais fortes e disciplinados.", "Legendary", [
    rule("enemyDraftQuality", 12),
    metric("rulesAdaptation", 7),
  ], ["enemy", "meta"]),
  card("sem-refresh", "Sem Refresh", "Ao escolher esta carta, todo Refresh restante é perdido.", "Epic", [
    metric("cardSynergy", 12),
    rule("teamScoreWeight", 1.04, "multiply"),
  ], ["refresh", "risk"]),
  card("draft-generoso", "Draft Generoso", "A IA oferece mais brechas no contra-draft.", "Rare", [
    rule("enemyDraftQuality", -10),
    metric("rulesAdaptation", 5),
  ], ["enemy", "draft"]),
  card("draft-cruel", "Draft Cruel", "Adversários exploram suas fraquezas com mais precisão.", "Epic", [
    rule("enemyDraftQuality", 15),
    rule("varianceMultiplier", 0.92, "multiply"),
  ], ["enemy", "draft"]),
  card("itemizacao-livre", "Itemização Livre", "Picos de poder são flexíveis e a adaptação recebe bônus.", "Common", [
    metric("rulesAdaptation", 10),
    metric("consistency", 4),
  ], ["adaptation"]),
  card("itemizacao-rigida", "Itemização Rígida", "Planos focados ficam fortes, mas menos adaptáveis.", "Rare", [
    metric("cardSynergy", 10),
    metric("rulesAdaptation", -8),
    rule("snowballMultiplier", 1.08, "multiply"),
  ], ["focus"]),
  card("snowball-brutal", "Snowball Brutal", "A primeira vantagem pode decidir a partida.", "Epic", [
    rule("snowballMultiplier", 1.65, "multiply"),
    rule("comebackMultiplier", 0.62, "multiply"),
    rule("durationMinutes", -4),
  ], ["snowball", "early"]),
  card("jogo-de-xadrez", "Jogo de Xadrez", "Menos lutas, mais mapa, wave clear e objetivos.", "Rare", [
    rule("fightChanceMultiplier", 0.65, "multiply"),
    metric("waveClear", 10),
    metric("objectiveControl", 10),
    rule("durationMinutes", 3),
  ], ["map", "control"]),
  card("caos-competitivo", "Caos Competitivo", "A variância sobe e qualquer time pode dominar uma luta.", "Epic", [
    rule("varianceMultiplier", 1.65, "multiply"),
    rule("fightChanceMultiplier", 1.25, "multiply"),
  ], ["chaos", "fight"]),
  card("anti-tank-meta", "Anti-Tank Meta", "Dano sustentado e resposta a frontline recebem bônus.", "Rare", [
    stat("damageAD", 6, { classes: ["Marksman", "Fighter"] }),
    stat("damageAP", 6, { classes: ["Mage"] }),
    metric("frontline", -6),
  ], ["damage", "antitank"]),
  card("anti-cura-meta", "Anti-Cura Meta", "Sustain perde força e burst ganha espaço.", "Common", [
    stat("sustain", -12),
    stat("burst", 7),
    metric("pickoff", 5),
  ], ["healing", "burst"]),
  card("escudos-fortes", "Escudos Fortes", "Peel e encantadores protegem muito mais.", "Rare", [
    stat("peel", 12, { classes: ["Enchanter", "Controller"] }),
    metric("peel", 10),
    metric("teamFight", 4),
  ], ["shield", "protect"]),
  card("assassinos-soltos", "Assassinos Soltos", "Assassinos ganham burst e mobilidade.", "Rare", [
    stat("burst", 13, { classes: ["Assassin"] }),
    stat("mobility", 9, { classes: ["Assassin"] }),
    metric("pickoff", 9),
  ], ["assassin", "pickoff"]),
  card("tanques-imortais", "Tanques Imortais", "Tanques acumulam resistência e prolongam lutas.", "Epic", [
    stat("tankiness", 16, { classes: ["Tank"] }),
    metric("frontline", 14),
    rule("durationMinutes", 3),
  ], ["tank", "late"]),
  card("mapa-escuro", "Mapa Escuro", "Visão limitada aumenta pickoffs e roubos.", "Rare", [
    metric("pickoff", 10),
    rule("objectiveStealChance", 0.1),
    rule("varianceMultiplier", 1.18, "multiply"),
  ], ["vision", "chaos"]),
  card("dragao-ancestral", "Dragão Ancestral", "Dragões acumulados têm poder decisivo no fim.", "Legendary", [
    rule("dragonValueMultiplier", 1.8, "multiply"),
    rule("objectiveValueMultiplier", 1.2, "multiply"),
    rule("durationMinutes", 2),
  ], ["dragon", "late"]),
  card("final-nervosa", "Final Nervosa", "Na Final, execução e variância pesam mais.", "Epic", [
    metric("executionDifficulty", 8, { stages: ["Final"] }),
    rule("varianceMultiplier", 1.32, "multiply"),
  ], ["final", "pressure"]),
  card("sem-erro", "Sem Erro", "Consistência sobe e a variância cai.", "Epic", [
    metric("consistency", 14),
    rule("varianceMultiplier", 0.68, "multiply"),
    metric("executionDifficulty", -6),
  ], ["consistency"]),
  card("composicao-premiada", "Composição Premiada", "A identidade principal da composição recebe bônus.", "Rare", [
    metric("cardSynergy", 12),
    rule("teamScoreWeight", 1.05, "multiply"),
  ], ["archetype", "synergy"]),
  card("full-ad-punido", "Full AD Punido", "Composições quase totalmente físicas sofrem penalidade.", "Rare", [
    metric("physicalDamage", -10, { hasFullAD: true }),
    rule("scoreCapModifier", -8, "add", { hasFullAD: true }),
  ], ["damage", "punishment"]),
  card("full-ap-punido", "Full AP Punido", "Composições quase totalmente mágicas sofrem penalidade.", "Rare", [
    metric("magicDamage", -10, { hasFullAP: true }),
    rule("scoreCapModifier", -8, "add", { hasFullAP: true }),
  ], ["damage", "punishment"]),
  card("meta-flex", "Meta Flex", "Campeões flexíveis e escolhas criativas recebem bônus.", "Rare", [
    rule("roleFitModifier", 4),
    rule("offMetaModifier", 10),
    metric("rulesAdaptation", 9),
  ], ["draft", "flex"]),
  card("rota-invertida", "Rota Invertida", "Encaixe de rota vale menos, adaptação vale mais.", "Epic", [
    rule("roleFitModifier", -12),
    rule("offMetaModifier", 16),
    metric("rulesAdaptation", 12),
  ], ["draft", "offmeta"]),
  card("jogo-de-objetivo", "Jogo de Objetivo", "Objetivos entregam mais ouro e poder de mapa.", "Rare", [
    metric("objectiveControl", 13),
    rule("objectiveValueMultiplier", 1.45, "multiply"),
  ], ["objective", "map"]),
  card("sangue-no-rift", "Sangue no Rift", "Abates são mais frequentes e valiosos.", "Epic", [
    rule("fightChanceMultiplier", 1.45, "multiply"),
    rule("killGoldMultiplier", 1.4, "multiply"),
    metric("earlyGame", 5),
  ], ["fight", "gold"]),
  card("cerco-total", "Cerco Total", "Poke, wave clear e pressão em torres ficam mais fortes.", "Rare", [
    metric("waveClear", 12),
    rule("towerChanceMultiplier", 1.35, "multiply"),
    rule("baronPressureMultiplier", 1.2, "multiply"),
  ], ["siege", "tower"]),
  card("sem-paciencia", "Sem Paciência", "Partidas encurtam e a pressão inicial cresce.", "Common", [
    rule("durationMinutes", -6),
    metric("earlyGame", 9),
    metric("scaling", -7),
  ], ["early", "tempo"]),
  card("resistencia-final", "Resistência Final", "A base fica mais difícil de quebrar no fim.", "Epic", [
    rule("towerResistance", 0.12),
    rule("inhibitorResistance", 0.28),
    rule("nexusResistance", 0.42),
    rule("durationMinutes", 5),
  ], ["base", "comeback"]),
];

export const rogueCardById = new Map(rogueCards.map((entry) => [entry.id, entry]));
