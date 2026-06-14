import * as vscode from 'vscode';

export async function importConfigCommand(): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'JSON Files': ['json'] },
    title: 'Select Open Model configuration file',
  });

  if (!uris || uris.length === 0) return;

  let data: Record<string, unknown>;
  try {
    const content = await vscode.workspace.fs.readFile(uris[0]);
    data = JSON.parse(Buffer.from(content).toString('utf-8'));
  } catch (err) {
    vscode.window.showErrorMessage(`Open Model: Failed to parse configuration file - ${err}`);
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    'This will overwrite your current Open Model configuration. Continue?',
    { modal: true },
    'Import'
  );

  if (confirm !== 'Import') return;

  const config = vscode.workspace.getConfiguration('openModel');
  const target = vscode.ConfigurationTarget.Global;

  for (const [key, value] of Object.entries(data)) {
    await config.update(key, value, target);
  }

  vscode.window.showInformationMessage('Open Model: Configuration imported successfully.');
}
