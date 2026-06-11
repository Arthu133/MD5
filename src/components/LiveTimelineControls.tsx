import type { SimulationMode, SimulationSpeed } from "../types/game";

type LiveTimelineControlsProps = {
  mode: SimulationMode;
  speed: SimulationSpeed;
  paused: boolean;
  matchFinished: boolean;
  onModeChange: (mode: SimulationMode) => void;
  onSpeedChange: (speed: SimulationSpeed) => void;
  onTogglePause: () => void;
  onSkipMatch: () => void;
  onSkipTournament: () => void;
};

const speedLabels: Record<SimulationSpeed, string> = {
  Slow: "Devagar",
  Normal: "Normal",
  Fast: "Rápida",
  UltraFast: "Ultra rápida",
};

export function LiveTimelineControls({
  mode,
  speed,
  paused,
  matchFinished,
  onModeChange,
  onSpeedChange,
  onTogglePause,
  onSkipMatch,
  onSkipTournament,
}: LiveTimelineControlsProps) {
  return (
    <section className="live-controls panel">
      <div className="live-control-group">
        <span>Modo</span>
        <div className="segmented-control">
          <button
            className={mode === "Automatic" ? "is-active" : ""}
            type="button"
            onClick={() => onModeChange("Automatic")}
          >
            Automático
          </button>
          <button
            className={mode === "Manual" ? "is-active" : ""}
            type="button"
            onClick={() => onModeChange("Manual")}
          >
            Manual
          </button>
        </div>
      </div>
      <div className="live-control-group live-speed-control">
        <span>Velocidade</span>
        <div className="segmented-control">
          {(Object.keys(speedLabels) as SimulationSpeed[]).map((entry) => (
            <button
              className={speed === entry ? "is-active" : ""}
              type="button"
              onClick={() => onSpeedChange(entry)}
              key={entry}
            >
              {speedLabels[entry]}
            </button>
          ))}
        </div>
      </div>
      <div className="live-control-actions">
        {!matchFinished ? (
          <button
            className="secondary-button"
            type="button"
            onClick={onTogglePause}
          >
            {paused ? "Continuar" : "Pausar"}
          </button>
        ) : mode === "Manual" ? (
          <span className="manual-waiting">Aguardando sua decisão</span>
        ) : null}
        {!matchFinished ? (
          <button className="ghost-button" type="button" onClick={onSkipMatch}>
            Pular partida
          </button>
        ) : null}
        <button className="ghost-button" type="button" onClick={onSkipTournament}>
          Pular torneio
        </button>
      </div>
    </section>
  );
}
