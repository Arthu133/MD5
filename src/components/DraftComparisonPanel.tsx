import type {
  CompetitiveEnemyTeam,
  DraftTeam,
  GameDifficulty,
  TeamIdentity,
} from "../types/game";

type DraftComparisonPanelProps = {
  userTeam: DraftTeam;
  userIdentity: TeamIdentity;
  enemy: CompetitiveEnemyTeam;
  difficulty: GameDifficulty;
};

export function DraftComparisonPanel({
  userTeam,
  userIdentity,
  enemy,
  difficulty,
}: DraftComparisonPanelProps) {
  return (
    <section className="draft-comparison">
      <div className="draft-comparison__heading">
        <div>
          <p className="eyebrow">
            {difficulty === "Classic"
              ? "LEITURA ESTRATÉGICA"
              : "DRAFTS DA PARTIDA"}
          </p>
          <h2>Comparação dos drafts</h2>
        </div>
      </div>

      <div className="draft-comparison__body panel">
        <div className="draft-comparison__teams">
          <strong>Seu Draft</strong>
          <strong>{enemy.name}</strong>
        </div>

        <div className="draft-comparison__rows">
          {userTeam.map((userBuild) => {
            const enemyBuild = enemy.simulatedDraft.find(
              (build) => build.role === userBuild.role,
            );

            return (
              <article key={userBuild.role}>
                <div className="draft-comparison__pick draft-comparison__pick--user">
                  <img src={userBuild.champion.image} alt="" />
                  <div>
                    <span>{userBuild.role}</span>
                    <strong>{userBuild.champion.name}</strong>
                    {difficulty === "Classic" ? (
                      <small>{userBuild.champion.damageProfile}</small>
                    ) : null}
                  </div>
                </div>

                <span className="draft-comparison__versus">VS</span>

                {enemyBuild ? (
                  <div className="draft-comparison__pick draft-comparison__pick--enemy">
                    <div>
                      <span>{enemyBuild.role}</span>
                      <strong>{enemyBuild.champion.name}</strong>
                      {difficulty === "Classic" ? (
                        <small>{enemyBuild.champion.damageProfile}</small>
                      ) : null}
                    </div>
                    <img src={enemyBuild.champion.image} alt="" />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {difficulty === "Classic" ? (
          <div className="draft-comparison__plans">
            <div className="draft-comparison__plan">
              <span>Seu plano</span>
              <strong>{userIdentity.displayName}</strong>
              {userIdentity.regionalCombo ? (
                <div className="draft-comparison__regional">
                  <span>
                    {userIdentity.regionalCombo.status === "Thematic"
                      ? "Tema regional"
                      : "Região ativa"}
                  </span>
                  <strong>{userIdentity.regionalCombo.name}</strong>
                  <small>
                    {userIdentity.regionalCombo.identityTags
                      .slice(0, 3)
                      .join(" • ")}
                  </small>
                </div>
              ) : null}
            </div>
            <div className="draft-comparison__plan">
              <span>Plano adversário</span>
              <strong>{enemy.winCondition}</strong>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
