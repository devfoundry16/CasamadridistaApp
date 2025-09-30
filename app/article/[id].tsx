import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Clock, User, Calendar } from 'lucide-react-native';
import { articles } from '@/mocks/articles';
import Colors from '@/constants/colors';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = articles.find(a => a.id === id);

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: article.image }}
        style={styles.headerImage}
        contentFit="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {article.category.replace('-', ' ').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <User size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{article.author}</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{article.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{article.readTime}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.excerpt}>{article.excerpt}</Text>

        <View style={styles.contentDivider} />

        {article.content.split('\n\n').map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            Thank you for reading Casa Madridista
          </Text>
          <Text style={styles.footerSubtext}>
            Stay tuned for more Real Madrid news and updates
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textLight,
  },
  headerImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.secondary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 36,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  excerpt: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: 16,
    fontStyle: 'italic' as const,
  },
  contentDivider: {
    height: 3,
    width: 60,
    backgroundColor: Colors.accent,
    marginBottom: 20,
    borderRadius: 2,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 20,
    textAlign: 'justify',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  footerDivider: {
    height: 2,
    width: 80,
    backgroundColor: Colors.accent,
    marginBottom: 16,
    borderRadius: 1,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
