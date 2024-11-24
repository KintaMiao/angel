import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatConfig, DEFAULT_CHANNEL } from '@/app/types/chat';

const CONFIG_KEY = '@chat_config';

const DEFAULT_CONFIG: ChatConfig = {
  channels: [DEFAULT_CHANNEL],
  currentChannelId: DEFAULT_CHANNEL.id,
  model: DEFAULT_CHANNEL.model,
};

async function getConfig(): Promise<ChatConfig> {
  try {
    const stored = await AsyncStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config: ChatConfig): Promise<void> {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export default {
  getConfig,
  saveConfig,
};
