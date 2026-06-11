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
) => effect("DraftRuleModifier", "rule", name, value, operation);

export const rogueCards: RogueCard[] = [
  card("meta-agressivo", "Meta Agressivo", "Early game e snowball ficam mais fortes.", "Common", [
    attribute("earlyGame", 8),
    attribute("snowball", 8),
    rule("fightChanceMultiplier", 1.12, "multiply"),
    rule("durationMinutes", -2),
  ], ["early", "snowball"]),
  card("late-game-absoluto", "Late Game", "Scaling cresce, mas o early game perde força.", "Rare", [
    attribute("scaling", 10),
    attribute("lateGame", 10),
    metric("earlyGame", -4),
    rule("durationMinutes", 4),
  ], ["late", "scaling"]),
  card("sem-frontline", "Sem Frontline", "Frontline perde valor; mobilidade e pickoff crescem.", "Rare", [
    attribute("frontline", -10),
    attribute("mobility", 6),
    attribute("pickoff", 6),
    rule("fightChanceMultiplier", 1.08, "multiply"),
  ], ["pickoff", "mobility"]),
  card("guerra-de-dragoes", "Guerra de Dragões", "Dragões aparecem cedo e valem mais.", "Common", [
    attribute("objectiveControl", 8),
    metric("objectiveControl", 6),
    rule("dragonValueMultiplier", 1.3, "multiply"),
    rule("earlyObjectiveOffset", -1),
  ], ["objective", "dragon"]),
  card("barao-decisivo", "Barão Decisivo", "Objetivos e cerco após Barão ficam mais fortes.", "Rare", [
    attribute("objectiveControl", 8),
    attribute("siege", 6),
    rule("baronPressureMultiplier", 1.35, "multiply"),
    rule("towerChanceMultiplier", 1.1, "multiply"),
  ], ["objective", "siege"]),
  card("full-dano", "Full Dano", "Dano aumenta, mas a frontline fica mais fraca.", "Rare", [
    stat("damageAD", 6),
    stat("damageAP", 6),
    attribute("frontline", -8),
    rule("killGoldMultiplier", 1.12, "multiply"),
  ], ["damage", "fight"]),
  card("jogo-travado", "Jogo Travado", "Defesa, wave clear e comeback ganham valor.", "Common", [
    attribute("comeback", 6),
    attribute("waveClear", 6),
    rule("towerResistance", 0.15),
    rule("durationMinutes", 4),
  ], ["comeback", "defense"]),
  card("ritmo-acelerado", "Ritmo Acelerado", "Pressão inicial e rotações acontecem mais cedo.", "Common", [
    attribute("earlyGame", 7),
    attribute("roaming", 5),
    rule("durationMinutes", -3),
    rule("fightChanceMultiplier", 1.1, "multiply"),
  ], ["early", "tempo"]),
  card("controle-de-mapa", "Controle de Mapa", "Visão, ondas e objetivos ficam mais fortes.", "Common", [
    attribute("visionControl", 8),
    attribute("waveClear", 7),
    attribute("objectiveControl", 7),
    rule("objectiveValueMultiplier", 1.1, "multiply"),
  ], ["map", "objective"]),
  card("bot-lane-forte", "Bot Lane Forte", "Carry escala; Support protege melhor.", "Common", [
    attribute("hypercarry", 7, { roles: ["Carry"] }),
    attribute("dps", 6, { roles: ["Carry"] }),
    attribute("protectCarry", 8, { roles: ["Support"] }),
    attribute("peel", 7, { roles: ["Support"] }),
  ], ["bot", "protect"]),
  card("top-ilha", "Top Ilha", "Top ganha duelo e pressão lateral.", "Common", [
    attribute("splitPush", 10, { roles: ["Top"] }),
    attribute("duelist", 8, { roles: ["Top"] }),
    attribute("sustain", 6, { roles: ["Top"] }),
    rule("towerChanceMultiplier", 1.08, "multiply"),
  ], ["top", "split"]),
  card("jungle-dominante", "Jungle Dominante", "Jungle controla ritmo, mapa e objetivos.", "Rare", [
    attribute("junglePressure", 10, { roles: ["Jungle"] }),
    attribute("objectiveControl", 8, { roles: ["Jungle"] }),
    attribute("roaming", 6, { roles: ["Jungle"] }),
    metric("objectiveControl", 6),
  ], ["jungle", "objective"]),
  card("mid-prioridade", "Mid Prioridade", "Mid ganha rotações, pickoff e wave clear.", "Common", [
    attribute("roaming", 8, { roles: ["Mid"] }),
    attribute("pickoff", 7, { roles: ["Mid"] }),
    attribute("waveClear", 7, { roles: ["Mid"] }),
    metric("earlyGame", 4),
  ], ["mid", "pickoff"]),
  card("sem-escapatoria", "Sem Escapatória", "Controle e pickoff ficam mais fortes.", "Rare", [
    attribute("pickoff", 9),
    attribute("crowdControl", 8),
    attribute("visionControl", 6),
    rule("fightChanceMultiplier", 1.06, "multiply"),
  ], ["pickoff", "control"]),
  card("dive-meta", "Dive Meta", "Dive, engage e burst ficam mais fortes.", "Rare", [
    attribute("dive", 10),
    attribute("engage", 8),
    attribute("burst", 6),
    metric("earlyGame", 6),
  ], ["dive", "engage"]),
  card("poke-meta", "Poke Meta", "Poke, alcance e cerco ficam mais fortes.", "Rare", [
    attribute("poke", 10),
    attribute("siege", 8),
    attribute("longRange", 6),
    metric("waveClear", 8),
  ], ["poke", "siege"]),
  card("protect-the-carry", "Protect the Carry", "Peel e proteção fortalecem o hypercarry.", "Rare", [
    attribute("protectCarry", 10),
    attribute("peel", 8),
    attribute("shielding", 6),
    attribute("hypercarry", 4),
  ], ["protect", "scaling"]),
  card("economia-apertada", "Economia Apertada", "Abates valem menos; objetivos valem mais.", "Common", [
    attribute("objectiveControl", 6),
    rule("killGoldMultiplier", 0.8, "multiply"),
    rule("objectiveValueMultiplier", 1.18, "multiply"),
  ], ["economy", "objective"]),
  card("power-spike-cedo", "Power Spike Cedo", "Early game acelera; scaling perde força.", "Common", [
    attribute("earlyGame", 8),
    attribute("snowball", 7),
    metric("scaling", -4),
    rule("durationMinutes", -2),
  ], ["early", "snowball"]),
  card("escalada-tardia", "Escalada Tardia", "Scaling, late game e comeback crescem.", "Common", [
    attribute("scaling", 8),
    attribute("lateGame", 8),
    attribute("comeback", 5),
    rule("durationMinutes", 3),
  ], ["late", "scaling"]),
  card("sem-volta", "Sem Volta", "Vantagens crescem e viradas ficam mais difíceis.", "Rare", [
    attribute("snowball", 8),
    rule("snowballMultiplier", 1.22, "multiply"),
    rule("comebackMultiplier", 0.82, "multiply"),
    rule("durationMinutes", -2),
  ], ["snowball", "early"]),
  card("virada-epica", "Virada Épica", "Comeback e wave clear ajudam o time atrás.", "Epic", [
    attribute("comeback", 10),
    attribute("waveClear", 6),
    rule("comebackMultiplier", 1.35, "multiply"),
    rule("durationMinutes", 2),
  ], ["comeback", "defense"]),
  card("lutas-constantes", "Lutas Constantes", "Engage e team fight acontecem mais vezes.", "Rare", [
    attribute("teamFight", 8),
    attribute("engage", 6),
    rule("fightChanceMultiplier", 1.3, "multiply"),
    rule("killGoldMultiplier", 1.05, "multiply"),
  ], ["fight", "teamfight"]),
  card("mapa-aberto", "Mapa Aberto", "Split push e cerco derrubam torres mais rápido.", "Common", [
    attribute("splitPush", 7),
    attribute("siege", 7),
    rule("towerChanceMultiplier", 1.25, "multiply"),
    rule("towerResistance", -0.08),
  ], ["map", "tower"]),
  card("base-blindada", "Base Blindada", "Wave clear e defesa prolongam a partida.", "Rare", [
    attribute("comeback", 7),
    attribute("waveClear", 6),
    rule("inhibitorResistance", 0.22),
    rule("nexusResistance", 0.2),
  ], ["base", "defense"]),
  card("objetivo-roubado", "Objetivo Roubado", "Junglers e visão aumentam chances de roubo.", "Epic", [
    attribute("junglePressure", 7, { roles: ["Jungle"] }),
    attribute("visionControl", 6),
    rule("objectiveStealChance", 0.1),
    rule("varianceMultiplier", 1.08, "multiply"),
  ], ["objective", "vision"]),
  card("serie-mental", "Série Mental", "Derrotas anteriores pesam menos na série.", "Rare", [
    attribute("comeback", 5),
    metric("consistency", 6),
    rule("mentalReset", 6),
  ], ["series", "comeback"]),
  card("momentum", "Momentum", "Vitórias seguidas fortalecem early e snowball.", "Rare", [
    attribute("earlyGame", 5),
    attribute("snowball", 6),
    rule("momentum", 4),
    rule("snowballMultiplier", 1.08, "multiply"),
  ], ["series", "snowball"]),
  card("meta-de-mundial", "Meta de Mundial", "O adversário recebe um draft mais forte.", "Legendary", [
    rule("enemyDraftQuality", 8),
  ], ["enemy", "difficulty"]),
  card("draft-generoso", "Draft Generoso", "O adversário deixa mais brechas no draft.", "Rare", [
    rule("enemyDraftQuality", -8),
  ], ["enemy", "draft"]),
  card("draft-cruel", "Draft Cruel", "O adversário explora melhor suas fraquezas.", "Epic", [
    rule("enemyDraftQuality", 10),
    rule("varianceMultiplier", 0.94, "multiply"),
  ], ["enemy", "draft"]),
  card("snowball-brutal", "Snowball Brutal", "A primeira vantagem ganha muito peso.", "Epic", [
    attribute("snowball", 10),
    rule("snowballMultiplier", 1.35, "multiply"),
    rule("comebackMultiplier", 0.75, "multiply"),
    rule("durationMinutes", -3),
  ], ["snowball", "early"]),
  card("jogo-de-xadrez", "Jogo de Xadrez", "Mapa e objetivos importam mais que lutas.", "Rare", [
    attribute("visionControl", 8),
    attribute("waveClear", 8),
    attribute("objectiveControl", 8),
    rule("fightChanceMultiplier", 0.75, "multiply"),
  ], ["map", "control"]),
  card("anti-tank-meta", "Anti-Tank Meta", "DPS e anti-tank enfraquecem frontlines.", "Rare", [
    attribute("antiTank", 10),
    attribute("dps", 6),
    attribute("frontline", -5),
  ], ["damage", "antitank"]),
  card("anti-cura-meta", "Anti-Cura Meta", "Cura e sustain caem; burst cresce.", "Common", [
    attribute("healing", -10),
    attribute("sustain", -10),
    attribute("burst", 6),
    metric("pickoff", 4),
  ], ["healing", "burst"]),
  card("escudos-fortes", "Escudos Fortes", "Escudos e peel protegem melhor os carries.", "Rare", [
    attribute("shielding", 10, { classes: ["Enchanter", "Controller"] }),
    attribute("peel", 8, { classes: ["Enchanter", "Controller"] }),
    attribute("protectCarry", 6, { classes: ["Enchanter", "Controller"] }),
    metric("teamFight", 3),
  ], ["shield", "protect"]),
  card("assassinos-soltos", "Assassinos Soltos", "Assassinos ganham burst, mobilidade e pickoff.", "Rare", [
    attribute("burst", 10, { classes: ["Assassin"] }),
    attribute("mobility", 8, { classes: ["Assassin"] }),
    attribute("pickoff", 8, { classes: ["Assassin"] }),
  ], ["assassin", "pickoff"]),
  card("tanques-imortais", "Tanques Imortais", "Tanques ganham frontline e sustain.", "Epic", [
    attribute("frontline", 10, { classes: ["Tank"] }),
    attribute("sustain", 6, { classes: ["Tank"] }),
    attribute("teamFight", 4, { classes: ["Tank"] }),
    rule("durationMinutes", 2),
  ], ["tank", "teamfight"]),
  card("mapa-escuro", "Mapa Escuro", "Visão e pickoff criam mais roubos.", "Rare", [
    attribute("visionControl", 7),
    attribute("pickoff", 8),
    rule("objectiveStealChance", 0.06),
    rule("varianceMultiplier", 1.08, "multiply"),
  ], ["vision", "pickoff"]),
  card("dragao-ancestral", "Dragão Ancestral", "Dragões e controle de objetivos ganham peso.", "Legendary", [
    attribute("objectiveControl", 8),
    rule("dragonValueMultiplier", 1.45, "multiply"),
    rule("objectiveValueMultiplier", 1.1, "multiply"),
    rule("durationMinutes", 1),
  ], ["dragon", "objective"]),
  card("sem-erro", "Sem Erro", "Consistência aumenta e a variância diminui.", "Epic", [
    metric("consistency", 10),
    metric("executionDifficulty", -4),
    rule("varianceMultiplier", 0.8, "multiply"),
  ], ["consistency"]),
  card("jogo-de-objetivo", "Jogo de Objetivo", "Objetivos e visão controlam o mapa.", "Rare", [
    attribute("objectiveControl", 9),
    attribute("visionControl", 6),
    rule("objectiveValueMultiplier", 1.25, "multiply"),
  ], ["objective", "map"]),
  card("sangue-no-rift", "Sangue no Rift", "Early e snowball tornam abates mais valiosos.", "Epic", [
    attribute("earlyGame", 6),
    attribute("snowball", 6),
    rule("fightChanceMultiplier", 1.25, "multiply"),
    rule("killGoldMultiplier", 1.2, "multiply"),
  ], ["fight", "snowball"]),
  card("cerco-total", "Cerco Total", "Poke e cerco derrubam torres mais rápido.", "Rare", [
    attribute("poke", 8),
    attribute("siege", 10),
    attribute("waveClear", 7),
    rule("towerChanceMultiplier", 1.2, "multiply"),
  ], ["siege", "tower"]),
  card("sem-paciencia", "Sem Paciência", "Early cresce e partidas ficam mais curtas.", "Common", [
    attribute("earlyGame", 8),
    attribute("snowball", 6),
    metric("scaling", -5),
    rule("durationMinutes", -4),
  ], ["early", "tempo"]),
  card("resistencia-final", "Resistência Final", "Comeback e defesa protegem o Nexus.", "Epic", [
    attribute("comeback", 8),
    attribute("waveClear", 6),
    rule("nexusResistance", 0.3),
    rule("durationMinutes", 4),
  ], ["base", "comeback"]),
];

const wordCount = (value: string) => value.trim().split(/\s+/).length;

export function validateRogueCards(cards: RogueCard[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  cards.forEach((entry) => {
    if (ids.has(entry.id)) errors.push(`${entry.id}: id duplicado`);
    ids.add(entry.id);
    if (wordCount(entry.description) > 10) {
      errors.push(`${entry.id}: descrição longa`);
    }
    if (!entry.effects.length || entry.effects.length > 4) {
      errors.push(`${entry.id}: deve ter entre 1 e 4 efeitos`);
    }
    if (
      !entry.effects.some(
        (cardEffect) =>
          cardEffect.attribute || cardEffect.stat || cardEffect.rule,
      )
    ) {
      errors.push(`${entry.id}: sem impacto direto no draft ou partida`);
    }
    entry.effects.forEach((cardEffect) => {
      if (
        cardEffect.operation === "multiply" &&
        Math.abs(cardEffect.value - 1) > 0.45
      ) {
        errors.push(`${entry.id}: multiplicador acima do limite`);
      }
      if (
        cardEffect.attribute &&
        Math.abs(cardEffect.value) > 10
      ) {
        errors.push(`${entry.id}: atributo acima do limite`);
      }
      if (
        (cardEffect.metric || cardEffect.stat) &&
        Math.abs(cardEffect.value) > 10
      ) {
        errors.push(`${entry.id}: bônus direto acima do limite`);
      }
    });
  });

  return errors;
}

export const rogueCardValidationErrors = validateRogueCards(rogueCards);

if (rogueCardValidationErrors.length) {
  throw new Error(
    `Cartas inválidas:\n${rogueCardValidationErrors.join("\n")}`,
  );
}

export const rogueCardById = new Map(rogueCards.map((entry) => [entry.id, entry]));
