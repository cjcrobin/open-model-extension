# T033 - 添加用量统计查看命令

**优先级:** P5 - UX 增强
**依赖:** T028 (用量持久化存储), T029 (流式响应中集成用量计数)

## 需要修改/增加的内容

### 新增文件

- `src/commands/showUsage.ts` — 用量统计查看命令的实现

### 修改文件

- `package.json` — 注册新命令 `openModel.showUsage`
- `src/extension.ts` — 导入并注册用量查看命令

### 具体变更

1. 在 `package.json` 的 `contributes.commands` 中添加：
   ```json
   {
     "command": "openModel.showUsage",
     "title": "Open Model: Show Usage Statistics",
     "category": "Open Model"
   }
   ```

2. 新建 `src/commands/showUsage.ts`：
   ```ts
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

       // Aggregate by provider
       if (!summary.byProvider[r.provider]) {
         summary.byProvider[r.provider] = { inputTokens: 0, outputTokens: 0, requests: 0 };
       }
       summary.byProvider[r.provider].inputTokens += r.inputTokens;
       summary.byProvider[r.provider].outputTokens += r.outputTokens;
       summary.byProvider[r.provider].requests++;

       // Aggregate by model
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

   export function showUsageCommand(store: UsageStore): () => Promise<void> {
     return async () => {
       const records = store.query();
       const summary = aggregate(records);

       // 显示为 OutputChannel 文本报告
       const output = vscode.window.createOutputChannel('Open Model Usage');
       output.clear();
       output.appendLine('=== Open Model Usage Statistics ===\n');
       output.appendLine(`Total Requests: ${summary.totalRequests}`);
       output.appendLine(`Total Input Tokens: ${summary.totalInputTokens.toLocaleString()}`);
       output.appendLine(`Total Output Tokens: ${summary.totalOutputTokens.toLocaleString()}`);
       output.appendLine(`Total Reasoning Tokens: ${summary.totalReasoningTokens.toLocaleString()}`);
       output.appendLine('\n--- By Provider ---');
       for (const [provider, data] of Object.entries(summary.byProvider)) {
         output.appendLine(`${provider}: ${data.requests} requests, ${data.inputTokens.toLocaleString()} in, ${data.outputTokens.toLocaleString()} out`);
       }
       output.appendLine('\n--- By Model ---');
       for (const [model, data] of Object.entries(summary.byModel)) {
         output.appendLine(`${model}: ${data.requests} requests, ${data.inputTokens.toLocaleString()} in, ${data.outputTokens.toLocaleString()} out`);
       }
       output.show();
     };
   }
   ```

## 边界条件

- 无使用记录时显示 "No usage data available"
- token 数使用 `toLocaleString()` 添加千位分隔符
- OutputChannel 复用（不每次创建新 channel）
- 聚合逻辑正确处理空记录

## 测试用例

1. 无记录时 → 显示 "No usage data available"
2. 有记录时 → 显示总数和分类统计
3. 多条同 provider 记录 → byProvider 正确聚合
4. 多条同 model 记录 → byModel 正确聚合

## 验收要求

- [ ] `package.json` 中注册了 `openModel.showUsage` 命令
- [ ] 命令在 OutputChannel 中显示格式化的用量统计
- [ ] 空记录时显示友好提示
- [ ] `npm run compile` 通过
