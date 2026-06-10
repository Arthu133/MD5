import type { DraftTeam, Role } from "../types/game";
import { ROLES } from "../types/game";

type DraftBoardProps = {
  team: DraftTeam;
  currentRole?: Role;
};

const roleInitials: Record<Role, string> = {
  Top: "T",
  Jungle: "J",
  Mid: "M",
  Carry: "C",
  Support: "S",
};

export function DraftBoard({ team, currentRole }: DraftBoardProps) {
  return (
    <aside className="draft-board">
      <div className="draft-board__header">
        <div>
          <p className="eyebrow">SEU ELENCO</p>
          <h2>Draft</h2>
        </div>
        <span>{team.length}/5</span>
      </div>
      <div className="draft-board__slots">
        {ROLES.map((role) => {
          const build = team.find((entry) => entry.role === role);
          return (
            <div
              className={`draft-slot ${currentRole === role ? "is-current" : ""} ${build ? "is-complete" : ""}`}
              key={role}
            >
              <div className="draft-slot__portrait">
                {build ? <img src={build.champion.image} alt="" /> : roleInitials[role]}
              </div>
              <div>
                <span>{role}</span>
                <strong>{build?.champion.name ?? (currentRole === role ? "Escolhendo..." : "Vazio")}</strong>
                {build ? <small>{build.items.length} itens confirmados</small> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="campaign-track tournament-track" aria-label="Etapas do torneio">
        {["GR", "QF", "SF", "F"].map((stage) => (
          <span key={stage}>{stage}</span>
        ))}
      </div>
    </aside>
  );
}
