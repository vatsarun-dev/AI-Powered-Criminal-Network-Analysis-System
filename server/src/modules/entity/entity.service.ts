import { EntityModel } from "../../models/entity.model.ts";
import type { NERResult } from "../../service/ner.service.ts";

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

  const documents = entities.map((entity) => ({
    entityType: entity.entity_type,
    value: entity.value,
    confidence: entity.confidence,
    sourceDocumentId,
    pageNumber,
    charOffset: entity.char_offset,
  }));

  return EntityModel.insertMany(documents);
};
