import { Spinner } from "@/components/Spinner";
import Colors, { altColors } from "@/constants/colors";
import ShopApiService from "@/services/ShopService";
import { Product } from "@/types/product/product";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const colors = altColors;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllProducts();
  }, []);

  const getAllProducts = async () => {
    try {
      ShopApiService.getProducts().then((data) => {
        setProducts(data);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error loading store data:", error);
    } finally {
      console.log("**");
      setLoading(true);
    }
  };

  if (loading) {
    return <Spinner content="Loading Store" />;
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.images[0].src }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.ratingContainer}>
          <Star size={14} color={Colors.darkGold} fill={Colors.darkGold} />
          <Text style={styles.ratingText}>
            {Number(item.average_rating).toFixed(1)}
          </Text>
          <Text style={styles.reviewsText}>({item.reviews ? 30 : 0})</Text>
        </View>
        <Text style={styles.productPrice}>
          ${Number(item.price).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.deepDarkGray }]}>
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
          <Text style={styles.headerSubtitle}>CasaMadridista Shop</Text>
        </View>
      </View>
      {loading && (
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
    backgroundColor: Colors.text,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.border,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: Colors.textWhite,
    fontWeight: "600" as const,
  },
  reviewsText: {
    fontSize: 12,
    color: Colors.textWhite,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.darkGold,
  },
  addToCartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
