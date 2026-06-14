/** Token usage for a single API request */
export interface TokenUsageRecord {
  provider: string;
  modelId: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  timestamp: string;
  durationMs: number;
}

/** Aggregated usage statistics */
export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalReasoningTokens: number;
  totalRequests: number;
  byProvider: Record<string, {
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }>;
  byModel: Record<string, {
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }>;
}

/** Filter options for querying usage */
export interface UsageFilter {
  startDate?: string;
  endDate?: string;
  provider?: string;
  modelId?: string;
}
