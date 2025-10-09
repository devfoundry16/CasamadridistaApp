import Colors from "@/constants/colors";
import { strengthStats } from "@/mocks/advertisement";
import { Image } from "expo-image";
import { Users } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { LayoutChangeEvent } from "react-native/Libraries/Types/CoreEventTypes";
const { width } = Dimensions.get("window");

const SquadSection = ({shouldAnimate, handleStrengthSectionLayout}: { shouldAnimate: boolean, handleStrengthSectionLayout: (event: LayoutChangeEvent) => void}) => {
  
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
      style={styles.adStrengthSection}
      onLayout={handleStrengthSectionLayout}
    >
      <View style={styles.adSectionHeader}>
        <View style={styles.adHeaderLine} />
        <Text style={styles.adSectionTitle}>Our Strength</Text>
        <View style={styles.adHeaderLine} />
      </View>
      <Text style={styles.adSectionSubtitle}>Madridista spirit united</Text>

      <View style={styles.adStatsContainer}>
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
const styles = StyleSheet.create({
  adStrengthSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#2a2a2a",
    marginHorizontal: -16,
  },
  adSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  adHeaderLine: {
    width: 70,
    height: 2,
    backgroundColor: Colors.accent,
    marginHorizontal: 40,
  },
  adSectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  adSectionSubtitle: {
    fontSize: 16,
    color: Colors.accent,
    textAlign: "center",
    marginBottom: 30,
  },
  adStatsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 15,
  },
  adStatCard: {
    width: (width - 80) / 2,
    alignItems: "center",
    padding: 15,
  },
  adIconContainer: {
    marginBottom: 12,
  },
  adStatValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 6,
  },
  adStatLabel: {
    fontSize: 14,
    color: Colors.accent,
    textAlign: "center",
  },
});

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
    <View style={styles.adStatCard}>
      <View style={styles.adIconContainer}>{React.cloneElement(icon)}</View>
      <Text style={styles.adStatValue}>
        {displayValue.toLocaleString()}
        {stat.suffix}
      </Text>
      <Text style={styles.adStatLabel}>{stat.label}</Text>
    </View>
  );
}
export default SquadSection;
