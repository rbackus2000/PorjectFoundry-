/**
 * Embedding generation using OpenAI API
 */

import { openai } from "../llm/openai";

const EMBEDDING_MODEL =
  process.env.RAG_EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536; // text-embedding-3-small default

export type EmbeddingResult = {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
};

/**
 * Generate embedding for a single text
 */
export async function embed(text: string): Promise<EmbeddingResult> {
  try {
    const response = await openai().embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const data = response.data[0];

    return {
      embedding: data.embedding,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  } catch (error: any) {
    throw new Error(`Embedding failed: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) {
    return [];
  }

  try {
    const response = await openai().embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data.map((item, idx) => ({
      embedding: item.embedding,
      model: response.model,
      usage: {
        promptTokens: Math.floor(response.usage.prompt_tokens / texts.length),
        totalTokens: Math.floor(response.usage.total_tokens / texts.length),
      },
    }));
  } catch (error: any) {
    throw new Error(`Batch embedding failed: ${error.message}`);
  }
}

/**
 * Embed query text (same as embed, but semantically distinct for clarity)
 */
export async function embedQuery(query: string): Promise<number[]> {
  const result = await embed(query);
  return result.embedding;
}
