# Open Model — Kimi, DeepSeek, GLM, Qwen, Doubao & MiniMax for Copilot Chat

> Use **Kimi (Moonshot AI)**, **DeepSeek V4**, **GLM-5 (Zhipu AI)**, **Qwen3 (Alibaba)**, **Doubao (ByteDance)**, and **MiniMax** models directly inside **GitHub Copilot Chat** — with streaming, reasoning tokens, and 1M context support.

**Keywords:** `kimi` · `moonshot` · `deepseek` · `deepseek-v4` · `deepseek-r1` · `glm` · `zhipu` · `qwen` · `qwen3` · `qwq` · `doubao` · `bytedance` · `minimax` · `abab` · `copilot chat` · `llm` · `reasoning model` · `china ai`

Integrate **Kimi**, **DeepSeek**, **GLM**, **Qwen**, **Doubao**, and **MiniMax** models into GitHub Copilot Chat as selectable AI models.

## Features

- Register models from Kimi (Moonshot AI), DeepSeek, GLM (Zhipu AI), Qwen (Alibaba Dashscope), Doubao (ByteDance), MiniMax, and custom OpenAI-compatible providers into the Copilot Chat model picker
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
- On-demand model discovery from provider APIs via the **Refresh Models from API** command
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
| `openModel.{provider}.enabled` | Enable a provider (`kimi`, `deepseek`, `glm`, `qwen`, `doubao`, `minimax`, `custom`) |
| `openModel.{provider}.models` | List of models for a provider |
| `openModel.{provider}.baseUrl` | Override the built-in base URL for a provider (leave empty to use the default) |
| `openModel.{provider}.extraHeaders` | Extra HTTP headers (object, string values) merged into every request for a provider |
| `openModel.{provider}.requestParams` | Advanced request parameters (temperature, topP, etc.) |
| `openModel.custom.baseUrl` | Base URL for the custom OpenAI-compatible provider |
| `openModel.custom.vendorName` | Display name for the custom provider |
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
> - [Doubao / ByteDance](https://console.volcengine.com/ark/)
> - [MiniMax](https://platform.minimaxi.com/)

### Interactive Configuration

Two command-palette wizards let you set up providers without hand-editing
`settings.json`:

- **Open Model: Configure Provider** — pick a provider and the wizard
  walks you through the required inputs:
  - Built-in vendors (DeepSeek, GLM, Qwen, Doubao, MiniMax): enter the
    API key.
  - **Custom**: enter the base URL, then optionally an API key (leave
    blank for keyless local endpoints such as Ollama or vLLM).
  - **Kimi**: first choose between *Kimi Code* (Coding Plan gateway)
    and *Kimi AI Platform* (Moonshot's open API), then enter the API
    key. See [Kimi: Code vs AI Platform](#kimi-code-vs-ai-platform)
    below for the differences.
- **Open Model: Toggle Provider** — lists every provider with its
  current `Enabled` / `Disabled` state. Selecting one flips
  `openModel.<provider>.enabled`.

> **Configure vs Set API Key:** `Open Model: Set API Key` changes only
> the key for a single provider you already picked. `Configure Provider`
> is the full onboarding wizard — it's what you want the first time you
> add a provider, or when you switch Kimi between Code and AI Platform.
> Both commands store the key in VS Code Secret Storage.

### Custom Model Example

Add a custom model to a provider by editing the `models` array in settings:

```json
"openModel.deepseek.models": [
  {
    "id": "deepseek-v4-flash",
    "name": "DeepSeek V4 Flash",
    "maxInputTokens": 1000000,
    "maxOutputTokens": 393216,
    "supportsVision": true
  },
  {
    "id": "deepseek-reasoner",
    "name": "DeepSeek R1",
    "maxInputTokens": 65536,
    "maxOutputTokens": 32768,
    "supportsReasoning": true
  }
]
```

### Kimi: Code vs AI Platform

Kimi ships in two flavours that share the `openModel.kimi.*` settings
namespace but differ in endpoint, default model list, and required
headers. The extension infers which one you're on from
`openModel.kimi.baseUrl` — there is no extra `variant` field.

| Variant | Base URL | Default models | Required headers |
|---------|----------|----------------|------------------|
| **Kimi Code** (Coding Plan gateway) | `https://api.kimi.com/coding/v1` | `kimi-for-coding` | `User-Agent: KimiCLI/1.5`, `X-Client-Name: KimiCLI` |
| **Kimi AI Platform** (Moonshot open API) | `https://api.moonshot.cn/v1` | `kimi-k2.6`, `kimi-k2.5` | — |

**Picking a variant interactively.** Run **Open Model: Configure
Provider**, choose *Kimi*, then pick *Kimi Code* or *Kimi AI Platform*
in the second step. The wizard writes the matching `baseUrl`,
`extraHeaders`, and default model list for you.

**Picking a variant by hand.** Edit `settings.json` directly — the
provider re-resolves the variant on every request, so no restart is
required:

```jsonc
// Kimi Code
"openModel.kimi.baseUrl": "https://api.kimi.com/coding/v1",
"openModel.kimi.extraHeaders": {
  "User-Agent": "KimiCLI/1.5",
  "X-Client-Name": "KimiCLI"
},
"openModel.kimi.models": [
  { "id": "kimi-for-coding", "name": "Kimi for Coding", "maxInputTokens": 262144, "maxOutputTokens": 32768, "supportsVision": true }
]

// Kimi AI Platform
"openModel.kimi.baseUrl": "https://api.moonshot.cn/v1",
"openModel.kimi.extraHeaders": {},
"openModel.kimi.models": [
  { "id": "kimi-k2.6", "name": "Kimi K2.6", "maxInputTokens": 262144, "maxOutputTokens": 32768, "supportsVision": true },
  { "id": "kimi-k2.5", "name": "Kimi K2.5", "maxInputTokens": 262144, "maxOutputTokens": 32768, "supportsVision": true }
]
```

> **Why the extra headers for Kimi Code?** The `/coding/v1` gateway
> only serves whitelisted coding agents. If the `User-Agent` does not
> look like one of the known agents (KimiCLI, Claude Code, Roo Code,
> Kilo Code, …) the gateway returns `access_terminated_error`. Setting
> `User-Agent: KimiCLI/1.5` is what lets this extension through.

### Image / Vision Support

This extension supports image input in two ways:

#### Direct Vision Support

Models with `supportsVision: true` in their configuration can process images directly. When you select such a model in Copilot Chat, you can paste or drag images into the chat — they are sent to the model's API as multimodal content (base64-encoded `image_url`).

Several default models already have `supportsVision: true` set (marked with "Yes" in the Vision column of the [Default Models](#default-models) tables below). You can also enable vision on any model by setting `"supportsVision": true` in its config.

#### Image Understanding Fallback

For models that don't natively support vision, you can designate a vision-capable model to describe images on their behalf:

1. Open Settings and search for `Open Model`
2. Set `openModel.imageUnderstandingModel.provider` to a provider with vision support (e.g., `deepseek`)
3. Set `openModel.imageUnderstandingModel.modelId` to a vision model ID (e.g., `deepseek-v4-flash`)
4. Ensure the vision model's provider has an API key configured (via **Open Model: Set API Key**)

When you send an image to a non-vision model with this fallback configured, the extension will:
1. Send the image to the designated vision model for description
2. Replace the image with the text description
3. Forward the text-only conversation to your active model

#### How Image Support Is Advertised

| Condition | Model shows image support in picker |
|-----------|-------------------------------------|
| Model has `supportsVision: true` | Yes — images processed directly |
| Model without vision + `imageUnderstandingModel` configured | Yes — images handled via fallback |
| Model without vision + no fallback configured | No — images cannot be attached |
| Models from other extensions | Unaffected by this extension |

If no image understanding model is configured and the active model doesn't support vision, images cannot be attached in Copilot Chat (the image attachment UI will show a strikethrough).

## Commands

| Command | Description |
|---------|-------------|
| **Open Model: Set API Key** | Set a provider's API key securely (encrypted via OS keychain) |
| **Open Model: Clear API Key** | Remove a provider's stored API key |
| **Open Model: Test Connection** | Test API connectivity for a provider |
| **Open Model: Configure Providers** | Open settings for this extension |
| **Open Model: Configure Provider** | Interactive wizard: pick a provider → enter URL/key/variant (recommended for first-time setup and for switching Kimi between Code and AI Platform) |
| **Open Model: Toggle Provider** | Flip a provider's `enabled` flag (QuickPick lists every provider with its current state) |
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

### Doubao (ByteDance)
| Model ID | Name | Context | Max Output | Vision |
|----------|------|---------|------------|--------|
| `doubao-pro-32k` | Doubao Pro 32K | 32K | 4K | |
| `doubao-pro-128k` | Doubao Pro 128K | 128K | 4K | |
| `doubao-lite-32k` | Doubao Lite 32K | 32K | 4K | |
| `doubao-lite-128k` | Doubao Lite 128K | 128K | 4K | |
| `doubao-vision-pro-32k` | Doubao Vision Pro 32K | 32K | 4K | Yes |

### MiniMax
| Model ID | Name | Context | Max Output | Vision |
|----------|------|---------|------------|--------|
| `MiniMax-Text-01` | MiniMax Text 01 | 1M | 16K | |
| `abab6.5s-chat` | ABAB 6.5s | 245K | 4K | |
| `abab6.5-chat` | ABAB 6.5 | 8K | 4K | |
| `abab5.5-chat` | ABAB 5.5 | 16K | 4K | |

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
- `streamParsing.test.ts` — SSE line parsing (OpenAI + Kimi compact format)
- `tokenCounting.test.ts` — CJK-aware token estimation
- `modelsTypes.test.ts` — API response type definitions
- `fetchModels.test.ts` — HTTP model fetching with mock
- `mergeModels.test.ts` — fetched/existing model merging logic
- `refreshProviderModels.test.ts` — provider refresh flow (fetch, merge, persist)
- `extensionRefresh.test.ts` — manual refresh command
- `describeImages.test.ts` — vision model image description utility
- `imageUnderstanding.test.ts` — image understanding fallback integration
- `kimiVariant.test.ts` — Kimi Code vs AI Platform variant resolver
- `providerExtraHeaders.test.ts` — dynamic per-variant request headers + baseUrl from configuration
- `configureProvider.test.ts` — Configure Provider wizard (builtin / custom / Kimi flows)
- `toggleProvider.test.ts` — Toggle Provider command
- `interactiveConfigFlow.test.ts` — end-to-end interactive configure + toggle scenarios

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
| Image input (vision model) | Select a model with `supportsVision: true` → attach image → verify model describes it |
| Image input (non-vision fallback) | Configure `imageUnderstandingModel` → select non-vision model → attach image → check Output channel for fallback log |

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
  extension.ts          — Extension entry point, command registration
  provider.ts           — OpenAI-compatible chat provider, SSE streaming
  manager.ts            — Provider lifecycle, API key cache, model refresh
  types.ts              — Shared type definitions (ModelConfig, ProviderName, KimiVariant, API types)
  errors.ts             — Friendly error messages
  retry.ts              — Exponential backoff retry logic
  commands/             — Command implementations (configureProvider, toggleProvider, export/import config, usage stats)
  storage/              — Usage data persistence (globalState)
  types/                — Usage type definitions (TokenUsageRecord, UsageSummary)
  ui/                   — Status bar indicator
  utils/                — System prompt, model fetching/merging, image description, Kimi variant resolver
  webview/              — WebView configuration panel
  test/                 — Unit tests (vitest)
media/                  — WebView static assets (CSS/JS)
```

