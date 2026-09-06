import { createWorker } from "tesseract.js";

export const extractTextFromImage = async (
  imagePath: string,
): Promise<{
  text: string;
  confidence: number;
}> => {
  const worker = await createWorker("eng");

  await worker.setParameters({
    tessedit_pageseg_mode: "3",
  });

  const result = await worker.recognize(imagePath);

  await worker.terminate();

  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
};
