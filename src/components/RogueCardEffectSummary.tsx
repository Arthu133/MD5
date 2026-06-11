import type { RogueCard } from "../types/game";

type RogueCardEffectSummaryProps = {
  card: RogueCard;
};

const labels: Record<string, string> = {
  earlyGame: "Early game",
  scaling: "Scaling",
  lateGame: "Late game",
  snowball: "Snowball",
  comeback: "Comeback",
  frontline: "Frontline",
  engage: "Engage",
  peel: "Peel",
  shielding: "Escudos",
  protectCarry: "Proteção do carry",
  hypercarry: "Hypercarry",
  crowdControl: "Controle",
  objectiveControl: "Objetivos",
  visionControl: "Controle de visão",
  junglePressure: "Pressão da jungle",
  waveClear: "Wave clear",
  pickoff: "Pickoff",
  splitPush: "Split push",
  duelist: "Duelo",
  roaming: "Rotações",
  siege: "Cerco",
  longRange: "Longo alcance",
  antiTank: "Anti-tank",
  healing: "Cura",
  teamFight: "Luta em equipe",
  mobility: "Mobilidade",
  sustain: "Sustain",
  burst: "Explosão",
  dps: "DPS",
  dive: "Dive",
  consistency: "Consistência",
  executionDifficulty: "Execução",
  damageAD: "Dano físico",
  damageAP: "Dano mágico",
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
  varianceMultiplier: "Variação",
  comebackMultiplier: "Força da virada",
  snowballMultiplier: "Força do snowball",
  enemyDraftQuality: "Draft adversário",
  mentalReset: "Recuperação mental",
  momentum: "Momentum",
};

const valueLabel = (operation: string, value: number) => {
  if (operation === "multiply") {
    const percentage = Math.round((value - 1) * 100);
    return `${percentage >= 0 ? "+" : ""}${percentage}%`;
  }
  return `${value >= 0 ? "+" : ""}${value}`;
};

const effectLabel = (key: string) =>
  labels[key] ??
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");

export function RogueCardEffectSummary({
  card,
}: RogueCardEffectSummaryProps) {
  return (
    <div className="rogue-effect-summary">
      {card.effects.map((entry, index) => {
        const key =
          entry.attribute ??
          entry.metric ??
          entry.stat ??
          entry.rule ??
          entry.type;
        return (
          <span key={`${card.id}-${key}-${index}`}>
            <span className="rogue-effect-summary__label">
              {effectLabel(key)}
            </span>
            <strong>{valueLabel(entry.operation, entry.value)}</strong>
          </span>
        );
      })}
    </div>
  );
}
