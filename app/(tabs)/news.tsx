import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { categories } from '@/mocks/articles';
import Colors from '@/constants/colors';

export default function NewsScreen() {
  const router = useRouter();
  const { filteredArticles, selectedCategory, setSelectedCategory } = useApp();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.articlesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.articlesContent}
      >
        {filteredArticles.map((article: any) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => router.push(`/article/${article.id}` as any)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: article.image }}
              style={styles.articleImage}
              contentFit="cover"
            />
            <View style={styles.articleContent}>
              <View style={styles.articleCategory}>
                <Text style={styles.articleCategoryText}>
                  {article.category.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.articleTitle} numberOfLines={2}>
                {article.title}
              </Text>
              <Text style={styles.articleExcerpt} numberOfLines={3}>
                {article.excerpt}
              </Text>
              <View style={styles.articleMeta}>
                <Clock size={12} color={Colors.textLight} />
                <Text style={styles.articleMetaText}>{article.readTime}</Text>
                <Text style={styles.articleMetaText}>•</Text>
                <Text style={styles.articleMetaText}>{article.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  categoriesContainer: {
    backgroundColor: Colors.primary,
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    height: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.secondary,
  },
  articlesContainer: {
    flex: 1,
  },
  articlesContent: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleImage: {
    width: '100%',
    height: 200,
  },
  articleContent: {
    padding: 16,
  },
  articleCategory: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  articleCategoryText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.royalBlue,
    letterSpacing: 0.5,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  articleMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
});
