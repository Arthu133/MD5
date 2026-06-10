import type {
  CampaignResult,
  DraftTeam,
  TournamentStage,
} from "../types/game";

const stageLabels: Record<TournamentStage, string> = {
  Groups: "fase de grupos",
  Quarterfinals: "quartas de final",
  Semifinals: "semifinal",
  Final: "final",
};

export function generateFinalDiagnosis(result: CampaignResult): string {
  const { teamScore } = result;
  const opening = result.champion
    ? "Título conquistado. Seu draft atravessou grupos e três séries MD5 contra adversários cada vez mais preparados."
    : `A campanha terminou na ${stageLabels[result.eliminatedAt ?? "Groups"]}.`;
  const strength = teamScore.strengths[0]
    ? ` O principal acerto foi ${teamScore.strengths[0].toLowerCase()}.`
    : "";
  const weakness = teamScore.weaknesses[0]
    ? ` O maior risco foi ${teamScore.weaknesses[0].toLowerCase()}.`
    : "";
  const cardNote =
    result.activeCards?.length
      ? ` As ${result.activeCards.length} cartas acumuladas levaram a sinergia para ${teamScore.cardSynergy}/100 e a adaptação para ${teamScore.rulesAdaptation}/100.`
      : " A campanha terminou sem regras acumuladas relevantes.";
  const roleNote =
    teamScore.roleWarnings.length > 0
      ? " Escolhas fora de função reduziram pressão de rota, objetivos e capacidade de adaptação."
      : " Os campeões ficaram bem encaixados em suas posições.";
  const decisiveSeries = [...result.series].reverse().find((entry) => !entry.won);
  const opponentNote = decisiveSeries
    ? ` ${decisiveSeries.enemy.name} venceu com ${decisiveSeries.enemy.mainThreat}, apoiado por um draft ${decisiveSeries.enemy.draftCoherence}/100.`
    : "";

  return `${opening}${strength}${weakness}${cardNote}${roleNote}${opponentNote}`;
}

export function generateShareText(
  result: CampaignResult,
  team: DraftTeam,
): string {
  const builds = team
    .map((build) => `${build.role}: ${build.champion.name}`)
    .join("\n");
  const mode = result.difficulty === "Hard" ? "Difícil" : "Clássico";
  const seriesText = result.series
    .map((entry) => {
      const stage =
        entry.stage === "Groups"
          ? `Grupo vs ${entry.enemy.name}`
          : entry.stage === "Quarterfinals"
            ? "Quartas"
            : entry.stage === "Semifinals"
              ? "Semi"
              : "Final";
      return `${stage}: ${entry.userWins}-${entry.enemyWins}`;
    })
    .join("\n");

  return `Joguei MD5 no modo ${mode}!

Resultado: ${result.champion ? "Campeão" : `Eliminado na ${stageLabels[result.eliminatedAt ?? "Groups"]}`}
Grupos: ${result.groupWins}-${result.groupLosses}
${seriesText}

Composição:
${builds}

Arquétipo: ${result.teamScore.archetype}
Nota: ${result.teamScore.total}/100
Cartas ativas: ${result.activeCards?.length ?? 0}
Sinergia das cartas: ${result.teamScore.cardSynergy}/100

Consegue ganhar uma MD5?`;
}
