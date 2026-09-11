import env from "../../config/env.js";
import { BadRequestError } from "../../shared/error/globalError.js";
import FirService from "../case/fir.service.js";

type Source = { kind: "FIR" | "OCR" | "ENTITY" | "RELATIONSHIP"; page?: number; excerpt: string };
type OcrPage = { pageNumber?: number; text?: string; confidence?: number };
type Entity = { entityType?: string; value?: string; pageNumber?: number; confidence?: number };
type Relationship = { relationshipType?: string; extractedEvidence?: string; pageNumber?: number; confidence?: number };

const words = (text: string) => [...new Set(text.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [])];
const excerpt = (value: string, maximum = 1800) => value.length <= maximum ? value : `${value.slice(0, maximum)}…`;

export default class RagService {
  private readonly firService = new FirService();

  async ask(firId: string, question: string): Promise<{ answer: string; sources: Source[] }> {
    if (!env.MISTRAL_API_KEY) {
      throw new BadRequestError("RAG is not configured. Set MISTRAL_API_KEY on the backend.");
    }

    const evidence = await this.firService.evidence(firId);
    const fir = evidence.fir;
    const questionWords = words(question);
    const pages = (evidence.ocrPages as unknown as OcrPage[])
      .map((page) => ({ ...page, score: words(page.text ?? "").filter((word) => questionWords.includes(word)).length }))
      .sort((left, right) => right.score - left.score || (left.pageNumber ?? 0) - (right.pageNumber ?? 0))
      .slice(0, 6);

    const sources: Source[] = [{
      kind: "FIR",
      excerpt: `FIR ${fir.firNumber}/${fir.year}; ${fir.crimeCategory}; ${fir.district}; ${fir.policeStation}. ${excerpt(fir.description, 1400)}`,
    }];
    pages.forEach((page) => sources.push({ kind: "OCR", ...(page.pageNumber ? { page: page.pageNumber } : {}), excerpt: excerpt(page.text ?? "") }));
    (evidence.entities as unknown as Entity[]).slice(0, 40).forEach((item) => sources.push({ kind: "ENTITY", ...(item.pageNumber ? { page: item.pageNumber } : {}), excerpt: `${item.entityType ?? "ENTITY"}: ${item.value ?? ""} (confidence ${item.confidence ?? "unknown"})` }));
    (evidence.relationships as unknown as Relationship[]).slice(0, 25).forEach((item) => sources.push({ kind: "RELATIONSHIP", ...(item.pageNumber ? { page: item.pageNumber } : {}), excerpt: `${item.relationshipType ?? "RELATIONSHIP"}: ${excerpt(item.extractedEvidence ?? "", 600)} (confidence ${item.confidence ?? "unknown"})` }));

    const context = sources.map((source, index) => `[${index + 1}] ${source.kind}${source.page ? ` page ${source.page}` : ""}: ${source.excerpt}`).join("\n\n").slice(0, 16000);
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.MISTRAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.MISTRAL_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: "You are an investigation evidence assistant. Answer only from supplied records. State when evidence is insufficient. Do not make allegations or infer facts. Cite source numbers like [1]." },
          { role: "user", content: `Question: ${question}\n\nEvidence:\n${context}` },
        ],
      }),
    });
    if (!response.ok) throw new Error("Mistral request failed");
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const answer = payload.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("Mistral returned an empty response");
    return { answer, sources };
  }
}
