import assert from "node:assert/strict";
import test from "node:test";
import { extractDomainEntities } from "./domain-extraction.service.js";
import { deduplicateExtractedEntities } from "./entity-deduplication.service.js";
import { normalizeEntityValue } from "./entity-normalization.service.js";
import { prepareEntityDocuments } from "./entity-persistence-preparation.service.js";

test("normalizes person names without changing the evidence value", () => {
  assert.equal(normalizeEntityValue(" RAKESH   KUMAR ", "PERSON"), "rakesh kumar");
  assert.equal(normalizeEntityValue("Rakesh Kumar", "PERSON"), "rakesh kumar");
});

test("normalizes common Indian phone representations", () => {
  const representations = [
    "+91 98765 43210",
    "+91-98765-43210",
    "98765-43210",
    "91 98765 43210",
  ];

  for (const value of representations) {
    assert.equal(normalizeEntityValue(value, "PHONE"), "+919876543210");
  }
});

test("normalizes Indian vehicle registrations", () => {
  for (const value of ["UP-14 AB 1234", "UP 14 AB 1234", "UP14AB1234"]) {
    assert.equal(normalizeEntityValue(value, "VEHICLE"), "UP14AB1234");
  }
});

test("normalizes FIR identifiers with or without a prefix", () => {
  for (const value of ["FIR No. 123/2026", "FIR-123/2026", "123/2026"]) {
    assert.equal(normalizeEntityValue(value, "FIR"), "fir-123/2026");
  }
});

test("normalizes locations conservatively and removes safe OCR noise", () => {
  assert.equal(
    normalizeEntityValue(" Meerut | Uttar   Pradesh. ", "LOCATION"),
    "meerut uttar pradesh",
  );
});

test("persistence preparation retains raw values and provenance", () => {
  const originalValue = "RAKESH   KUMAR";
  const [document] = prepareEntityDocuments({
    entities: [
      {
        entity_type: "PERSON",
        value: originalValue,
        confidence: 0.87,
        char_offset: 41,
        extractionSources: ["NER"],
      },
    ],
    sourceDocumentId: "synthetic-fir-document-id",
    pageNumber: 3,
  });

  assert.equal(document?.value, originalValue);
  assert.equal(document?.normalizedValue, "rakesh kumar");
  assert.equal(document?.sourceDocumentId, "synthetic-fir-document-id");
  assert.equal(document?.pageNumber, 3);
  assert.equal(document?.charOffset, 41);
  assert.deepEqual(document?.originalValues, [originalValue]);
  assert.deepEqual(document?.extractionSources, ["NER"]);
});

test("extracts fictional FIR, vehicle, and phone domain entities", () => {
  const text =
    "FIR No. 123/2026 records UP-14 AB 1234. Contact: +91 98765 43210.";
  const entities = extractDomainEntities(text);

  assert.deepEqual(
    entities.map((entity) => [
      entity.entity_type,
      normalizeEntityValue(entity.value, entity.entity_type),
    ]),
    [
      ["PHONE", "+919876543210"],
      ["VEHICLE", "UP14AB1234"],
      ["FIR", "fir-123/2026"],
    ],
  );

  const fir = entities.find((entity) => entity.entity_type === "FIR");
  assert.deepEqual(fir?.extractionSources, ["REGEX"]);
  assert.deepEqual(fir?.originalValues, ["FIR No. 123/2026", "123/2026"]);
});

test("merges overlapping NER and regex detections while retaining both sources", () => {
  const entities = deduplicateExtractedEntities([
    {
      entity_type: "PHONE",
      value: "+91 98765 43210",
      confidence: 0.74,
      char_offset: 12,
      extractionSources: ["NER"],
    },
    {
      entity_type: "PHONE",
      value: "+91 98765 43210",
      confidence: 0.99,
      char_offset: 12,
      extractionSources: ["REGEX"],
    },
  ]);

  assert.equal(entities.length, 1);
  assert.deepEqual(entities[0]?.extractionSources, ["NER", "REGEX"]);
  assert.deepEqual(entities[0]?.originalValues, ["+91 98765 43210"]);
  assert.equal(entities[0]?.confidence, 0.99);
});

test("keeps separate occurrences as separate provenance records", () => {
  const entities = deduplicateExtractedEntities([
    {
      entity_type: "PHONE",
      value: "98765-43210",
      confidence: 0.99,
      char_offset: 10,
      extractionSources: ["REGEX"],
    },
    {
      entity_type: "PHONE",
      value: "+91 98765 43210",
      confidence: 0.99,
      char_offset: 70,
      extractionSources: ["REGEX"],
    },
  ]);

  assert.equal(entities.length, 2);
});

test("rejects invalid structured values and ignores empty input", () => {
  assert.equal(normalizeEntityValue("", "PERSON"), "");
  assert.equal(normalizeEntityValue("12345", "PHONE"), "");
  assert.equal(normalizeEntityValue("ABCD", "VEHICLE"), "");
  assert.deepEqual(extractDomainEntities("Contact: 12345"), []);
});

test("handles harmless OCR separators in structured values", () => {
  assert.equal(
    normalizeEntityValue("+91 | 98765 43210", "PHONE"),
    "+919876543210",
  );
  assert.equal(
    normalizeEntityValue("UP-14 | AB 1234", "VEHICLE"),
    "UP14AB1234",
  );
});
