import { AVAILABLE_MODELS } from "./models.js";
import { chat } from "./client.js";
import type { ChatRequest } from "./models.js";

export interface CompareResult {
  model: string;
  provider: string;
  content: string;
  tokens: number;
  time: number;
  error?: string;
}

export async function compareModels(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 2048
): Promise<CompareResult[]> {
  const results = await Promise.all(
    AVAILABLE_MODELS.map(async (model) => {
      const start = Date.now();
      try {
        const messages = systemPrompt
          ? [{ role: "system" as const, content: systemPrompt }, { role: "user" as const, content: prompt }]
          : [{ role: "user" as const, content: prompt }];

        const request: ChatRequest = { model, messages, temperature: 0.7, maxTokens };
        const response = await chat(request, "compare");

        return {
          model: model.name,
          provider: model.provider,
          content: response.content,
          tokens: response.usage?.totalTokens ?? 0,
          time: Date.now() - start,
        };
      } catch (err) {
        return {
          model: model.name,
          provider: model.provider,
          content: "",
          tokens: 0,
          time: Date.now() - start,
          error: (err as Error).message,
        };
      }
    })
  );

  return results;
}
