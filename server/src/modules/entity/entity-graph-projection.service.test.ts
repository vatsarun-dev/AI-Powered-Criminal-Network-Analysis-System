import assert from "node:assert/strict";
import test from "node:test";

import { graphNodeIdForEntity } from "./entity-graph-projection.service.js";

const fakeId = (value: string) => ({ toString: () => value });

test("projects exact structured identifiers to one stable graph node", () => {
  const firstPhone = graphNodeIdForEntity({
    _id: fakeId("synthetic-entity-one"),
    entityType: "PHONE",
    normalizedValue: "+919876543210",
  });
  const secondPhone = graphNodeIdForEntity({
    _id: fakeId("synthetic-entity-two"),
    entityType: "PHONE",
    normalizedValue: "+919876543210",
  });
  const caseNode = graphNodeIdForEntity({
    _id: fakeId("synthetic-case-evidence"),
    entityType: "CASE",
    normalizedValue: "case-123",
  });

  assert.equal(firstPhone, "phone:+919876543210");
  assert.equal(secondPhone, firstPhone);
  assert.equal(caseNode, "case:case-123");
});

test("does not merge people merely because their normalized names match", () => {
  const firstPerson = graphNodeIdForEntity({
    _id: fakeId("synthetic-person-evidence-one"),
    entityType: "PERSON",
    normalizedValue: "rakesh kumar",
  });
  const secondPerson = graphNodeIdForEntity({
    _id: fakeId("synthetic-person-evidence-two"),
    entityType: "PERSON",
    normalizedValue: "rakesh kumar",
  });

  assert.equal(firstPerson, "person:synthetic-person-evidence-one");
  assert.equal(secondPerson, "person:synthetic-person-evidence-two");
  assert.notEqual(firstPerson, secondPerson);
});
