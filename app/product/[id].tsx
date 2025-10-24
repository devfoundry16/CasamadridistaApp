import { useCart } from "@/hooks/useCart";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ShoppingCart, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import HeaderStack from "@/components/HeaderStack";
import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import ProductService from "@/services/Shop/ProductService";
import { Product } from "@/types/product/product";
import { RenderHTML } from "react-native-render-html";
const { width } = Dimensions.get("window");
export default function ProductDetailScreen() {
  const [product, setProduct] = useState<Product>();
  const [loading, setLoading] = useState<boolean>(true);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number>(0);

  useEffect(() => {
    getProduct(Number(id));
  }, []);

  const getProduct = async (id: number) => {
    try {
      ProductService.getProductById(id).then((data) => {
        setProduct(data);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error loading store data:", error);
    } finally {
      setLoading(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.spinnerContainer}>
        <HeaderStack title="Product Details" />
        <Spinner content="Loading product" />
      </View>
    );
  }

  if (!product) {
    return (
      <>
        <HeaderStack title="No Product" />
        <View style={styles.container}>
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    // router.push("/cart" as any);
  };

  return (
    <>
      <HeaderStack title={product.name} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            <Image
              source={{ uri: product.images[selectedImageIndex].src }}
              style={styles.productImage}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailContainer}
              contentContainerStyle={styles.thumbnailContent}
            >
              {product.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: img.src }}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.thumbnailSelected,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                ${Number(product.price).toFixed(2)}
              </Text>
            </View>

            <View style={styles.ratingContainer}>
              <Star size={18} color={Colors.darkGold} fill={Colors.darkGold} />
              <Text style={styles.ratingText}>
                {Number(product.average_rating).toFixed(1)}
              </Text>
              <Text style={styles.reviewsText}>
                ({product.reviews} reviews)
              </Text>
              {product.stock_quantity && (
                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>In Stock</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                <RenderHTML
                  contentWidth={width}
                  source={{ html: product.description }}
                  tagsStyles={customStyles}
                />
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <ShoppingCart size={20} color={Colors.darkBg} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
const customStyles = {
  p: {
    color: Colors.textWhite,
  },
  strong: {
    color: Colors.textWhite,
  },
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
  },
  productImage: {
    width: "100%",
    height: 400,
    objectFit: "contain",
    backgroundColor: "transparent",
  },
  thumbnailContainer: {
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.border,
    borderWidth: 2,
    objectFit: "contain",
    borderColor: "transparent",
  },
  thumbnailSelected: {
    borderColor: Colors.darkGold,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.darkGold,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "600" as const,
  },
  reviewsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  stockBadge: {
    backgroundColor: Colors.darkGold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.darkBg,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  footer: {
    backgroundColor: Colors.cardBg,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addToCartButton: {
    backgroundColor: Colors.darkGold,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.darkBg,
  },
});
