import Colors, { altColors } from '@/constants/colors';
import StoreApiService from '@/services/storeApi';
import { Product } from '@/types/product/product';
import { Stack } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';



export default function StoreScreen() {

  const [products, setProducts] = useState<Product[] | null>(null);
  const colors = altColors;
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    getAllProducts();
  }, []);


  const getAllProducts = async () => {
    try {
      StoreApiService.getProducts().then((data) => {
        setProducts(data);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error loading store data:", error);
    } finally {
      setIsLoading(true);
    }
  };
  

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable
      style={[styles.productCard, { backgroundColor: colors.card, borderWidth: 0}]}
    >
      <Image source={{ uri: item.images[0].src }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productCategory, { color: colors.textWhite }]}>{item.categories[0].name}</Text>
        <Text style={[styles.productName, { color: colors.textWhite }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.productFooter}>
          <Text style={[styles.productPrice, { color: colors.textWhite }]}>${item.price}</Text>
          <Pressable style={[styles.addToCartButton, { backgroundColor: colors.primary }]}>
            <ShoppingCart size={18} color={colors.textWhite} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "About",
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      { isLoading && <Text style={{color: colors.textWhite, textAlign: 'center'}}>Loading...</Text> }
      <FlatList
        data={products}
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
