// utils/pdfProcessor.ts
import fetch from "node-fetch";
import pdf from "pdf-parse";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function processPDFfromURL(pdfUrl: string): Promise<number[][]> {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch the PDF: ${response.statusText}`);
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  const pdfData = await pdf(fileBuffer);

  const textChunks = splitTextWithOverlap(pdfData.text, 200, 50);
  const embeddings = await Promise.all(
    textChunks.map(async (chunk) => {
      const embedding = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: chunk,
      });

      if (!Array.isArray(embedding)) {
        throw new Error("Failed to generate embeddings");
      }

      return embedding as number[];
    })
  );

  return embeddings;
}

function splitTextWithOverlap(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}
