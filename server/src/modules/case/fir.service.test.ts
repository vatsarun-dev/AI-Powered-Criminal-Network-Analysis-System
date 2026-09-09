import assert from "node:assert/strict";
import test from "node:test";

import type { FirMongoDocument } from "../../models/fir.model.js";
import { NotFoundError } from "../../shared/error/globalError.js";
import FirService from "./fir.service.js";
import {
  parseFirCreateInput,
  parseFirListFilter,
  parseFirUpdateInput,
} from "./fir.validation.js";

type StoredFir = FirMongoDocument & {
  _id: { toString(): string };
};

const createInput = () =>
  parseFirCreateInput({
    firNumber: "9401",
    year: 2026,
    registrationDate: "2026-09-09T10:00:00.000Z",
    incidentDate: "2026-09-08T22:30:00.000Z",
    district: "Synthetic District",
    policeStation: "Synthetic Police Station",
    crimeCategory: "Synthetic Theft",
    sections: ["379 IPC", "34 IPC"],
    description: "Synthetic FIR used only to test management CRUD.",
    complainant: { name: "Complainant One", phone: "+919876543210" },
    victims: [{ name: "Victim One" }],
    accused: [{ name: "Accused One", identifier: "SYN-ACC-1" }],
    investigatingOfficer: { name: "Officer One", badgeNumber: "SYN-42" },
    court: "Synthetic District Court",
  });

const toStoredFir = (input: ReturnType<typeof createInput>): StoredFir => {
  // The isolated CRUD fixture deliberately has no linked File ObjectId.
  const { sourceDocument: _sourceDocument, ...documentInput } = input;
  void _sourceDocument;
  return {
    _id: { toString: () => "synthetic-fir-record-id" },
    ...documentInput,
    createdAt: new Date("2026-09-09T10:01:00.000Z"),
    updatedAt: new Date("2026-09-09T10:01:00.000Z"),
  };
};

test("creates, lists, reads, updates, and deletes a Mongo FIR record", async () => {
  let stored: StoredFir | null = null;
  const model = {
    create: async (input: ReturnType<typeof createInput>) => {
      stored = toStoredFir(input);
      return { toObject: () => stored };
    },
    find: () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({ lean: async () => (stored ? [stored] : []) }),
        }),
      }),
    }),
    countDocuments: async () => (stored ? 1 : 0),
    findById: () => ({ lean: async () => stored }),
    findByIdAndUpdate: (
      _id: string,
      update: { $set?: Record<string, unknown>; $unset?: Record<string, ""> },
    ) => ({
      lean: async () => {
        if (!stored) return null;
        Object.assign(stored, update.$set ?? {});
        for (const key of Object.keys(update.$unset ?? {})) {
          delete (stored as Record<string, unknown>)[key];
        }
        stored.updatedAt = new Date("2026-09-09T10:02:00.000Z");
        return stored;
      },
    }),
    findByIdAndDelete: () => ({
      lean: async () => {
        const deleted = stored;
        stored = null;
        return deleted;
      },
    }),
  };
  const service = new FirService({ firModel: model as unknown as never });

  const created = await service.create(createInput());
  assert.equal(created.id, "synthetic-fir-record-id");
  assert.equal(created.firNumber, "9401");
  assert.equal(created.status, "REGISTERED");

  const listed = await service.list(parseFirListFilter({ q: "synthetic", page: "1", limit: "10" }));
  assert.equal(listed.total, 1);
  assert.equal(listed.items[0]?.id, created.id);

  const fetched = await service.findById(created.id);
  assert.equal(fetched.complainant.name, "Complainant One");

  const updated = await service.update(
    created.id,
    parseFirUpdateInput({ status: "UNDER_INVESTIGATION", court: null }),
  );
  assert.equal(updated.status, "UNDER_INVESTIGATION");
  assert.equal(updated.court, undefined);

  const deleted = await service.delete(created.id);
  assert.equal(deleted.id, created.id);
  await assert.rejects(
    service.findById(created.id),
    (error: unknown) => error instanceof NotFoundError,
  );
});

test("rejects invalid FIR payloads and unsafe list filters", () => {
  assert.throws(
    () => parseFirCreateInput({ ...createInput(), incidentDate: "2026-09-10" }),
    /incidentDate cannot be after registrationDate/,
  );
  assert.throws(
    () => parseFirUpdateInput({ unsupportedField: true }),
    /Unsupported FIR fields/,
  );
  assert.throws(
    () => parseFirListFilter({ status: "INVALID" }),
    /status must be one of/,
  );
});
