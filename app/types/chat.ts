export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatResponse {
  content: string;
  error?: string;
  stream?: () => AsyncGenerator<string>;
}

export interface ChatConfig {
  channels: Channel[];
  currentChannelId: string;
  model?: string;
}

export interface ChatRequest {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  model: string;
  stream?: boolean;
}

export interface ChatAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

export interface ChatStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta: {
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
}

export interface Channel {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  isDefault?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: '功能强大的模型',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    description: '响应更快的模型',
  },
];

export const DEFAULT_CHANNEL: Channel = {
  id: 'openai',
  name: 'OpenAI',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o',
  isDefault: true,
};