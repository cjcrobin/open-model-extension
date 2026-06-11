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
