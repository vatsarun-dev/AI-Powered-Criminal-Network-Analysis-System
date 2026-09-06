import { pipeline } from "@huggingface/transformers";
import { applyEntityContextRules } from "./ner-context.service.ts";

type EntityType = "PERSON" | "LOCATION" | "ORGANIZATION";

export type NERResult = {
  entity_type: EntityType;
  value: string;
  confidence: number;
  char_offset: number;
};

type RawEntity = {
  entity_group?: string;
  entity?: string;
  score: number;
  word: string;
  start?: number;
  end?: number;
};

const ENTITY_MAP: Record<string, EntityType> = {
  PER: "PERSON",
  LOC: "LOCATION",
  ORG: "ORGANIZATION",
};

let nerPipeline: any = null;

const getNERPipeline = async () => {
  if (!nerPipeline) {
    nerPipeline = await pipeline(
      "token-classification",
      "Xenova/bert-base-NER",
    );
  }

  return nerPipeline;
};

const normalizeEntityType = (label: string | undefined): EntityType | null => {
  if (!label) {
    return null;
  }

  const cleanLabel = label.replace(/^[BI]-/, "");

  return ENTITY_MAP[cleanLabel] ?? null;
};

/**
 * Merge WordPiece subwords returned by the model.
 *
 * Example:
 *
 * Ra
 * ##kes
 * ##h Kumar
 *
 * becomes:
 *
 * Rakesh Kumar
 */
const mergeSubwords = (entities: RawEntity[]): RawEntity[] => {
  const merged: RawEntity[] = [];

  for (const entity of entities) {
    const last = merged[merged.length - 1];

    /**
     * If this token starts with ##, it belongs to
     * the previous token/entity.
     */
    if (
      last &&
      entity.word.startsWith("##") &&
      last.entity_group === entity.entity_group
    ) {
      last.word += entity.word.slice(2);

      /**
       * Keep the average confidence of the merged tokens.
       */
      last.score = (last.score + entity.score) / 2;

      if (typeof entity.end === "number") {
        last.end = entity.end;
      }

      continue;
    }

    merged.push({
      ...entity,
    });
  }

  return merged;
};

const cleanValue = (value: string): string => {
  return value.replace(/##/g, "").replace(/\s+/g, " ").trim();
};

export const extractNamedEntities = async (
  text: string,
): Promise<NERResult[]> => {
  if (!text.trim()) {
    return [];
  }

  const ner = await getNERPipeline();

  const finalEntities: NERResult[] = [];

  /**
   * Process logical lines separately.
   *
   * This prevents unrelated FIR fields from being
   * merged together.
   */
  const lines = text.split("\n");

  let globalOffset = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      globalOffset += line.length + 1;
      continue;
    }

    const lineOffset = text.indexOf(trimmedLine, globalOffset);

    const rawResult = (await ner(trimmedLine, {
      aggregation_strategy: "simple",
    })) as RawEntity[];

    console.log(`\nNER INPUT: ${trimmedLine}`);

    console.log("RAW NER RESULT:", JSON.stringify(rawResult, null, 2));

    /**
     * Fix WordPiece tokenization.
     */
    const mergedEntities = mergeSubwords(rawResult);

    console.log("MERGED NER RESULT:", JSON.stringify(mergedEntities, null, 2));

    for (const entity of mergedEntities) {
      const entityType = normalizeEntityType(
        entity.entity_group ?? entity.entity,
      );

      if (!entityType) {
        continue;
      }

      const value = cleanValue(entity.word);

      if (!value) {
        continue;
      }

      let charOffset = lineOffset;

      /**
       * Transformers.js may provide character offsets.
       */
      if (typeof entity.start === "number") {
        charOffset = lineOffset + entity.start;
      } else {
        /**
         * Fallback: find the entity inside the original line.
         */
        const localOffset = trimmedLine
          .toLowerCase()
          .indexOf(value.toLowerCase());

        if (localOffset !== -1) {
          charOffset = lineOffset + localOffset;
        }
      }

      finalEntities.push({
        entity_type: entityType,
        value,
        confidence: entity.score,
        char_offset: charOffset,
      });
    }

    globalOffset = lineOffset + trimmedLine.length;
  }

  /**
   * Apply FIR/domain context rules after the
   * ML model has extracted the entities.
   *
   * Example:
   *
   * Address: Civil Lines, Meerut
   *
   * ML:
   * Civil Lines -> ORGANIZATION
   * Meerut      -> LOCATION
   *
   * Context rules can correct Civil Lines to LOCATION
   * because it appears inside an Address field.
   */
  const contextualEntities = applyEntityContextRules(text, finalEntities);

  return contextualEntities;
};
