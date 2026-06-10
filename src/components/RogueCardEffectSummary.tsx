import type { RogueCard } from "../types/game";

type RogueCardEffectSummaryProps = {
  card: RogueCard;
};

const labels: Record<string, string> = {
  earlyGame: "Early game",
  scaling: "Scaling",
  frontline: "Frontline",
  engage: "Engage",
  peel: "Peel",
  crowdControl: "Controle",
  objectiveControl: "Objetivos",
  waveClear: "Wave clear",
  pickoff: "Pickoff",
  splitPush: "Split push",
  consistency: "Consistência",
  executionDifficulty: "Execução",
  cardSynergy: "Sinergia",
  rulesAdaptation: "Adaptação",
  damageAD: "Dano físico",
  damageAP: "Dano mágico",
  tankiness: "Resistência",
  earlyPressure: "Pressão inicial",
  teamFight: "Luta em equipe",
  mobility: "Mobilidade",
  sustain: "Sustain",
  burst: "Explosão",
  utility: "Utilidade",
  durationMinutes: "Duração",
  fightChanceMultiplier: "Lutas",
  killGoldMultiplier: "Ouro de abates",
  objectiveValueMultiplier: "Valor de objetivos",
  dragonValueMultiplier: "Dragões",
  baronPressureMultiplier: "Pressão do Barão",
  towerChanceMultiplier: "Queda de torres",
  towerResistance: "Resistência das torres",
  inhibitorResistance: "Resistência dos inibidores",
  nexusResistance: "Resistência do Nexus",
  objectiveStealChance: "Roubos",
  earlyObjectiveOffset: "Objetivos antecipados",
  varianceMultiplier: "Variância",
  enemyDraftQuality: "Draft adversário",
  offMetaModifier: "Off-meta",
  roleFitModifier: "Encaixe de rota",
};

const valueLabel = (operation: string, value: number) => {
  if (operation === "multiply") {
    const percentage = Math.round((value - 1) * 100);
    return `${percentage >= 0 ? "+" : ""}${percentage}%`;
  }
  return `${value >= 0 ? "+" : ""}${value}`;
};

export function RogueCardEffectSummary({
  card,
}: RogueCardEffectSummaryProps) {
  return (
    <div className="rogue-effect-summary">
      {card.effects.slice(0, 4).map((entry, index) => {
        const key = entry.metric ?? entry.stat ?? entry.rule ?? entry.type;
        return (
          <span key={`${card.id}-${key}-${index}`}>
            {labels[key] ?? key}
            <strong>{valueLabel(entry.operation, entry.value)}</strong>
          </span>
        );
      })}
    </div>
  );
}
