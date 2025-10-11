import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface BallProps {
  position: { x: number; y: number };
  visible: boolean;
}

export const Ball: React.FC<BallProps> = ({ position, visible }) => {
  if (!visible) return null;

  return (
    <View style={[styles.ball, { left: position.x - 15, top: position.y - 15 }]}>
      <Svg width="30" height="30">
        <Circle
          cx="15"
          cy="15"
          r="14"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="1"
        />
        <Circle
          cx="15"
          cy="15"
          r="12"
          fill="none"
          stroke="#000000"
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
});