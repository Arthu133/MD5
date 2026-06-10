import type { LiveMatchEvent } from "../types/game";

type LiveEventFeedProps = {
  events: LiveMatchEvent[];
  currentMinute: number;
};

const importanceLabels = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
  Critical: "Crítica",
} as const;

export function LiveEventFeed({
  events,
  currentMinute,
}: LiveEventFeedProps) {
  const visibleEvents = events
    .filter((event) => event.minute <= currentMinute)
    .slice()
    .reverse();

  return (
    <details className="live-history panel">
      <summary>
        <div>
          <p className="eyebrow">DETALHES OPCIONAIS</p>
          <strong>Histórico da partida</strong>
        </div>
        <span>{visibleEvents.length} eventos</span>
      </summary>
      <div className="live-feed__scroll" aria-live="polite">
        {visibleEvents.length ? (
          visibleEvents.map((event) => (
            <article
              className={`live-event live-event--${event.importance.toLowerCase()} live-event--${event.side.toLowerCase()}`}
              key={event.id}
            >
              <time>{String(event.minute).padStart(2, "0")}:00</time>
              <div>
                <span>
                  {event.title} · {importanceLabels[event.importance]}
                </span>
                <p>{event.description}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="live-feed__empty">
            A partida começou. As equipes estudam o mapa e disputam visão.
          </div>
        )}
      </div>
    </details>
  );
}
