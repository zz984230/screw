# AI 子系统说明

- Provider：OpenAI/Anthropic/Gemini/Ollama。
- 路由：按策略选择与回退。
- 接口：`ask({text, sessionId, stream}) => AsyncIterable<Chunk>`。

