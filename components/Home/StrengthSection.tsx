import Colors from "@/constants/colors";
import { strengthStats } from "@/mocks/advertisement";
import { Image } from "expo-image";
import { Users } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Text, View } from "react-native";
import { LayoutChangeEvent } from "react-native/Libraries/Types/CoreEventTypes";
const { width } = Dimensions.get("window");

const SquadSection = ({
  shouldAnimate,
  handleStrengthSectionLayout,
}: {
  shouldAnimate: boolean;
  handleStrengthSectionLayout: (event: LayoutChangeEvent) => void;
}) => {
  const getIcon = (iconName: string) => {
    const iconProps = { width: 156, height: 156 };
    switch (iconName) {
      case "users":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/4324324234.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      case "gift":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/323423424.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      case "calendar":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/34y467346.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      case "heart":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/324245324231.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      default:
        return <Users {...iconProps} />;
    }
  };
  return (
    <View
      className="py-10 px-5 bg-bg-medium -mx-4"
      onLayout={handleStrengthSectionLayout}
    >
      <View className="flex-row items-center justify-center mb-2.5">
        <View className="w-[70px] h-0.5 bg-rm-gold mx-10" />
        <Text className="text-2xl font-bold text-text-primary text-center">
          Our Strength
        </Text>
        <View className="w-[70px] h-0.5 bg-rm-gold mx-10" />
      </View>
      <Text className="text-base text-rm-gold text-center mb-7">
        Madridista spirit united
      </Text>

      <View className="flex-row flex-wrap justify-around gap-4">
        {strengthStats.map((stat, index) => (
          <AnimatedStat
            key={index}
            stat={stat}
            icon={getIcon(stat.icon)}
            shouldAnimate={shouldAnimate}
          />
        ))}
      </View>
    </View>
  );
};
const adStatCardWidth = (width - 80) / 2;

interface AnimatedStatProps {
  stat: {
    icon: string;
    value: number;
    suffix: string;
    label: string;
    color: string;
  };
  icon: React.ReactElement;
  shouldAnimate: boolean;
}

function AnimatedStat({ stat, icon, shouldAnimate }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shouldAnimate) {
      Animated.timing(animatedValue, {
        toValue: stat.value,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      const listener = animatedValue.addListener(({ value }) => {
        setDisplayValue(Math.floor(value));
      });

      return () => {
        animatedValue.removeListener(listener);
      };
    }
  }, [shouldAnimate, stat.value, animatedValue]);

  return (
    <View
      className="items-center p-4"
      style={{ width: adStatCardWidth }}
    >
      <View className="mb-3">{React.cloneElement(icon)}</View>
      <Text className="text-2xl font-bold text-text-primary mb-1.5">
        {displayValue.toLocaleString()}
        {stat.suffix}
      </Text>
      <Text className="text-sm text-rm-gold text-center">{stat.label}</Text>
    </View>
  );
}
export default SquadSection;
