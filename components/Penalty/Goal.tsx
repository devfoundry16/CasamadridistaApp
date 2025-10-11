import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const GOAL_WIDTH = width * 0.6;
const GOAL_HEIGHT = height * 0.3;

interface GoalProps {
  goalkeeperPosition: { x: number; y: number };
}

export const Goal: React.FC<GoalProps> = ({ goalkeeperPosition }) => {
  return (
    <View style={styles.container}>
      <Svg width={GOAL_WIDTH} height={GOAL_HEIGHT} style={styles.goal}>
        {/* Goal frame */}
        <Rect
          x="0"
          y="0"
          width={GOAL_WIDTH}
          height={GOAL_HEIGHT}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        
        {/* Goal net */}
        <Rect
          x="5"
          y="5"
          width={GOAL_WIDTH - 10}
          height={GOAL_HEIGHT - 10}
          fill="none"
          stroke="#666666"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        
        {/* Goalkeeper */}
        <Rect
          x={goalkeeperPosition.x - 20}
          y={goalkeeperPosition.y - 20}
          width="40"
          height="40"
          fill="#FF6B6B"
          rx="8"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  goal: {
    backgroundColor: 'rgba(0, 100, 0, 0.3)',
    borderRadius: 10,
  },
});