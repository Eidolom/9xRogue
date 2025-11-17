import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import TitleScreen from '@/components/TitleScreen';
import PuzzleScreen from '@/components/PuzzleScreen';
import ShopScreen from '@/components/ShopScreen';
import VictoryScreen from '@/components/VictoryScreen';
import DefeatScreen from '@/components/DefeatScreen';
import ProgressScreen from '@/components/ProgressScreen';

export default function GameScreen() {
  const { phase, stats, achievements, startGame, showProgress, backToTitle } = useGame();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {phase === 'title' && <TitleScreen onStart={startGame} onProgress={showProgress} />}
      {phase === 'puzzle' && <PuzzleScreen />}
      {phase === 'shop' && <ShopScreen />}
      {phase === 'victory' && <VictoryScreen />}
      {phase === 'defeat' && <DefeatScreen />}
      {phase === 'progress' && <ProgressScreen stats={stats} achievements={achievements} onBack={backToTitle} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
});
