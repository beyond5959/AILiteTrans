document.addEventListener('DOMContentLoaded', function() {
  const modelConfigs = {
    openai: {
      models: [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' }
      ],
      baseUrl: 'https://api.openai.com/v1/chat/completions'
    },
    deepseek: {
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek V3' }
      ],
      baseUrl: 'https://api.deepseek.com/chat/completions'
    },
    siliconflow: {
      models: [
        { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B(免费)' },
        { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
        { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5' },
        { id: 'Qwen/Qwen2.5-14B-Instruct', name: 'Qwen2.5-14B' }
      ],
      baseUrl: 'https://api.siliconflow.cn/v1/chat/completions'
    }
  };

  // 加载保存的设置
  chrome.storage.sync.get(['currentProvider', 'providerSettings'], function(data) {
    const currentProvider = data.currentProvider || 'openai';
    const providerSettings = data.providerSettings || {};
    
    // 设置当前供应商
    document.getElementById('provider').value = currentProvider;
    
    // 更新模型选项
    updateModelOptions(currentProvider);
    
    // 填充当前供应商的设置
    if (providerSettings[currentProvider]) {
      const settings = providerSettings[currentProvider];
      if (settings.model) document.getElementById('model').value = settings.model;
      if (settings.apiKey) document.getElementById('apiKey').value = settings.apiKey;
      if (settings.apiUrl) document.getElementById('apiUrl').value = settings.apiUrl;
    }
  });

  // 更新模型选项
  function updateModelOptions(provider, selectedModel = null) {
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '';
    
    const models = modelConfigs[provider].models;
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      modelSelect.appendChild(option);
    });

    // 设置默认 API 地址
    document.getElementById('apiUrl').value = modelConfigs[provider].baseUrl;

    // 如果有选中的模型，设置它
    if (selectedModel) {
      modelSelect.value = selectedModel;
    }
  }

  // 监听服务商变化
  document.getElementById('provider').addEventListener('change', function(e) {
    const newProvider = e.target.value;
    
    // 获取当前所有设置
    chrome.storage.sync.get(['providerSettings'], function(data) {
      const providerSettings = data.providerSettings || {};
      
      // 更新模型选项
      updateModelOptions(newProvider);
      
      // 清空 API Key 输入框
      document.getElementById('apiKey').value = '';
      
      // 如果有保存的设置，填充它们
      if (providerSettings[newProvider]) {
        const settings = providerSettings[newProvider];
        if (settings.model) document.getElementById('model').value = settings.model;
        if (settings.apiKey) document.getElementById('apiKey').value = settings.apiKey;
        if (settings.apiUrl) document.getElementById('apiUrl').value = settings.apiUrl;
      }
      
      // 保存当前选中的供应商
      chrome.storage.sync.set({ currentProvider: newProvider });
    });
  });

  // 保存设置
  document.getElementById('save').addEventListener('click', function() {
    const provider = document.getElementById('provider').value;
    const model = document.getElementById('model').value;
    const apiKey = document.getElementById('apiKey').value;
    const apiUrl = document.getElementById('apiUrl').value;

    if (!apiKey) {
      showStatus('error', 'API Key 不能为空');
      return;
    }

    // 获取现有设置
    chrome.storage.sync.get(['providerSettings'], function(data) {
      const providerSettings = data.providerSettings || {};
      
      // 更新当前供应商的设置
      providerSettings[provider] = {
        model: model,
        apiKey: apiKey,
        apiUrl: apiUrl
      };

      // 保存所有设置
      chrome.storage.sync.set({
        currentProvider: provider,
        providerSettings: providerSettings
      }, function() {
        showStatus('success', '设置已成功保存！');
      });
    });
  });

  function showStatus(type, message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }
}); 