import { convertPdfToImages } from "./pdf.service.ts";
import { extractTextFromImage } from "./ocr.service.ts";
import { OCRResult } from "../models/ocr-result.model.ts";
import { extractNamedEntities } from "./ner.service.ts";
import { saveEntities } from "../modules/entity/entity.service.ts";

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

  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];

    const ocrResult = await extractTextFromImage(imagePath);

    const savedResult = await OCRResult.create({
      sourceDocumentId,
      pageNumber: i + 1,
      text: ocrResult.text,
      confidence: ocrResult.confidence,
    });

    const entities = await extractNamedEntities(ocrResult.text);

    await saveEntities({
      entities,
      sourceDocumentId,
      pageNumber: i + 1,
    });

    results.push(savedResult);
  }
};
