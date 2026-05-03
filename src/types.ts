export interface ModelConfig {
  id: string;
  name: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export type ProviderName = 'kimi' | 'deepseek' | 'glm' | 'qwen';

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
