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

export enum ProgressLocation {
  Notification = 15,
  SourceControl = 1,
  Window = 10,
}

export class EventEmitter<T> {
  private listeners: Array<(e: T) => void> = [];
  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => { this.listeners = this.listeners.filter((l) => l !== listener); } };
  };
  fire(data: T): void {
    this.listeners.forEach((l) => l(data));
  }
  dispose(): void {
    this.listeners = [];
  }
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
  onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
};

export const lm = {
  registerLanguageModelChatProvider: vi.fn(() => ({ dispose: vi.fn() })),
};

const registeredCommands = new Map<string, (...args: unknown[]) => unknown>();

export function getRegisteredCommand(id: string): ((...args: unknown[]) => unknown) | undefined {
  return registeredCommands.get(id);
}

export function resetRegisteredCommands(): void {
  registeredCommands.clear();
}

export const commands = {
  registerCommand: vi.fn((id: string, handler: (...args: unknown[]) => unknown) => {
    registeredCommands.set(id, handler);
    return { dispose: vi.fn() };
  }),
  executeCommand: vi.fn(),
};

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

function createMockStatusBarItem() {
  return {
    text: '',
    tooltip: '',
    command: undefined,
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    alignment: StatusBarAlignment.Right,
    priority: 100,
    name: undefined,
    color: undefined,
    backgroundColor: undefined,
    accessibilityInformation: undefined,
  };
}

export const window = {
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    name: 'test',
    replace: vi.fn(),
  })),
  createStatusBarItem: vi.fn(() => createMockStatusBarItem()),
  showInformationMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showQuickPick: vi.fn(),
  showInputBox: vi.fn(),
  withProgress: vi.fn(),
};
