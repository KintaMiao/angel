import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ModelOption } from '@/app/types/chat';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ModelSelectorProps {
  currentModel: string;
  models: ModelOption[];
  onSelect: (model: ModelOption) => void;
}

export function ModelSelector({ currentModel, models, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colorScheme = useColorScheme();
  const currentModelInfo = models.find(m => m.id === currentModel);
  
  return (
    <>
      <TouchableOpacity 
        onPress={() => setIsOpen(true)}
        style={styles.currentModel}
      >
        <ThemedText style={styles.modelName}>{currentModelInfo?.name || 'GPT-4o'}</ThemedText>
        <IconSymbol name="chevron.down" size={12} color="#0a7ea4" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <BlurView
            intensity={20}
            style={styles.modalContent}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
          >
            {models.map(model => (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelItem,
                  currentModel === model.id && styles.modelItemSelected
                ]}
                onPress={() => {
                  onSelect(model);
                  setIsOpen(false);
                }}
              >
                <ThemedText style={[
                  styles.modelItemName,
                  currentModel === model.id && styles.modelItemNameSelected
                ]}>
                  {model.name}
                </ThemedText>
                <ThemedText style={[
                  styles.modelItemDesc,
                  currentModel === model.id && styles.modelItemDescSelected
                ]}>
                  {model.description}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </BlurView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  currentModel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10,126,164,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modelName: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modelItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modelItemSelected: {
    backgroundColor: '#0a7ea4',
  },
  modelItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modelItemDesc: {
    fontSize: 14,
    color: '#666',
  },
  modelItemNameSelected: {
    color: '#FFFFFF',
  },
  modelItemDescSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
});
