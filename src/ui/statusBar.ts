import * as vscode from 'vscode';
import { PROVIDER_METADATA, PROVIDER_NAMES } from '../types';

export function createStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  item.name = 'Open Model';
  updateStatusBar(item);
  item.command = 'openModel.configure';
  item.tooltip = 'Open Model: Click to configure providers';
  item.show();
  return item;
}

export function updateStatusBar(item: vscode.StatusBarItem): void {
  const enabled: string[] = [];
  for (const name of PROVIDER_NAMES) {
    const isEnabled = vscode.workspace
      .getConfiguration(`openModel.${name}`)
      .get<boolean>('enabled', false);
    if (isEnabled) {
      enabled.push(PROVIDER_METADATA[name].displayName);
    }
  }

  if (enabled.length === 0) {
    item.text = '$(circle-slash) Open Model';
  } else {
    const joined = enabled.join(', ');
    if (joined.length > 50) {
      const shown = enabled.slice(0, 2).join(', ');
      item.text = `$(sparkle) ${shown}, +${enabled.length - 2} more`;
    } else {
      item.text = `$(sparkle) ${joined}`;
    }
  }
}
