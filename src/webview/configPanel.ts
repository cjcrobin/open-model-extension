import * as vscode from 'vscode';
import { PROVIDER_METADATA, PROVIDER_NAMES, ModelConfig } from '../types';

export class ConfigPanel {
  private static instance: ConfigPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  private constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
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

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'getProviders':
            this.panel.webview.postMessage({ command: 'providerData', data: this.getProviderData() });
            break;
          case 'toggleProvider':
            await this.toggleProvider(message.provider, message.enabled);
            break;
          case 'updateModel':
            await this.updateModel(message.provider, message.model);
            break;
          case 'addModel':
            await this.addModel(message.provider, message.model);
            break;
          case 'removeModel':
            await this.removeModel(message.provider, message.modelId);
            break;
        }
      },
      null,
      this.disposables
    );

    this.update();
  }

  static show(extensionUri: vscode.Uri): void {
    if (ConfigPanel.instance) {
      ConfigPanel.instance.panel.reveal();
    } else {
      ConfigPanel.instance = new ConfigPanel(extensionUri);
    }
  }

  private getProviderData(): object {
    const providers: Record<string, { displayName: string; enabled: boolean; models: ModelConfig[] }> = {};
    for (const name of PROVIDER_NAMES) {
      const config = vscode.workspace.getConfiguration(`openModel.${name}`);
      providers[name] = {
        displayName: PROVIDER_METADATA[name].displayName,
        enabled: config.get<boolean>('enabled', false),
        models: config.get<ModelConfig[]>('models', []),
      };
    }
    return providers;
  }

  private async toggleProvider(name: string, enabled: boolean): Promise<void> {
    const config = vscode.workspace.getConfiguration(`openModel.${name}`);
    await config.update('enabled', enabled, vscode.ConfigurationTarget.Global);
  }

  private async updateModel(provider: string, model: ModelConfig): Promise<void> {
    const config = vscode.workspace.getConfiguration(`openModel.${provider}`);
    const models = config.get<ModelConfig[]>('models', []);
    const idx = models.findIndex((m) => m.id === model.id);
    if (idx >= 0) {
      models[idx] = model;
      await config.update('models', models, vscode.ConfigurationTarget.Global);
    }
  }

  private async addModel(provider: string, model: ModelConfig): Promise<void> {
    const config = vscode.workspace.getConfiguration(`openModel.${provider}`);
    const models = config.get<ModelConfig[]>('models', []);
    models.push(model);
    await config.update('models', models, vscode.ConfigurationTarget.Global);
  }

  private async removeModel(provider: string, modelId: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(`openModel.${provider}`);
    const models = config.get<ModelConfig[]>('models', []);
    await config.update('models', models.filter((m) => m.id !== modelId), vscode.ConfigurationTarget.Global);
  }

  private update(): void {
    this.panel.webview.html = this.getHtmlContent();
  }

  private getNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
      nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return nonce;
  }

  private getHtmlContent(): string {
    const webview = this.panel.webview;
    const nonce = this.getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'configPanel.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'configPanel.css'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Open Model Configuration</title>
</head>
<body>
  <h1>Open Model Configuration</h1>
  <div id="providers"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
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
