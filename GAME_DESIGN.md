# 9x Rogue - Sudoku Roguelike

A beautiful mobile game combining Sudoku puzzle-solving with roguelike progression and corruption mechanics.

## Game Features

### Core Gameplay
- **Touch-optimized Sudoku grid** with smooth animations and haptic feedback
- **Corruption system** that visually corrupts cells when mistakes are made
- **5-floor progression** with increasing difficulty
- **Mistake tracking** (3 strikes and you're out)

### Roguelike Elements
- **Shop system** between floors with random upgrade offerings
- **8 unique upgrades** with different rarities (Common, Rare, Legendary)
- **Currency system** earned by completing floors
- **Permanent upgrades** that modify gameplay

### Upgrade System

#### Number Upgrades
- **Lucky Seven**: Placing 7s gives +10 currency
- **Perfect Five**: Placing 5s reduces corruption by 1
- **Triple Three**: 3s fill adjacent cells with hints
- **Nine Lives**: Placing all 9s clears all corruption
- **The Wise One**: Placing 1s reveals one random cell

#### Passive Upgrades
- **Second Chance**: +2 maximum mistakes
- **Corruption Shield**: Mistakes generate 50% less corruption
- **Golden Touch**: Earn 2x currency this floor

### Visual Design
- Dark, mysterious aesthetic with vibrant blue/purple accents
- Smooth animations using React Native's Animated API
- Gradient effects for visual depth
- Corruption visualization on cells
- Victory/Defeat screens with run statistics

## Technical Stack
- React Native with Expo
- TypeScript with strict type checking
- Custom Sudoku generator with guaranteed solvability
- State management with @nkzw/create-context-hook
- Haptic feedback for mobile feel
- Web-compatible (React Native Web)

## Game Flow
1. **Puzzle Phase**: Solve Sudoku puzzles with corruption threats
2. **Shop Phase**: Purchase upgrades with earned currency
3. **Repeat**: Progress through 5 floors
4. **Victory/Defeat**: View statistics and play again

## Future Enhancements
See the production plan for the full roadmap including:
- Boss encounters with rule modifications
- More puzzle variants (diagonal, killer, irregular)
- Enemy entities that operate on rows/columns
- Daily challenges
- Cosmetic unlocks
