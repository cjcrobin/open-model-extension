# T035 - 在请求中注入系统提示词

**优先级:** P5 - 系统提示词
**依赖:** T034 (系统提示词配置 schema 已定义)

## 需要修改/增加的内容

### 新增文件

- `src/utils/systemPrompt.ts` — 系统提示词解析和匹配逻辑

### 修改文件

- `src/provider.ts` — 在 `convertMessages` 或 `provideLanguageModelChatResponse` 中注入 system prompt

### 具体变更

1. 新建 `src/utils/systemPrompt.ts`：
   ```ts
   import * as vscode from 'vscode';

   interface PromptTemplate {
     id: string;
     name: string;
     content: string;
     providers?: string[];
     modelIds?: string[];
   }

   export function resolveSystemPrompt(
     providerName: string,
     modelId: string
   ): string | undefined {
     const config = vscode.workspace.getConfiguration('openModel');
     const activeId = config.get<string>('activeSystemPrompt', '');
     if (!activeId) return undefined;

     const templates = config.get<PromptTemplate[]>('systemPrompts', []);
     const template = templates.find((t) => t.id === activeId);
     if (!template) return undefined;

     // Check provider filter
     if (template.providers && template.providers.length > 0) {
       if (!template.providers.includes(providerName)) return undefined;
     }

     // Check model filter
     if (template.modelIds && template.modelIds.length > 0) {
       if (!template.modelIds.includes(modelId)) return undefined;
     }

     return template.content;
   }
   ```

2. 在 `provider.ts` 的 `provideLanguageModelChatResponse` 中，在 `convertedMessages` 之前注入 system message：
   ```ts
   const systemPrompt = resolveSystemPrompt(this.providerName, model.id);
   if (systemPrompt) {
     convertedMessages.unshift({ role: 'system', content: systemPrompt });
   }
   ```

## 边界条件

- `activeSystemPrompt` 为空时不注入任何 system prompt
- 模板的 `providers` 或 `modelIds` 过滤不匹配时跳过该模板
- 如果消息列表中已有 system 消息，将系统提示词与其合并（拼接在已有 system 消息之前）还是替换，需明确策略
- 建议策略：始终作为独立的 system message 插入到消息列表最前面

## 测试用例

1. `activeSystemPrompt` 为空 → 不注入
2. 模板匹配 provider 和 model → 注入 system message
3. 模板的 providers 过滤不匹配 → 不注入
4. 模板的 modelIds 过滤不匹配 → 不注入
5. 模板的 providers 和 modelIds 都为空 → 匹配所有

## 验收要求

- [ ] `src/utils/systemPrompt.ts` 存在并导出 `resolveSystemPrompt`
- [ ] 匹配的 system prompt 正确注入到请求消息中
- [ ] 不匹配时不注入
- [ ] `npm run compile` 通过
