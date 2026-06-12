(function () {
  const vscode = acquireVsCodeApi();
  const container = document.getElementById('providers');

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'providerData') {
      renderProviders(message.data);
    }
  });

  function renderProviders(data) {
    container.innerHTML = '';
    for (const [name, provider] of Object.entries(data)) {
      const card = document.createElement('div');
      card.className = 'provider-card';

      const header = document.createElement('div');
      header.className = 'provider-header';

      const title = document.createElement('h2');
      title.textContent = provider.displayName;

      const toggle = document.createElement('label');
      toggle.className = 'toggle-switch';
      toggle.innerHTML = `
        <input type="checkbox" ${provider.enabled ? 'checked' : ''} data-provider="${name}">
        <span class="toggle-slider"></span>
      `;
      toggle.querySelector('input').addEventListener('change', (e) => {
        vscode.postMessage({
          command: 'toggleProvider',
          provider: name,
          enabled: e.target.checked,
        });
      });

      header.appendChild(title);
      header.appendChild(toggle);
      card.appendChild(header);

      const modelList = document.createElement('div');
      modelList.className = 'model-list';

      for (const model of provider.models) {
        const item = document.createElement('div');
        item.className = 'model-item';

        const info = document.createElement('div');
        info.innerHTML = `<div class="model-name">${escapeHtml(model.name)}</div><div class="model-id">${escapeHtml(model.id)}</div>`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
          vscode.postMessage({
            command: 'removeModel',
            provider: name,
            modelId: model.id,
          });
        });

        item.appendChild(info);
        item.appendChild(removeBtn);
        modelList.appendChild(item);
      }

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-add';
      addBtn.textContent = 'Add Model';
      addBtn.addEventListener('click', () => {
        const id = prompt('Model ID:');
        if (!id) return;
        const modelName = prompt('Model Name:');
        if (!modelName) return;
        vscode.postMessage({
          command: 'addModel',
          provider: name,
          model: { id: id, name: modelName },
        });
      });

      card.appendChild(modelList);
      card.appendChild(addBtn);
      container.appendChild(card);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  vscode.postMessage({ command: 'getProviders' });
})();
