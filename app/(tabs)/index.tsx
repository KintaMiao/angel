import { StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import api from '@/app/services/api';
import { Message, ChatConfig, AVAILABLE_MODELS } from '@/app/types/chat';
import { ModelSelector } from '@/components/ModelSelector';

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [inputText, setInputText] = useState('');
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '有什么可以帮你的吗？',
      isUser: false,
      timestamp: Date.now(),
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.getConfig().then(config => {
      setConfig(config);
      if (!config.channels || config.channels.length === 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: '请先在设置中添加聊天渠道',
          isUser: false,
          timestamp: Date.now(),
        }]);
      } else if (!config.currentChannelId) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: '请先选择一个聊天渠道',
          isUser: false,
          timestamp: Date.now(),
        }]);
      } else {
        const currentChannel = config.channels.find(c => c.id === config.currentChannelId);
        if (!currentChannel?.apiKey) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            content: '请先设置 API Key 才能开始对话',
            isUser: false,
            timestamp: Date.now(),
          }]);
        }
      }
    });
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // 添加触反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();

    // 添加加载状态消息
    const loadingMessage: Message = {
      id: 'loading',
      content: '正在思考...',
      isUser: false,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await api.sendMessage([...messages, userMessage]);
      
      if ('stream' in response) {
        // 定义流式响应类型
        type StreamResponse = {
          stream(): AsyncIterableIterator<string>
        }
        
        // 类型断言
        const streamResponse = response as StreamResponse;
        
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: '',
          isUser: false, 
          timestamp: Date.now(),
        };

        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== 'loading');
          return [...filtered, aiMessage];
        });

        // 使用类型断言后的stream
        for await (const chunk of streamResponse.stream()) {
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.id === aiMessage.id) {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: lastMessage.content + chunk,
                },
              ];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      // 处理错误情况
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'loading');
        return [...filtered, {
          id: Date.now().toString(),
          content: '抱歉，发生了错误，请稍后重试。',
          isUser: false,
          timestamp: Date.now(),
        }];
      });
    }

    scrollToBottom();
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleKeyPress = (e: any) => {
    // Web 平台
    if (Platform.OS === 'web') {
      if (e.nativeEvent.key === 'Enter') {
        if (e.nativeEvent.shiftKey) {
          return;
        }
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleSubmitEditing = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      handleSend();
    }
  };

  const currentChannel = config?.channels?.find(c => c.id === config?.currentChannelId);

  return (
    <ThemedView style={styles.container}>
      {/* 顶部导航栏 */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedView style={styles.headerContent}>
          <ThemedView style={styles.headerLeft}>
            <ThemedText type="title" style={styles.headerTitle}>新的聊天</ThemedText>
            <ThemedText style={styles.headerSubtitle}>共 {messages.length} 条对话</ThemedText>
          </ThemedView>
          <ThemedView style={styles.headerRight}>
            <ModelSelector
              currentModel={currentChannel?.model || config?.model || 'gpt-4o'}
              models={AVAILABLE_MODELS}
              onSelect={(model) => {
                if (config) {
                  const updatedChannels = config.channels.map(channel => {
                    if (channel.id === config.currentChannelId) {
                      return { ...channel, model: model.id };
                    }
                    return channel;
                  });
                  
                  const newConfig = { 
                    ...config, 
                    channels: updatedChannels,
                    model: model.id  // 同时更新全局配置的model
                  };
                  
                  api.saveConfig(newConfig).then(() => setConfig(newConfig));
                }
              }}
            />
            <TouchableOpacity style={styles.headerButton}>
              <IconSymbol name="arrow.clockwise" size={20} color={tintColor} />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* 聊天内容区域 */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={scrollToBottom}>
        {messages.map((message) => (
          <ThemedView
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}>
            <ThemedText 
              style={[
                styles.messageText,
                message.isUser && styles.userMessageText
              ]}>
              {message.content}
            </ThemedText>
            <ThemedText 
              style={[
                styles.messageTime,
                message.isUser ? styles.userMessageTime : styles.aiMessageTime
              ]}>
              {formatMessageTime(message.timestamp)}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>

      {/* 底部输入区域 */}
      <ThemedView 
        style={[styles.inputContainer]} 
        lightColor="#FFFFFF"
        darkColor="#1C1C1E"
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F5F5F5',
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
              }
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter 发送，Shift + Enter 换行"
            placeholderTextColor={colorScheme === 'dark' ? '#666666' : '#999999'}
            multiline
            onKeyPress={handleKeyPress}
            returnKeyType={Platform.select({ ios: 'send', android: 'send' })}
            onSubmitEditing={handleSubmitEditing}
            blurOnSubmit={Platform.OS === 'web' ? false : true}
            enablesReturnKeyAutomatically={true}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              !inputText.trim() && styles.sendButtonDisabled,
              {
                backgroundColor: inputText.trim() 
                  ? '#0a7ea4' 
                  : (colorScheme === 'dark' ? '#3C3C3E' : '#E5E5E5')
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}>
            <IconSymbol 
              name="paperplane.fill" 
              size={20} 
              color={inputText.trim() ? "#FFFFFF" : (colorScheme === 'dark' ? '#666666' : '#CCCCCC')} 
            />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255,255,255,0.85)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  chatContent: {
    padding: 16,
    gap: 16,
  },
  messageBubble: {
    backgroundColor: 'rgba(10,126,164,0.1)',
    padding: 16,
    borderRadius: 16,
    maxWidth: '80%',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0a7ea4',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
  },
  messageText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 44,
    fontSize: 16,
  },
  sendButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  userMessageTime: {
    color: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  aiMessageTime: {
    color: '#666666',
    alignSelf: 'flex-start',
  },
  modelText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(10,126,164,0.1)',
    borderRadius: 12,
  },
}); 