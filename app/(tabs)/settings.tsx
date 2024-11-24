import { StyleSheet, TouchableOpacity, TextInput, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import api from '@/app/services/api';
import { ChatConfig, AVAILABLE_MODELS, Channel } from '@/app/types/chat';
import { ModelSelector } from '@/components/ModelSelector';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ChannelManager } from '@/components/ChannelManager';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<ChatConfig | null>(null);

  useEffect(() => {
    api.getConfig().then(config => {
      if (!config) {
        // 初始化空配置
        const defaultConfig: ChatConfig = {
          channels: [],
          currentChannelId: '',
        };
        api.saveConfig(defaultConfig).then(() => setConfig(defaultConfig));
      } else {
        setConfig(config);
      }
    });
  }, []);

  const handleChannelChange = (channels: Channel[], currentChannelId: string) => {
    if (config) {
      const currentChannel = channels.find(c => c.id === currentChannelId);
      const newConfig = { 
        ...config, 
        channels,
        currentChannelId,
        model: currentChannel?.model || config.model || 'gpt-4o'
      };
      api.saveConfig(newConfig).then(() => setConfig(newConfig));
    }
  };

  const currentChannel = config?.channels?.find(c => c.id === config?.currentChannelId);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText type="title" style={styles.headerTitle}>设置</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>渠道管理</ThemedText>
          {config && (
            <ChannelManager
              channels={config.channels}
              currentChannelId={config.currentChannelId}
              onChannelChange={handleChannelChange}
            />
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 44,
    fontSize: 16,
  },
  visibilityButton: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  modelName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
