import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const key = "__openai__" as const;

/**
 * Lazy-initialized OpenAI client
 * Only connects when first accessed to avoid blocking Next.js compilation
 */
export function openai() {
  // @ts-ignore
  if (!globalThis[key]) {
    // @ts-ignore
    globalThis[key] = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }
  // @ts-ignore
  return globalThis[key] as OpenAI;
}

export type LLMConfig = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

const DEFAULT_CONFIG: LLMConfig = {
  model: "gpt-5-2025-08-07", // GPT-5 with structured outputs
  temperature: 0.7,
  maxTokens: 16000,
};

/**
 * Generate structured JSON output from OpenAI using zod schema
 */
export async function generateStructured<T extends z.ZodType>(params: {
  schema: T;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  config?: LLMConfig;
}): Promise<z.infer<T>> {
  const { schema, schemaName, systemPrompt, userPrompt, config = {} } = params;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const completion = await openai().beta.chat.completions.parse({
      model: finalConfig.model!,
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(schema, schemaName),
    });

    const result = completion.choices[0]?.message?.parsed;

    if (!result) {
      throw new Error("No parsed result from OpenAI");
    }

    return result;
  } catch (error) {
    console.error("OpenAI structured generation error:", error);
    throw error;
  }
}

/**
 * Generate text completion from OpenAI
 */
export async function generateText(params: {
  systemPrompt: string;
  userPrompt: string;
  config?: LLMConfig;
}): Promise<string> {
  const { systemPrompt, userPrompt, config = {} } = params;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const completion = await openai().chat.completions.create({
      model: finalConfig.model!,
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      throw new Error("No content from OpenAI");
    }

    return result;
  } catch (error) {
    console.error("OpenAI text generation error:", error);
    throw error;
  }
}
