import type { NERResult } from "./ner.service.js";

const LOCATION_CONTEXT = [
  "address",
  "location",
  "residence",
  "residential address",
  "place",
  "village",
  "city",
  "district",
  "state",
  "police station",
  "ps",
  "near",
];

const ORGANIZATION_CONTEXT = [
  "organization",
  "organisation",
  "company",
  "bank",
  "hospital",
  "school",
  "college",
  "department",
  "station",
  "agency",
];

const PERSON_CONTEXT = [
  "name",
  "father's name",
  "father name",
  "mother's name",
  "son of",
  "daughter of",
  "complainant",
  "accused",
  "victim",
  "witness",
];

const hasContext = (line: string, contexts: string[]): boolean => {
  const normalizedLine = line.toLowerCase();

  return contexts.some((context) => normalizedLine.includes(context));
};

export const applyEntityContextRules = (
  text: string,
  entities: NERResult[],
): NERResult[] => {
  return entities.map((entity) => {
    const lineStart = text.lastIndexOf("\n", entity.char_offset) + 1;

    const lineEnd = text.indexOf("\n", entity.char_offset);

    const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;

    const line = text.slice(lineStart, actualLineEnd);

    /*
     * Location context has highest priority for
     * address/location related FIR fields.
     */
    if (hasContext(line, LOCATION_CONTEXT) && entity.entity_type !== "PERSON") {
      return {
        ...entity,
        entity_type: "LOCATION",
      };
    }

    /*
     * Organization context.
     */
    if (
      hasContext(line, ORGANIZATION_CONTEXT) &&
      entity.entity_type !== "PERSON"
    ) {
      return {
        ...entity,
        entity_type: "ORGANIZATION",
      };
    }

    /*
     * Person context.
     */
    if (hasContext(line, PERSON_CONTEXT)) {
      return {
        ...entity,
        entity_type: "PERSON",
      };
    }

    return entity;
  });
};
