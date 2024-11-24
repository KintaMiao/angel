import { Message, ChatResponse, ChatConfig, ChatRequest, ChatStreamResponse } from '@/app/types/chat';
import configService from './config';

async function getConfig(): Promise<ChatConfig> {
  return await configService.getConfig();
}

async function saveConfig(config: ChatConfig): Promise<void> {
  await configService.saveConfig(config);
}

async function sendMessage(messages: Message[]): Promise<ChatResponse> {
  try {
    const config = await getConfig();
    
    if (!config.channels || config.channels.length === 0) {
      throw new Error('请先添加聊天渠道');
    }

    if (!config.currentChannelId) {
      throw new Error('请先选择一个聊天渠道');
    }

    const currentChannel = config?.channels?.find(c => c.id === config?.currentChannelId);
    
    if (!currentChannel) {
      throw new Error('当前选择的渠道不存在');
    }

    if (!currentChannel.apiKey) {
      throw new Error('请先设置 API Key');
    }

    if (!currentChannel.apiUrl) {
      throw new Error('请先设置 API 地址');
    }

    const request: ChatRequest = {
      messages: messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content,
      })),
      model: currentChannel.model || config.model || 'gpt-4o',
      stream: true
    };

    const response = await fetch(currentChannel.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentChannel.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查配置');
      } else if (response.status === 404) {
        throw new Error('API 地址无效，请检查配置');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else {
        throw new Error(error.message || `请求失败 (${response.status})`);
      }
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';

    return {
      content: '',
      stream: async function* () {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk
              .split('\n')
              .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');

            for (const line of lines) {
              if (line.includes('data: ')) {
                try {
                  const data: ChatStreamResponse = JSON.parse(line.slice(6));
                  if (data.choices[0].delta.content) {
                    content += data.choices[0].delta.content;
                    yield data.choices[0].delta.content;
                  }
                } catch (e) {
                  console.error('Error parsing stream data:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        content: '网络连接失败，请检查网络设置或 API 地址是否正确',
        error: '网络错误'
      };
    }
    
    return {
      content: '抱歉，发生了错误：' + (error instanceof Error ? error.message : '未知错误'),
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

export default {
  getConfig,
  saveConfig,
  sendMessage,
};
