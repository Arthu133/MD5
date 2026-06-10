import type {
  LiveMatchEvent,
  LiveMatchStats,
  MapZone,
  MatchSide,
} from "../types/game";
import { MiniMapEventPing } from "./MiniMapEventPing";
import { MiniMapObjective } from "./MiniMapObjective";
import { MiniMapStructure } from "./MiniMapStructure";

type LiveMiniMapProps = {
  currentMinute: number;
  events: LiveMatchEvent[];
  stats: LiveMatchStats;
  userTeamName: string;
  enemyTeamName: string;
};

type StructurePosition = {
  side: MatchSide;
  lane: "top" | "mid" | "bot";
  x: number;
  y: number;
};

const towerPositions: StructurePosition[] = [
  { side: "User", lane: "top", x: 14, y: 72 },
  { side: "User", lane: "top", x: 14, y: 49 },
  { side: "User", lane: "top", x: 16, y: 27 },
  { side: "Enemy", lane: "top", x: 34, y: 13 },
  { side: "Enemy", lane: "top", x: 57, y: 13 },
  { side: "Enemy", lane: "top", x: 78, y: 15 },
  { side: "User", lane: "mid", x: 24, y: 76 },
  { side: "User", lane: "mid", x: 37, y: 63 },
  { side: "User", lane: "mid", x: 47, y: 53 },
  { side: "Enemy", lane: "mid", x: 53, y: 47 },
  { side: "Enemy", lane: "mid", x: 65, y: 35 },
  { side: "Enemy", lane: "mid", x: 78, y: 22 },
  { side: "User", lane: "bot", x: 28, y: 86 },
  { side: "User", lane: "bot", x: 51, y: 87 },
  { side: "User", lane: "bot", x: 73, y: 85 },
  { side: "Enemy", lane: "bot", x: 86, y: 72 },
  { side: "Enemy", lane: "bot", x: 86, y: 49 },
  { side: "Enemy", lane: "bot", x: 84, y: 27 },
];

const inhibitorPositions: StructurePosition[] = [
  { side: "User", lane: "top", x: 8, y: 79 },
  { side: "User", lane: "mid", x: 15, y: 84 },
  { side: "User", lane: "bot", x: 21, y: 91 },
  { side: "Enemy", lane: "top", x: 79, y: 9 },
  { side: "Enemy", lane: "mid", x: 85, y: 16 },
  { side: "Enemy", lane: "bot", x: 92, y: 22 },
];

const towerCount = (
  stats: LiveMatchStats,
  position: StructurePosition,
) => {
  const key =
    `${position.lane}Towers${position.side}` as keyof LiveMatchStats["structures"];
  return stats.structures[key] as number;
};

const inhibitorDestroyed = (
  stats: LiveMatchStats,
  position: StructurePosition,
) => {
  const key =
    `${position.lane}Inhibitor${position.side}Destroyed` as keyof LiveMatchStats["structures"];
  return stats.structures[key] as boolean;
};

const pressureByZone = (
  events: LiveMatchEvent[],
  currentMinute: number,
) => {
  const pressures = new Map<MapZone, MatchSide>();
  events
    .filter(
      (event) =>
        event.minute >= currentMinute - 3 &&
        event.minute <= currentMinute &&
        ["MapPressure", "PowerSpike"].includes(event.type),
    )
    .forEach((event) => pressures.set(event.mapZone, event.side));
  return pressures;
};

const latestObjectiveSide = (
  events: LiveMatchEvent[],
  currentMinute: number,
  types: LiveMatchEvent["type"][],
) =>
  events
    .filter(
      (event) =>
        event.minute <= currentMinute &&
        event.minute >= currentMinute - 4 &&
        types.includes(event.type),
    )
    .at(-1)?.side;

const pingPriority: Partial<Record<LiveMatchEvent["type"], number>> = {
  GameEnd: 100,
  ObjectiveSteal: 90,
  Ace: 80,
  InhibitorDestroyed: 70,
  BaronTaken: 60,
  TeamFight: 50,
};

export function LiveMiniMap({
  currentMinute,
  events,
  stats,
  userTeamName,
  enemyTeamName,
}: LiveMiniMapProps) {
  const pressures = pressureByZone(events, currentMinute);
  const activeEvent = events
    .filter(
      (event) =>
        event.minute <= currentMinute &&
        event.minute >= currentMinute - 1 &&
        pingPriority[event.type],
    )
    .sort(
      (left, right) =>
        (pingPriority[right.type] ?? 0) - (pingPriority[left.type] ?? 0) ||
        right.minute - left.minute,
    )[0];
  const dragonSide = latestObjectiveSide(
    events,
    currentMinute,
    ["DragonTaken"],
  );
  const baronSide = latestObjectiveSide(
    events,
    currentMinute,
    ["BaronTaken", "HeraldTaken", "ObjectiveSteal"],
  );

  return (
    <section className="live-mini-map panel">
      <div className="live-mini-map__header">
        <div>
          <p className="eyebrow">LEITURA TÁTICA</p>
          <h2>Mapa da partida</h2>
        </div>
        <div className="mini-map-legend">
          <span className="is-user">{userTeamName}</span>
          <span className="is-enemy">{enemyTeamName}</span>
        </div>
      </div>
      <div className="mini-map-canvas">
        <svg
          className="mini-map-terrain"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Mapa tático com três rotas, rio, selva e bases"
        >
          <defs>
            <linearGradient id="map-ground" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#102d2b" />
              <stop offset="0.52" stopColor="#182b27" />
              <stop offset="1" stopColor="#30252d" />
            </linearGradient>
            <linearGradient id="map-river" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#15384b" />
              <stop offset="0.5" stopColor="#1e4d64" />
              <stop offset="1" stopColor="#19384c" />
            </linearGradient>
            <filter id="lane-glow">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="100" height="100" rx="7" fill="url(#map-ground)" />
          <path
            className={`map-jungle map-jungle--top ${
              pressures.get("TopJungle")
                ? `is-${pressures.get("TopJungle")?.toLowerCase()}`
                : ""
            }`}
            d="M18 18 H70 L57 42 L30 54 L15 43 Z"
          />
          <path
            className={`map-jungle map-jungle--bot ${
              pressures.get("BotJungle")
                ? `is-${pressures.get("BotJungle")?.toLowerCase()}`
                : ""
            }`}
            d="M82 82 H30 L43 58 L70 46 L85 57 Z"
          />
          <path
            className="map-river"
            d="M4 91 C25 78 36 67 48 53 C62 37 75 23 96 9"
            fill="none"
            stroke="url(#map-river)"
            strokeWidth="10"
          />
          <path
            className={`map-lane map-lane--top ${
              pressures.get("TopLane")
                ? `is-${pressures.get("TopLane")?.toLowerCase()}`
                : ""
            }`}
            d="M9 91 V10 H91"
          />
          <path
            className={`map-lane map-lane--mid ${
              pressures.get("MidLane")
                ? `is-${pressures.get("MidLane")?.toLowerCase()}`
                : ""
            }`}
            d="M10 90 L90 10"
          />
          <path
            className={`map-lane map-lane--bot ${
              pressures.get("BotLane")
                ? `is-${pressures.get("BotLane")?.toLowerCase()}`
                : ""
            }`}
            d="M9 91 H90 V10"
          />
          <path
            className={`map-river-pressure ${
              pressures.get("River")
                ? `is-${pressures.get("River")?.toLowerCase()}`
                : ""
            }`}
            d="M4 91 C25 78 36 67 48 53 C62 37 75 23 96 9"
          />

          <g className="map-camp map-camp--top">
            <circle cx="32" cy="29" r="4" />
            <circle cx="47" cy="22" r="3" />
            <circle cx="27" cy="45" r="3" />
          </g>
          <g className="map-camp map-camp--bot">
            <circle cx="68" cy="71" r="4" />
            <circle cx="53" cy="78" r="3" />
            <circle cx="73" cy="55" r="3" />
          </g>

          <path className="map-base map-base--user" d="M2 98 V78 L22 98 Z" />
          <path className="map-base map-base--enemy" d="M98 2 V22 L78 2 Z" />

          <text x="39" y="8">TOP</text>
          <text x="47" y="48" transform="rotate(-45 47 48)">MID</text>
          <text x="54" y="96">BOT</text>
        </svg>

        <MiniMapObjective type="Dragon" active={Boolean(dragonSide)} side={dragonSide} />
        <MiniMapObjective type="Baron" active={Boolean(baronSide)} side={baronSide} />

        {towerPositions.map((position, index) => {
          const laneIndex = index % 3;
          return (
            <MiniMapStructure
              key={`${position.side}-${position.lane}-${index}`}
              kind="Tower"
              side={position.side}
              x={position.x}
              y={position.y}
              destroyed={laneIndex >= towerCount(stats, position)}
              label={`Torre ${position.lane} do ${
                position.side === "User" ? userTeamName : enemyTeamName
              }`}
            />
          );
        })}

        {inhibitorPositions.map((position) => (
          <MiniMapStructure
            key={`inhibitor-${position.side}-${position.lane}`}
            kind="Inhibitor"
            side={position.side}
            x={position.x}
            y={position.y}
            destroyed={inhibitorDestroyed(stats, position)}
            label={`Inibidor ${position.lane} do ${
              position.side === "User" ? userTeamName : enemyTeamName
            }`}
          />
        ))}

        <MiniMapStructure
          kind="Nexus"
          side="User"
          x={9}
          y={91}
          label={`Base principal do ${userTeamName}`}
        />
        <MiniMapStructure
          kind="Nexus"
          side="Enemy"
          x={91}
          y={9}
          label={`Base principal do ${enemyTeamName}`}
        />

        {activeEvent ? <MiniMapEventPing event={activeEvent} /> : null}
      </div>
    </section>
  );
}
