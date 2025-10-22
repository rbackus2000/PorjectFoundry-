/**
 * Text chunking for RAG
 * Splits text into overlapping chunks based on token count
 */

import { encode, decode } from "gpt-tokenizer";

export type ChunkResult = {
  content: string;
  tokenCount: number;
  index: number;
};

export type ChunkerConfig = {
  chunkTokens: number;
  overlapTokens: number;
};

const DEFAULT_CONFIG: ChunkerConfig = {
  chunkTokens: parseInt(process.env.RAG_CHUNK_TOKENS || "900", 10),
  overlapTokens: parseInt(process.env.RAG_CHUNK_OVERLAP || "150", 10),
};

/**
 * Split text into overlapping chunks
 */
export function chunkText(
  text: string,
  config: ChunkerConfig = DEFAULT_CONFIG
): ChunkResult[] {
  const { chunkTokens, overlapTokens } = config;

  // Tokenize the full text
  const tokens = encode(text);

  if (tokens.length === 0) {
    return [];
  }

  const chunks: ChunkResult[] = [];
  let startIdx = 0;
  let chunkIndex = 0;

  while (startIdx < tokens.length) {
    const endIdx = Math.min(startIdx + chunkTokens, tokens.length);
    const chunkTokens_ = tokens.slice(startIdx, endIdx);

    // Decode back to text
    const chunkText = decodeTokens(chunkTokens_);

    chunks.push({
      content: chunkText.trim(),
      tokenCount: chunkTokens_.length,
      index: chunkIndex,
    });

    // Move forward by (chunkTokens - overlapTokens)
    startIdx += chunkTokens - overlapTokens;
    chunkIndex++;

    // Prevent infinite loop if overlap >= chunkTokens
    if (startIdx >= tokens.length || overlapTokens >= chunkTokens) {
      break;
    }
  }

  return chunks;
}

/**
 * Decode tokens back to text using proper GPT tokenizer decode
 */
function decodeTokens(tokens: number[]): string {
  try {
    return decode(tokens);
  } catch (error) {
    console.error("Failed to decode tokens:", error);
    return "";
  }
}

/**
 * Estimate token count for text
 */
export function estimateTokens(text: string): number {
  return encode(text).length;
}

/**
 * Split by sentences as a fallback for very large chunks
 */
export function splitBySentences(text: string, maxSentences: number = 10): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];

  for (let i = 0; i < sentences.length; i += maxSentences) {
    chunks.push(sentences.slice(i, i + maxSentences).join(" "));
  }

  return chunks;
}
