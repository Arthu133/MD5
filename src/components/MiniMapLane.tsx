import type { MapZone, MatchSide } from "../types/game";

type MiniMapLaneProps = {
  zone: Extract<MapZone, "TopLane" | "MidLane" | "BotLane" | "River">;
  label: string;
  pressure?: MatchSide;
};

export function MiniMapLane({
  zone,
  label,
  pressure,
}: MiniMapLaneProps) {
  return (
    <div
      className={`mini-map-lane mini-map-lane--${zone.toLowerCase()} ${
        pressure ? `is-pressured-by-${pressure.toLowerCase()}` : ""
      }`}
      aria-label={`${label}${pressure ? ` sob pressão do time ${pressure === "User" ? "azul" : "vermelho"}` : ""}`}
    >
      <span>{label}</span>
    </div>
  );
}
