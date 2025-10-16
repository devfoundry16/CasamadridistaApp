// components/FlintopWalletDebug.tsx
import { FlintopWalletService } from '@/services/FlintopWalletService';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

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
    <View style={styles.container}>
      <Text style={styles.title}>FlinTop Wallet Debug</Text>
      
      <Button
        title={isTesting ? "Testing..." : "Test Connection"}
        onPress={testConnection}
        disabled={isTesting}
        variant="outline"
        style={styles.testButton}
      />
      
      <Button
        title="Clear Log"
        onPress={clearDebugInfo}
        variant="secondary"
        size="small"
      />
      
      <ScrollView style={styles.debugContainer}>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>
            {info}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  testButton: {
    marginBottom: 12,
  },
  debugContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});