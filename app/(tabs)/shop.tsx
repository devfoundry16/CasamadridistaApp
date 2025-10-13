import Colors, { altColors } from "@/constants/colors";
import ShopApiService from "@/services/shopApi";
import { Product } from "@/types/product/product";
import { Image } from 'expo-image';
import { router, Stack } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const colors = altColors;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllProducts();
  }, []);

  const getAllProducts = async () => {
    try {
      ShopApiService.getProducts().then((data) => {
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
      style={[
        styles.productCard,
        { backgroundColor: colors.card, borderWidth: 0 },
      ]}
      onPress={() => {
        router.push(`/product/${item.id}`);
      }}
    >
      <Image source={{ uri: item.images[0].src }} contentFit="cover" style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productCategory, { color: colors.textWhite }]}>
          {item.categories[0].name}
        </Text>
        <Text
          style={[styles.productName, { color: Colors.darkGold }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View style={styles.productFooter}>
          <Text style={[styles.productPrice, { color: colors.textWhite }]}>
            ${item.price}
          </Text>
          <Pressable
            style={[
              styles.addToCartButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <ShoppingCart size={18} color={colors.textWhite} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.deepDarkGray }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Shop",
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      <View style={styles.headerContent}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
          }}
          style={styles.headerImage}
          contentFit="cover"
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome</Text>
          <Text style={styles.headerSubtitle}>
            CasaMadridista Shop
          </Text>
        </View>
      </View>
      {isLoading && (
        <Text style={{ color: colors.textWhite, textAlign: "center" }}>
          Loading...
        </Text>
      )}
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
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  headerImage: {
    width: "100%",
    height: 250,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.darkGold,
  },
  productsList: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  productImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E5E7EB",
  },
  productInfo: {
    padding: 12,
  },
  productCategory: {
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
    minHeight: 36,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  addToCartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
