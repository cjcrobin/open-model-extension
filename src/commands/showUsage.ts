import * as vscode from 'vscode';
import { UsageStore } from '../storage/usageStore';
import { UsageSummary, TokenUsageRecord } from '../types/usage';

function aggregate(records: TokenUsageRecord[]): UsageSummary {
  const summary: UsageSummary = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalReasoningTokens: 0,
    totalRequests: 0,
    byProvider: {},
    byModel: {},
  };

  for (const r of records) {
    summary.totalInputTokens += r.inputTokens;
    summary.totalOutputTokens += r.outputTokens;
    summary.totalReasoningTokens += r.reasoningTokens ?? 0;
    summary.totalRequests++;

    if (!summary.byProvider[r.provider]) {
      summary.byProvider[r.provider] = { inputTokens: 0, outputTokens: 0, requests: 0 };
    }
    summary.byProvider[r.provider].inputTokens += r.inputTokens;
    summary.byProvider[r.provider].outputTokens += r.outputTokens;
    summary.byProvider[r.provider].requests++;

    const modelKey = `${r.provider}/${r.modelId}`;
    if (!summary.byModel[modelKey]) {
      summary.byModel[modelKey] = { inputTokens: 0, outputTokens: 0, requests: 0 };
    }
    summary.byModel[modelKey].inputTokens += r.inputTokens;
    summary.byModel[modelKey].outputTokens += r.outputTokens;
    summary.byModel[modelKey].requests++;
  }

  return summary;
}

let outputChannel: vscode.OutputChannel | undefined;

export function showUsageCommand(store: UsageStore): () => Promise<void> {
  return async () => {
    const records = store.query();

    if (!outputChannel) {
      outputChannel = vscode.window.createOutputChannel('Open Model Usage');
    }

    outputChannel.clear();

    if (records.length === 0) {
      outputChannel.appendLine('No usage data available.');
      outputChannel.show();
      return;
    }

    const summary = aggregate(records);

    outputChannel.appendLine('=== Open Model Usage Statistics ===\n');
    outputChannel.appendLine(`Total Requests: ${summary.totalRequests}`);
    outputChannel.appendLine(`Total Input Tokens: ${summary.totalInputTokens.toLocaleString()}`);
    outputChannel.appendLine(`Total Output Tokens: ${summary.totalOutputTokens.toLocaleString()}`);
    outputChannel.appendLine(`Total Reasoning Tokens: ${summary.totalReasoningTokens.toLocaleString()}`);

    outputChannel.appendLine('\n--- By Provider ---');
    for (const [provider, data] of Object.entries(summary.byProvider)) {
      outputChannel.appendLine(
        `${provider}: ${data.requests} requests, ${data.inputTokens.toLocaleString()} in, ${data.outputTokens.toLocaleString()} out`
      );
    }

    outputChannel.appendLine('\n--- By Model ---');
    for (const [model, data] of Object.entries(summary.byModel)) {
      outputChannel.appendLine(
        `${model}: ${data.requests} requests, ${data.inputTokens.toLocaleString()} in, ${data.outputTokens.toLocaleString()} out`
      );
    }

    outputChannel.show();
  };
}
