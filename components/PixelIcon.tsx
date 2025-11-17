import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface PixelIconProps {
  number: number;
  size?: number;
  color?: string;
  iconType?: 'number' | 'potion' | 'artifact';
}

export default function PixelIcon({ number, size = 24, color = '#5DBCD2', iconType = 'number' }: PixelIconProps) {
  const pixelSize = size / 8;

  const renderPixels = () => {
    if (iconType === 'potion') {
      return (
        <>
          <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={1 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={5 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={1 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={5 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
        </>
      );
    }

    if (iconType === 'artifact') {
      return (
        <>
          <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={1 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={5 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
        </>
      );
    }

    switch (number) {
      case 1:
        return (
          <>
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );
      
      case 2:
        return (
          <>
            <Rect x={2 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      case 3:
        return (
          <>
            <Rect x={2 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      case 4:
        return (
          <>
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      case 5:
        return (
          <>
            <Rect x={1 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      case 6:
        return (
          <>
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      case 7:
        return (
          <>
            <Rect x={1 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      case 8:
        return (
          <>
            <Rect x={2 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      case 9:
        return (
          <>
            <Rect x={2 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={1 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={2 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={1 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={3 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={5 * pixelSize} y={4 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={4 * pixelSize} y={5 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={2 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
            <Rect x={3 * pixelSize} y={6 * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {renderPixels()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
