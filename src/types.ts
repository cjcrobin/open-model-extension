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

export type ProviderName = 'kimi' | 'deepseek' | 'glm' | 'qwen';

export const PROVIDER_NAMES: readonly ProviderName[] = ['kimi', 'deepseek', 'glm', 'qwen'];

export const PROVIDER_METADATA: Record<
  ProviderName,
  {
    displayName: string;
    baseUrl: string;
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
};
