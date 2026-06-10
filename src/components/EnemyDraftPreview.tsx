import type {
  CompetitiveEnemyTeam,
  GameDifficulty,
} from "../types/game";

type EnemyDraftPreviewProps = {
  enemy: CompetitiveEnemyTeam;
  difficulty: GameDifficulty;
};

export function EnemyDraftPreview({
  enemy,
  difficulty,
}: EnemyDraftPreviewProps) {
  return (
    <section className="enemy-draft-preview panel">
      <div className="enemy-draft-preview__heading">
        <div>
          <p className="eyebrow">DRAFT INIMIGO</p>
          <h2>{enemy.name}</h2>
        </div>
        <span>{enemy.archetype}</span>
      </div>
      <div className="enemy-draft-preview__list">
        {enemy.simulatedDraft.map(({ role, champion }) => (
          <article key={role}>
            <img src={champion.image} alt="" />
            <div>
              <span>{role}</span>
              <strong>{champion.name}</strong>
              {difficulty === "Classic" ? (
                <small>
                  {champion.classes.slice(0, 2).join(" · ")} ·{" "}
                  {champion.damageProfile}
                </small>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {difficulty === "Classic" ? (
        <div className="enemy-draft-preview__plan">
          <span>Plano provável</span>
          <strong>{enemy.winCondition}</strong>
          <p>{enemy.mainThreat}</p>
        </div>
      ) : null}
    </section>
  );
}
