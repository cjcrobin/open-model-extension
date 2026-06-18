import * as vscode from 'vscode';
import { PROVIDER_METADATA, PROVIDER_NAMES, ProviderName } from '../types';

interface TogglePickItem extends vscode.QuickPickItem {
  providerName: ProviderName;
  currentEnabled: boolean;
}

export async function toggleProviderCommand(): Promise<void> {
  const items: TogglePickItem[] = PROVIDER_NAMES.map((name) => {
    const enabled = vscode.workspace
      .getConfiguration(`openModel.${name}`)
      .get<boolean>('enabled', false);
    return {
      label: PROVIDER_METADATA[name].displayName,
      description: name,
      detail: enabled ? 'Enabled — select to disable' : 'Disabled — select to enable',
      providerName: name,
      currentEnabled: enabled,
    };
  });

  const pick = await vscode.window.showQuickPick(items, {
    title: 'Open Model: Toggle Provider',
    placeHolder: 'Select a provider to flip its enabled state',
  });

  if (!pick) return;

  const target = !pick.currentEnabled;
  await vscode.workspace
    .getConfiguration(`openModel.${pick.providerName}`)
    .update('enabled', target, vscode.ConfigurationTarget.Global);

  const displayName = PROVIDER_METADATA[pick.providerName].displayName;
  vscode.window.showInformationMessage(
    `Open Model: ${displayName} is now ${target ? 'enabled' : 'disabled'}.`,
  );
}
