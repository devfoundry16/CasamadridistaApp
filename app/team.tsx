import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function TeamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real Madrid Team</Text>
      <Text style={styles.subtitle}>Roster & player details will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightGray, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle: { marginTop: 8, color: Colors.textLight },
});