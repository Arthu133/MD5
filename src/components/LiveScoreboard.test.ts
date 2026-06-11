import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LiveMatchSimulation, LiveMatchStats, MatchSide } from "../types/game";
import { LiveScoreboard } from "./LiveScoreboard";

const simulation = {
  gameLabel: "Jogo 1",
  userTeamName: "MD5",
  enemyTier: "Elite",
  enemyName: "Adversario",
} as LiveMatchSimulation;

const stats = {
  minute: 32,
  userKills: 18,
  enemyKills: 12,
  userGold: 58_000,
  enemyGold: 53_000,
} as LiveMatchStats;

const renderScoreboard = (result?: MatchSide) =>
  renderToStaticMarkup(
    createElement(LiveScoreboard, { simulation, stats, result }),
  );

describe("LiveScoreboard result feedback", () => {
  it("does not highlight a match still in progress", () => {
    const markup = renderScoreboard();

    expect(markup).not.toContain("live-scoreboard--victory");
    expect(markup).not.toContain("live-scoreboard--defeat");
  });

  it("highlights a finished victory", () => {
    expect(renderScoreboard("User")).toContain("live-scoreboard--victory");
  });

  it("highlights a finished defeat", () => {
    expect(renderScoreboard("Enemy")).toContain("live-scoreboard--defeat");
  });
});
