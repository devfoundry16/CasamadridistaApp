import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

export default function TermsOfServiceScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Terms of Service',
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerSubtitle}>Last Updated: January 2025</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By accessing and using the Casa Madridista mobile application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Use License</Text>
            <Text style={styles.sectionText}>
              Permission is granted to temporarily download one copy of the materials (information or software) on Casa Madridista's application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Modify or copy the materials</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Use the materials for any commercial purpose</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Attempt to decompile or reverse engineer any software</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Remove any copyright or proprietary notations</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Content</Text>
            <Text style={styles.sectionText}>
              Users may post, upload, or submit content to the application. By doing so, you grant Casa Madridista a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content in connection with the service.
            </Text>
            <Text style={styles.sectionText}>
              You are responsible for the content you post and must ensure it does not violate any laws or infringe on the rights of others.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Disclaimer</Text>
            <Text style={styles.sectionText}>
              The materials on Casa Madridista's application are provided on an 'as is' basis. Casa Madridista makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Limitations</Text>
            <Text style={styles.sectionText}>
              In no event shall Casa Madridista or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Casa Madridista's application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Accuracy of Materials</Text>
            <Text style={styles.sectionText}>
              The materials appearing on Casa Madridista's application could include technical, typographical, or photographic errors. Casa Madridista does not warrant that any of the materials on its application are accurate, complete, or current.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Links</Text>
            <Text style={styles.sectionText}>
              Casa Madridista has not reviewed all of the sites linked to its application and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Casa Madridista of the site.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Modifications</Text>
            <Text style={styles.sectionText}>
              Casa Madridista may revise these terms of service for its application at any time without notice. By using this application you are agreeing to be bound by the then current version of these terms of service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Governing Law</Text>
            <Text style={styles.sectionText}>
              These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Contact Information</Text>
            <Text style={styles.sectionText}>
              If you have any questions about these Terms of Service, please contact us through the Contact section of the application.
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
