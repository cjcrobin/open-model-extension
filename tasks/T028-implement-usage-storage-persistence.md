# T028 - 实现 Token 用量持久化存储

**优先级:** P4 - 用量追踪
**依赖:** T027 (TokenUsage 数据结构已定义)

## 需要修改/增加的内容

### 新增文件

- `src/storage/usageStore.ts` — Token 用量的持久化存储层

### 具体变更

```ts
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

  /** Record a new usage entry */
  async addRecord(record: TokenUsageRecord): Promise<void> {
    this.records.push(record);
    await this.persist();
  }

  /** Query records with optional filters */
  query(filter?: UsageFilter): TokenUsageRecord[] {
    return this.records.filter((r) => {
      if (filter?.startDate && r.timestamp < filter.startDate) return false;
      if (filter?.endDate && r.timestamp > filter.endDate) return false;
      if (filter?.provider && r.provider !== filter.provider) return false;
      if (filter?.modelId && r.modelId !== filter.modelId) return false;
      return true;
    });
  }

  /** Clear all records */
  async clear(): Promise<void> {
    this.records = [];
    await this.persist();
  }

  /** Get all records (unfiltered) */
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
```

## 边界条件

- 使用 `vscode.ExtensionContext.globalState` 存储，跨 workspace 持久化
- 存储容量有上限（VS Code globalState 建议 < 10MB），需考虑后续清理策略
- 读写操作为异步，`addRecord` 需 await 持久化完成
- 数据以 JSON 数组形式序列化存储

## 测试用例

1. `addRecord` 后 `getAll` 返回包含新记录
2. `query` 按 `startDate`/`endDate` 过滤正确
3. `query` 按 `provider` 过滤正确
4. `query` 按 `modelId` 过滤正确
5. `clear` 后 `getAll` 返回空数组
6. 多条件组合过滤正确

## 验收要求

- [ ] `src/storage/usageStore.ts` 文件存在
- [ ] `UsageStore` 类使用 `ExtensionContext.globalState` 持久化
- [ ] 支持增删查操作
- [ ] `npm run compile` 通过
