import { vi } from 'vitest';

export enum LanguageModelChatMessageRole {
  User = 1,
  Assistant = 2,
  System = 3,
}

export class LanguageModelTextPart {
  constructor(public value: string) {}
}

export class LanguageModelToolCallPart {
  constructor(
    public callId: string,
    public name: string,
    public input: unknown
  ) {}
}

export class LanguageModelToolResultPart {
  constructor(
    public callId: string,
    public content: Array<LanguageModelTextPart | unknown>
  ) {}
}

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

const configStore = new Map<string, Map<string, unknown>>();

export function resetMockConfig(): void {
  configStore.clear();
}

export function setMockConfig(section: string, key: string, value: unknown): void {
  if (!configStore.has(section)) {
    configStore.set(section, new Map());
  }
  configStore.get(section)!.set(key, value);
}

export const workspace = {
  getConfiguration(section: string) {
    return {
      get<T>(key: string, defaultValue: T): T {
        const sectionMap = configStore.get(section);
        if (sectionMap && sectionMap.has(key)) {
          return sectionMap.get(key) as T;
        }
        return defaultValue;
      },
      update: vi.fn(async (key: string, value: unknown, _target?: ConfigurationTarget) => {
        if (!configStore.has(section)) {
          configStore.set(section, new Map());
        }
        configStore.get(section)!.set(key, value);
      }),
    };
  },
};

export const lm = {
  registerLanguageModelChatProvider: vi.fn(() => ({ dispose: vi.fn() })),
};
