import { describe, expect, it } from "vitest";
import { finalRanks, getRankForPoints } from "./finalScore";

describe("final rank system", () => {
  it("covers the complete 0 to 10000 range", () => {
    expect(finalRanks[0].name).toBe("Ferro IV");
    expect(finalRanks.at(-1)?.name).toBe("Desafiante");
    expect(getRankForPoints(0).name).toBe("Ferro IV");
    expect(getRankForPoints(6999).name).toBe("Diamante I");
    expect(getRankForPoints(7000).name).toBe("Mestre");
    expect(getRankForPoints(8000).name).toBe("Grão-Mestre");
    expect(getRankForPoints(9000).name).toBe("Desafiante");
    expect(getRankForPoints(12000).name).toBe("Desafiante");
  });
});
