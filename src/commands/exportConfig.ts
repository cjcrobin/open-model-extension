import * as vscode from 'vscode';
import { PROVIDER_NAMES } from '../types';

export async function exportConfigCommand(): Promise<void> {
  const config = vscode.workspace.getConfiguration('openModel');
  const exportData: Record<string, unknown> = {};

  for (const name of PROVIDER_NAMES) {
    exportData[`${name}.enabled`] = config.get(`${name}.enabled`);
    exportData[`${name}.models`] = config.get(`${name}.models`);
    exportData[`${name}.requestParams`] = config.get(`${name}.requestParams`);
  }

  if (config.get('custom.baseUrl')) {
    exportData['custom.baseUrl'] = config.get('custom.baseUrl');
  }
  if (config.get('custom.vendorName')) {
    exportData['custom.vendorName'] = config.get('custom.vendorName');
  }

  const doc = JSON.stringify(exportData, null, 2);

  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('open-model-config.json'),
    filters: { 'JSON Files': ['json'] },
  });

  if (uri) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(doc, 'utf-8'));
    vscode.window.showInformationMessage(`Open Model: Configuration exported to ${uri.fsPath}`);
  }
}
