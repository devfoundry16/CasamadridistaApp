import * as React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Info, Mail, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

function HeaderMenu() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push('/about' as any)}
        style={styles.button}
        activeOpacity={0.7}
        accessibilityLabel="About"
        accessibilityHint="About Us"
      >
        <Info size={20} color={Colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/memberships' as any)}
        style={styles.button}
        activeOpacity={0.7}
        accessibilityLabel="Memberships"
        accessibilityHint="Memberships"
      >
        <Crown size={20} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/contact' as any)}
        style={styles.button}
        activeOpacity={0.7}
        accessibilityLabel="Contact"
        accessibilityHint="Contact Us"
      >
        <Mail size={20} color={Colors.primary} />
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