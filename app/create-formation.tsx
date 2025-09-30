import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function CreateFormationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Formation</Text>
      <Text style={styles.subtitle}>A small formation builder goes here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightGray, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle: { marginTop: 8, color: Colors.textLight },
});