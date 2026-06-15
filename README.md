# Open Model — Kimi, DeepSeek, GLM & Qwen for Copilot Chat

> Use **Kimi (Moonshot AI)**, **DeepSeek V4**, **GLM-5 (Zhipu AI)**, and **Qwen3 (Alibaba)** models directly inside **GitHub Copilot Chat** — with streaming, reasoning tokens, and 1M context support.

**Keywords:** `kimi` · `moonshot` · `deepseek` · `deepseek-v4` · `deepseek-r1` · `glm` · `zhipu` · `qwen` · `qwen3` · `qwq` · `copilot chat` · `llm` · `reasoning model` · `china ai`

Integrate **Kimi**, **DeepSeek**, **GLM**, and **Qwen** models into GitHub Copilot Chat as selectable AI models.

## Features

- Register models from Kimi (Moonshot AI), DeepSeek, GLM (Zhipu AI), Qwen (Alibaba Dashscope), and custom OpenAI-compatible providers into the Copilot Chat model picker
- Each provider can be independently enabled/disabled
- Secure API key management via VS Code SecretStorage (OS keychain)
- Fully customizable model lists per provider (with sensible defaults)
- Streaming responses with reasoning token support (DeepSeek R1, Kimi Thinking, QwQ)
- CJK-aware token counting
- Token usage tracking and statistics
- System prompt templates with provider/model filtering
- Base URL override per model (for proxy or self-hosted endpoints)
- Advanced request parameters (temperature, top_p, frequency/presence penalty)
- Config import/export
- WebView configuration panel
- Status bar indicator for enabled providers
- Test connection command for API key verification
- Automatic model discovery from provider APIs with manual refresh command
- Image/vision input for multimodal models (attach images directly in Copilot Chat)

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
| `openModel.{provider}.enabled` | Enable a provider (kimi, deepseek, glm, qwen, custom) |
| `openModel.{provider}.models` | List of models for a provider |
| `openModel.{provider}.requestParams` | Advanced request parameters (temperature, topP, etc.) |
| `openModel.custom.baseUrl` | Base URL for custom OpenAI-compatible provider |
| `openModel.custom.vendorName` | Display name for custom provider |
| `openModel.systemPrompts` | System prompt templates |
| `openModel.activeSystemPrompt` | ID of the active system prompt template |
| `openModel.imageUnderstandingModel` | Designated vision model for image description fallback |

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

### Image Understanding for Non-Vision Models

If your active model doesn't support image input (vision), you can designate a vision-capable model to describe images on its behalf:

1. Open Settings and search for `Open Model`
2. Set `openModel.imageUnderstandingModel.provider` to a provider with vision support (e.g., `deepseek`)
3. Set `openModel.imageUnderstandingModel.modelId` to a vision model ID (e.g., `deepseek-v4-flash`)

When you send an image to a non-vision model, the extension will:
1. Send the image to the designated vision model for description
2. Replace the image with the text description
3. Forward the text-only conversation to your active model

If no image understanding model is configured, images sent to non-vision models are silently removed.

## Commands

| Command | Description |
|---------|-------------|
| **Open Model: Set API Key** | Set a provider's API key securely (encrypted via OS keychain) |
| **Open Model: Clear API Key** | Remove a provider's stored API key |
| **Open Model: Test Connection** | Test API connectivity for a provider |
| **Open Model: Configure Providers** | Open settings for this extension |
| **Open Model: Reload Providers** | Reload model registrations |
| **Open Model: Export Configuration** | Export non-sensitive config to a JSON file |
| **Open Model: Import Configuration** | Import config from a JSON file |
| **Open Model: Show Usage Statistics** | Display token usage report in Output panel |
| **Open Model: Open Configuration Panel** | Open the WebView configuration panel |
| **Open Model: Refresh Models from API** | Fetch latest models from provider APIs and merge with existing config |

## Default Models

### Kimi (Moonshot AI)
| Model ID | Name | Context | Max Output | Vision |
|----------|------|---------|------------|--------|
| `kimi-k2.6` | Kimi K2.6 | 256K | 32K | Yes |
| `kimi-k2.5` | Kimi K2.5 | 256K | 32K | Yes |
| `moonshot-v1-128k` | Moonshot V1 128K | 128K | 16K | |
| `moonshot-v1-32k` | Moonshot V1 32K | 32K | 16K | |
| `moonshot-v1-8k` | Moonshot V1 8K | 8K | 4K | |

### DeepSeek
| Model ID | Name | Context | Max Output | Vision |
|----------|------|---------|------------|--------|
| `deepseek-v4-flash` | DeepSeek V4 Flash | 1M | 384K | Yes |
| `deepseek-v4-pro` | DeepSeek V4 Pro | 1M | 384K | Yes |
| `deepseek-chat` | DeepSeek V3 (Legacy) | 64K | 8K | |
| `deepseek-reasoner` | DeepSeek R1 (Legacy) | 64K | 32K | |

### GLM (Zhipu AI)
| Model ID | Name | Context | Max Output | Vision |
|----------|------|---------|------------|--------|
| `glm-5.1` | GLM-5.1 | 200K | 128K | Yes |
| `glm-5` | GLM-5 | 200K | 128K | Yes |
| `glm-5-turbo` | GLM-5-Turbo | 200K | 128K | |
| `glm-4.7` | GLM-4.7 | 200K | 128K | Yes |
| `glm-4.7-flash` | GLM-4.7-Flash (Free) | 200K | 128K | |
| `glm-4-long` | GLM-4-Long | 1M | 4K | |

### Qwen (Alibaba Dashscope)
| Model ID | Name | Context | Max Output | Vision |
|----------|------|---------|------------|--------|
| `qwen3.6-plus` | Qwen3.6-Plus | 1M | 32K | Yes |
| `qwen3.6-flash` | Qwen3.6-Flash | 1M | 32K | Yes |
| `qwen3.6-max-preview` | Qwen3.6-Max (Preview) | 256K | 32K | |
| `qwen3-235b-a22b` | Qwen3-235B-A22B | 128K | 32K | |
| `qwen3-32b` | Qwen3-32B | 128K | 32K | |
| `qwq-32b` | QwQ-32B (Reasoning) | 128K | 32K | |

## Development

### Prerequisites

- **Node.js** >= 24 (LTS recommended)
- **npm** >= 10
- **VS Code** >= 1.99
- **GitHub Copilot Chat** extension installed in your local VS Code (required to test model picker integration)

### Environment Setup

#### Option A: Dev Container (Recommended)

This project includes a pre-configured [Dev Container](https://code.visualstudio.com/docs/devcontainers/containers) for isolated development:

1. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension in VS Code
2. Open the project folder and click **Reopen in Container** when prompted (or run `Dev Containers: Reopen in Container` from the Command Palette)
3. Wait for the container to build — `npm install` runs automatically via `postCreateCommand`

The Dev Container provides:
- Pre-configured Node.js + TypeScript environment
- Isolated `node_modules` and npm cache (volume-mounted, won't pollute host)
- All dependencies installed automatically

#### Option B: Local Machine

```bash
# Clone the repository
git clone https://github.com/cjcrobin/open-model-extension.git
cd open-model-extension

# Install dependencies
npm install
```

### Build

```bash
# One-time compile (development mode)
npm run compile

# Watch mode (auto-rebuild on file changes)
npm run watch
```

Output goes to `dist/extension.js` (bundled by webpack).

### Run Unit Tests

Unit tests use [Vitest](https://vitest.dev/) and run without VS Code (pure function tests with mocked `vscode` module):

```bash
npm test
```

Test files are in `src/test/`:
- `convertMessages.test.ts` — message format conversion
- `streamParsing.test.ts` — SSE line parsing
- `tokenCounting.test.ts` — CJK-aware token estimation
- `modelsTypes.test.ts` — API response type definitions
- `fetchModels.test.ts` — HTTP model fetching with mock
- `mergeModels.test.ts` — fetched/existing model merging logic
- `refreshProviderModels.test.ts` — provider refresh flow (fetch, merge, persist)
- `extensionRefresh.test.ts` — startup auto-refresh and manual refresh command
- `describeImages.test.ts` — vision model image description utility
- `imageUnderstanding.test.ts` — image understanding fallback integration

### Local Integration Testing (Extension Host)

This is the primary way to test the extension end-to-end inside a real VS Code instance.

#### Step-by-step

1. **Open the project in VS Code**
   ```bash
   code .
   ```

2. **Install dependencies and build** (if not done already)
   ```bash
   npm install
   npm run compile
   ```

3. **Press `F5`** (or go to **Run and Debug** panel, select **Run Extension**)
   - This launches a new **Extension Development Host** VS Code window with the extension loaded
   - The pre-configured `.vscode/launch.json` handles `--extensionDevelopmentPath` automatically

4. **In the Extension Host window:**
   - Open Settings (`Ctrl+,`) and search for `Open Model`
   - Enable a provider (e.g. `openModel.deepseek.enabled = true`)
   - Run `Ctrl+Shift+P` → **Open Model: Set API Key** to configure an API key
   - Open **GitHub Copilot Chat**, click the model picker — your registered models should appear
   - Test streaming by sending a chat message to a registered model
   - Test commands: Clear API Key, Test Connection, Show Usage Statistics, etc.

5. **Debugging**: Set breakpoints in `.ts` source files in the original VS Code window — they will be hit in the Extension Host

6. **Iterate**: Edit code → the watch task rebuilds → press `Ctrl+Shift+P` → **Developer: Reload Window** in the Extension Host to pick up changes

#### Testing specific features

| Feature | How to test |
|---------|-------------|
| Model registration | Enable provider → check Copilot Chat model picker |
| API key flow | Set / Clear / Test Connection commands |
| Streaming | Send a chat message to a registered model |
| Reasoning tokens | Use `deepseek-reasoner` or `qwq-32b` — check thinking block appears |
| CJK token counting | Check "Open Model" Output channel for token estimates |
| Usage tracking | Send messages → run **Show Usage Statistics** |
| Config export/import | Export config → edit file → import back |
| Status bar | Check bottom-right status bar shows enabled providers |
| WebView panel | Run **Open Configuration Panel** → toggle providers, add/remove models |
| System prompt | Set `openModel.activeSystemPrompt` to a template ID → send a chat |
| Base URL override | Set `baseUrlOverride` on a model → check requests go to custom URL |
| Model auto-refresh | Run **Refresh Models from API** → check Output channel for fetched model count |
| Image input | Attach an image in Copilot Chat with a vision-capable model → verify model describes the image |
| Image understanding fallback | Send image to non-vision model with imageUnderstandingModel configured → check Output channel for fallback log |

### Package as VSIX

```bash
# Production build (minified, no source maps)
npm run package

# Package into a .vsix file
npx @vscode/vsce package
```

The resulting `open-model-*.vsix` can be installed via:
```bash
code --install-extension open-model-*.vsix
```

### Lint

```bash
npm run lint
```

### Project Structure

```
src/
  extension.ts          — Extension entry point, command registration, auto-refresh
  provider.ts           — OpenAI-compatible chat provider, SSE streaming
  manager.ts            — Provider lifecycle, API key cache, model refresh
  types.ts              — Shared type definitions (ModelConfig, ProviderName, API types)
  errors.ts             — Friendly error messages
  retry.ts              — Exponential backoff retry logic
  commands/             — Command implementations (export/import config, usage stats)
  storage/              — Usage data persistence (globalState)
  types/                — Usage type definitions (TokenUsageRecord, UsageSummary)
  ui/                   — Status bar indicator
  utils/                — System prompt, model fetching, model merging
  webview/              — WebView configuration panel
  test/                 — Unit tests (vitest)
media/                  — WebView static assets (CSS/JS)
```

