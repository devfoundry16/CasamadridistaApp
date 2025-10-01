import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users, Globe, Heart, FileText, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[Colors.secondary, Colors.royalBlue]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>About Casa Madridista</Text>
        <Text style={styles.headerSubtitle}>بيت المدريديستا</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            Casa Madridista is your ultimate destination for everything Real Madrid. We bring you the latest news, 
            match reports, player interviews, and exclusive content about the world&apos;s most successful football club.
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Trophy size={32} color={Colors.accent} />
            </View>
            <Text style={styles.featureTitle}>Latest News</Text>
            <Text style={styles.featureText}>
              Stay updated with breaking news and match reports
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Users size={32} color={Colors.accent} />
            </View>
            <Text style={styles.featureTitle}>Player Insights</Text>
            <Text style={styles.featureText}>
              Exclusive interviews and player profiles
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Globe size={32} color={Colors.accent} />
            </View>
            <Text style={styles.featureTitle}>Global Community</Text>
            <Text style={styles.featureText}>
              Connect with Madridistas worldwide
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Heart size={32} color={Colors.accent} />
            </View>
            <Text style={styles.featureTitle}>Passion & Pride</Text>
            <Text style={styles.featureText}>
              Celebrating the legacy of Real Madrid
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real Madrid Legacy</Text>
          <Text style={styles.sectionText}>
            Real Madrid Club de Fútbol, founded in 1902, is one of the most prestigious and successful football 
            clubs in the world. With a record number of European Cup/UEFA Champions League titles and countless 
            domestic honors, Real Madrid has established itself as a symbol of excellence in football.
          </Text>
          <Text style={styles.sectionText}>
            The club&apos;s iconic white kit, the legendary Santiago Bernabéu Stadium, and a history filled with 
            legendary players have made Real Madrid a global phenomenon. From Di Stéfano to Cristiano Ronaldo, 
            the club has been home to football&apos;s greatest talents.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.valueItem}>
            <View style={styles.valueBullet} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>Excellence:</Text> Striving for the highest standards in everything we do
            </Text>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueBullet} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>Passion:</Text> Celebrating the love for Real Madrid and football
            </Text>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueBullet} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>Community:</Text> Building connections among Madridistas globally
            </Text>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueBullet} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>Integrity:</Text> Providing accurate and reliable information
            </Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Club Achievements</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>15+</Text>
              <Text style={styles.statLabel}>Champions League</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>35+</Text>
              <Text style={styles.statLabel}>La Liga Titles</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>20+</Text>
              <Text style={styles.statLabel}>Copa del Rey</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>100+</Text>
              <Text style={styles.statLabel}>Total Trophies</Text>
            </View>
          </View>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity 
            style={styles.legalCard}
            onPress={() => router.replace('/terms-of-service')}
          >
            <View style={styles.legalIcon}>
              <FileText size={24} color={Colors.accent} />
            </View>
            <View style={styles.legalContent}>
              <Text style={styles.legalTitle}>Terms of Service</Text>
              <Text style={styles.legalDescription}>Read our terms and conditions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.legalCard}
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={styles.legalIcon}>
              <Shield size={24} color={Colors.accent} />
            </View>
            <View style={styles.legalContent}>
              <Text style={styles.legalTitle}>Privacy Policy</Text>
              <Text style={styles.legalDescription}>Learn how we protect your data</Text>
            </View>
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: '600' as const,
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
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  valueBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 8,
    marginRight: 12,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
  },
  valueBold: {
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statsSection: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.royalBlue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  legalSection: {
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
  legalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  legalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  legalContent: {
    flex: 1,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  legalDescription: {
    fontSize: 13,
    color: Colors.textLight,
  },
});
