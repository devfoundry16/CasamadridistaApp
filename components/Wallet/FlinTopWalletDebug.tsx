// components/FlintopWalletDebug.tsx
import { FlintopWalletService } from '@/services/FlintopWalletService';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '../Button';

export const FlintopWalletDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsTesting(true);
    addDebugInfo('Testing FlinTop Wallet connection...');
    
    try {
      const result = await FlintopWalletService.testConnection();
      addDebugInfo(`Connection test: ${result.message}`);
    } catch (error) {
      addDebugInfo(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <View className="p-4 bg-bg-light">
      <Text className="text-lg font-bold mb-4 text-center text-text-primary">
        FlinTop Wallet Debug
      </Text>
      
      <Button
        title={isTesting ? "Testing..." : "Test Connection"}
        onPress={testConnection}
        disabled={isTesting}
        variant="outline"
        style={{ marginBottom: 12 }}
      />
      
      <Button
        title="Clear Log"
        onPress={clearDebugInfo}
        variant="secondary"
        size="small"
      />
      
      <ScrollView className="mt-4 bg-bg-card rounded-lg p-3 max-h-[200px]">
        {debugInfo.map((info, index) => (
          <Text key={index} className="text-xs mb-1 font-mono text-text-primary">
            {info}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};
