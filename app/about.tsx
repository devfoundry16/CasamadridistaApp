import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import {
  Mail,
  Globe,
  Volleyball,
  FileText,
  Shield,
  Check,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContent}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/324242342.webp",
          }}
          style={styles.headerImage}
          contentFit="cover"
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>About Us</Text>
          <Text style={styles.headerSubtitle}>بيت المدريديستا</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Casa Madridista</Text>
          <Text style={styles.sectionText}>
            Casa Madridista is more than just a website it's the digital home of
            every passionate Madridista around the world. We are an official fan
            network, proudly uniting Real Madrid fan clubs from more than 30
            countries under one banner.
          </Text>
          <Text style={styles.sectionText}>
            Driven by loyalty, history, and the legacy of greatness, our mission
            is to create a shared space for fans to connect, celebrate, and
            participate in the Real Madrid journey wherever they are in the
            world.
          </Text>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/436456.webp",
            }}
            style={{
              width: "100%",
              height: 305,
              borderRadius: 12,
              marginTop: 12,
              marginBottom: 12,
            }}
            contentFit="cover"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Vision</Text>
          <Text style={styles.sectionText}>
            To unite Madridistas from all corners of the globe from every
            culture, background, and belief and create the most vibrant,
            trusted, and inclusive community of Real Madrid fans. We aim to
            amplify the voice of every fan, giving them a platform to connect,
            celebrate, and influence the official fan journey wherever they are
            in the world.
          </Text>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/5466456-1.webp",
            }}
            style={{
              width: "100%",
              height: 208,
              borderRadius: 12,
              marginTop: 12,
              marginBottom: 12,
            }}
            contentFit="cover"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.valueItem}>
            <Check size={20} color={Colors.darkGold} strokeWidth={5} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>Verified Membership Tiers</Text>{" "}
              that unlock exclusive content, VIP experiences, and official
              perks.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Check size={20} color={Colors.darkGold} strokeWidth={5} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>Access to Tickets & Events</Text>{" "}
              through our club allocations and special raffles.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Check size={20} color={Colors.darkGold} strokeWidth={5} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>Interactive Fan Engagement,</Text>{" "}
              including polls, match previews, tactical discussions, and more.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Check size={20} color={Colors.darkGold} strokeWidth={5} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>
                Private WhatsApp Channels & Live Sessions{" "}
              </Text>{" "}
              with analysts and community leaders.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Check size={20} color={Colors.darkGold} strokeWidth={5} />
            <Text style={styles.valueText}>
              <Text style={styles.valueBold}>A Place at the Table - </Text> VIP
              members can vote and take part in official fan club decisions.
            </Text>
          </View>
        </View>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Volleyball size={50} strokeWidth={1.5} color={Colors.darkGold} />
            </View>
            <Text style={styles.sectionTitle}>Why We Exist</Text>
            <Text
              style={{
                ...styles.sectionText,
                textAlign: "center",
                color: Colors.primary,
              }}
            >
              Real Madrid is not just a football club. It's a story. A legacy. A
              force. We believe every fan deserves to be part of that story not
              just as a spectator, but as a participant.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Globe size={50} strokeWidth={1.5} color={Colors.darkGold} />
            </View>
            <Text style={styles.sectionTitle}>A Global Family</Text>
            <Text
              style={{
                ...styles.sectionText,
                textAlign: "center",
                color: Colors.primary,
              }}
            >
              Whether you're in Madrid, Morocco, Mexico, or Malaysia you are
              part of One Madridista Family. Our strength lies in our unity, and
              our voice becomes louder with every member who joins.
            </Text>
          </View>
          <Text style={styles.featureContent}>
            Casa Madridista is your chance to live that experience fully.
          </Text>
        </View>

        <View style={styles.headerContent}>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234234234.webp",
            }}
            style={styles.statsImage}
            contentFit="cover"
          />
          <View style={styles.header}>
            <Text style={styles.sectionTitle}>Join Us</Text>
            <View style={styles.contactItem}>
              <Text
                style={{
                  ...styles.featureText,
                  textAlign: "center",
                  fontSize: 13,
                  marginBottom: 0,
                }}
              >
                Become an official member, access exclusive content, and
                represent Real Madrid with pride.
              </Text>
              <Text
                style={{
                  ...styles.featureText,
                  fontStyle: "italic",
                  fontSize: 15,
                  marginBottom: 0,
                }}
              >
                For collaborations, media, or official inquiries
              </Text>
              <Mail size={30} color={Colors.darkGold} strokeWidth={3} />
              <Text style={styles.sectionText}>Contact@casamadridista.com</Text>
            </View>
          </View>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity
            style={styles.legalCard}
            onPress={() => router.push("/terms-of-service")}
          >
            <View style={styles.legalIcon}>
              <FileText size={35} color={Colors.darkGold} />
            </View>
            <View style={styles.legalContent}>
              <Text style={styles.legalTitle}>Terms of Service</Text>
              <Text style={styles.legalDescription}>
                Read our terms and conditions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalCard}
            onPress={() => router.push("/privacy-policy")}
          >
            <View style={styles.legalIcon}>
              <Shield size={35} color={Colors.darkGold} />
            </View>
            <View style={styles.legalContent}>
              <Text style={styles.legalTitle}>Privacy Policy</Text>
              <Text style={styles.legalDescription}>
                Learn how we protect your data
              </Text>
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
    backgroundColor: Colors.darkGray,
  },
  headerContent: {
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    position: "absolute" as const,
    alignItems: "center" as const,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  headerImage: {
    width: "100%",
    height: 235,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.darkGold,
  },
  content: {
    padding: 16,
  },
  section: {
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: Colors.textWhite,
    lineHeight: 24,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  featuredImage: {
    width: "100%",
    height: 305,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
    textAlign: "center",
  },
  featureText: {
    fontSize: 12,
    color: Colors.textWhite,
    textAlign: "center",
    lineHeight: 16,
  },
  featureContent: {
    color: Colors.textWhite,
    fontSize: 18,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500" as const,
    fontStyle: "italic",
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center" as const,
    marginBottom: 12,
    gap: 12,
  },
  contactItem: {
    flexDirection: "column",
    alignItems: "center" as const,
    marginBottom: 12,
    gap: 12,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textWhite,
    lineHeight: 22,
  },
  valueBold: {
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  statsImage: {
    width: "100%",
    height: 350,
  },
  statsSection: {
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: Colors.darkGold,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.royalBlue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
  },
  legalSection: {
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
  },
  legalIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  legalContent: {
    flex: 1,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  legalDescription: {
    fontSize: 13,
    color: Colors.textWhite,
  },
});
