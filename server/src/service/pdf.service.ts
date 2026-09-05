import path from "node:path";
import fs from "node:fs/promises";
import { pdf } from "pdf-to-img";

export const convertPdfToImages = async (
  pdfPath: string,
  outputDirectory: string,
  filePrefix = "page",
): Promise<string[]> => {
  await fs.mkdir(outputDirectory, { recursive: true });

  const document = await pdf(pdfPath, { format: "png", scale: 4 });
  const imagePaths: string[] = [];
  let pageNumber = 1;

  for await (const page of document) {
    const imagePath = path.join(
      outputDirectory,
      `${filePrefix}-page-${pageNumber}.png`,
    );

    await fs.writeFile(imagePath, page);
    imagePaths.push(imagePath);
    pageNumber++;
  }

  await document.destroy();

  return imagePaths;
};
