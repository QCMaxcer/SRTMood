import { describe, expect, it } from "vitest";
import { DEFAULT_EMOTIONS, swapEmotions } from "./emotions";

describe("swapEmotions", () => {
  it("swaps two emotion cards", () => {
    const emotions = DEFAULT_EMOTIONS.slice(0, 3);
    const result = swapEmotions(emotions, "happy_sneaky", "surprise");

    expect(result.map((emotion) => emotion.id)).toEqual([
      "surprise",
      "laughable",
      "happy_sneaky",
    ]);
  });

  it("keeps the original order when ids are missing or equal", () => {
    const emotions = DEFAULT_EMOTIONS.slice(0, 3);

    expect(
      swapEmotions(emotions, "happy_sneaky", "happy_sneaky"),
    ).toBe(emotions);
    expect(swapEmotions(emotions, "missing", "happy_sneaky")).toBe(emotions);
  });
});
