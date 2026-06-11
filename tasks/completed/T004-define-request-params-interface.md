# T004 - 定义 RequestParams 接口用于高级请求参数配置

**优先级:** P2 - 基础重构
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/types.ts` — 新增 `RequestParams` 接口

### 具体变更

在 `src/types.ts` 中新增：
```ts
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
```

## 边界条件

- 所有字段可选，用户只需配置想覆盖的参数
- `extra` 字段用于传递各 provider 特有的参数（如 DeepSeek 的 `reasoning_effort`）
- 参数命名使用 camelCase（TypeScript 风格），在发送 API 请求时需转换为 snake_case（由消费方任务处理）
- `temperature` 和 `topP` 不应同时设置（OpenAI 文档建议），但本任务不做运行时校验

## 测试用例

1. 空对象 `{}` 是合法的 `RequestParams`
2. 完整对象类型合法：
   ```ts
   const p: RequestParams = { temperature: 0.7, topP: 0.9, extra: { reasoning_effort: 'high' } };
   ```
3. `stop` 字段接受 string 和 string[] 两种形式

## 验收要求

- [ ] `npm run compile` 通过
- [ ] `RequestParams` 接口已导出
- [ ] `extra` 字段类型为 `Record<string, unknown>`
