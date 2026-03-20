export const AVAILABLE_MODELS = [
    {
        name: "qwen-plus",
        provider: "tongyi",
        endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        apiKeyEnv: "TONGYI_API_KEY",
    },
    {
        name: "ernie-4.0-8k",
        provider: "wenxin",
        endpoint: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k",
        apiKeyEnv: "WENXIN_API_KEY",
    },
    {
        name: "moonshot-v1-128k",
        provider: "kimi",
        endpoint: "https://api.moonshot.cn/v1/chat/completions",
        apiKeyEnv: "KIMI_API_KEY",
    },
];
export const DEFAULT_MODEL = AVAILABLE_MODELS[0];
