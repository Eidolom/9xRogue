import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CRTBackground from './CRTBackground';

interface TitleScreenProps {
  onStart: () => void;
  onProgress: () => void;
}

export default function TitleScreen({ onStart, onProgress }: TitleScreenProps) {
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;
  const insets = useSafeAreaInsets();
  
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const corruptionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();

    Animated.loop(
      Animated.timing(corruptionAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      })
    ).start();
  }, [glitchAnim, corruptionAnim]);

  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });



  return (
    <View style={styles.container}>
      <CRTBackground showVignette vignetteIntensity={0.2} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>/// SYSTEM WARNING: CORRUPTION DETECTED ///</Text>
          </View>

          <View style={styles.header}>
            <Text style={[styles.sectionLabel, isMobile && styles.sectionLabelMobile]}>LOGIC IS</Text>
            <Animated.View style={{ transform: [{ translateX: glitchTranslateX }] }}>
              <Text style={[styles.title, isMobile && styles.titleMobile]}>DECAYING</Text>
            </Animated.View>
            <Text style={[styles.description, isMobile && styles.descriptionMobile]}>
              The grid is fighting back. Equip your numbers.{isMobile ? '\n' : ' '}Build your deck.{isMobile ? '\n' : ' '}Survive the{' '}<Text style={styles.corruptionText}>Slow Burn</Text>.
            </Text>
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={onStart}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#20e080', '#18b060']}
                style={styles.buttonGradient}
              >
                <Text style={[styles.buttonText, isMobile && styles.buttonTextMobile]}>[ INITIATE_RUN ]</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={onProgress}
              activeOpacity={0.8}
            >
              <View style={styles.buttonBorder}>
                <Text style={[styles.buttonText, styles.secondaryButtonText, isMobile && styles.buttonTextMobile]}>[ VIEW_PROGRESS ]</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.featureGrid}>
            <View style={[styles.featureCard, styles.card1]}>
              <Text style={[styles.featureNumber, { color: '#00ffff' }]}>1</Text>
              <Text style={styles.featureTitle}>THE SCOUT</Text>
              <Text style={styles.featureDesc}>
                The grid hides its secrets. Use The Scout to cut through Fog and reveal Hidden Singles.
              </Text>
            </View>

            <View style={[styles.featureCard, styles.card2]}>
              <Text style={[styles.featureNumber, { color: '#0066ff' }]}>4</Text>
              <Text style={styles.featureTitle}>THE FORTRESS</Text>
              <Text style={styles.featureDesc}>
                Mistakes fuel the Corruption. Deploy Shields to absorb errors and stop the Doomsday Clock.
              </Text>
            </View>

            <View style={[styles.featureCard, styles.card3]}>
              <Text style={[styles.featureNumber, { color: '#ff0044' }]}>8</Text>
              <Text style={styles.featureTitle}>THE POWERHOUSE</Text>
              <Text style={styles.featureDesc}>
                When the logic fails, brute force prevails. Nuke Corrupted cells and reset the board state.
              </Text>
            </View>
          </View>

          <View style={styles.corruptionSection}>
            <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>THE SLOW BURN</Text>
            
            <View style={styles.corruptionBarContainer}>
              <View style={styles.corruptionBar}>
                <Animated.View 
                  style={[
                    styles.corruptionFill, 
                    { 
                      width: corruptionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '84%'],
                      }),
                    }
                  ]} 
                />
                <View style={styles.corruptionBarOverlay}>
                  <Text style={styles.corruptionBarText}>CORRUPTION: 42 / 50</Text>
                </View>
              </View>
            </View>
            
            <Text style={[styles.corruptionWarning, isMobile && styles.corruptionWarningMobile]}>
              WARNING: THRESHOLD IMMINENT. CELL LOCK DETECTED.
            </Text>
          </View>

          <View style={styles.systemSection}>
            <View style={styles.systemCard}>
              <Text style={[styles.systemTitle, isMobile && styles.systemTitleMobile]}>THE GRIMOIRE</Text>
              <View style={styles.systemDivider} />
              <Text style={[styles.systemDesc, isMobile && styles.systemDescMobile]}>
                PLAN YOUR BUILD. Deterministic upgrades. No RNG. Pure strategy.
              </Text>
            </View>

            <View style={styles.systemCard}>
              <Text style={[styles.systemTitle, isMobile && styles.systemTitleMobile]}>THE BAZAAR</Text>
              <View style={styles.systemDivider} />
              <Text style={[styles.systemDesc, isMobile && styles.systemDescMobile]}>
                ADAPT TO CHAOS. Rare Artifacts. Forbidden Consumables. High Prices.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>[ SYSTEM_ID: SUDOKU_RL_VER_0.9 ]</Text>
            <Text style={styles.footerSubtext}>[ BUILT_WITH_LOGIC ] · [ END_OF_LINE ]</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0e15',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 0, 68, 0.1)',
    borderWidth: 2,
    borderColor: '#ff0044',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 30,
    width: '100%',
    maxWidth: 600,
  },
  warningText: {
    color: '#ff0044',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  sectionLabel: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#c0cbdc',
    letterSpacing: 4,
    marginBottom: 10,
  },
  sectionLabelMobile: {
    fontSize: 18,
  },
  title: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: '#ff0044',
    textShadowColor: 'rgba(255, 0, 68, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
  },
  titleMobile: {
    fontSize: 40,
    letterSpacing: 3,
  },
  description: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#c0cbdc',
    textAlign: 'center' as const,
    lineHeight: 28,
    maxWidth: 600,
    paddingHorizontal: 20,
  },
  descriptionMobile: {
    fontSize: 14,
    lineHeight: 22,
  },
  corruptionText: {
    color: '#ff0044',
    fontWeight: '700' as const,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
    marginBottom: 60,
  },
  button: {
    width: '100%',
  },
  primaryButton: {
    shadowColor: '#20e080',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  buttonBorder: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#c0cbdc',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#000000',
    textAlign: 'center' as const,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonTextMobile: {
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#c0cbdc',
  },
  featureGrid: {
    width: '100%',
    maxWidth: 900,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 80,
  },
  featureCard: {
    backgroundColor: 'rgba(192, 203, 220, 0.05)',
    borderWidth: 3,
    borderColor: '#c0cbdc',
    padding: 20,
    minWidth: 250,
    maxWidth: 280,
    flex: 1,
  },
  card1: {
    borderColor: '#00ffff',
  },
  card2: {
    borderColor: '#0066ff',
  },
  card3: {
    borderColor: '#ff0044',
  },
  featureNumber: {
    fontSize: 48,
    fontWeight: '900' as const,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    marginBottom: 10,
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#c0cbdc',
    lineHeight: 18,
  },
  corruptionSection: {
    width: '100%',
    maxWidth: 800,
    backgroundColor: 'rgba(26, 28, 41, 0.8)',
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#c0cbdc',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 60,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
    marginBottom: 30,
  },
  sectionTitleMobile: {
    fontSize: 24,
  },
  corruptionBarContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 20,
  },
  corruptionBar: {
    width: '100%',
    height: 50,
    backgroundColor: '#000000',
    borderWidth: 4,
    borderColor: '#c0cbdc',
    position: 'relative' as const,
  },
  corruptionFill: {
    height: '100%',
    backgroundColor: '#ff0044',
    borderRightWidth: 2,
    borderRightColor: '#ffffff',
  },
  corruptionBarOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corruptionBarText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  corruptionWarning: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#ff0044',
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  corruptionWarningMobile: {
    fontSize: 11,
  },
  systemSection: {
    width: '100%',
    maxWidth: 800,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 60,
    justifyContent: 'center',
  },
  systemCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: 'rgba(192, 203, 220, 0.05)',
    borderWidth: 3,
    borderColor: '#c0cbdc',
    padding: 30,
  },
  systemTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#ffcc33',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    marginBottom: 15,
  },
  systemTitleMobile: {
    fontSize: 18,
  },
  systemDivider: {
    height: 2,
    backgroundColor: '#c0cbdc',
    marginBottom: 15,
  },
  systemDesc: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#c0cbdc',
    lineHeight: 20,
  },
  systemDescMobile: {
    fontSize: 11,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#666666',
    letterSpacing: 2,
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#444444',
    letterSpacing: 1,
  },
});
