// 首先声明所有需要的变量
let container = null;
let translatePopup = null;
let translateButton = null;
let currentController = null;
let hasSelectedText = false;

// 系统提示词
const SYSTEM_PROMPT = `忽略之前的对话，现在你是一个中英文翻译专家，将用户输入的中文翻译成英文，或将用户输入的英文翻译成中文。对于非中文内容，它将提供中文翻译结果。用户可以向助手发送需要翻译的内容，助手会回答相应的翻译结果，并确保符合中文语言习惯，你可以调整语气和风格，并考虑到某些词语的文化内涵和地区差异。同时作为翻译家，需将原文翻译成具有信达雅标准的译文。'信' 即忠实于原文的内容与意图；'达' 意味着译文应通顺易懂，表达清晰；'雅' 则追求译文的文化审美和语言的优美。目标是创作出既忠于原作精神，又符合目标语言文化和读者审美的翻译。`;

// 初始化函数
function initializeTranslator() {
  console.log('Initializing AI Translator');
  
  // 确保 DOM 已经准备好
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createContainer();
      addEventListeners();
    });
  } else {
    createContainer();
    addEventListeners();
  }
}

function createContainer() {
  if (!container) {
    try {
      container = document.createElement('div');
      container.id = 'ai-translator-container';
      
      // 创建 shadow DOM
      const shadow = container.attachShadow({ mode: 'open' }); // 改回 open 模式
      
      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        .ai-translator-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999999;
        }

        .ai-translate-button {
          position: fixed;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 999999;
          color: #3498db;
          transition: all 0.2s ease;
          pointer-events: auto;
          user-select: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          padding: 0;
        }

        /* 深色模式样式 */
        @media (prefers-color-scheme: dark) {
          .ai-translate-button {
            background: rgba(35, 38, 42, 0.9);
            color: #61dafb;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }

          .ai-translate-button:hover {
            background: rgba(45, 48, 52, 0.95);
            color: #74e3ff;
          }
        }

        /* 为 GitHub 深色主题特别设置样式 */
        [data-color-mode="dark"] .ai-translate-button,
        [data-dark-theme] .ai-translate-button {
          background: rgba(35, 38, 42, 0.9);
          color: #61dafb;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        [data-color-mode="dark"] .ai-translate-button:hover,
        [data-dark-theme] .ai-translate-button:hover {
          background: rgba(45, 48, 52, 0.95);
          color: #74e3ff;
        }

        .ai-translate-button:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.95);
          color: #2980b9;
        }

        .ai-translate-button img {
          width: 32px;
          height: 32px;
          pointer-events: none;
        }

        .ai-translate-button:active {
          transform: scale(0.95);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .ai-translate-button {
          animation: fadeIn 0.2s ease-out;
        }

        .translator-popup {
          position: fixed;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 600px;
          min-width: 300px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #2c3e50;
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .translator-popup.loading {
          color: #666;
          font-style: italic;
        }

        .translator-popup.error {
          color: #e74c3c;
          font-size: 13px;
        }

        .translator-popup[style*="display: block"] {
          opacity: 1;
          transform: translateY(0);
        }
      `;
      
      shadow.appendChild(style);

      // 创建一个容器来存放按钮和弹窗
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'ai-translator-wrapper';
      shadow.appendChild(contentWrapper);
      
      // 确保 document.body 存在
      if (document.body) {
        document.body.appendChild(container);
      } else {
        // 如果 body 不存在，等待 DOM 加载完成
        document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(container);
        });
      }
    } catch (error) {
      console.error('创建翻译容器失败:', error);
      return null;
    }
  }
  return container.shadowRoot.querySelector('.ai-translator-wrapper');
}

// 修改创建按钮的函数
function createTranslateButton() {
  const wrapper = createContainer();
  if (!wrapper) return null;

  const button = document.createElement('div');
  button.className = 'ai-translate-button';
  
  // 预加载图标
  const iconUrl = chrome.runtime.getURL('icons/icon32.png');
  const img = new Image();
  img.src = iconUrl;
  img.width = 32;  // 图标尺寸与按钮一致
  img.height = 32;
  img.alt = 'Translate';
  
  button.appendChild(img);
  
  button.addEventListener('click', async function(e) {
    console.log('点击了翻译按钮');
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) return;

    // 获取按钮当前位置
    const buttonRect = button.getBoundingClientRect();
    const buttonX = buttonRect.left + window.scrollX;
    const buttonY = buttonRect.top + window.scrollY;

    try {
      // 确保在开始新请求前取消旧请求
      if (currentController) {
        currentController.abort();
      }
      
      // 创建新的 AbortController
      currentController = new AbortController();
      const signal = currentController.signal;
      
      // 在按钮位置显示加载状态
      showTranslation('正在翻译...', buttonX, buttonY, 'loading');
      
      // 获取设置并执行翻译
      chrome.storage.sync.get(['currentProvider', 'providerSettings'], async function(data) {
        const currentProvider = data.currentProvider || 'openai';
        const providerSettings = data.providerSettings || {};
        const settings = providerSettings[currentProvider];

        if (!settings || !settings.apiKey) {
          showTranslation('请先配置 API Key', buttonX, buttonY, 'error');
          return;
        }

        try {
          const response = await fetch(settings.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.apiKey}`,
              'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
              model: settings.model,
              messages: [
                {
                  role: 'system',
                  content: SYSTEM_PROMPT
                },
                {
                  role: 'user',
                  content: selectedText
                }
              ],
              stream: true
            }),
            signal
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '请求失败');
          }

          if (!response.body) {
            throw new Error('响应中没有数据流');
          }

          const reader = response.body.getReader();
          await handleStream(reader, signal);

        } catch (error) {
          console.error('翻译失败:', error);
          if (error.name !== 'AbortError') {
            showTranslation('翻译失败，请检查配置和网络', buttonX, buttonY, 'error');
          }
        }
      });
    } catch (error) {
      console.error('翻译过程出错:', error);
    } finally {
      currentController = null;
    }
  });

  wrapper.appendChild(button);
  return button;
}

// 修改创建弹窗的函数
function createPopup() {
  const wrapper = createContainer();
  if (!wrapper) return null;

  const popup = document.createElement('div');
  popup.className = 'translator-popup';
  popup.style.display = 'none';
  wrapper.appendChild(popup);
  return popup;
}

// 显示翻译结果
function showTranslation(text, x, y, type = 'normal') {
  // 隐藏翻译按钮
  hideTranslateButton();

  if (!translatePopup) {
    translatePopup = createPopup();
  }

  // 确保位置是相对于视口的
  const viewportX = x - window.scrollX;
  const viewportY = y - window.scrollY;

  // 初始化弹窗位置在按钮的位置
  translatePopup.style.left = `${viewportX}px`;
  translatePopup.style.top = `${viewportY}px`;
  translatePopup.style.display = 'block';
  translatePopup.textContent = text;
  
  // 根据不同状态设置不同的样式
  translatePopup.className = 'translator-popup';
  if (type === 'loading') {
    translatePopup.classList.add('loading');
  } else if (type === 'error') {
    translatePopup.classList.add('error');
  }

  // 确保弹窗不会超出视口
  const rect = translatePopup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 调整位置以确保完全可见
  if (rect.right > viewportWidth) {
    translatePopup.style.left = `${viewportX - rect.width}px`;
  }
  if (rect.bottom > viewportHeight) {
    translatePopup.style.top = `${viewportY - rect.height}px`;
  }
}

// 更新翻译结果
function updateTranslation(text) {
  if (translatePopup) {
    translatePopup.textContent = text;
    // 确保弹窗可见
    translatePopup.style.display = 'block';
    translatePopup.style.opacity = '1';
  }
}

// 处理流式响应
async function handleStream(reader, signal) {
  const decoder = new TextDecoder();
  let content = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // 解码并处理接收到的数据
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.trim() === 'data: [DONE]') continue;
        
        try {
          const data = JSON.parse(line.replace(/^data: /, ''));
          if (data.choices?.[0]?.delta?.content) {
            content += data.choices[0].delta.content;
            updateTranslation(content);
          }
        } catch (e) {
          console.error('解析响应数据失败:', e);
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('翻译请求已取消');
    } else {
      throw error;
    }
  }
  return content;
}

// 修改 showTranslateButton 函数
function showTranslateButton(x, y) {
  if (!translateButton) {
    translateButton = createTranslateButton();
  }
  // 将按钮定位在鼠标正下方 5px 的位置
  translateButton.style.left = `${x - 16}px`;  // 居中显示，所以减去按钮宽度的一半
  translateButton.style.top = `${y + 5}px`;    // 在鼠标下方 5px
  translateButton.style.display = 'block';      // 确保按钮显示
}

// 修改 hideTranslateButton 函数
function hideTranslateButton() {
  if (translateButton && !hasSelectedText) {
    translateButton.style.display = 'none';
  }
}

function handleDocumentClick(e) {
  if (!e.target.closest('.translator-popup') && !e.target.closest('.ai-translate-button')) {
    hideTranslateButton();
    if (translatePopup) {
      translatePopup.style.display = 'none';
    }
    if (currentController) {
      currentController.abort();
      currentController = null;
    }
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    if (translatePopup) {
      translatePopup.style.display = 'none';
    }
    if (currentController) {
      currentController.abort();
      currentController = null;
    }
  }
}

// 修改 addEventListeners 函数
function addEventListeners() {
  // 监听鼠标松开事件
  document.addEventListener('mouseup', function(e) {
    // 延迟一小段时间确保文本选择已完成
    setTimeout(() => {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        hasSelectedText = true;
        // 使用鼠标松开时的位置显示按钮
        showTranslateButton(e.pageX, e.pageY);
      }
    }, 10);
  });

  // 修改点击事件处理
  document.addEventListener('click', function(e) {
    const isClickOnButton = e.target.closest('.ai-translate-button');
    const isClickOnPopup = e.target.closest('.translator-popup');
    
    if (!isClickOnButton && !isClickOnPopup) {
      // 只在点击其他区域时重置状态和隐藏按钮
      hasSelectedText = false;
      hideTranslateButton();
      if (translatePopup) {
        translatePopup.style.display = 'none';
      }
      if (currentController) {
        currentController.abort();
        currentController = null;
      }
    }
  });

  document.addEventListener('keydown', handleKeyDown);
}

// 最后执行初始化
console.log('AI Translator content script loaded');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTranslator);
} else {
  initializeTranslator();
} 