import { Spinner } from "@/components/Spinner";
import ProductService from "@/services/Shop/ProductService";
import { Product } from "@/types/shop/product";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllProducts();
  }, []);

  const getAllProducts = async () => {
    try {
      ProductService.getProducts().then((data) => {
        const filtered = data.filter((p) => p.type !== "variable-subscription");
        setProducts(filtered);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error loading store data:", error);
    } finally {
      setLoading(true);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="w-[48%] bg-text-dark rounded-xl mb-4 border border-border-default overflow-hidden"
      onPress={() => router.push(`/product/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.images[0].src }}
        style={{ width: screenWidth * 0.48 - 24, height: 180 }}
        className="bg-border-default"
      />
      <View className="p-3">
        <Text className="text-base font-semibold text-white mb-1.5" numberOfLines={1}>
          {item.name}
        </Text>
        <View className="flex-row items-center mb-2 gap-1">
          <Star size={14} color="#BC9045" fill="#BC9045" />
          <Text className="text-[13px] text-white font-semibold">
            {Number(item.average_rating).toFixed(1)}
          </Text>
          <Text className="text-xs text-white">({item.reviews ? 30 : 0})</Text>
        </View>
        <Text className="text-lg font-bold text-rm-gold">
          ${Number(item.price).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-bg-medium">
      <View className="flex-col items-center justify-center">
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
          }}
          style={{ width: screenWidth, height: 250 }}
          className="mb-3"
          contentFit="cover"
        />
        <View className="absolute items-center">
          <Text className="text-4xl font-bold text-white mb-1">Welcome</Text>
          <Text className="text-xl font-semibold text-rm-gold">CasaMadridista Shop</Text>
        </View>
      </View>
      {loading && <Spinner content="Loading Store" />}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }}
      />
    </View>
  );
}
