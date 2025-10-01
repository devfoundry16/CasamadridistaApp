import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Privacy Policy',
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }} 
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.secondary, Colors.royalBlue]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>Last Updated: January 2025</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.sectionText}>
              Casa Madridista ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </Text>
            <Text style={styles.sectionText}>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We may collect information about you in a variety of ways. The information we may collect via the application includes:
            </Text>
            
            <Text style={styles.subsectionTitle}>Personal Data</Text>
            <Text style={styles.sectionText}>
              Personally identifiable information, such as your name, email address, and demographic information that you voluntarily give to us when you register with the application or when you choose to participate in various activities related to the application.
            </Text>

            <Text style={styles.subsectionTitle}>Derivative Data</Text>
            <Text style={styles.sectionText}>
              Information our servers automatically collect when you access the application, such as your device type, operating system, access times, and the pages you have viewed directly before and after accessing the application.
            </Text>

            <Text style={styles.subsectionTitle}>Mobile Device Data</Text>
            <Text style={styles.sectionText}>
              Device information such as your mobile device ID, model, and manufacturer, and information about the location of your device, if you access the application from a mobile device.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Use of Your Information</Text>
            <Text style={styles.sectionText}>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Create and manage your account</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Deliver targeted content and news</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Email you regarding your account or updates</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Improve our application and services</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Monitor and analyze usage and trends</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Respond to inquiries and offer support</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Disclosure of Your Information</Text>
            <Text style={styles.sectionText}>
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </Text>
            
            <Text style={styles.subsectionTitle}>By Law or to Protect Rights</Text>
            <Text style={styles.sectionText}>
              If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.
            </Text>

            <Text style={styles.subsectionTitle}>Third-Party Service Providers</Text>
            <Text style={styles.sectionText}>
              We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Security of Your Information</Text>
            <Text style={styles.sectionText}>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Policy for Children</Text>
            <Text style={styles.sectionText}>
              We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Changes to This Privacy Policy</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy from time to time in order to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Your Rights</Text>
            <Text style={styles.sectionText}>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>The right to access your personal data</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>The right to rectify inaccurate data</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>The right to request deletion of your data</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>The right to restrict processing</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>The right to data portability</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have questions or comments about this Privacy Policy, please contact us through the Contact section of the application or visit our website at casamadridista.com.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
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
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
  },
});
