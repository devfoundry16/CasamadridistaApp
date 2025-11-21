import Colors from "@/constants/colors";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import countries from "@/constants/countries.json";
import { useFootball } from "@/hooks/useFootball";
import { CountryMap } from "@/types/soccer/profile";
import { useEffect } from "react";
import CountryFlag from "react-native-country-flag";

const map: CountryMap = countries;
export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams();
  const { coachList } = useFootball();

  const coachId = Number(id);

  const coachWithTeam = coachList.find((p) => p.player.id === coachId);
  const coach = coachWithTeam?.player;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{ uri: coach?.photo }}
          style={styles.playerPhoto}
          contentFit="cover"
        />
        <Text style={styles.playerName}>{coach?.name}</Text>
        <Text style={styles.playerPosition}>{coach?.position}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Player Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{coach?.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{coach?.age}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nationality</Text>
              {coach?.nationality && map[coach?.nationality] ? (
                <CountryFlag isoCode={map[coach?.nationality]} size={25} />
              ) : null}
            </View>
            <View style={styles.divider} />
            <View style={{ ...styles.infoRow }}>
              <Text style={styles.infoLabel}>Place of Birth</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={styles.infoValue}>{coach?.birth.place} </Text>
                {coach?.birth.country && map[coach?.birth.country] ? (
                  <CountryFlag isoCode={map[coach?.birth.country]} size={25} />
                ) : null}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date Of Birth</Text>
              <Text style={styles.infoValue}>{coach?.birth.date}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{coach?.weight}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>{coach?.height}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
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
    backgroundColor: "transparent",
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
  widgetContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    overflow: "hidden",
    height: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webview: {
    backgroundColor: "transparent",
  },
});
