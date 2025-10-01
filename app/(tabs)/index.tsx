import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Clock, ChevronRight } from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function HomeScreen() {
  const router = useRouter();
  const { featuredArticles, latestArticles } = useApp();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View
        style={styles.header}
      >
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/435345345.webp",
          }}
          style={styles.headerImage}
          contentFit="cover"
        />
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>بيت المدريديستا</Text>
          <Text style={styles.headerSubtitle}>Casa Madridista</Text>
          <Text style={styles.headerTagline}>Your Home for Real Madrid News</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Stories</Text>
          <View style={styles.accentLine} />
        </View>

        {featuredArticles[0] && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() =>
              router.push(`/article/${featuredArticles[0].id}` as any)
            }
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: featuredArticles[0].image }}
              style={styles.featuredImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.9)"]}
              style={styles.featuredGradient}
            >
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {featuredArticles[0].category.replace("-", " ").toUpperCase()}
                </Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {featuredArticles[0].title}
              </Text>
              <View style={styles.featuredMeta}>
                <Clock size={14} color={Colors.accent} />
                <Text style={styles.featuredMetaText}>
                  {featuredArticles[0].readTime}
                </Text>
                <Text style={styles.featuredMetaText}>•</Text>
                <Text style={styles.featuredMetaText}>
                  {featuredArticles[0].date}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.featuredGrid}>
          {featuredArticles.slice(1, 3).map((article: any) => (
            <TouchableOpacity
              key={article.id}
              style={styles.featuredSmallCard}
              onPress={() => router.push(`/article/${article.id}` as any)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: article.image }}
                style={styles.featuredSmallImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.featuredSmallGradient}
              >
                <Text style={styles.featuredSmallTitle} numberOfLines={2}>
                  {article.title}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => router.push("/news" as any)}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={16} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {latestArticles.map((article: any) => (
          <TouchableOpacity
            key={article.id}
            style={styles.newsCard}
            onPress={() => router.push(`/article/${article.id}` as any)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: article.image }}
              style={styles.newsImage}
              contentFit="cover"
            />
            <View style={styles.newsContent}>
              <View style={styles.newsCategory}>
                <Text style={styles.newsCategoryText}>
                  {article.category.replace("-", " ").toUpperCase()}
                </Text>
              </View>
              <Text style={styles.newsTitle} numberOfLines={2}>
                {article.title}
              </Text>
              <Text style={styles.newsExcerpt} numberOfLines={2}>
                {article.excerpt}
              </Text>
              <View style={styles.newsMeta}>
                <Clock size={12} color={Colors.textLight} />
                <Text style={styles.newsMetaText}>{article.readTime}</Text>
                <Text style={styles.newsMetaText}>•</Text>
                <Text style={styles.newsMetaText}>{article.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
  header: {
    paddingBottom: 30,
    alignItems: "center",
  },
  headerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBlockEnd: 300,
    paddingBlockStart: 300,
  },
  headerImage: {
    width: "100%",
    height: 778,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.accent,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  headerTagline: {
    fontSize: 14,
    color: Colors.textWhite,
    opacity: 0.8,
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  accentLine: {
    height: 3,
    width: 40,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  featuredCard: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: Colors.secondary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: "flex-end",
  },
  categoryBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.secondary,
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 8,
    lineHeight: 30,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredMetaText: {
    fontSize: 12,
    color: Colors.accent,
  },
  featuredGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  featuredSmallCard: {
    flex: 1,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.secondary,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  featuredSmallImage: {
    width: "100%",
    height: "100%",
  },
  featuredSmallGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: "flex-end",
  },
  featuredSmallTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    lineHeight: 18,
  },
  newsCard: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    width: 120,
    height: 120,
  },
  newsContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  newsCategory: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  newsCategoryText: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: Colors.royalBlue,
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  newsExcerpt: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
    marginBottom: 6,
  },
  newsMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newsMetaText: {
    fontSize: 10,
    color: Colors.textLight,
  },
});
