# T003 - 为模型配置添加 vision 和 reasoning 能力标记字段

**优先级:** P1 - 基础重构
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/types.ts` — 在 `ModelConfig` 接口中新增 `supportsVision` 和 `supportsReasoning` 字段

### 具体变更

在 `ModelConfig` 接口中添加：
```ts
export interface ModelConfig {
  id: string;
  name: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  baseUrlOverride?: string;
  /** Whether this model supports image input */
  supportsVision?: boolean;
  /** Whether this model outputs reasoning/thinking tokens */
  supportsReasoning?: boolean;
}
```

## 边界条件

- 两个字段均为可选（`?:`），默认视为 `false`
- 不修改 `package.json` 中的默认模型配置（默认模型的能力标记由消费方推断或后续任务补充）
- 本任务仅做类型定义，不涉及 UI 展示或 API 行为变更

## 测试用例

1. 现有 `ModelConfig` 对象不含新字段时仍类型合法
2. 包含新字段的对象类型合法：
   ```ts
   const m: ModelConfig = { id: 'deepseek-reasoner', name: 'R1', supportsReasoning: true };
   const m2: ModelConfig = { id: 'qwen-vl', name: 'Qwen VL', supportsVision: true };
   ```

## 验收要求

- [ ] `npm run compile` 通过
- [ ] `ModelConfig` 接口包含 `supportsVision?: boolean` 和 `supportsReasoning?: boolean`
- [ ] 不影响现有配置的兼容性
