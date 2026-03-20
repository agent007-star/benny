import { AVAILABLE_MODELS } from "./models.js";
import { recordUsage } from "../utils/analytics.js";
import { getConfig } from "../utils/config.js";
import { checkLimit } from "../monetization/usage-tracker.js";
function resolveApiKey(envKey, configKey) {
    return process.env[envKey] ?? configKey ?? "";
}
export class FriendlyError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "FriendlyError";
    }
}
function classifyError(status) {
    if (status === 401)
        return { msg: "API Key 无效或已过期，请检查或重新配置。", code: "auth_failed" };
    if (status === 403)
        return { msg: "无访问权限，请检查 API Key 权限设置。", code: "forbidden" };
    if (status === 429)
        return { msg: "请求频率超限，请稍后再试。", code: "rate_limited" };
    if (status >= 500)
        return { msg: "AI 服务端错误，请稍后重试。", code: "server_error" };
    return { msg: `请求失败 (${status})`, code: "api_error" };
}
export async function streamChat(request, onChunk, command = "chat") {
    const { model, messages, temperature = 0.7, maxTokens = 4096 } = request;
    checkLimit(maxTokens);
    const config = getConfig();
    const apiKey = resolveApiKey(model.apiKeyEnv, config?.apiKeys?.[model.apiKeyEnv]);
    if (!apiKey) {
        throw new FriendlyError(`未找到 API Key (${model.apiKeyEnv})。请运行 'benny init' 配置，或设置环境变量。`, "api_key_missing");
    }
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };
    if (model.provider === "wenxin") {
        throw new FriendlyError("文心模型暂不支持流式输出，请使用 'benny chat --no-stream' 或切换到通义/Kimi模型。", "wenxin_stream_unsupported");
    }
    const body = {
        model: model.name,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
    };
    const response = await fetch(model.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const classified = classifyError(response.status);
        recordUsage(model.name, model.provider, command, 0, 0, 0, false, `API error ${response.status}`);
        throw new FriendlyError(classified.msg, classified.code);
    }
    if (!response.body) {
        throw new Error("No response body for streaming");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let usage;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data:"))
                    continue;
                const data = trimmed.slice(5).trim();
                if (data === "[DONE]")
                    continue;
                try {
                    const parsed = JSON.parse(data);
                    const choices = parsed.choices;
                    const delta = choices?.[0]?.delta?.content ?? "";
                    if (delta) {
                        onChunk({ content: delta, done: false });
                    }
                    if (choices?.[0]?.finish_reason) {
                        const u = parsed.usage;
                        if (u) {
                            usage = {
                                promptTokens: u.prompt_tokens ?? 0,
                                completionTokens: u.completion_tokens ?? 0,
                                totalTokens: u.total_tokens ?? 0,
                            };
                        }
                    }
                }
                catch {
                    // skip malformed JSON
                }
            }
        }
        if (buffer.trim() && buffer.trim().startsWith("data:")) {
            const data = buffer.trim().slice(5).trim();
            if (data !== "[DONE]") {
                try {
                    const parsed = JSON.parse(data);
                    const u = parsed.usage;
                    if (u) {
                        usage = {
                            promptTokens: u.prompt_tokens ?? 0,
                            completionTokens: u.completion_tokens ?? 0,
                            totalTokens: u.total_tokens ?? 0,
                        };
                    }
                }
                catch {
                    // skip
                }
            }
        }
        onChunk({ content: "", done: true, usage });
    }
    finally {
        reader.releaseLock();
    }
    if (usage) {
        recordUsage(model.name, model.provider, command, usage.promptTokens, usage.completionTokens, usage.totalTokens, true);
    }
}
export async function chat(request, command = "chat") {
    const { model, messages, temperature = 0.7, maxTokens = 4096 } = request;
    checkLimit(maxTokens);
    const config = getConfig();
    const apiKey = resolveApiKey(model.apiKeyEnv, config?.apiKeys?.[model.apiKeyEnv]);
    if (!apiKey) {
        throw new FriendlyError(`未找到 API Key (${model.apiKeyEnv})。请运行 'benny init' 配置，或设置环境变量。`, "api_key_missing");
    }
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };
    if (model.provider === "wenxin") {
        const secretKey = resolveApiKey("WENXIN_SECRET_KEY", config?.apiKeys?.WENXIN_SECRET_KEY);
        const accessToken = await getWenxinAccessToken(apiKey, secretKey);
        headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const body = {
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
        const classified = classifyError(response.status);
        recordUsage(model.name, model.provider, command, 0, 0, 0, false, `API error ${response.status}`);
        throw new FriendlyError(classified.msg, classified.code);
    }
    const data = await response.json();
    const result = parseResponse(data, model);
    if (result.usage) {
        recordUsage(model.name, model.provider, command, result.usage.promptTokens, result.usage.completionTokens, result.usage.totalTokens, true);
    }
    return result;
}
async function getWenxinAccessToken(apiKey, secretKey) {
    if (!secretKey) {
        throw new FriendlyError("文心 Secret Key 未设置。请运行 'benny init' 或设置 WENXIN_SECRET_KEY 环境变量。", "wenxin_secret_missing");
    }
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    const res = await fetch(tokenUrl, { method: "POST" });
    if (!res.ok) {
        throw new FriendlyError("文心 API Key 或 Secret Key 无效。", "auth_failed");
    }
    const data = await res.json();
    if (!data.access_token) {
        throw new FriendlyError("获取文心访问令牌失败，请检查 API Key 配置。", "auth_failed");
    }
    return data.access_token;
}
function parseResponse(data, model) {
    const choices = data.choices;
    const content = choices?.[0]?.message?.content ?? "";
    const usage = data.usage;
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
export function selectModel(provider) {
    if (!provider)
        return AVAILABLE_MODELS[0];
    const found = AVAILABLE_MODELS.find((m) => m.provider === provider);
    return found ?? AVAILABLE_MODELS[0];
}
