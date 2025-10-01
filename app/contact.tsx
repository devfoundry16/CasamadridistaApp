import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Globe, Facebook, Twitter, Instagram, Youtube, MapPin, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ContactScreen() {
  const handlePress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handlePress('mailto:info@casamadridista.com')}
            activeOpacity={0.7}
          >
            <View style={styles.contactIcon}>
              <Mail size={24} color={Colors.accent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>info@casamadridista.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handlePress('https://casamadridista.com')}
            activeOpacity={0.7}
          >
            <View style={styles.contactIcon}>
              <Globe size={24} color={Colors.accent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>www.casamadridista.com</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <MapPin size={24} color={Colors.accent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Location</Text>
              <Text style={styles.contactValue}>Madrid, Spain</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Phone size={24} color={Colors.accent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Support</Text>
              <Text style={styles.contactValue}>Available 24/7</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <Text style={styles.sectionDescription}>
            Stay connected with us on social media for the latest updates, exclusive content, and community discussions.
          </Text>

          <View style={styles.socialGrid}>
            <TouchableOpacity
              style={styles.socialCard}
              onPress={() => handlePress('https://facebook.com/realmadrid')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                <Facebook size={28} color={Colors.textWhite} />
              </View>
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialCard}
              onPress={() => handlePress('https://twitter.com/realmadrid')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#1DA1F2' }]}>
                <Twitter size={28} color={Colors.textWhite} />
              </View>
              <Text style={styles.socialLabel}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialCard}
              onPress={() => handlePress('https://instagram.com/realmadrid')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#E4405F' }]}>
                <Instagram size={28} color={Colors.textWhite} />
              </View>
              <Text style={styles.socialLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialCard}
              onPress={() => handlePress('https://youtube.com/realmadrid')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#FF0000' }]}>
                <Youtube size={28} color={Colors.textWhite} />
              </View>
              <Text style={styles.socialLabel}>YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Real Madrid</Text>
          <Text style={styles.sectionText}>
            Real Madrid Club de Fútbol is a professional football club based in Madrid, Spain. Founded in 1902, 
            the club has become one of the most successful and prestigious football institutions in the world.
          </Text>
          <Text style={styles.sectionText}>
            The Santiago Bernabéu Stadium, with a capacity of over 80,000 spectators, serves as the home ground 
            for Los Blancos and has witnessed countless historic moments in football history.
          </Text>
        </View>

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            Casa Madridista is an independent fan platform dedicated to Real Madrid supporters worldwide. 
            This app is not officially affiliated with Real Madrid Club de Fútbol.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.accent,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
  },
  socialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  disclaimerSection: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
});
