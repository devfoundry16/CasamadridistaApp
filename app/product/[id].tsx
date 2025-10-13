import Colors from "@/constants/colors";
import ShopApiService from "@/services/shopApi";
import { Product } from "@/types/product/product";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import RenderHtml from "react-native-render-html";
const { width } = Dimensions.get("window");
const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailUri, setDetailUri] = useState("");

  useEffect(() => {
    getProduct(Number(id));
  }, []);

  const getProduct = async (id: number) => {
    try {
      ShopApiService.getProductById(id).then((data) => {
        setProduct(data);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error loading store data:", error);
    } finally {
      setIsLoading(true);
    }
  };

  // Carousel item renderer
  const renderCarouselItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => setDetailUri(item)}
    >
      <Image source={{ uri: item }} style={styles.detailImage} />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Product Details",
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.headerContent}>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
            }}
            style={styles.headerImage}
            contentFit="cover"
          />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{product?.name}</Text>
            <Text style={styles.headerSubtitle}>
              {product?.categories[0].name}
            </Text>
          </View>
        </View>
        {/* Original/Main Product Image */}
        <View style={styles.mainImageContainer}>
          <Image
            source={{ uri: detailUri || product?.images[0].src }}
            style={styles.mainImage}
          />
        </View>

        {/* Detail Images Carousel */}
        {product && product.images.length > 0 && (
          <Carousel
            data={product.images.map((img) => img.src)}
            renderItem={renderCarouselItem}
            width={width * 0.9}
            height={250}
            loop
            mode="parallax"
          />
        )}

        <View style={{ padding: 16, flex: 1, alignItems: "center" }}>
          {/* Product Name */}
          <Text style={styles.name}>{product?.name}</Text>

          {/* Price */}
          <Text style={styles.price}>${Number(product?.price).toFixed(2)}</Text>

          {/* Description */}
          <RenderHtml
            tagsStyles={customStyles}
            source={{ html: product?.description || "" }}
            contentWidth={width - 32}
          />
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: Colors.darkGold,
              },
            ]}
            onPress={() => router.push("/contact")}
          >
            <Text style={[styles.submitButton, { color: Colors.textWhite }]}>
              Contact Us For More Details
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
};
export default ProductDetailScreen;
const customStyles = {
  p: { color: Colors.textWhite },
  strong: { color: Colors.textWhite },
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
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
  mainImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  mainImage: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    borderColor: Colors.textWhite,
    backgroundColor: "#2f2f2f",
    borderRadius: 10,
    padding: 12,
  },
  carouselItem: {
    backgroundColor: "#2f2f2f",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    height: "100%",
    alignSelf: "center",
  },
  detailImage: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.darkGold,
  },
  price: {
    fontSize: 40,
    fontWeight: "bold",
    color: Colors.textWhite,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginVertical: 16,
    color: Colors.textWhite,
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
