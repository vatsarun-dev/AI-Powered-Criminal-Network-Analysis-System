import { EntityModel } from "../../models/entity.model.js";
import { FirModel, type FirMongoDocument } from "../../models/fir.model.js";
import { FileModel } from "../../models/file.model.js";
import { OCRResult } from "../../models/ocr-result.model.js";
import { RelationshipEvidenceModel } from "../../models/relationship-evidence.model.js";
import { getCaseNetwork, getGraphRelationships } from "../../graph/graphQuery.service.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../shared/error/globalError.js";
import type {
  FirCreateInput,
  FirListFilter,
  FirResponse,
  FirUpdateInput,
  PaginatedFirResponse,
} from "./fir.types.js";

type StoredFir = FirMongoDocument & {
  _id: { toString(): string };
};

type FirQuery = {
  firNumber?: { $regex: string; $options: "i" };
  year?: number;
  district?: { $regex: string; $options: "i" };
  policeStation?: { $regex: string; $options: "i" };
  crimeCategory?: { $regex: string; $options: "i" };
  status?: FirMongoDocument["status"];
  registrationDate?: { $gte?: Date; $lte?: Date };
  incidentDate?: { $gte?: Date; $lte?: Date };
  $or?: Array<Record<string, RegExp>>;
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toFirResponse = (fir: StoredFir): FirResponse => ({
  id: fir._id.toString(),
  firNumber: fir.firNumber,
  year: fir.year,
  registrationDate: fir.registrationDate.toISOString(),
  ...(fir.incidentDate ? { incidentDate: fir.incidentDate.toISOString() } : {}),
  district: fir.district,
  ...(fir.districtCoordinates ? { districtCoordinates: fir.districtCoordinates } : {}),
  policeStation: fir.policeStation,
  ...(fir.policeStationCoordinates
    ? { policeStationCoordinates: fir.policeStationCoordinates }
    : {}),
  crimeCategory: fir.crimeCategory,
  sections: fir.sections,
  description: fir.description,
  status: fir.status,
  complainant: fir.complainant,
  victims: fir.victims,
  accused: fir.accused,
  ...(fir.investigatingOfficer ? { investigatingOfficer: fir.investigatingOfficer } : {}),
  ...(fir.court ? { court: fir.court } : {}),
  ...(fir.sourceDocument ? { sourceDocument: fir.sourceDocument.toString() } : {}),
  createdAt: fir.createdAt.toISOString(),
  updatedAt: fir.updatedAt.toISOString(),
});

const hasDuplicateKey = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

const addDateRange = (
  query: FirQuery,
  field: "registrationDate" | "incidentDate",
  from: Date | undefined,
  to: Date | undefined,
): void => {
  if (from || to) {
    query[field] = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }
};

export const buildFirMongoFilter = (
  filters: FirListFilter,
): FirQuery => {
  const query: FirQuery = {};

  if (filters.firNumber) {
    query.firNumber = { $regex: escapeRegex(filters.firNumber), $options: "i" };
  }
  if (filters.year !== undefined) query.year = filters.year;
  if (filters.district) query.district = { $regex: escapeRegex(filters.district), $options: "i" };
  if (filters.policeStation) query.policeStation = { $regex: escapeRegex(filters.policeStation), $options: "i" };
  if (filters.crimeCategory) query.crimeCategory = { $regex: escapeRegex(filters.crimeCategory), $options: "i" };
  if (filters.status) query.status = filters.status;
  addDateRange(query, "registrationDate", filters.registrationDateFrom, filters.registrationDateTo);
  addDateRange(query, "incidentDate", filters.incidentDateFrom, filters.incidentDateTo);

  if (filters.q) {
    const expression = new RegExp(escapeRegex(filters.q), "i");
    query.$or = [
      { firNumber: expression },
      { district: expression },
      { policeStation: expression },
      { crimeCategory: expression },
      { sections: expression },
      { description: expression },
      { "complainant.name": expression },
      { "victims.name": expression },
      { "accused.name": expression },
      { "investigatingOfficer.name": expression },
      { court: expression },
    ];
  }

  return query;
};

const assertDateOrder = (incidentDate: Date | undefined, registrationDate: Date): void => {
  if (incidentDate && incidentDate > registrationDate) {
    throw new BadRequestError("incidentDate cannot be after registrationDate");
  }
};

const graphNodeIdForFir = (fir: Pick<FirMongoDocument, "firNumber" | "year">): string =>
  `case:fir-${fir.firNumber.toLocaleLowerCase("en-IN")}/${fir.year}`;

export type FirServiceDependencies = {
  firModel?: typeof FirModel;
  fileModel?: typeof FileModel;
  entityModel?: typeof EntityModel;
  ocrResultModel?: typeof OCRResult;
  relationshipEvidenceModel?: typeof RelationshipEvidenceModel;
  getCaseNetwork?: typeof getCaseNetwork;
  getGraphRelationships?: typeof getGraphRelationships;
};

export default class FirService {
  private readonly firModel: typeof FirModel;
  private readonly fileModel: typeof FileModel;
  private readonly entityModel: typeof EntityModel;
  private readonly ocrResultModel: typeof OCRResult;
  private readonly relationshipEvidenceModel: typeof RelationshipEvidenceModel;
  private readonly graphCaseNetwork: typeof getCaseNetwork;
  private readonly graphRelationships: typeof getGraphRelationships;

  constructor(dependencies: FirServiceDependencies = {}) {
    this.firModel = dependencies.firModel ?? FirModel;
    this.fileModel = dependencies.fileModel ?? FileModel;
    this.entityModel = dependencies.entityModel ?? EntityModel;
    this.ocrResultModel = dependencies.ocrResultModel ?? OCRResult;
    this.relationshipEvidenceModel =
      dependencies.relationshipEvidenceModel ?? RelationshipEvidenceModel;
    this.graphCaseNetwork = dependencies.getCaseNetwork ?? getCaseNetwork;
    this.graphRelationships = dependencies.getGraphRelationships ?? getGraphRelationships;
  }

  private async assertSourceDocument(sourceDocument: string | undefined): Promise<void> {
    if (!sourceDocument) return;

    const file = await this.fileModel.findById(sourceDocument)
      .select({ _id: 1, type: 1 })
      .lean();
    if (!file) {
      throw new NotFoundError("sourceDocument file not found");
    }
    if (file.type !== "FIR") {
      throw new BadRequestError("sourceDocument must reference a file of type FIR");
    }
  }

  private async requireFirDocument(id: string): Promise<StoredFir> {
    const fir = await this.firModel.findById(id).lean();
    if (!fir) {
      throw new NotFoundError("FIR not found");
    }
    return fir as unknown as StoredFir;
  }

  async create(input: FirCreateInput): Promise<FirResponse> {
    await this.assertSourceDocument(input.sourceDocument);

    try {
      const created = await this.firModel.create(input);
      return toFirResponse(created.toObject() as StoredFir);
    } catch (error) {
      if (hasDuplicateKey(error)) {
        throw new ConflictError("An FIR with this firNumber and year already exists");
      }
      throw error;
    }
  }

  async list(filters: FirListFilter): Promise<PaginatedFirResponse> {
    const query = buildFirMongoFilter(filters);
    const skip = (filters.page - 1) * filters.limit;
    const [records, total] = await Promise.all([
      this.firModel.find(query as never)
        .sort({ registrationDate: -1, year: -1, firNumber: 1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      this.firModel.countDocuments(query as never),
    ]);

    return {
      items: records.map((record) => toFirResponse(record as unknown as StoredFir)),
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async findById(id: string): Promise<FirResponse> {
    return toFirResponse(await this.requireFirDocument(id));
  }

  async update(id: string, input: FirUpdateInput): Promise<FirResponse> {
    const current = await this.requireFirDocument(id);
    const registrationDate = input.registrationDate ?? current.registrationDate;
    const incidentDate = input.incidentDate === null
      ? undefined
      : input.incidentDate ?? current.incidentDate;
    assertDateOrder(incidentDate, registrationDate);

    if (typeof input.sourceDocument === "string") {
      await this.assertSourceDocument(input.sourceDocument);
    }

    const changes: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === null) {
        unset[key] = "";
      } else if (value !== undefined) {
        changes[key] = value;
      }
    }

    try {
      const updated = await this.firModel.findByIdAndUpdate(
        id,
        {
          ...(Object.keys(changes).length ? { $set: changes } : {}),
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { returnDocument: "after", runValidators: true },
      ).lean();
      if (!updated) {
        throw new NotFoundError("FIR not found");
      }
      return toFirResponse(updated as unknown as StoredFir);
    } catch (error) {
      if (hasDuplicateKey(error)) {
        throw new ConflictError("An FIR with this firNumber and year already exists");
      }
      throw error;
    }
  }

  async delete(id: string): Promise<FirResponse> {
    const deleted = await this.firModel.findByIdAndDelete(id).lean();
    if (!deleted) {
      throw new NotFoundError("FIR not found");
    }

    // Evidence documents and graph assertions deliberately remain immutable.
    return toFirResponse(deleted as unknown as StoredFir);
  }

  async evidence(id: string, pageNumber?: number) {
    const fir = await this.requireFirDocument(id);
    const sourceDocumentId = fir.sourceDocument?.toString();
    if (!sourceDocumentId) {
      return {
        fir: toFirResponse(fir),
        sourceDocument: null,
        ocrPages: [],
        entities: [],
        relationships: [],
      };
    }

    const pageFilter = pageNumber === undefined ? {} : { pageNumber };
    const [sourceDocument, ocrPages, entities, relationships] = await Promise.all([
      this.fileModel.findById(sourceDocumentId).lean(),
      this.ocrResultModel.find({ sourceDocumentId, ...pageFilter }).sort({ pageNumber: 1 }).lean(),
      this.entityModel.find({ sourceDocumentId, ...pageFilter })
        .sort({ pageNumber: 1, charOffset: 1 })
        .lean(),
      this.relationshipEvidenceModel.find({ sourceDocumentId, ...pageFilter })
        .sort({ pageNumber: 1, confidence: -1 })
        .lean(),
    ]);

    return {
      fir: toFirResponse(fir),
      sourceDocument,
      ocrPages,
      entities,
      relationships,
    };
  }

  async network(id: string, depth: number) {
    const fir = await this.requireFirDocument(id);
    const graphNodeId = graphNodeIdForFir(fir);
    const sourceDocumentId = fir.sourceDocument?.toString();
    const [caseNetwork, evidenceNetwork] = await Promise.all([
      this.graphCaseNetwork(graphNodeId, depth),
      sourceDocumentId
        ? this.graphRelationships({ sourceDocumentId, limit: 500 })
        : Promise.resolve({ nodes: [], relationships: [] }),
    ]);

    return {
      fir: toFirResponse(fir),
      graphNodeId,
      network: caseNetwork ?? evidenceNetwork,
      ...(caseNetwork ? {} : { graphCaseNodeFound: false }),
    };
  }
}
