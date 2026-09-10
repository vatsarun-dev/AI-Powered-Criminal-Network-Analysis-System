import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { FileModel } from "../../models/file.model.js";
import { OCRResult } from "../../models/ocr-result.model.js";
import { RelationshipEvidenceModel } from "../../models/relationship-evidence.model.js";
import { TelecomRecordModel } from "../../models/telecom-record.model.js";
import {
  getGraphNeighbors,
  searchGraphNodes,
  type GraphNetwork,
} from "../graph/graphQuery.service.js";
import env from "../../config/env.js";

export const INSUFFICIENT_EVIDENCE_MESSAGE =
  "The available evidence does not contain enough information to answer this question.";

type RagQuery = {
  query: string;
  caseId?: string;
  entityId?: string;
};

export type RagSource = {
  sourceDocumentId: string;
  pageNumber: number;
  evidence: string;
  confidence: number;
  documentType?: string;
  caseId?: string;
  timestamp?: string;
};

export type RagResult = {
  answer: string;
  sources: RagSource[];
  graphContext: GraphNetwork;
};

type FileSummary = {
  _id: unknown;
  type: string;
  caseId: string;
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

const queryTerms = (query: string): string[] =>
  [
    ...new Set(
      query
        .split(/\\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3),
    ),
  ].slice(0, 12);

const searchPattern = (query: string): RegExp =>
  new RegExp(
    (queryTerms(query).length ? queryTerms(query) : [query])
      .map(escapeRegex)
      .join("|"),
    "i",
  );

const documentMapFor = async (
  caseId?: string,
): Promise<Map<string, FileSummary>> => {
  const filter = caseId ? { caseId } : {};
  const documents = await FileModel.find(filter)
    .select("_id type caseId")
    .limit(200)
    .lean<FileSummary[]>();

  return new Map(documents.map((document) => [String(document._id), document]));
};

const ocrSources = async (
  pattern: RegExp,
  documents: Map<string, FileSummary>,
): Promise<RagSource[]> => {
  if (!documents.size) return [];

  const rows = await OCRResult.find({
    sourceDocumentId: { $in: [...documents.keys()] },
    text: { $regex: pattern },
  })
    .sort({ confidence: -1, pageNumber: 1 })
    .limit(8)
    .lean();

  return rows.map((row) => {
    const sourceDocumentId = String(row.sourceDocumentId);
    const document = documents.get(sourceDocumentId);
    return {
      sourceDocumentId,
      pageNumber: row.pageNumber,
      evidence: row.text,
      confidence: row.confidence / 100,
      ...(document?.type ? { documentType: document.type } : {}),
      ...(document?.caseId ? { caseId: document.caseId } : {}),
    };
  });
};

const relationshipSources = async (
  pattern: RegExp,
  documents: Map<string, FileSummary>,
): Promise<RagSource[]> => {
  if (!documents.size) return [];

  const rows = await RelationshipEvidenceModel.find({
    sourceDocumentId: { $in: [...documents.keys()] },
    extractedEvidence: { $regex: pattern },
  })
    .sort({ confidence: -1, pageNumber: 1 })
    .limit(8)
    .lean();

  return rows.map((row) => {
    const sourceDocumentId = String(row.sourceDocumentId);
    const document = documents.get(sourceDocumentId);
    return {
      sourceDocumentId,
      pageNumber: row.pageNumber,
      evidence: row.extractedEvidence,
      confidence: row.confidence,
      ...(document?.type ? { documentType: document.type } : {}),
      ...(document?.caseId ? { caseId: document.caseId } : {}),
      ...(row.timestamp ? { timestamp: row.timestamp } : {}),
    };
  });
};

const telecomSources = async (
  pattern: RegExp,
  caseId?: string,
): Promise<RagSource[]> => {
  const rows = await TelecomRecordModel.find({
    ...(caseId ? { caseId } : {}),
    $or: [
      { "normalizedRecord.sourcePhone": { $regex: pattern } },
      { "normalizedRecord.destinationPhone": { $regex: pattern } },
      { "normalizedRecord.sourceIp": { $regex: pattern } },
      { "normalizedRecord.destinationIp": { $regex: pattern } },
      { "normalizedRecord.account": { $regex: pattern } },
      { "normalizedRecord.device": { $regex: pattern } },
      { "normalizedRecord.location": { $regex: pattern } },
    ],
  })
    .sort({ timestamp: -1, rowNumber: 1 })
    .limit(8)
    .lean();

  return rows.map((row) => ({
    sourceDocumentId: String(row.sourceDocumentId),
    pageNumber: 1,
    evidence: `${row.recordType} CSV row ${row.rowNumber}: ${JSON.stringify(row.rawRecord)}`,
    confidence: row.validationErrors.length ? 0.5 : 1,
    documentType: row.recordType,
    caseId: row.caseId,
    ...(row.timestamp ? { timestamp: row.timestamp } : {}),
  }));
};

const retrieveGraphContext = async (query: RagQuery): Promise<GraphNetwork> => {
  const candidates = new Map<string, { id: string }>();
  const searches = [query.query, ...queryTerms(query.query).slice(0, 5)];

  for (const search of searches) {
    try {
      const results = await searchGraphNodes(search);
      for (const result of results) candidates.set(String(result.id), result);
    } catch {
      return { nodes: [], relationships: [] };
    }
  }

  if (query.entityId) candidates.set(query.entityId, { id: query.entityId });

  const network: GraphNetwork = { nodes: [], relationships: [] };
  for (const candidate of [...candidates.values()].slice(0, 8)) {
    try {
      const result = await getGraphNeighbors(candidate.id);
      const nodeIds = new Set(network.nodes.map((node) => node.id));
      const relationshipIds = new Set(
        network.relationships.map((relationship) => relationship.id),
      );
      for (const node of result.network.nodes) {
        if (!nodeIds.has(node.id)) network.nodes.push(node);
      }
      for (const relationship of result.network.relationships) {
        if (!relationshipIds.has(relationship.id))
          network.relationships.push(relationship);
      }
    } catch {
      // Graph context is supplementary; evidence retrieval remains usable.
    }
  }

  return network;
};

const contentText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string"
          ? part
          : ((part as { text?: string }).text ?? ""),
      )
      .join("");
  }
  return String(content ?? "");
};

const generateAnswer = async (
  query: string,
  sources: RagSource[],
  graphContext: GraphNetwork,
): Promise<string> => {
  if (!env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not configured");
  }

  const model = new ChatMistralAI({
    apiKey: env.MISTRAL_API_KEY,
    model: env.MISTRAL_MODEL,
    temperature: 0,
    maxRetries: 2,
  });
  const context = JSON.stringify({ sources, graphContext });
  const response = await model.invoke([
    new SystemMessage(
      "You are an evidence-grounded investigator assistant. Use only the supplied evidence and graph context. Distinguish observed facts from inference, preserve uncertainty, and cite source document IDs and page numbers when available. Never claim guilt, criminality, or causation from association. If the context does not answer the question, say that the available evidence is insufficient.",
    ),
    new HumanMessage(`Question: ${query}\\nRetrieved context: ${context}`),
  ]);

  return contentText(response.content).trim() || INSUFFICIENT_EVIDENCE_MESSAGE;
};

export const answerRagQuery = async (input: RagQuery): Promise<RagResult> => {
  const documents = await documentMapFor(input.caseId);
  const pattern = searchPattern(input.query);
  const sources = [
    ...(await ocrSources(pattern, documents)),
    ...(await relationshipSources(pattern, documents)),
    ...(await telecomSources(pattern, input.caseId)),
  ].slice(0, 20);
  const graphContext = await retrieveGraphContext(input);

  if (!sources.length && !graphContext.nodes.length) {
    return {
      answer: INSUFFICIENT_EVIDENCE_MESSAGE,
      sources: [],
      graphContext,
    };
  }

  return {
    answer: await generateAnswer(input.query, sources, graphContext),
    sources,
    graphContext,
  };
};
