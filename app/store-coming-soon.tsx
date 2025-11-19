import ShiningText from "@/components/ShiningText";
import Colors from "@/constants/colors";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width } = Dimensions.get("window");

interface ProductCardProps {
  image: string;
  title: string;
  // titleAr: string;
  description: string;
  descriptionAr: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  title,
  // titleAr,
  description,
  descriptionAr,
}) => {
  return (
    <View style={styles.productCard}>
      <Image
        source={{ uri: image }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productContent}>
        <Text style={styles.productTitle}>{title}</Text>
        {/* <Text style={styles.productTitleAr}>{titleAr}</Text> */}
        <Text style={styles.productDescription}>{description}</Text>
        <Text style={styles.productDescriptionAr}>{descriptionAr}</Text>
        <TouchableOpacity style={styles.soonButton}>
          <Text style={styles.soonButtonText}>SOON</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function StoreComingSoon() {
  const insets = useSafeAreaInsets();

  const products: ProductCardProps[] = [
    {
      image: "https://casamadridista.com/wp-content/uploads/2025/08/box.png",
      title: "Queen's perfume",
      // titleAr: 'عطر الملكة',
      description:
        "انتظر هو كاساماديريستا ورائحة العطور.. شيء غير رسمي، يشتم بوتيرة جيدة خلال الأطفال عليك.",
      descriptionAr:
        "بحالة متميزة مثل الطلاسم من الجنان، قلب يائس بالحالة مثل (بصمات وتوابات عصرية تدوم مثل بصمتك في الماسيات).",
    },
    {
      image:
        "https://casamadridista.com/wp-content/uploads/2025/08/DAEA05EB-59E7-4316-91D0-926B6F344449.png",
      title: "Luxe Madridista Box",
      // titleAr: 'صندوق مدريديستا الفاخر',
      description: "يتوفر بيت المدريديستا.. ليس مجرد صندوق، إنه تجربة.",
      descriptionAr:
        "يحتوي على: رائحة، ومحفظة، ومحفظة الأصلي، بنسيل، مفاتيح جلدية، ومعدنية، شعبة معدنية إضافية، رسم بيت الجلد بريميا... حاملة نيترو أنيقة، كوب قهوة أو شاي، بطاقة إضافية، ممكنة بوضعية التخطيط، وبطاقة تهنئة فاخرة.",
    },
  ];

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.header}>
          <ShiningText>CasaMadridista Shop is Coming Soon!</ShiningText>
        </View>

        <View style={styles.productsContainer}>
          {products.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  productsContainer: {
    paddingHorizontal: 20,
    gap: 30,
  },
  productCard: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },
  productImage: {
    width: "100%",
    height: width > 768 ? 400 : 400,
    backgroundColor: "#2a2a2a",
  },
  productContent: {
    padding: 24,
    alignItems: "center",
  },
  productTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: Colors.accent,
    marginBottom: 8,
    textAlign: "center",
  },
  productTitleAr: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.accent,
    marginBottom: 16,
    textAlign: "center",
  },
  productDescription: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  productDescriptionAr: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "System",
  },
  soonButton: {
    backgroundColor: Colors.darkGold,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 4,
  },
  soonButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    letterSpacing: 1,
  },
});
