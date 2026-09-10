import assert from "node:assert/strict";
import test from "node:test";

import { parseCsv } from "./telecom-ingestion.service.js";

test("parses quoted CDR rows and normalizes CSV headers", () => {
  const rows = parseCsv([
    "Calling Number,Called Number,Call Time,Cell Tower",
    '9876543210,"91234,56789",2026-01-10T10:30:00Z,"Tower, North"',
  ].join("\n"));

  assert.deepEqual(rows, [{
    callingnumber: "9876543210",
    callednumber: "91234,56789",
    calltime: "2026-01-10T10:30:00Z",
    celltower: "Tower, North",
  }]);
});

test("rejects malformed or header-only telecom CSV input", () => {
  assert.throws(() => parseCsv("source,destination\n\"unterminated"));
  assert.throws(() => parseCsv("source,destination\n"));
});
