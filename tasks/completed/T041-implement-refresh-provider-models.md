# T041 - 在 ProviderManager 中实现 refreshProviderModels 方法

**优先级:** P3 - 自动模型发现
**依赖:** T039 (fetchAvailableModels), T040 (mergeFetchedModels)

## 需要修改/增加的内容

### 修改文件

- `src/manager.ts` — 新增 `refreshProviderModels` 方法

### 具体变更

在 `ProviderManager` 类中新增方法：

```ts
import { fetchAvailableModels } from './utils/fetchModels';
import { mergeFetchedModels } from './utils/mergeModels';
import { PROVIDER_METADATA, ProviderName } from './types';

// 在 ProviderManager 类中:
async refreshProviderModels(name: ProviderName): Promise<void> {
  const apiKey = this.getApiKey(name);
  if (!apiKey) {
    return;
  }

  const baseUrl = name === 'custom'
    ? vscode.workspace.getConfiguration('openModel.custom').get<string>('baseUrl', '')
    : PROVIDER_METADATA[name].baseUrl;

  if (!baseUrl) {
    return;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10000);

  try {
    const response = await fetchAvailableModels(baseUrl, apiKey, abortController.signal);
    const existing = getNestedConfig<ModelConfig[]>(name, 'models', []);
    const merged = mergeFetchedModels(response.data, existing);

    await vscode.workspace
      .getConfiguration(`openModel.${name}`)
      .update('models', merged, vscode.ConfigurationTarget.Global);

    this.output.appendLine(
      `[${PROVIDER_METADATA[name].displayName}] Refreshed models: ${merged.length} model(s) available`
    );
  } catch (err) {
    this.output.appendLine(
      `[${PROVIDER_METADATA[name].displayName}] Failed to refresh models: ${err}`
    );
  } finally {
    clearTimeout(timeout);
  }
}
```

## 边界条件

- API Key 为空时直接返回，不发请求
- `baseUrl` 为空时直接返回（custom provider 未配置的情况）
- 请求超时 10 秒，通过 AbortController 实现
- 失败时仅记录日志到 OutputChannel，不抛出异常
- 成功后写入 `ConfigurationTarget.Global`，自动触发 `onDidChangeConfiguration`
- custom provider 的 baseUrl 从配置中动态读取

## 测试用例

1. API Key 为空 → 不发请求，不修改配置
2. baseUrl 为空（custom 未配置）→ 不发请求
3. API 返回成功 → 合并后写入配置，OutputChannel 有日志
4. API 返回 401 → OutputChannel 记录错误，配置不变
5. 请求超时 10 秒 → 中止请求，OutputChannel 记录错误

## 验收要求

- [ ] `ProviderManager` 新增 `refreshProviderModels` 方法
- [ ] 失败时不抛出异常，仅记录日志
- [ ] 成功后配置自动更新并触发 refresh
- [ ] 10 秒超时保护
- [ ] `npm run compile` 通过
