import { convertPdfToImages } from "./pdf.service.js";
import { extractTextFromImage } from "./ocr.service.js";
import { OCRResult } from "../models/ocr-result.model.js";
import { extractNamedEntities } from "./ner.service.js";
import { saveEntities } from "../modules/entity/entity.service.js";
import { cleanOCRText } from "./ocr-cleanup.service.js";
import { extractDomainEntities } from "./domain-extraction.service.js";
import { deduplicateExtractedEntities } from "./entity-deduplication.service.js";

export const extractTextFromPdf = async (
  pdfPath: string,
  outputDirectory: string,
  sourceDocumentId: string,
) => {
  const imagePaths = await convertPdfToImages(
    pdfPath,
    outputDirectory,
    sourceDocumentId,
  );

  const results = [];

  for (const [i, imagePath] of imagePaths.entries()) {

    const ocrResult = await extractTextFromImage(imagePath);

    const cleanedText = cleanOCRText(ocrResult.text);

    const namedEntities = await extractNamedEntities(cleanedText);
    const domainEntities = extractDomainEntities(cleanedText);
    const entities = deduplicateExtractedEntities([
      ...namedEntities,
      ...domainEntities,
    ]);

    const savedResult = await OCRResult.create({
      sourceDocumentId,
      pageNumber: i + 1,
      text: ocrResult.text,
      confidence: ocrResult.confidence,
    });

    await saveEntities({
      entities,
      sourceDocumentId,
      pageNumber: i + 1,
    });

    results.push(savedResult);
  }
};
