import type { CSSProperties } from "react";
import type { LiveMatchEvent, MapZone } from "../types/game";

type MiniMapEventPingProps = {
  event: LiveMatchEvent;
};

const zoneCoordinates: Record<MapZone, [number, number]> = {
  TopLane: [28, 18],
  MidLane: [50, 50],
  BotLane: [73, 82],
  TopJungle: [37, 32],
  BotJungle: [63, 68],
  River: [50, 47],
  DragonPit: [62, 61],
  BaronPit: [38, 38],
  UserBase: [10, 90],
  EnemyBase: [90, 10],
};

const pingGlyphs: Partial<Record<LiveMatchEvent["type"], string>> = {
  Kill: "K",
  Death: "X",
  FirstBlood: "1",
  TeamFight: "!",
  DragonTaken: "D",
  HeraldTaken: "H",
  BaronTaken: "B",
  ObjectiveSteal: "S",
  TowerDestroyed: "T",
  InhibitorDestroyed: "I",
  Ace: "A",
  MapPressure: "P",
  GameEnd: "N",
};

const hashOffset = (value: string) =>
  [...value].reduce((total, character) => total + character.charCodeAt(0), 0);

export function MiniMapEventPing({ event }: MiniMapEventPingProps) {
  const [baseX, baseY] = zoneCoordinates[event.mapZone];
  const hash = hashOffset(event.id);
  const x = baseX + ((hash % 9) - 4);
  const y = baseY + (((hash >> 3) % 9) - 4);

  return (
    <span
      className={`mini-map-ping mini-map-ping--${event.type.toLowerCase()} mini-map-ping--${event.side.toLowerCase()} mini-map-ping--${event.importance.toLowerCase()}`}
      style={{ "--ping-x": `${x}%`, "--ping-y": `${y}%` } as CSSProperties}
      title={`${event.title}: ${event.description}`}
      aria-label={event.description}
    >
      {pingGlyphs[event.type] ?? "•"}
    </span>
  );
}
