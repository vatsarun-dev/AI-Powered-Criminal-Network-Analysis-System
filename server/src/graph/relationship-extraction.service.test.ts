import assert from "node:assert/strict";
import test from "node:test";

import { cleanOCRText } from "../service/ocr-cleanup.service.js";
import { deduplicateExtractedEntities } from "../service/entity-deduplication.service.js";
import { extractDomainEntities } from "../service/domain-extraction.service.js";
import { prepareEntityDocuments } from "../service/entity-persistence-preparation.service.js";
import type { ExtractedEntity, EntityType } from "../types/entity.js";
import { resolvePersonAgainstCandidates } from "./entityResolution.service.js";
import {
  RELATIONSHIP_MODEL_VERSION,
  extractEvidenceBackedRelationships,
  type RelationshipExtractionEntity,
} from "./relationship-extraction.service.js";

const syntheticDocumentId = "507f1f77bcf86cd799439011";

const entityAt = (
  text: string,
  value: string,
  entityType: EntityType,
  occurrence = 0,
): RelationshipExtractionEntity => {
  let offset = -1;
  for (let index = 0; index <= occurrence; index += 1) {
    offset = text.indexOf(value, offset + 1);
  }
  if (offset < 0) throw new Error(`Missing synthetic entity: ${value}`);

  return {
    id: `synthetic-${entityType.toLowerCase()}-${offset}`,
    entityType,
    value,
    normalizedValue: value.toLowerCase(),
    confidence: 0.96,
    charOffset: offset,
  };
};

test("extracts the requested evidence-backed relationship types", () => {
  const text = [
    "Vikram Gowda was named as an accused in Case 123 registered at Vidyanagar Police Station on Date: 12/06/2026.",
    "Rahul Verma is a victim in Case 123.",
    "Case 123 was classified as Crime Category: Theft.",
    "Case 123 is heard in District Court.",
    "Case 123 occurred at Civil Lines.",
    "Vikram Gowda uses phone +91 98765 43210.",
    "Vikram Gowda owns vehicle UP-14 AB 1234.",
    "Vikram Gowda is associated with Rahul Verma.",
    "Vikram Gowda was seen with device IMEI123456789012.",
    "Account ACCT100001 was transferred to Account ACCT100002.",
  ].join("\n");

  const entities = [
    entityAt(text, "Vikram Gowda", "PERSON", 0),
    entityAt(text, "Case 123", "CASE", 0),
    entityAt(text, "Vidyanagar Police Station", "POLICE_STATION"),
    entityAt(text, "Rahul Verma", "PERSON", 0),
    entityAt(text, "Case 123", "CASE", 1),
    entityAt(text, "Case 123", "CASE", 2),
    entityAt(text, "Theft", "CRIME_CATEGORY"),
    entityAt(text, "Case 123", "CASE", 3),
    entityAt(text, "District Court", "COURT"),
    entityAt(text, "Case 123", "CASE", 4),
    entityAt(text, "Civil Lines", "LOCATION"),
    entityAt(text, "Vikram Gowda", "PERSON", 1),
    entityAt(text, "+91 98765 43210", "PHONE"),
    entityAt(text, "Vikram Gowda", "PERSON", 2),
    entityAt(text, "UP-14 AB 1234", "VEHICLE"),
    entityAt(text, "Vikram Gowda", "PERSON", 3),
    entityAt(text, "Rahul Verma", "PERSON", 1),
    entityAt(text, "Vikram Gowda", "PERSON", 4),
    entityAt(text, "IMEI123456789012", "DEVICE"),
    entityAt(text, "ACCT100001", "ACCOUNT"),
    entityAt(text, "ACCT100002", "ACCOUNT"),
  ];

  const relationships = extractEvidenceBackedRelationships({
    text,
    sourceDocumentId: syntheticDocumentId,
    pageNumber: 2,
    entities,
  });
  const relationshipTypes = relationships.map(
    (relationship) => relationship.relationshipType,
  );

  assert.deepEqual(relationshipTypes, [
    "ACCUSED_IN",
    "REGISTERED_AT",
    "VICTIM_IN",
    "CLASSIFIED_AS",
    "HEARD_IN",
    "OCCURRED_AT",
    "USES",
    "OWNS",
    "ASSOCIATED_WITH",
    "SEEN_WITH",
    "TRANSFERRED_TO",
  ]);

  const accused = relationships[0];
  const firstPerson = entities.find(
    (entity) => entity.entityType === "PERSON" && entity.charOffset === 0,
  );
  const firstCase = entities.find(
    (entity) => entity.entityType === "CASE" && entity.charOffset > 0,
  );
  assert.ok(firstPerson);
  assert.ok(firstCase);
  assert.equal(accused?.sourceDocumentId, syntheticDocumentId);
  assert.equal(accused?.pageNumber, 2);
  assert.equal(accused?.modelVersion, RELATIONSHIP_MODEL_VERSION);
  assert.equal(accused?.timestamp, "2026-06-12T00:00:00.000Z");
  assert.deepEqual(accused?.sourceEntityIds, [
    firstPerson.id,
    firstCase.id,
  ]);
  assert.match(accused?.extractedEvidence ?? "", /named as an accused/i);
  assert.ok((accused?.confidence ?? 0) >= 0.94);
});

test("does not infer relationships from entity co-occurrence", () => {
  const text = "Vikram Gowda, Case 123, and Vidyanagar Police Station are listed in a record.";
  const relationships = extractEvidenceBackedRelationships({
    text,
    sourceDocumentId: syntheticDocumentId,
    pageNumber: 1,
    entities: [
      entityAt(text, "Vikram Gowda", "PERSON"),
      entityAt(text, "Case 123", "CASE"),
      entityAt(text, "Vidyanagar Police Station", "POLICE_STATION"),
    ],
  });

  assert.deepEqual(relationships, []);
});

test("does not create cross-pair relationships from multiple typed entities", () => {
  const text =
    "Asha Singh was named as an accused in Case 123; Rahul Verma is mentioned in Case 456.";
  const asha = entityAt(text, "Asha Singh", "PERSON");
  const firstCase = entityAt(text, "Case 123", "CASE");
  const rahul = entityAt(text, "Rahul Verma", "PERSON");
  const secondCase = entityAt(text, "Case 456", "CASE");

  const relationships = extractEvidenceBackedRelationships({
    text,
    sourceDocumentId: syntheticDocumentId,
    pageNumber: 1,
    entities: [asha, firstCase, rahul, secondCase],
  });

  assert.deepEqual(
    relationships.map((relationship) => ({
      relationshipType: relationship.relationshipType,
      fromEntityId: relationship.fromEntityId,
      toEntityId: relationship.toEntityId,
    })),
    [
      {
        relationshipType: "ACCUSED_IN",
        fromEntityId: asha.id,
        toEntityId: firstCase.id,
      },
    ],
  );
});

test("runs synthetic FIR OCR-output through NER/regex, normalization, resolution, and relationship extraction", () => {
  // This is fictional text emitted by the OCR stage; it avoids real personal data.
  const ocrOutput =
    "Vikram Gowda was named as an accused in Case 123 registered at Vidyanagar Police Station. Contact: +91 98765 43210.";
  const cleanedText = cleanOCRText(ocrOutput);
  const syntheticNerEntities: ExtractedEntity[] = [
    {
      entity_type: "PERSON",
      value: "Vikram Gowda",
      confidence: 0.96,
      char_offset: cleanedText.indexOf("Vikram Gowda"),
      extractionSources: ["NER"],
    },
  ];
  const extractedEntities = deduplicateExtractedEntities([
    ...syntheticNerEntities,
    ...extractDomainEntities(cleanedText),
  ]);
  const documents = prepareEntityDocuments({
    entities: extractedEntities,
    sourceDocumentId: syntheticDocumentId,
    pageNumber: 1,
  });
  const graphEntities: RelationshipExtractionEntity[] = documents.map(
    (document, index) => ({
      id: `synthetic-pipeline-${index}`,
      entityType: document.entityType,
      value: document.value,
      normalizedValue: document.normalizedValue,
      confidence: document.confidence,
      charOffset: document.charOffset,
    }),
  );
  const person = graphEntities.find((entity) => entity.entityType === "PERSON");
  assert.ok(person);

  // Phase 2's exact stable-ID decision leaves the original source entity ID
  // intact, which is what the relationship evidence uses as provenance.
  const resolution = resolvePersonAgainstCandidates(
    { personId: person.id, sourceEntityIds: [person.id] },
    [
      {
        id: person.id,
        name: person.value,
        normalizedName: person.normalizedValue,
        sourceEntityIds: [person.id],
      },
    ],
  );
  assert.equal(resolution.status, "MATCHED");
  assert.equal(person.value, "Vikram Gowda");
  assert.equal(person.normalizedValue, "vikram gowda");

  const relationships = extractEvidenceBackedRelationships({
    text: cleanedText,
    sourceDocumentId: syntheticDocumentId,
    pageNumber: 1,
    entities: graphEntities,
  });

  assert.deepEqual(
    relationships.map((relationship) => relationship.relationshipType),
    ["ACCUSED_IN", "REGISTERED_AT"],
  );
  assert.ok(
    relationships.every((relationship) =>
      relationship.sourceEntityIds.every((id) =>
        graphEntities.some((entity) => entity.id === id),
      ),
    ),
  );
});
