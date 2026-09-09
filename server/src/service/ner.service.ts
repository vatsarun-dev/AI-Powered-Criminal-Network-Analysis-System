import { pipeline } from "@huggingface/transformers";
import {
  isOCRFieldLabel,
  removeOCRFieldLabelPrefix,
} from "./ocr-cleanup.service.js";
import { applyEntityContextRules } from "./ner-context.service.js";
import type { EntityType, ExtractedEntity } from "../types/entity.js";

export type NERResult = ExtractedEntity;

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

const MIN_ENTITY_CONFIDENCE = 0.65;

const LOWERCASE_CONNECTOR_TOKENS = new Set([
  "of",
  "the",
  "and",
  "in",
  "at",
  "on",
  "de",
  "la",
  "di",
  "da",
  "bin",
  "ibn",
]);

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

    /*
     * An orphaned WordPiece has no reliable beginning to reconstruct.
     * Keeping it would persist a truncated value such as "ress Civil Lines".
     */
    if (entity.word.startsWith("##")) {
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

const isWordCharacter = (character: string | undefined): boolean => {
  return Boolean(character && /[\p{L}\p{N}]/u.test(character));
};

const completePartialWord = (
  line: string,
  value: string,
  offset: number,
): string => {
  let start = offset;
  let end = offset + value.length;

  if (!isWordCharacter(value[0]) || !isWordCharacter(value.at(-1))) {
    return value;
  }

  while (start > 0 && isWordCharacter(line[start - 1])) {
    start--;
  }

  while (end < line.length && isWordCharacter(line[end])) {
    end++;
  }

  return line.slice(start, end);
};

const hasUnexpectedShortLowercaseToken = (value: string): boolean => {
  const tokens = value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  return (
    tokens.length > 1 &&
    tokens.some(
      (token) =>
        token.length <= 2 &&
        token === token.toLowerCase() &&
        !LOWERCASE_CONNECTOR_TOKENS.has(token),
    )
  );
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

      let value = cleanValue(entity.word);

      if (!value || entity.score < MIN_ENTITY_CONFIDENCE) {
        continue;
      }

      let charOffset = lineOffset;

      /**
       * Transformers.js may provide character offsets.
       */
      if (typeof entity.start === "number") {
        charOffset = lineOffset + entity.start;
        value = completePartialWord(trimmedLine, value, entity.start);
      } else {
        /**
         * Fallback: find the entity inside the original line.
         */
        const localOffset = trimmedLine
          .toLowerCase()
          .indexOf(value.toLowerCase());

        if (localOffset === -1) {
          continue;
        }

        charOffset = lineOffset + localOffset;
        value = completePartialWord(trimmedLine, value, localOffset);
      }

      const valueWithoutFieldLabel = removeOCRFieldLabelPrefix(value);
      charOffset += value.length - valueWithoutFieldLabel.length;
      value = valueWithoutFieldLabel;

      if (
        !value ||
        isOCRFieldLabel(value) ||
        hasUnexpectedShortLowercaseToken(value)
      ) {
        continue;
      }

      finalEntities.push({
        entity_type: entityType,
        value,
        confidence: entity.score,
        char_offset: charOffset,
        extractionSources: ["NER"],
        originalValues: [value],
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
