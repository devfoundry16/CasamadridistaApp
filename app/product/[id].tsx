import { useCart } from "@/hooks/useCart";
import { useLocalSearchParams } from "expo-router";
import { ShoppingCart, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Spinner } from "@/components/Spinner";
import ProductService from "@/services/Shop/ProductService";
import { Product } from "@/types/shop/product";
import { RenderHTML } from "react-native-render-html";
const { width } = Dimensions.get("window");

const customStyles = {
  p: {
    color: "#FFFFFF",
  },
  strong: {
    color: "#FFFFFF",
  },
};

export default function ProductDetailScreen() {
  const [product, setProduct] = useState<Product>();
  const [loading, setLoading] = useState<boolean>(true);
  const { id } = useLocalSearchParams<{ id: string }>();
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
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content="Loading product" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-bg-medium">
        <Text className="text-white text-lg text-center mt-10">Product not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    // router.push("/cart" as any);
  };

  return (
    <>
      <View className="flex-1 bg-bg-medium">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            <Image
              source={{ uri: product.images[selectedImageIndex].src }}
              style={{ width, height: 400 }}
              className="bg-transparent"
              resizeMode="contain"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="bg-bg-card border-t border-border-default"
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}
            >
              {product.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: img.src }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                    className={`bg-border-default border-2 ${
                      selectedImageIndex === index ? "border-rm-gold" : "border-transparent"
                    }`}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="p-5">
            <View className="mb-3">
              <Text className="text-[28px] font-bold text-white mb-2">{product.name}</Text>
              <Text className="text-[32px] font-bold text-rm-gold">
                ${Number(product.price).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row items-center mb-6 gap-1.5">
              <Star size={18} color="#BC9045" fill="#BC9045" />
              <Text className="text-base text-white font-semibold">
                {Number(product.average_rating).toFixed(1)}
              </Text>
              <Text className="text-sm text-text-secondary">
                ({product.reviews} reviews)
              </Text>
              {product.stock_quantity && (
                <View className="bg-rm-gold px-3 py-1 rounded-xl ml-2">
                  <Text className="text-xs font-semibold text-text-dark">In Stock</Text>
                </View>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-xl font-bold text-white mb-3">Description</Text>
              <View>
                <RenderHTML
                  contentWidth={width}
                  source={{ html: product.description }}
                  tagsStyles={customStyles}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="bg-bg-card p-4 border-t border-border-default">
          <TouchableOpacity
            className="bg-rm-gold py-4 rounded-xl flex-row items-center justify-center gap-2"
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <ShoppingCart size={20} color="#0A0A0A" />
            <Text className="text-lg font-semibold text-bg-dark">Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
