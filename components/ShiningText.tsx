import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const ShiningText = ({children}: {children: React.ReactNode}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const textShadowColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.8)'],
  });

  const textShadowRadius = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  return (
    <Animated.Text
      style={{
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: textShadowColor,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: textShadowRadius,
        padding: 20,
      }}
    >
      {children}
    </Animated.Text>
  );
};

export default ShiningText;