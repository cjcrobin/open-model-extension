import * as vscode from 'vscode';

export class ConfigPanel {
  private static instance: ConfigPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(extensionUri: vscode.Uri) {
    this.panel = vscode.window.createWebviewPanel(
      'openModelConfig',
      'Open Model Configuration',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.update();
  }

  static show(extensionUri: vscode.Uri): void {
    if (ConfigPanel.instance) {
      ConfigPanel.instance.panel.reveal();
    } else {
      ConfigPanel.instance = new ConfigPanel(extensionUri);
    }
  }

  private update(): void {
    this.panel.webview.html = this.getHtmlContent();
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Open Model Configuration</title>
    </head>
    <body>
      <h1>Open Model Configuration</h1>
      <p>Configuration panel placeholder</p>
    </body>
    </html>`;
  }

  dispose(): void {
    ConfigPanel.instance = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
