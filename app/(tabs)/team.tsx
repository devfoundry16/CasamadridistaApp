import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MapPin, Calendar, Building2 } from "lucide-react-native";
import { Player, TeamInfo, Coach, CountryMap, PlayerWithTeam, CoachWithTeam } from "@/interfaces/profile";
import countries from "@/constants/countries.json";
import { altColors as colors } from "@/constants/colors";
import { latestMatches } from "@/mocks/team";
import { useApp } from "@/contexts/AppContext";
import CountryFlag from "react-native-country-flag";
const map: CountryMap = countries;

export default function TeamScreen() {
  const router = useRouter();
  const { playersList, coachList, teamInfoList, fetchProfileData } = useApp();
  const id = 541;

  const players = playersList.find((p) => p.team.id === id) ?? {
    player: [],
    team: {},
  };
  const coachWithTeam: CoachWithTeam = coachList.find(
    (c) => c.team.id === Number(id)
  ) ?? { player: {} as Coach, team: { id: 0 } };

  const coach: Player = coachWithTeam.player;

  const teamInfo = teamInfoList.find((t) => t.team.id === id);

  const goalkeepers = players.player.filter((p) => p.position === "Goalkeeper");
  const defenders = players.player.filter((p) => p.position === "Defender");
  const midfielders = players.player.filter((p) => p.position === "Midfielder");
  const forwards = players.player.filter((p) => p.position === "Attacker");

  useEffect(() => {
    // fetchProfileData(Number(id)); // Default Real Madrid team ID
    const teamIDs = playersList.map((players) => players.team.id);
    console.log("loaded players on team[id].tsx:", teamIDs);
    console.log("fetch profile data on team[id].tsx");
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: 12,
          },
        ]}
      >
        <Image
          source={{
            uri: teamInfo?.team?.logo,
          }}
          contentFit="cover"
          style={styles.headerImage}
        />
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
          {teamInfo?.team?.name} Squad
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textWhite }]}>
          2024-2025 Season
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
              <MapPin size={20} color={colors.textWhite} />
              <Text style={styles.infoLabel}>Country</Text>
              {teamInfo?.team?.country && map[teamInfo.team.country] ? (
                <CountryFlag isoCode={map[teamInfo.team.country]} size={25} />
              ) : null}
            </View>
            <View style={styles.infoItem}>
              <Calendar size={20} color={colors.textWhite} />
              <Text style={styles.infoLabel}>Founded</Text>
              <Text style={styles.infoValue}>{teamInfo?.team?.founded}</Text>
            </View>
            <View style={styles.infoItem}>
              <Building2 size={20} color={colors.textWhite} />
              <Text style={styles.infoLabel}>Stadium</Text>
              <Text style={styles.infoValue}>{teamInfo?.venue?.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Squad</Text>
          <View style={styles.accentLine} />
        </View>

        <View style={styles.positionSection}>
          <View style={styles.positionTitleContainer}>
            <Text style={styles.positionTitle}>GOALKEEPERS</Text>
          </View>
          {goalkeepers.map((player: Player) => (
            <View key={player.id}>
              <PlayerCard
                player={player}
                onPress={() => router.push(`/player/${player.id}` as any)}
              />
              <View style={styles.accentLine} />
            </View>
          ))}
        </View>

        <View style={styles.positionSection}>
          <View style={styles.positionTitleContainer}>
            <Text style={styles.positionTitle}>DEFENDERS</Text>
          </View>
          {defenders.map((player: Player) => (
            <View key={player.id}>
              <PlayerCard
                player={player}
                onPress={() => router.push(`/player/${player.id}` as any)}
              />
              <View style={styles.accentLine} />
            </View>
          ))}
        </View>

        <View style={styles.positionSection}>
          <View style={styles.positionTitleContainer}>
            <Text style={styles.positionTitle}>MIDFIELDERS</Text>
          </View>
          {midfielders.map((player: Player) => (
            <View key={player.id}>
              <PlayerCard
                player={player}
                onPress={() => router.push(`/player/${player.id}` as any)}
              />
              <View style={styles.accentLine} />
            </View>
          ))}
        </View>

        <View style={styles.positionSection}>
          <View style={styles.positionTitleContainer}>
            <Text style={styles.positionTitle}>FORWARDS</Text>
          </View>
          {forwards.map((player: Player) => (
            <View key={player.id}>
              <PlayerCard
                player={player}
                onPress={() => router.push(`/player/${player.id}` as any)}
              />
              <View style={styles.accentLine} />
            </View>
          ))}
        </View>
        <View style={styles.positionSection}>
          <View style={styles.positionTitleContainer}>
            <Text style={styles.positionTitle}>COACH</Text>
          </View>
          {coach && (
            <View>
              <PlayerCard
                player={coach}
                onPress={() => router.push(`/coach/${coach.id}` as any)}
              />
              <View style={styles.accentLine} />
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Matches</Text>
          <View style={styles.accentLine} />
        </View>

        {latestMatches.map((match, index) => (
          <View key={index} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchCompetition}>{match.competition}</Text>
              <Text style={styles.matchDateTime}>
                {match.date} • {match.time}
              </Text>
            </View>
            <View style={styles.matchContent}>
              <View style={styles.teamContainer}>
                <Image
                  source={{ uri: match.homeTeam.logo }}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.homeTeam.name}
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{match.homeTeam.score}</Text>
                <Text style={styles.scoreSeparator}>-</Text>
                <Text style={styles.score}>{match.awayTeam.score}</Text>
              </View>
              <View style={styles.teamContainer}>
                <Image
                  source={{ uri: match.awayTeam.logo }}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.awayTeam.name}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
function PlayerCard({
  player,
  onPress,
}: {
  player: Player | Coach;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.playerCard} onPress={onPress}>
      <View style={styles.playerNumber}>
        <Text style={styles.playerNumberText}>{player.number}</Text>
      </View>
      <Image
        source={{ uri: player.photo }}
        style={styles.playerPhoto}
        contentFit="cover"
      />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <View style={styles.playerMeta}>
          {player.nationality && map[player.nationality] ? (
            <CountryFlag isoCode={map[player.nationality]} size={25} />
          ) : null}
          <Text style={styles.playerMetaText}>Age: </Text>
          <Text style={styles.playerMetaText}>{player.age} years</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerImage: {
    width: 120,
    height: 120,
    margin: "auto",
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  playersList: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  infoCard: {
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoColumn: {
    flexDirection: "column",
    justifyContent: "space-around",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    margin: 6,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.lightGray,
    fontWeight: "500" as const,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textWhite,
    fontWeight: "700" as const,
  },
  sectionHeader: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.textWhite,
  },
  accentLine: {
    height: 1.5,
    width: "100%",
    backgroundColor: colors.lightGray,
    borderRadius: 2,
  },
  positionSection: {
    marginBottom: 24,
  },
  positionTitleContainer: {
    textAlignVertical: "center",
    backgroundColor: colors.primary,
    paddingLeft: 16,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.textWhite,
    paddingVertical: 6,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playerNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playerNumberText: {
    fontSize: 25,
    fontWeight: "700" as const,
    color: colors.textWhite,
  },
  playerPhoto: {
    width: 60,
    height: 60,
    marginRight: 12,
    backgroundColor: colors.lightGray,
  },
  playerCountryImage: {
    width: 50,
    height: 30,
    backgroundColor: "transparent",
    marginRight: 6,
  },
  playerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.textWhite,
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playerMetaText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textWhite,
  },
  matchCard: {
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matchCompetition: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.textWhite,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchDateTime: {
    fontSize: 11,
    color: colors.textWhite,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 40,
    height: 40,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textWhite,
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  score: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.textWhite,
  },
  scoreSeparator: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.textWhite,
  },
  nextMatchSection: {
    marginBottom: 24,
  },
  nextMatchCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  nextMatchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nextMatchCompetition: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.accent,
  },
  nextMatchTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  nextMatchTeam: {
    flex: 1,
    alignItems: "center",
    gap: 12,
  },
  nextMatchLogo: {
    width: 70,
    height: 70,
  },
  nextMatchTeamName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: colors.textWhite,
    textAlign: "center",
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.accent,
    letterSpacing: 2,
  },
  nextMatchDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  nextMatchDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextMatchDetailText: {
    fontSize: 12,
    color: colors.textWhite,
    fontWeight: "600" as const,
  },
  vsTextSmall: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.textWhite,
  },
  matchStadium: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchStadiumText: {
    fontSize: 11,
    color: colors.textWhite,
  },
});
