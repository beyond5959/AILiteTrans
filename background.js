chrome.runtime.onInstalled.addListener(() => {
  // 设置默认配置
  chrome.storage.sync.set({
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1/chat/completions'
  });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    console.log('Injecting content script into tab:', tabId);
    
    // 注入 CSS
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['styles.css']
    }).catch(err => console.error('Failed to inject CSS:', err));

    // 注入 JavaScript
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => console.error('Failed to inject script:', err));
  }
}); 