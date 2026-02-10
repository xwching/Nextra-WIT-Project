import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ParticleProps {
  x: number;
  y: number;
  color: string;
}

export function ParticleTrail({ x, y, color }: ParticleProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 2,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Svg width={20} height={20}>
        <Circle cx={10} cy={10} r={4} fill={color} opacity={0.6} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
