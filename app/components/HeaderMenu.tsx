import * as React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Layout, Store } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

function HeaderMenu() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push('/team' as any)}
        style={styles.button}
        activeOpacity={0.7}
        accessibilityLabel="Open team"
        accessibilityHint="Open Real Madrid team roster"
      >
        <Users size={20} color={Colors.accent} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/create-formation' as any)}
        style={styles.button}
        activeOpacity={0.7}
        accessibilityLabel="Create formation"
        accessibilityHint="Open formation creator"
      >
        <Layout size={20} color={Colors.accent} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/store' as any)}
        style={styles.button}
        activeOpacity={0.7}
        accessibilityLabel="Store"
        accessibilityHint="Open Store"
      >
        <Store size={20} color={Colors.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 6,
    borderRadius: 8,
    // optional background to improve touch target in light/dark:
    // backgroundColor: Colors.primary,
  },
});

export default HeaderMenu;