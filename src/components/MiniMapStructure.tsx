import type { CSSProperties } from "react";
import type { MatchSide } from "../types/game";

type MiniMapStructureProps = {
  kind: "Tower" | "Inhibitor" | "Nexus";
  side: MatchSide;
  x: number;
  y: number;
  destroyed?: boolean;
  label: string;
};

export function MiniMapStructure({
  kind,
  side,
  x,
  y,
  destroyed = false,
  label,
}: MiniMapStructureProps) {
  return (
    <span
      className={`mini-map-structure mini-map-structure--${kind.toLowerCase()} mini-map-structure--${side.toLowerCase()} ${
        destroyed ? "is-destroyed" : ""
      }`}
      style={{ "--structure-x": `${x}%`, "--structure-y": `${y}%` } as CSSProperties}
      title={label}
      aria-label={`${label}${destroyed ? " destruído" : ""}`}
    />
  );
}
