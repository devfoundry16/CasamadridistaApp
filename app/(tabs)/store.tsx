import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart } from 'lucide-react-native';
import {altColors} from '@/constants/colors';

interface Product {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  category: string;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Home Jersey 24/25', price: '$89.99', imageUrl: 'https://casamadridista.com/wp-content/uploads/2025/08/box.png', category: 'Jerseys' },
  { id: 2, name: 'Away Jersey 24/25', price: '$89.99', imageUrl: 'https://casamadridista.com/wp-content/uploads/2025/08/DAEA05EB-59E7-4316-91D0-926B6F344449.png', category: 'Jerseys' },
  { id: 3, name: 'Training Kit', price: '$59.99', imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400', category: 'Training' },
  { id: 4, name: 'Scarf', price: '$24.99', imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400', category: 'Accessories' },
  { id: 5, name: 'Cap', price: '$19.99', imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400', category: 'Accessories' },
  { id: 6, name: 'Backpack', price: '$49.99', imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400', category: 'Accessories' },
];

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const colors = altColors;

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable
      style={[styles.productCard, { backgroundColor: colors.card, borderWidth: 0}]}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productCategory, { color: colors.textWhite }]}>{item.category}</Text>
        <Text style={[styles.productName, { color: colors.textWhite }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.productFooter}>
          <Text style={[styles.productPrice, { color: colors.textWhite }]}>{item.price}</Text>
          <Pressable style={[styles.addToCartButton, { backgroundColor: colors.primary }]}>
            <ShoppingCart size={18} color={colors.textWhite} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={PRODUCTS}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  productsList: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  productInfo: {
    padding: 12,
  },
  productCategory: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    minHeight: 36,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  addToCartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
