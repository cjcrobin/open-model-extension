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
    "id": "deepseek-v4-flash",
    "name": "DeepSeek V4 Flash",
    "maxInputTokens": 1000000,
    "maxOutputTokens": 393216
  },
  {
    "id": "deepseek-v4-pro",
    "name": "DeepSeek V4 Pro",
    "maxInputTokens": 1000000,
    "maxOutputTokens": 393216
  }
]
```

## Commands

- **Open Model: Configure Providers** — Open settings for this extension
- **Open Model: Reload Providers** — Reload model registrations (useful after API key changes)

## Default Models

### Kimi (Moonshot AI)
| Model ID | Name | Context | Max Output |
|----------|------|---------|------------|
| `kimi-k2.6` | Kimi K2.6 | 256K | 32K |
| `kimi-k2.5` | Kimi K2.5 | 256K | 32K |
| `moonshot-v1-128k` | Moonshot V1 128K | 128K | 16K |
| `moonshot-v1-32k` | Moonshot V1 32K | 32K | 16K |
| `moonshot-v1-8k` | Moonshot V1 8K | 8K | 4K |

### DeepSeek
| Model ID | Name | Context | Max Output |
|----------|------|---------|------------|
| `deepseek-v4-flash` | DeepSeek V4 Flash | 1M | 384K |
| `deepseek-v4-pro` | DeepSeek V4 Pro | 1M | 384K |
| `deepseek-chat` | DeepSeek V3 (Legacy) | 64K | 8K |
| `deepseek-reasoner` | DeepSeek R1 (Legacy) | 64K | 32K |

### GLM (Zhipu AI)
| Model ID | Name | Context | Max Output |
|----------|------|---------|------------|
| `glm-5.1` | GLM-5.1 | 200K | 128K |
| `glm-5` | GLM-5 | 200K | 128K |
| `glm-5-turbo` | GLM-5-Turbo | 200K | 128K |
| `glm-4.7` | GLM-4.7 | 200K | 128K |
| `glm-4.7-flash` | GLM-4.7-Flash (Free) | 200K | 128K |
| `glm-4-long` | GLM-4-Long | 1M | 4K |

### Qwen (Alibaba Dashscope)
| Model ID | Name | Context | Max Output |
|----------|------|---------|------------|
| `qwen3.6-plus` | Qwen3.6-Plus | 1M | 32K |
| `qwen3.6-flash` | Qwen3.6-Flash | 1M | 32K |
| `qwen3.6-max-preview` | Qwen3.6-Max (Preview) | 256K | 32K |
| `qwen3-235b-a22b` | Qwen3-235B-A22B | 128K | 32K |
| `qwen3-32b` | Qwen3-32B | 128K | 32K |
| `qwq-32b` | QwQ-32B (Reasoning) | 128K | 32K |
