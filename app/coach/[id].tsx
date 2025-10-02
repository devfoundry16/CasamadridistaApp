import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Image } from "expo-image";
import { MapPin, Calendar, Hash, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

export default function CoachDetailScreen() {
  const { coach: player} = useApp();
  const { id } = useLocalSearchParams();

  if (!player) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Coach not found</Text>
      </View>
    );
  }
  return (
    <>
      <Stack.Screen
        options={{
          title: player.name,
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.primary,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={{ uri: player.photo }}
            style={styles.playerPhoto}
            contentFit="cover"
          />
          <Text style={styles.playerName}>{player.name}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Player Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{player.name}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{player.age}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nationality</Text>
                <Image
                  source={{ uri: player.birth.flag }}
                  contentFit="cover"
                  style={styles.playerCountryImage}
                />
              </View>
              <View style={styles.divider} />
              <View style={{ ...styles.infoRow }}>
                <Text style={styles.infoLabel}>Place of Birth</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}} >
                  <Text style={styles.infoValue}>{player.birth.place} </Text>
                  <Image
                    source={{ uri: player.flag }}
                    contentFit="cover"
                    style={styles.playerCountryImage}
                  />
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date Of Birth</Text>
                <Text style={styles.infoValue}>{player.birth.date}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>{player.weight}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{player.height}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Club</Text>
            <View style={styles.clubCard}>
              <Image
                source={{
                  uri: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
                }}
                style={styles.clubLogo}
                contentFit="contain"
              />
              <View style={styles.clubInfo}>
                <Text style={styles.clubName}>Real Madrid CF</Text>
                <Text style={styles.clubSubtitle}>Los Blancos</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  playerPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Colors.primary,
    marginBottom: 16,
    backgroundColor: Colors.lightGray,
  },
  playerName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 4,
    textAlign: "center",
  },
  playerPosition: {
    fontSize: 16,
    color: Colors.textWhite,
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  playerCountryImage: {
    width: 50,
    height: 30,
    marginLeft: 10,
    backgroundColor: Colors.lightGray,
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textWhite,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 12,
    paddingLeft: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    paddingTop: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textWhite,
    fontWeight: "500" as const,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textWhite,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clubLogo: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  clubSubtitle: {
    fontSize: 14,
    color: Colors.textWhite,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textWhite,
    textAlign: "center",
    marginTop: 40,
  },
});
