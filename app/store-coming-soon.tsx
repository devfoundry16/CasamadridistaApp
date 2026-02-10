import ShiningText from "@/components/ShiningText";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
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
    <View className="rounded-lg overflow-hidden mb-5">
      <Image
        source={{ uri: image }}
        style={{ width, height: 400 }}
        className="bg-bg-medium"
        resizeMode="cover"
      />
      <View className="p-6 items-center">
        <Text className="text-[22px] font-semibold text-rm-gold mb-2 text-center">{title}</Text>
        {/* <Text className="text-xl font-semibold text-rm-gold mb-4 text-center">{titleAr}</Text> */}
        <Text className="text-sm text-text-secondary leading-[22px] text-center mb-2">{description}</Text>
        <Text className="text-sm text-text-secondary leading-[22px] text-center mb-6">{descriptionAr}</Text>
        <TouchableOpacity className="bg-rm-gold px-10 py-3 rounded">
          <Text className="text-sm font-bold text-white tracking-wider">SOON</Text>
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
        className="flex-1 bg-bg-deep-dark"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View className="py-10 px-5 items-center">
          <ShiningText>CasaMadridista Shop is Coming Soon!</ShiningText>
        </View>

        <View className="px-5 gap-7.5">
          {products.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}
