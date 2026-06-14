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

  if (template.providers && template.providers.length > 0) {
    if (!template.providers.includes(providerName)) return undefined;
  }

  if (template.modelIds && template.modelIds.length > 0) {
    if (!template.modelIds.includes(modelId)) return undefined;
  }

  return template.content;
}
