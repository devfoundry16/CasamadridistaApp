import Colors from "@/constants/colors";
import { Match } from "@/types/soccer/match";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useRef } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
const { width } = Dimensions.get("window");

export default function UpcomingMatchesCarousel({ data }: { data: Match[] }) {
  const router = useRouter();
  const carouselRef = useRef<any>(null);

  const renderCard = (item: any) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => router.push(`/league/${item.league.id}/${item.league.season}`)}>
        <Text style={styles.league}>
          {item.league.name} {item.league.season}-{item.league.season + 1}
        </Text>
      </TouchableOpacity>
      <Text style={styles.week}>{item.league.round}</Text>

      <TouchableOpacity style={styles.matchRow} onPress={() => router.push(`/match/${item.fixture.id}`)}>
        <View
          style={styles.team}
        >
          <Image source={{ uri: item.teams.home.logo }} style={styles.logo} />
          <Text style={styles.teamName}>{item.teams.home.name}</Text>
        </View>

        <Text style={styles.score}>
          {item.fixture.status.short == "NS" ? "-" : item.goals.home}:
          {item.fixture.status.short == "NS" ? "-" : item.goals.away}
        </Text>

        <View
          style={styles.team}
        >
          <Image source={{ uri: item.teams.away.logo }} style={styles.logo} />
          <Text style={styles.teamName}>{item.teams.away.name}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.date}>
        {new Date(item.fixture.date as any).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.adSectionHeader}>
        <View style={styles.adHeaderLine} />
        <Text style={styles.adSectionTitle}>Upcoming Match</Text>
        <View style={styles.adHeaderLine} />
      </View>
      <View style={styles.carouselWrapper}>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() =>
            carouselRef.current?.scrollTo({ count: -1, animated: true })
          }
        >
          <ChevronLeft size={20} color={Colors.accent} />
        </TouchableOpacity>

        <Carousel
          ref={carouselRef}
          width={width * 0.9}
          height={250}
          data={data}
          scrollAnimationDuration={600}
          renderItem={({ item }) => renderCard(item)}
          style={{ flex: 0 }}
          mode="parallax"
          loop
        />

        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() =>
            carouselRef.current?.scrollTo({ count: 1, animated: true })
          }
        >
          <ChevronRight size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 16,
  },
  adSectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  adSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  adHeaderLine: {
    width: 70,
    height: 2,
    backgroundColor: Colors.accent,
    marginHorizontal: 30,
  },
  carouselWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: "#fff",
    fontSize: 24,
  },
  card: {
    backgroundColor: "#2f2f2f",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    height: "100%",
    alignSelf: "center",
  },
  league: {
    color: Colors.textWhite,
    fontSize: 16,
    textAlign: "center",
  },
  week: {
    color: Colors.textWhite,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 8,
  },
  team: {
    alignItems: "center",
    width: "30%",
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 4,
  },
  teamName: {
    color: Colors.textWhite,
    fontSize: 14,
    marginTop: 2,
  },
  score: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  date: {
    marginTop: 10,
    backgroundColor: "#a37c4b",
    color: "white",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 13,
  },
});
