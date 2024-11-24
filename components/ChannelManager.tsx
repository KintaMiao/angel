import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { Channel } from '@/app/types/chat';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ChannelManagerProps {
  channels: Channel[];
  currentChannelId: string;
  onChannelChange: (channels: Channel[], currentChannelId: string) => void;
}

export function ChannelManager({ channels = [], currentChannelId, onChannelChange }: ChannelManagerProps) {
  const colorScheme = useColorScheme();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<Partial<Channel>>({});
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  const handleSaveChannel = () => {
    if (!editingChannel.name || !editingChannel.apiUrl) {
      Alert.alert('错误', '请填写完整信息');
      return;
    }

    const channel: Channel = {
      id: editingChannel.id || Date.now().toString(),
      name: editingChannel.name,
      apiUrl: editingChannel.apiUrl,
      apiKey: editingChannel.apiKey || '',
      model: editingChannel.model || 'gpt-4o',
      isDefault: editingChannel.isDefault,
    };

    const updatedChannels = isEditing
      ? channels.map(c => c.id === isEditing ? channel : c)
      : [...channels, channel];

    onChannelChange(updatedChannels, currentChannelId);
    setIsEditing(null);
    setIsAdding(false);
    setEditingChannel({});
  };

  const handleEditChannel = (channel: Channel) => {
    if (channel.isDefault) {
      setIsEditing(channel.id);
      setEditingChannel({...channel});
      setIsApiKeyVisible(false);
      setIsAdding(false);
    } else {
      setIsEditing(channel.id);
      setEditingChannel({...channel});
      setIsApiKeyVisible(false);
      setIsAdding(false);
    }
  };

  const renderChannelForm = () => {
    const isEditingDefaultChannel = editingChannel.isDefault;
    
    return (
      <ThemedView style={[styles.addForm, { width: '100%' }]}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F5F5F5',
            color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
            width: '100%'
          }]}
          value={editingChannel.name}
          onChangeText={(text) => setEditingChannel(prev => ({ ...prev, name: text }))}
          placeholder="渠道名称"
          placeholderTextColor={colorScheme === 'dark' ? '#666666' : '#999999'}
          editable={!isEditingDefaultChannel}
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F5F5F5',
            color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
            width: '100%'
          }]}
          value={editingChannel.apiUrl}
          onChangeText={(text) => setEditingChannel(prev => ({ ...prev, apiUrl: text }))}
          placeholder="API 地址"
          placeholderTextColor={colorScheme === 'dark' ? '#666666' : '#999999'}
          editable={!isEditingDefaultChannel}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F5F5F5',
              color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
              width: '100%'
            }]}
            value={editingChannel.apiKey}
            onChangeText={(text) => setEditingChannel(prev => ({ ...prev, apiKey: text }))}
            placeholder="API Key"
            placeholderTextColor={colorScheme === 'dark' ? '#666666' : '#999999'}
            secureTextEntry={!isApiKeyVisible}
          />
          <TouchableOpacity 
            style={styles.visibilityButton}
            onPress={() => setIsApiKeyVisible(!isApiKeyVisible)}
          >
            <IconSymbol 
              name={isApiKeyVisible ? "eye.fill" : "eye.slash.fill"} 
              size={20} 
              color={colorScheme === 'dark' ? '#666666' : '#999999'}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F5F5F5',
            color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
            width: '100%'
          }]}
          value={editingChannel.model}
          onChangeText={(text) => setEditingChannel(prev => ({ ...prev, model: text }))}
          placeholder="模型名称"
          placeholderTextColor={colorScheme === 'dark' ? '#666666' : '#999999'}
          editable={!isEditingDefaultChannel}
        />
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setIsEditing(null);
              setIsAdding(false);
              setEditingChannel({});
            }}
          >
            <ThemedText style={styles.buttonText}>取消</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.confirmButton]}
            onPress={handleSaveChannel}
          >
            <ThemedText style={styles.buttonText}>确定</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {Array.isArray(channels) && channels.map(channel => (
        <ThemedView 
          key={channel.id} 
          style={[
            styles.channelItem,
            channel.id === currentChannelId && styles.channelItemActive
          ]}
        >
          {isEditing === channel.id ? (
            renderChannelForm()
          ) : (
            <>
              <TouchableOpacity 
                style={styles.channelContent}
                onPress={() => onChannelChange(channels, channel.id)}
              >
                <ThemedText style={styles.channelName}>{channel.name}</ThemedText>
                <ThemedText style={styles.channelUrl}>{channel.apiUrl}</ThemedText>
                <ThemedText style={styles.modelName}>模型: {channel.model}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditChannel(channel)}
              >
                <IconSymbol name="pencil" size={20} color="#0a7ea4" />
              </TouchableOpacity>
            </>
          )}
        </ThemedView>
      ))}

      {isAdding && renderChannelForm()}

      {!isAdding && !isEditing && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setIsAdding(true);
            setEditingChannel({});
          }}
        >
          <IconSymbol name="plus" size={20} color="#0a7ea4" />
          <ThemedText style={styles.addButtonText}>添加新渠道</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  channelItemActive: {
    backgroundColor: 'rgba(10,126,164,0.1)',
  },
  channelContent: {
    flex: 1,
    paddingRight: 8,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  channelUrl: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    color: '#0a7ea4',
    fontSize: 16,
  },
  addForm: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 12,
    width: '100%',
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  confirmButton: {
    backgroundColor: '#0a7ea4',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
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
    marginLeft: 8,
  },
  modelName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
