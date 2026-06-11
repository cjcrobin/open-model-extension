# Open Model Extension - 改进与扩展执行计划

## 概览

本计划涵盖对 Open Model VS Code 扩展的代码改进和功能扩展，共 37 个任务，分为 12 个 Phase。

---

## 优先级说明

| 优先级 | 含义 | 说明 |
|--------|------|------|
| P0 | 基础重构 | 消除重复代码、完善类型定义，为后续任务打基础 |
| P1 | 功能改进 | 改进现有功能的质量和健壮性 |
| P2 | 错误恢复与 API Key 管理 | 增强错误处理和密钥管理能力 |
| P3 | 自定义端点与模型能力 | 核心新功能：自定义 Base URL、Custom Provider、能力标记 |
| P4 | 高级参数与用量追踪 | 请求参数配置、Token 用量追踪 |
| P5 | UX 增强 | 配置导入导出、状态栏、系统提示词、用量统计 UI |
| P6 | WebView | 可视化配置面板 |

---

## 依赖关系图

```
Phase 1: 基础重构
  T001 ─── consolidate PROVIDER_NAMES ──────────────┐
  T002 ─── add baseUrlOverride to ModelConfig ──────┤
  T003 ─── add capability flags to ModelConfig ─────┤
  T004 ─── define RequestParams interface ──────────┤
                                                    │
Phase 2: 功能改进 (无依赖，可并行)                      │
  T005 ─── improve token counting (CJK)             │
  T006 ─── parse structured API errors ──────────┐  │
  T007 ─── log tool call parse failures           │  │
  T008 ─── ThinkingPart fallback                  │  │
  T009 ─── baseUrlOverride config (依赖 T002) ────┤  │
  T010 ─── capability flags config (依赖 T003) ───┤  │
                                                  │  │
Phase 3: 测试                                       │  │
  T011 ─── test convertMessages (依赖 T001)       │  │
  T012 ─── test stream parsing (依赖 T005,T006)   │  │
  T013 ─── test token counting (依赖 T005)        │  │
                                                  │  │
Phase 4: 错误恢复 & API Key                          │  │
  T014 ─── retry logic (依赖 T006) ─────────────┐ │  │
  T015 ─── friendly error messages (T006,T014)  │ │  │
  T016 ─── clear API key command (依赖 T001)    │ │  │
  T017 ─── API key status display (依赖 T016)   │ │  │
  T018 ─── test connection command (T014,T015)  │ │  │
                                                │ │  │
Phase 5: 自定义 Base URL                             │ │  │
  T019 ─── use baseUrlOverride (T002,T009) ─────┤ │  │
  T020 ─── custom provider config schema ───────┤ │  │
  T021 ─── custom provider types (T001,T020) ──┤ │  │
  T022 ─── custom provider resolution (T021,T019) │  │
                                                  │  │
Phase 6: 模型能力标记                                  │
  T023 ─── default model capability flags (T010) ─┤
  T024 ─── reflect in toModelInfo (T003,T023) ────┤
                                                  │
Phase 7: 高级请求参数                                  │
  T025 ─── requestParams config (T004) ───────────┤
  T026 ─── apply requestParams (T004,T025) ───────┤
                                                  │
Phase 8: 用量追踪                                      │
  T027 ─── define usage types ────────────────────┤
  T028 ─── usage persistence (T027) ──────────────┤
  T029 ─── integrate in stream (T028) ────────────┤
                                                  │
Phase 9: 配置导入导出                                    │
  T030 ─── export config command                  │
  T031 ─── import config command (T030)           │
                                                  │
Phase 10: UX 增强                                       │
  T032 ─── status bar indicator (T001)            │
  T033 ─── usage statistics (T028,T029)           │
                                                  │
Phase 11: 系统提示词                                      │
  T034 ─── system prompt config schema            │
  T035 ─── inject system prompt (T034)            │
                                                  │
Phase 12: WebView                                         │
  T036 ─── WebView panel skeleton                 │
  T037 ─── WebView data binding (T036)            │
```

---

## 任务总表

| 编号 | Phase | 优先级 | 任务名称 | 依赖 |
|------|-------|--------|----------|------|
| T001 | 1 | P0 | 集中定义 PROVIDER_NAMES 常量 | - |
| T002 | 1 | P0 | 为 ModelConfig 添加 baseUrlOverride 字段 | - |
| T003 | 1 | P0 | 为 ModelConfig 添加 vision/reasoning 能力标记 | - |
| T004 | 1 | P0 | 定义 RequestParams 接口 | - |
| T005 | 2 | P1 | CJK 感知的 Token 计数改进 | - |
| T006 | 2 | P1 | 解析结构化 API 错误响应 | - |
| T007 | 2 | P1 | 工具调用 JSON 解析失败日志 | - |
| T008 | 2 | P1 | ThinkingPart fallback 输出 | - |
| T009 | 2 | P2 | baseUrlOverride 配置注册到 package.json | T002 |
| T010 | 2 | P2 | 能力标记注册到 package.json | T003 |
| T011 | 3 | P1 | 单元测试: convertMessages | T001 |
| T012 | 3 | P1 | 单元测试: SSE 流解析 | T005, T006 |
| T013 | 3 | P1 | 单元测试: Token 计数 | T005 |
| T014 | 4 | P2 | 指数退避重试逻辑 | T006 |
| T015 | 4 | P2 | 友好错误提示信息 | T006, T014 |
| T016 | 4 | P2 | 清除 API Key 命令 | T001 |
| T017 | 4 | P2 | QuickPick 显示 API Key 状态 | T016 |
| T018 | 4 | P2 | API 连通性测试命令 | T014, T015 |
| T019 | 5 | P3 | Provider 中使用 baseUrlOverride | T002, T009 |
| T020 | 5 | P3 | Custom Provider 配置 Schema | T009 |
| T021 | 5 | P3 | Custom Provider 类型注册 | T001, T020 |
| T022 | 5 | P3 | Custom Provider 动态解析 | T021, T019 |
| T023 | 6 | P3 | 默认模型添加能力标记 | T010 |
| T024 | 6 | P3 | toModelInfo 反映能力标记 | T003, T023 |
| T025 | 7 | P4 | RequestParams 配置注册 | T004 |
| T026 | 7 | P4 | API 请求中应用 RequestParams | T004, T025 |
| T027 | 8 | P4 | 定义 TokenUsage 数据结构 | - |
| T028 | 8 | P4 | Token 用量持久化存储 | T027 |
| T029 | 8 | P4 | 流式响应集成用量计数 | T028 |
| T030 | 9 | P5 | 配置导出命令 | - |
| T031 | 9 | P5 | 配置导入命令 | T030 |
| T032 | 10 | P5 | 状态栏 Provider 指示器 | T001 |
| T033 | 10 | P5 | 用量统计查看命令 | T028, T029 |
| T034 | 11 | P5 | 系统提示词模板配置 Schema | - |
| T035 | 11 | P5 | 请求中注入系统提示词 | T034 |
| T036 | 12 | P6 | WebView 配置面板骨架 | - |
| T037 | 12 | P6 | WebView 数据绑定与交互 | T036 |

---

## 建议执行顺序

**第一批（可并行）：** T001, T002, T003, T004, T005, T006, T007, T008, T027, T030, T034, T036

**第二批（依赖第一批）：** T009, T010, T011, T014, T016, T019, T023, T025, T028

**第三批（依赖第二批）：** T012, T013, T015, T017, T020, T021, T024, T026, T029, T031, T032, T035, T037

**第四批（依赖第三批）：** T018, T022, T033
