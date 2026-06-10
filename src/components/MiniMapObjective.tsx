import type { MatchSide } from "../types/game";

type MiniMapObjectiveProps = {
  type: "Dragon" | "Baron";
  side?: MatchSide;
  active: boolean;
};

export function MiniMapObjective({
  type,
  side,
  active,
}: MiniMapObjectiveProps) {
  return (
    <div
      className={`mini-map-objective mini-map-objective--${type.toLowerCase()} ${
        active ? "is-active" : ""
      } ${side ? `is-${side.toLowerCase()}` : ""}`}
      aria-label={`${type === "Dragon" ? "Covil do dragão" : "Covil do Barão"}${
        side ? ` controlado por ${side === "User" ? "MD5" : "adversário"}` : ""
      }`}
    >
      <span>{type === "Dragon" ? "D" : "B"}</span>
      <small>{type === "Dragon" ? "DRAGÃO" : "BARÃO"}</small>
    </div>
  );
}
