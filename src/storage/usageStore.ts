import * as vscode from 'vscode';
import { TokenUsageRecord, UsageFilter } from '../types/usage';

export class UsageStore implements vscode.Disposable {
  private records: TokenUsageRecord[] = [];
  private readonly storageKey = 'openModel.usageRecords';
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.records = context.globalState.get<TokenUsageRecord[]>(this.storageKey, []);
  }

  async addRecord(record: TokenUsageRecord): Promise<void> {
    this.records.push(record);
    await this.persist();
  }

  query(filter?: UsageFilter): TokenUsageRecord[] {
    return this.records.filter((r) => {
      if (filter?.startDate && r.timestamp < filter.startDate) return false;
      if (filter?.endDate && r.timestamp > filter.endDate) return false;
      if (filter?.provider && r.provider !== filter.provider) return false;
      if (filter?.modelId && r.modelId !== filter.modelId) return false;
      return true;
    });
  }

  async clear(): Promise<void> {
    this.records = [];
    await this.persist();
  }

  getAll(): readonly TokenUsageRecord[] {
    return this.records;
  }

  private async persist(): Promise<void> {
    await this.context.globalState.update(this.storageKey, this.records);
  }

  dispose(): void {
    // nothing to dispose
  }
}
