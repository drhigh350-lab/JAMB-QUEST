import { describe, expect, it } from "vitest";
import { naturalExplanationReasons } from "./explanationStyle";

describe("natural explanation style gate", () => {
  it("rejects label-led and repetitive generated explanation prose", () => {
    const repetitive = "Concept: Glucose is fermented by yeast in the absence of oxygen to form ethanol. Glucose is fermented by yeast in the absence of oxygen to form ethanol. This process also releases carbon dioxide.";
    expect(naturalExplanationReasons(repetitive)).toEqual(expect.arrayContaining(["template label", "duplicated sentence", "repeated sentence stem"]));
  });

  it("accepts a compact authentic teaching paragraph", () => {
    const authentic = "Aqua regia contains three volumes of concentrated hydrochloric acid and one volume of nitric acid. Nitric acid oxidises the metal while chloride ions stabilise it in solution, so the mixture can dissolve gold even though either acid alone cannot.";
    expect(naturalExplanationReasons(authentic)).toEqual([]);
  });
});
