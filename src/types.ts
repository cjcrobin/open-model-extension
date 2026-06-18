export interface ModelConfig {
  id: string;
  name: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  /** Override the default base URL for this specific model */
  baseUrlOverride?: string;
  /** Whether this model supports image input */
  supportsVision?: boolean;
  /** Whether this model outputs reasoning/thinking tokens */
  supportsReasoning?: boolean;
}

export interface RequestParams {
  /** Sampling temperature, 0-2 */
  temperature?: number;
  /** Nucleus sampling parameter, 0-1 */
  topP?: number;
  /** Frequency penalty, -2 to 2 */
  frequencyPenalty?: number;
  /** Presence penalty, -2 to 2 */
  presencePenalty?: number;
  /** Stop sequences */
  stop?: string | string[];
  /** Provider-specific extra parameters, passed as-is */
  extra?: Record<string, unknown>;
}

export type ProviderName = 'kimi' | 'deepseek' | 'glm' | 'qwen' | 'doubao' | 'minimax' | 'custom';

export const PROVIDER_NAMES: readonly ProviderName[] = ['kimi', 'deepseek', 'glm', 'qwen', 'doubao', 'minimax', 'custom'];

export const PROVIDER_METADATA: Record<
  ProviderName,
  {
    displayName: string;
    baseUrl: string;
    /** Vendor-specific headers merged into every request for this provider. */
    extraHeaders?: Record<string, string>;
  }
> = {
  kimi: {
    displayName: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
  },
  deepseek: {
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
  },
  glm: {
    displayName: 'GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  qwen: {
    displayName: 'Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  doubao: {
    displayName: 'Doubao',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  minimax: {
    displayName: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
  },
  custom: {
    displayName: 'Custom',
    baseUrl: '',
  },
};

/**
 * Kimi ships in two flavours that share the same provider name but differ in
 * endpoint / required headers / default model list:
 *   - 'code'         : Kimi For Coding gateway (whitelisted, requires KimiCLI UA).
 *   - 'ai-platform'  : Moonshot open platform (plain OpenAI-compatible API).
 * The active variant is inferred from `openModel.kimi.baseUrl` — no extra
 * settings field is stored.
 */
export type KimiVariant = 'code' | 'ai-platform';

export interface KimiVariantMeta {
  displayName: string;
  description: string;
  baseUrl: string;
  defaultModels: ModelConfig[];
  extraHeaders?: Record<string, string>;
}

export const KIMI_VARIANT_METADATA: Record<KimiVariant, KimiVariantMeta> = {
  code: {
    displayName: 'Kimi Code',
    description: 'Coding Plan — whitelisted coding-agent gateway (requires KimiCLI User-Agent).',
    baseUrl: 'https://api.kimi.com/coding/v1',
    defaultModels: [
      {
        id: 'kimi-for-coding',
        name: 'Kimi for Coding',
        maxInputTokens: 262144,
        maxOutputTokens: 32768,
        supportsVision: true,
      },
    ],
    extraHeaders: {
      'User-Agent': 'KimiCLI/1.5',
      'X-Client-Name': 'KimiCLI',
    },
  },
  'ai-platform': {
    displayName: 'Kimi AI Platform',
    description: 'Moonshot open platform — plain OpenAI-compatible API.',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModels: [
      {
        id: 'kimi-k2.6',
        name: 'Kimi K2.6',
        maxInputTokens: 262144,
        maxOutputTokens: 32768,
        supportsVision: true,
      },
      {
        id: 'kimi-k2.5',
        name: 'Kimi K2.5',
        maxInputTokens: 262144,
        maxOutputTokens: 32768,
        supportsVision: true,
      },
    ],
  },
};

export interface FetchedModel {
  id: string;
  object: string;
  owned_by?: string;
}

export interface ModelsApiResponse {
  object: string;
  data: FetchedModel[];
}

export interface ImageUnderstandingConfig {
  provider: ProviderName | '';
  modelId: string;
}
