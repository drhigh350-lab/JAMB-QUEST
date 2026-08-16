import { describe, expect, it } from "vitest";
import { OFFICIAL_SYLLABUS_AREAS, type SyllabusSubject } from "@shared/syllabusTopicMap";
import { getSyllabusParentGroups, getSyllabusParentLabel } from "@shared/syllabusTopicGroups";

describe("syllabus parent sections", () => {
  it.each(Object.keys(OFFICIAL_SYLLABUS_AREAS) as SyllabusSubject[]) ("covers every official %s topic exactly once", (subject) => {
    const groups = getSyllabusParentGroups(subject);
    const flattened = groups.flatMap((group) => group.topics);
    expect(new Set(flattened).size).toBe(flattened.length);
    expect(new Set(flattened)).toEqual(new Set(OFFICIAL_SYLLABUS_AREAS[subject]));
    expect(groups.every((group) => group.label && group.topics.length > 0)).toBe(true);
  });

  it("returns a parent label without changing the exact drill topic", () => {
    expect(getSyllabusParentLabel("Chemistry", "Organic compounds")).toBe("Elements, compounds and applications");
    expect(getSyllabusParentLabel("Physics", "Motion")).toBe("Mechanics and properties of matter");
  });
});
