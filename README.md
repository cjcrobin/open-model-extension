# Open Model — Kimi, DeepSeek, GLM & Qwen for Copilot Chat

> Use **Kimi (Moonshot AI)**, **DeepSeek V4**, **GLM-5 (Zhipu AI)**, and **Qwen3 (Alibaba)** models directly inside **GitHub Copilot Chat** — with streaming, reasoning tokens, and 1M context support.

**Keywords:** `kimi` · `moonshot` · `deepseek` · `deepseek-v4` · `deepseek-r1` · `glm` · `zhipu` · `qwen` · `qwen3` · `qwq` · `copilot chat` · `llm` · `reasoning model` · `china ai`

Integrate **Kimi**, **DeepSeek**, **GLM**, and **Qwen** models into GitHub Copilot Chat as selectable AI models.

## Features

- Register models from Kimi (Moonshot AI), DeepSeek, GLM (Zhipu AI), and Qwen (Alibaba Dashscope) into the Copilot Chat model picker
- Each provider can be independently enabled/disabled
- Secure API key management via VS Code SecretStorage (OS keychain)
- Fully customizable model lists per provider (with sensible defaults)
- Streaming responses with reasoning token support (DeepSeek R1, Kimi Thinking, QwQ)

## Requirements

- VS Code 1.99+
- GitHub Copilot Chat extension

## Setup

1. Install this extension
2. Open Settings (`Ctrl+,`) and search for `Open Model`
3. Enable the providers you want (e.g. `openModel.deepseek.enabled = true`)
4. Press `Ctrl+Shift+P` → **Open Model: Set API Key** to securely configure API keys for each enabled provider (keys are encrypted and stored in your OS keychain)
5. The models will appear in the Copilot Chat model picker

## Configuration

| Setting | Description |
|---------|-------------|
| `openModel.kimi.enabled` | Enable Kimi (Moonshot AI) |
| `openModel.kimi.models` | List of Kimi models to register |
| `openModel.deepseek.enabled` | Enable DeepSeek |
| `openModel.deepseek.models` | List of DeepSeek models to register |
| `openModel.glm.enabled` | Enable GLM (Zhipu AI) |
| `openModel.glm.models` | List of GLM models to register |
| `openModel.qwen.enabled` | Enable Qwen (Alibaba Dashscope) |
| `openModel.qwen.models` | List of Qwen models to register |

### API Key Management

API keys are **never stored in `settings.json`**. Instead, they are saved securely using VS Code's built-in secret storage (which uses your OS keychain — macOS Keychain, Windows Credential Manager, or Linux libsecret).

To set an API key:

1. Press `Ctrl+Shift+P` to open the Command Palette
2. Type **Open Model: Set API Key** and press `Enter`
3. Select a provider from the list
4. Paste your API key in the password-masked input box

The key is encrypted at rest and loaded automatically when the extension starts. You can update a key at any time by running the command again — changes take effect immediately without reloading the window.

> **Tip:** Get your API keys here:
> - [Kimi / Moonshot AI](https://platform.moonshot.cn/)
> - [DeepSeek](https://platform.deepseek.com/)
> - [GLM / Zhipu AI](https://open.bigmodel.cn/)
> - [Qwen / Alibaba Dashscope](https://dashscope.aliyun.com/)

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

| Command | Description |
|---------|-------------|
| **Open Model: Set API Key** | Set a provider's API key securely (encrypted via OS keychain) |
| **Open Model: Configure Providers** | Open settings for this extension (enable/disable providers, customize model lists) |
| **Open Model: Reload Providers** | Reload model registrations |

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
