import { AVAILABLE_MODELS } from "./models.js";
import { chat } from "./client.js";
export async function compareModels(prompt, systemPrompt, maxTokens = 2048) {
    const results = await Promise.all(AVAILABLE_MODELS.map(async (model) => {
        const start = Date.now();
        try {
            const messages = systemPrompt
                ? [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }]
                : [{ role: "user", content: prompt }];
            const request = { model, messages, temperature: 0.7, maxTokens };
            const response = await chat(request, "compare");
            return {
                model: model.name,
                provider: model.provider,
                content: response.content,
                tokens: response.usage?.totalTokens ?? 0,
                time: Date.now() - start,
            };
        }
        catch (err) {
            return {
                model: model.name,
                provider: model.provider,
                content: "",
                tokens: 0,
                time: Date.now() - start,
                error: err.message,
            };
        }
    }));
    return results;
}
