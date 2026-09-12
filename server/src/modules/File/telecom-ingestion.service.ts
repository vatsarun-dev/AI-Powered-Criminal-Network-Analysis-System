import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isIP } from "node:net";

import { EntityModel } from "../../models/entity.model.js";
import { RelationshipEvidenceModel } from "../../models/relationship-evidence.model.js";
import { TelecomRecordModel } from "../../models/telecom-record.model.js";
import { getEntityNodeLabel } from "../entity/entity-node-labels.js";
import { syncEntityToGraph } from "../entity/entity-graph.service.js";
import { createNode, createRelationship } from "../graph/graph.service.js";
import type { RelationshipType } from "../graph/graph.constants.js";
import { normalizeEntityValue } from "../../service/entity-normalization.service.js";
import type { EntityType } from "../../types/entity.js";
import { BadRequestError } from "../../shared/error/globalError.js";

const TELECOM_MODEL_VERSION = "telecom-csv-v1";

type CsvRow = Record<string, string>;

type StoredEntity = {
  id: string;
  graphNodeId: string;
  entityType: EntityType;
};

type NormalizedCdrRow = {
  sourcePhone?: string | undefined;
  destinationPhone?: string | undefined;
  device?: string | undefined;
  location?: string | undefined;
  timestamp?: string | undefined;
  duration?: string | undefined;
};

type NormalizedIpdrRow = {
  sourceIp?: string | undefined;
  destinationIp?: string | undefined;
  sourcePort?: string | undefined;
  destinationPort?: string | undefined;
  protocol?: string | undefined;
  account?: string | undefined;
  device?: string | undefined;
  location?: string | undefined;
  timestamp?: string | undefined;
};

const normalizedHeader = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const cleanValue = (value: string | undefined): string | undefined => {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
};

const findValue = (row: CsvRow, aliases: string[]): string | undefined => {
  for (const alias of aliases) {
    const value = row[alias];
    if (value) return value;
  }
  return undefined;
};

const normaliseTimestamp = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? undefined : timestamp.toISOString();
};

/** Parses RFC-4180-style quoted CSV fields without adding a second parser dependency. */
export const parseCsv = (input: string): CsvRow[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    const next = input[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += character;
  }

  if (quoted) throw new BadRequestError("CSV contains an unterminated quoted field");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) throw new BadRequestError("CSV must include a header and at least one data row");

  const headers = rows[0]!.map((header) => normalizedHeader(header.replace(/^\uFEFF/, "")));
  if (headers.some((header) => !header)) throw new BadRequestError("CSV headers cannot be empty");
  if (new Set(headers).size !== headers.length) throw new BadRequestError("CSV headers must be unique after normalization");

  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])));
};

const normaliseCdrRow = (row: CsvRow): NormalizedCdrRow => {
  const sourcePhone = findValue(row, ["sourcephone", "sourcenumber", "callingnumber", "fromnumber", "anumber", "source", "from", "msisdn"]);
  const destinationPhone = findValue(row, ["destinationphone", "destinationnumber", "callednumber", "tonumber", "bnumber", "destination", "to"]);
  const device = findValue(row, ["imei", "device", "deviceid", "handsetid"]);
  const location = findValue(row, ["location", "celltower", "cellid", "tower", "site", "lac"]);
  const timestampInput = findValue(row, ["timestamp", "datetime", "calltime", "calldatetime", "dateandtime", "starttime"]);
  const duration = findValue(row, ["duration", "callduration", "durationseconds"]);

  return {
    ...(cleanValue(sourcePhone) ? { sourcePhone: cleanValue(sourcePhone) } : {}),
    ...(cleanValue(destinationPhone) ? { destinationPhone: cleanValue(destinationPhone) } : {}),
    ...(cleanValue(device) ? { device: cleanValue(device) } : {}),
    ...(cleanValue(location) ? { location: cleanValue(location) } : {}),
    ...(normaliseTimestamp(timestampInput) ? { timestamp: normaliseTimestamp(timestampInput) } : {}),
    ...(cleanValue(duration) ? { duration: cleanValue(duration) } : {}),
  };
};

const normaliseIpdrRow = (row: CsvRow): NormalizedIpdrRow => {
  const sourceIp = findValue(row, ["sourceip", "srcip", "sourceaddress", "srcaddress"]);
  const destinationIp = findValue(row, ["destinationip", "destip", "dstip", "destinationaddress", "dstaddress"]);
  const sourcePort = findValue(row, ["sourceport", "srcport"]);
  const destinationPort = findValue(row, ["destinationport", "destport", "dstport"]);
  const protocol = findValue(row, ["protocol", "ipprotocol"]);
  const account = findValue(row, ["subscriberid", "subscriber", "account", "accountid", "imsi"]);
  const device = findValue(row, ["imei", "device", "deviceid"]);
  const location = findValue(row, ["location", "celltower", "cellid", "tower", "site", "lac"]);
  const timestampInput = findValue(row, ["timestamp", "datetime", "sessiontime", "starttime", "dateandtime"]);

  return {
    ...(sourceIp && isIP(sourceIp.trim()) ? { sourceIp: sourceIp.trim() } : {}),
    ...(destinationIp && isIP(destinationIp.trim()) ? { destinationIp: destinationIp.trim() } : {}),
    ...(cleanValue(sourcePort) ? { sourcePort: cleanValue(sourcePort) } : {}),
    ...(cleanValue(destinationPort) ? { destinationPort: cleanValue(destinationPort) } : {}),
    ...(cleanValue(protocol) ? { protocol: cleanValue(protocol)?.toUpperCase() } : {}),
    ...(cleanValue(account) ? { account: cleanValue(account) } : {}),
    ...(cleanValue(device) ? { device: cleanValue(device) } : {}),
    ...(cleanValue(location) ? { location: cleanValue(location) } : {}),
    ...(normaliseTimestamp(timestampInput) ? { timestamp: normaliseTimestamp(timestampInput) } : {}),
  };
};

const validationErrorsFor = (
  type: "CDR" | "IPDR",
  row: NormalizedCdrRow | NormalizedIpdrRow,
): string[] => {
  if (type === "CDR") {
    const cdr = row as NormalizedCdrRow;
    return cdr.sourcePhone || cdr.destinationPhone ? [] : ["No source or destination phone value was found"];
  }
  const ipdr = row as NormalizedIpdrRow;
  return ipdr.sourceIp || ipdr.destinationIp || ipdr.account || ipdr.device
    ? []
    : ["No supported IPDR identifier was found"];
};

const createStructuredEntity = async (input: {
  entityType: EntityType;
  value: string | undefined;
  sourceDocumentId: string;
  rowNumber: number;
}): Promise<StoredEntity | null> => {
  if (!input.value) return null;
  const normalizedValue = normalizeEntityValue(input.value, input.entityType);
  if (!normalizedValue) return null;

  const entity = await EntityModel.create({
    entityType: input.entityType,
    value: input.value,
    normalizedValue,
    confidence: 1,
    sourceDocumentId: input.sourceDocumentId,
    pageNumber: 1,
    charOffset: input.rowNumber,
    extractionSources: ["STRUCTURED"],
    originalValues: [input.value],
  });
  const projection = await syncEntityToGraph(entity._id.toString());
  return { id: entity._id.toString(), graphNodeId: projection.graphNodeId, entityType: input.entityType };
};

const evidenceIdFor = (
  sourceDocumentId: string,
  rowNumber: number,
  relationshipType: RelationshipType,
  fromEntityId: string,
  toEntityId: string,
): string => createHash("sha256")
  .update([sourceDocumentId, rowNumber, relationshipType, fromEntityId, toEntityId].join("|"))
  .digest("hex");

const persistObservedRelationship = async (input: {
  sourceDocumentId: string;
  rowNumber: number;
  relationshipType: RelationshipType;
  from: StoredEntity;
  to: StoredEntity;
  evidence: string;
  timestamp?: string;
}): Promise<void> => {
  const evidenceId = evidenceIdFor(
    input.sourceDocumentId,
    input.rowNumber,
    input.relationshipType,
    input.from.id,
    input.to.id,
  );
  const fromLabel = getEntityNodeLabel(input.from.entityType);
  const toLabel = getEntityNodeLabel(input.to.entityType);

  await RelationshipEvidenceModel.updateOne(
    { evidenceId },
    {
      $setOnInsert: {
        evidenceId,
        relationshipType: input.relationshipType,
        fromEntityId: input.from.id,
        fromLabel,
        toEntityId: input.to.id,
        toLabel,
        sourceEntityIds: [input.from.id, input.to.id],
        sourceDocumentId: input.sourceDocumentId,
        pageNumber: 1,
        confidence: 1,
        extractedEvidence: input.evidence,
        ...(input.timestamp ? { timestamp: input.timestamp } : {}),
        modelVersion: TELECOM_MODEL_VERSION,
      },
    },
    { upsert: true },
  );

  await createRelationship(fromLabel, input.from.graphNodeId, input.relationshipType, toLabel, input.to.graphNodeId, {
    evidenceId,
    fromEntityId: input.from.id,
    toEntityId: input.to.id,
    fromGraphNodeId: input.from.graphNodeId,
    toGraphNodeId: input.to.graphNodeId,
    sourceDocumentId: input.sourceDocumentId,
    pageNumber: 1,
    confidence: 1,
    extractedEvidence: input.evidence,
    modelVersion: TELECOM_MODEL_VERSION,
    sourceEntityIds: [input.from.id, input.to.id],
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
  });
};

const sourceEvidence = (type: "CDR" | "IPDR", rowNumber: number, rawRecord: CsvRow): string =>
  `${type} CSV row ${rowNumber}: ${JSON.stringify(rawRecord)}`;

const processCdrRow = async (input: {
  sourceDocumentId: string;
  rowNumber: number;
  rawRecord: CsvRow;
  normalizedRecord: NormalizedCdrRow;
}): Promise<void> => {
  const source = await createStructuredEntity({ entityType: "PHONE", value: input.normalizedRecord.sourcePhone, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });
  const destination = await createStructuredEntity({ entityType: "PHONE", value: input.normalizedRecord.destinationPhone, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });
  const device = await createStructuredEntity({ entityType: "DEVICE", value: input.normalizedRecord.device, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });
  const location = await createStructuredEntity({ entityType: "LOCATION", value: input.normalizedRecord.location, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });
  const evidence = sourceEvidence("CDR", input.rowNumber, input.rawRecord);

  if (source && destination) await persistObservedRelationship({ sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber, relationshipType: "CALLED", from: source, to: destination, evidence, ...(input.normalizedRecord.timestamp ? { timestamp: input.normalizedRecord.timestamp } : {}) });
  if (source && device) await persistObservedRelationship({ sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber, relationshipType: "USES", from: source, to: device, evidence, ...(input.normalizedRecord.timestamp ? { timestamp: input.normalizedRecord.timestamp } : {}) });
  if (source && location) await persistObservedRelationship({ sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber, relationshipType: "LOCATED_AT", from: source, to: location, evidence, ...(input.normalizedRecord.timestamp ? { timestamp: input.normalizedRecord.timestamp } : {}) });
};

const processIpdrRow = async (input: {
  sourceDocumentId: string;
  rowNumber: number;
  rawRecord: CsvRow;
  normalizedRecord: NormalizedIpdrRow;
}): Promise<void> => {
  const evidence = sourceEvidence("IPDR", input.rowNumber, input.rawRecord);
  const event = await createStructuredEntity({ entityType: "EVENT", value: `IPDR session ${input.sourceDocumentId}-${input.rowNumber}`, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });
  const account = await createStructuredEntity({ entityType: "ACCOUNT", value: input.normalizedRecord.account, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });
  const device = await createStructuredEntity({ entityType: "DEVICE", value: input.normalizedRecord.device, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });
  const location = await createStructuredEntity({ entityType: "LOCATION", value: input.normalizedRecord.location, sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber });

  if (!event) return;
  await createNode("EVENT", {
    id: event.graphNodeId,
    name: `IPDR session ${input.rowNumber}`,
    event_type: "IPDR_SESSION",
    ...(input.normalizedRecord.sourceIp ? { source_ip: input.normalizedRecord.sourceIp } : {}),
    ...(input.normalizedRecord.destinationIp ? { destination_ip: input.normalizedRecord.destinationIp } : {}),
    ...(input.normalizedRecord.sourcePort ? { source_port: input.normalizedRecord.sourcePort } : {}),
    ...(input.normalizedRecord.destinationPort ? { destination_port: input.normalizedRecord.destinationPort } : {}),
    ...(input.normalizedRecord.protocol ? { protocol: input.normalizedRecord.protocol } : {}),
    ...(input.normalizedRecord.timestamp ? { timestamp: input.normalizedRecord.timestamp } : {}),
  }, { sourceEntityIds: [event.id], sourceDocumentIds: [input.sourceDocumentId], sourceValues: [evidence] });

  if (account) await persistObservedRelationship({ sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber, relationshipType: "PARTICIPATED_IN", from: account, to: event, evidence, ...(input.normalizedRecord.timestamp ? { timestamp: input.normalizedRecord.timestamp } : {}) });
  if (device) await persistObservedRelationship({ sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber, relationshipType: "PARTICIPATED_IN", from: device, to: event, evidence, ...(input.normalizedRecord.timestamp ? { timestamp: input.normalizedRecord.timestamp } : {}) });
  if (location) await persistObservedRelationship({ sourceDocumentId: input.sourceDocumentId, rowNumber: input.rowNumber, relationshipType: "LOCATED_AT", from: event, to: location, evidence, ...(input.normalizedRecord.timestamp ? { timestamp: input.normalizedRecord.timestamp } : {}) });
};

export const ingestTelecomCsv = async (input: {
  sourceDocumentId: string;
  caseId: string;
  type: "CDR" | "IPDR";
  filePath: string;
}): Promise<{ processedRows: number; invalidRows: number }> => {
  const rawCsv = await readFile(input.filePath, "utf8");
  const rows = parseCsv(rawCsv);
  let processedRows = 0;
  let invalidRows = 0;

  for (const [index, rawRecord] of rows.entries()) {
    const rowNumber = index + 2;
    const normalizedRecord = input.type === "CDR" ? normaliseCdrRow(rawRecord) : normaliseIpdrRow(rawRecord);
    const validationErrors = validationErrorsFor(input.type, normalizedRecord);
    const timestamp = normalizedRecord.timestamp;
    await TelecomRecordModel.updateOne(
      { sourceDocumentId: input.sourceDocumentId, rowNumber },
      { $setOnInsert: { sourceDocumentId: input.sourceDocumentId, caseId: input.caseId, recordType: input.type, rowNumber, rawRecord, normalizedRecord, validationErrors, ...(timestamp ? { timestamp } : {}) } },
      { upsert: true },
    );

    if (validationErrors.length) {
      invalidRows += 1;
      continue;
    }
    if (input.type === "CDR") {
      await processCdrRow({ sourceDocumentId: input.sourceDocumentId, rowNumber, rawRecord, normalizedRecord: normalizedRecord as NormalizedCdrRow });
    } else {
      await processIpdrRow({ sourceDocumentId: input.sourceDocumentId, rowNumber, rawRecord, normalizedRecord: normalizedRecord as NormalizedIpdrRow });
    }
    processedRows += 1;
  }

  return { processedRows, invalidRows };
};
