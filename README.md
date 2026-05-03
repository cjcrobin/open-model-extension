# Open Model for Copilot Chat

Integrate **Kimi**, **DeepSeek**, **GLM**, and **Qwen** models into GitHub Copilot Chat as selectable AI models.

## Features

- Register models from Kimi (Moonshot AI), DeepSeek, GLM (Zhipu AI), and Qwen (Alibaba Dashscope) into the Copilot Chat model picker
- Each provider can be independently enabled/disabled
- Configurable API keys per provider
- Fully customizable model lists per provider (with sensible defaults)
- Streaming responses with reasoning token support (DeepSeek R1, Kimi Thinking, QwQ)

## Requirements

- VS Code 1.99+
- GitHub Copilot Chat extension

## Setup

1. Install this extension
2. Open Settings (`Ctrl+,`) and search for `Open Model`
3. Enable the providers you want (e.g. `openModel.deepseek.enabled = true`)
4. Set the API key for each enabled provider
5. The models will appear in the Copilot Chat model picker

## Configuration

| Setting | Description |
|---------|-------------|
| `openModel.kimi.enabled` | Enable Kimi (Moonshot AI) |
| `openModel.kimi.apiKey` | Kimi API key ([get one](https://platform.moonshot.cn/)) |
| `openModel.kimi.models` | List of Kimi models to register |
| `openModel.deepseek.enabled` | Enable DeepSeek |
| `openModel.deepseek.apiKey` | DeepSeek API key ([get one](https://platform.deepseek.com/)) |
| `openModel.deepseek.models` | List of DeepSeek models to register |
| `openModel.glm.enabled` | Enable GLM (Zhipu AI) |
| `openModel.glm.apiKey` | GLM API key ([get one](https://open.bigmodel.cn/)) |
| `openModel.glm.models` | List of GLM models to register |
| `openModel.qwen.enabled` | Enable Qwen (Alibaba Dashscope) |
| `openModel.qwen.apiKey` | Qwen API key ([get one](https://dashscope.aliyun.com/)) |
| `openModel.qwen.models` | List of Qwen models to register |

### Custom Model Example

Add a custom model to a provider by editing the `models` array in settings:

```json
"openModel.deepseek.models": [
  {
    "id": "deepseek-chat",
    "name": "DeepSeek V3",
    "maxInputTokens": 65536,
    "maxOutputTokens": 8192
  },
  {
    "id": "deepseek-reasoner",
    "name": "DeepSeek R1",
    "maxInputTokens": 65536,
    "maxOutputTokens": 32768
  }
]
```

## Commands

- **Open Model: Configure Providers** — Open settings for this extension
- **Open Model: Reload Providers** — Reload model registrations (useful after API key changes)

## Default Models

### Kimi (Moonshot AI)
- moonshot-v1-8k / moonshot-v1-32k / moonshot-v1-128k
- kimi-latest
- kimi-thinking-preview (reasoning)

### DeepSeek
- deepseek-chat (DeepSeek V3)
- deepseek-reasoner (DeepSeek R1)

### GLM (Zhipu AI)
- glm-4-plus
- glm-4-air-250414
- glm-4-flash-250414
- glm-z1-flash (reasoning)
- glm-4-long (1M context)

### Qwen (Alibaba Dashscope)
- qwen-turbo-latest / qwen-plus-latest / qwen-max-latest
- qwen3-235b-a22b / qwen3-30b-a3b
- qwq-plus-latest (reasoning)
