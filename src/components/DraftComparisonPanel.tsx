import type {
  CompetitiveEnemyTeam,
  DraftTeam,
  GameDifficulty,
  TeamArchetype,
} from "../types/game";

type DraftComparisonPanelProps = {
  userTeam: DraftTeam;
  userArchetype: TeamArchetype;
  enemy: CompetitiveEnemyTeam;
  difficulty: GameDifficulty;
};

export function DraftComparisonPanel({
  userTeam,
  userArchetype,
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
        {difficulty === "Classic" ? (
          <span>
            {userArchetype} × {enemy.archetype}
          </span>
        ) : null}
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
          <div className="draft-comparison__plan">
            <span>Plano adversário</span>
            <strong>{enemy.winCondition}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}
