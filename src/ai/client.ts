import { ChatRequest, ChatResponse, AVAILABLE_MODELS, AiModel } from "./models.js";
import { recordUsage } from "../utils/analytics.js";

export async function chat(request: ChatRequest, command = "chat"): Promise<ChatResponse> {
  const { model, messages, temperature = 0.7, maxTokens = 4096 } = request;

  const apiKey = process.env[model.apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `API key not found: ${model.apiKeyEnv}. Please set it in .env or environment.`
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (model.provider === "wenxin") {
    const accessToken = await getWenxinAccessToken(apiKey);
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const body: Record<string, unknown> = {
    model: model.name,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  const response = await fetch(model.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    recordUsage(model.name, model.provider, command, 0, 0, 0, false, `API error ${response.status}`);
    throw new Error(`AI API error (${response.status}): ${error}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const result = parseResponse(data, model);

  if (result.usage) {
    recordUsage(model.name, model.provider, command, result.usage.promptTokens, result.usage.completionTokens, result.usage.totalTokens, true);
  }

  return result;
}

async function getWenxinAccessToken(apiKey: string): Promise<string> {
  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${process.env.WENXIN_SECRET_KEY}`;
  const res = await fetch(tokenUrl, { method: "POST" });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function parseResponse(data: Record<string, unknown>, model: AiModel): ChatResponse {
  const choices = data.choices as Array<{ message: { content: string } }> | undefined;
  const content = choices?.[0]?.message?.content ?? "";
  const usage = data.usage as Record<string, number> | undefined;

  return {
    content,
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          totalTokens: usage.total_tokens ?? 0,
        }
      : undefined,
    model: model.name,
  };
}

export function selectModel(provider?: string): AiModel {
  if (!provider) return AVAILABLE_MODELS[0];
  const found = AVAILABLE_MODELS.find((m) => m.provider === provider);
  return found ?? AVAILABLE_MODELS[0];
}
