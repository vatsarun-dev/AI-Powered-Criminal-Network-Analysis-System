import { EntityModel } from "../../models/entity.model.js";

import type { NERResult } from "../../service/ner.service.js";

import { syncEntityToGraph } from "./entity-graph.service.js";
import { prepareEntityDocuments } from "../../service/entity-persistence-preparation.service.js";

type SaveEntitiesParams = {
  entities: NERResult[];

  sourceDocumentId: string;

  pageNumber: number;
};

export const saveEntities = async ({
  entities,
  sourceDocumentId,
  pageNumber,
}: SaveEntitiesParams) => {
  if (!entities.length) {
    return [];
  }

  const documents = prepareEntityDocuments({
    entities,
    sourceDocumentId,
    pageNumber,
  });

  if (!documents.length) {
    return [];
  }

  // Save entities in MongoDB
  const savedEntities = await EntityModel.insertMany(documents);

  // Sync every saved entity to Neo4j
  for (const entity of savedEntities) {
    await syncEntityToGraph(entity._id.toString());
  }

  return savedEntities;
};
