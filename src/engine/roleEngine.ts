import type {
  ChampionClass,
  ChampionProfile,
  GameDifficulty,
  Role,
  RoleFitLevel,
  RoleFitResult,
} from "../types/game";

const roleClassAffinity: Record<Role, ChampionClass[]> = {
  Top: ["Tank", "Fighter", "Engager", "Marksman"],
  Jungle: ["Fighter", "Assassin", "Tank", "Engager", "Specialist"],
  Mid: ["Mage", "Assassin", "Controller", "Fighter", "Specialist"],
  Carry: ["Marksman", "Mage", "Specialist"],
  Support: ["Enchanter", "Controller", "Engager", "Tank", "Mage"],
};

const levelFromScore = (score: number): RoleFitLevel => {
  if (score >= 95) return "Natural";
  if (score >= 85) return "Flex";
  if (score >= 55) return "OffMeta";
  if (score >= 30) return "Bad";
  return "Terrible";
};

const roleSpecificScore = (champion: ChampionProfile, role: Role) => {
  const classes = champion.classes;
  const stats = champion.stats;
  const classMatches = classes.filter((championClass) =>
    roleClassAffinity[role].includes(championClass),
  ).length;
  let score = 24 + classMatches * 15;
  const reasons: string[] = [];
  const penalties: string[] = [];

  if (classMatches > 0) {
    reasons.push("A classe do campeão oferece alguma lógica para a posição.");
  }

  if (role === "Top") {
    score += stats.tankiness * 0.1 + stats.splitPush * 0.09 + stats.sustain * 0.06;
    if (classes.includes("Marksman")) {
      score = Math.max(score, 57);
      reasons.push("O alcance permite uma escolha de pressão lateral fora do meta.");
    }
    if (classes.includes("Enchanter")) {
      score -= 24;
      penalties.push("A posição exige autonomia e pressão que o campeão não oferece.");
    }
  }

  if (role === "Jungle") {
    score +=
      stats.objectiveControl * 0.12 +
      stats.mobility * 0.08 +
      stats.pickoff * 0.07 +
      stats.sustain * 0.05;
    if (classes.includes("Enchanter")) {
      score -= 34;
      penalties.push("Baixa autonomia para limpar a selva e disputar objetivos.");
    }
    if (classes.includes("Marksman") && !classes.includes("Fighter")) {
      score -= 25;
      penalties.push("A limpeza e a sobrevivência na selva são pouco confiáveis.");
    }
    if (stats.objectiveControl < 42) {
      score -= 10;
      penalties.push("O campeão oferece pouco controle de objetivo nesta função.");
    }
  }

  if (role === "Mid") {
    score += stats.waveClear * 0.11 + stats.burst * 0.08 + stats.mobility * 0.05;
    if (classes.includes("Fighter")) {
      score = Math.max(score, 58);
      reasons.push("Lutadores podem funcionar no meio com pressão e trocas curtas.");
    }
    if (classes.includes("Enchanter") && stats.waveClear < 50) {
      score -= 18;
      penalties.push("Falta pressão de rota para controlar o centro do mapa.");
    }
  }

  if (role === "Carry") {
    score +=
      Math.max(stats.damageAD, stats.damageAP) * 0.1 +
      stats.scaling * 0.11 +
      stats.teamFight * 0.05;
    if (classes.includes("Mage") && stats.waveClear >= 60) {
      score = Math.max(score, 58);
      reasons.push("Magos de alcance podem ocupar a função como escolha alternativa.");
    }
    if (classes.includes("Tank") || classes.includes("Engager")) {
      score -= 35;
      penalties.push("O time perde uma fonte confiável de dano contínuo.");
    }
    if (classes.includes("Enchanter")) {
      score -= 28;
      penalties.push("A função de carregador fica sem dano suficiente.");
    }
  }

  if (role === "Support") {
    score +=
      stats.peel * 0.1 +
      stats.engage * 0.09 +
      stats.crowdControl * 0.08 +
      stats.utility * 0.07;
    if (classes.includes("Mage") && (stats.crowdControl >= 50 || stats.pickoff >= 55)) {
      score = Math.max(score, 57);
      reasons.push("Controle e alcance permitem uma escolha de suporte fora do meta.");
    }
    if (classes.includes("Marksman") && stats.utility < 35) {
      score -= 16;
      penalties.push("A posição recebe pouca proteção ou iniciação.");
    }
  }

  return {
    score: Math.round(Math.max(0, Math.min(84, score))),
    reasons,
    penalties,
  };
};

export function calculateRoleFit(
  champion: ChampionProfile,
  assignedRole: Role,
  difficulty: GameDifficulty,
): RoleFitResult {
  if (champion.primaryRole === assignedRole) {
    return {
      score: 100,
      level: "Natural",
      reasons: ["O campeão está em sua posição principal."],
      penalties: [],
    };
  }

  if (champion.roles.includes(assignedRole)) {
    return {
      score: 90,
      level: "Flex",
      reasons: ["O campeão possui histórico e ferramentas para atuar nesta posição."],
      penalties: [],
    };
  }

  const evaluated = roleSpecificScore(champion, assignedRole);
  const level = levelFromScore(evaluated.score);
  const modePenalty =
    difficulty === "Hard"
      ? "A escolha fora de rota aumenta o risco estratégico do modo difícil."
      : "A escolha não corresponde às posições cadastradas para o campeão.";

  return {
    score: evaluated.score,
    level,
    reasons: evaluated.reasons,
    penalties: [...evaluated.penalties, modePenalty],
  };
}
