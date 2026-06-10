import { generateCurrentEventSummary } from "../engine/liveMatchEngine";
import type { LiveMatchEvent } from "../types/game";

type CurrentEventSummaryProps = {
  events: LiveMatchEvent[];
  currentMinute: number;
};

export function CurrentEventSummary({
  events,
  currentMinute,
}: CurrentEventSummaryProps) {
  return (
    <section className="current-event-summary" aria-live="polite">
      <span className="current-event-summary__pulse" />
      <div>
        <small>AGORA NO MAPA</small>
        <strong>{generateCurrentEventSummary(events, currentMinute)}</strong>
      </div>
    </section>
  );
}
