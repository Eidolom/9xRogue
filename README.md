# 🔢 9xRogue - Sudoku Roguelike: The Numbers Fight Back

> **Logic is your weapon. The grid is your enemy.**

**Sudoku Roguelike** turns the classic puzzle game into a turn-based tactical RPG. In this game, you don't just place numbers—you build a deck of abilities. Every number from 1 to 9 has a unique class, a skill tree, and a role to play in defeating a grid that fights back with Corruption, Fog, and Logic Distortion.

There are no timers. There are no reflex checks. There is only the board, your build, and the impending threat of a mistake.

-----

## 📖 Table of Contents

  - [Core Concept](https://www.google.com/search?q=%23-core-concept)
  - [The Threat System](https://www.google.com/search?q=%23-the-threat-system)
  - [The Numbers (Classes)](https://www.google.com/search?q=%23-the-numbers-classes)
  - [The Shop & Economy](https://www.google.com/search?q=%23-the-shop--economy)
  - [How to Play](https://www.google.com/search?q=%23-how-to-play)
  - [Installation & Development](https://www.google.com/search?q=%23-installation--development)
  - [Design Philosophy](https://www.google.com/search?q=%23-design-philosophy)

-----

## 🧠 Core Concept

Most Sudoku games are passive. This one is hostile.

  * **Roguelike Progression:** You start with basic numbers. After every puzzle, you enter a Shop to upgrade numbers (Level 1-5), buy consumables, or unlock powerful Artifacts.
  * **Active Abilities:** Placing a '1' clears Fog. Placing an '8' cleanses Corruption. Placing a '5' triggers a synergy chain.
  * **Turn-Based Logic:** There is **no timer**. Combos are based on board state and placement chains, not speed. You can take an hour to make a move.
  * **Build Diversity:** Do you invest in **Economy (2 & 9)** to buy expensive artifacts? Do you rush **Defense (4)** to tank mistakes? Or do you max out **Logic (1 & 7)** to solve the board automatically?

-----

## ⚔️ The Threat System

The game manages difficulty through a "Threat Matrix." As you progress, the board generates active resistance.

| Threat Category | Description |
| :--- | :--- |
| **1. Mistakes** | Your "HP." Errors punish you with penalties and corruption. Lose all buffer, and the run ends. |
| **2. Corruption** | A spreading "disease" on the grid. Corrupted cells shuffle candidates, hide numbers, and increase Shop prices. |
| **3. Visibility Loss** | Fog covers regions. Phantom candidates appear to mislead you. Hidden numbers obscure the board state. |
| **4. Ambiguity** | Boards with multiple solutions or forced guesses. You must use abilities (like the '6' or '7') to bypass pure logic. |
| **5. Economic Pressure** | **Corruption Inflation** raises shop prices over time. You must balance "cleansing" inflation vs. earning gold. |
| **6. Flow Disruption** | Cell Locks prevent input. Shuffled candidates break your mental notes. |
| **7. Rule Modifiers** | Unique level constraints like "Hidden Regions," "Rotated Grids," or "Forced Placements." |

-----

## 🧙 The Numbers (Classes)

Each number is a distinct character class with a 5-level upgrade tree and a "Rogue Level" (Capstone).

### 1️⃣ The Scout (Utility)

  * **Role:** Information gathering & Visibility.
  * **Key Ability:** Clears **Fog**, removes **Phantom Candidates**, and reveals **Hidden Numbers**.
  * **Rogue Level:** *Omniscience* (Reveals all 1s, disables Fog forever).

### 2️⃣ The Merchant (Economy)

  * **Role:** Gold generation & Inflation management.
  * **Key Ability:** Generates raw Gold. Reduces **Corruption Inflation** in the shop.
  * **Rogue Level:** *Monopoly* (Immunity to inflation; shop prices stay at base).

### 3️⃣ The Jester (Synergy)

  * **Role:** Anti-Lock & Board Presence.
  * **Key Ability:** Grants Gold based on other '3's in the row/col. Breaks **Cell Locks**.
  * **Rogue Level:** *Master of Flow* (Immunity to locks/shuffles).

### 4️⃣ The Fortress (Defense)

  * **Role:** Tank & Mistake Protection.
  * **Key Ability:** Increases "Mistake Buffer" (HP). Generates **Shields** that absorb errors.
  * **Rogue Level:** *Absolution* (Survive a fatal mistake once per puzzle).

### 5️⃣ The Catalyst (Multiplier)

  * **Role:** The "Ultimate" & Ability Trigger.
  * **Key Ability:** Triggers the abilities of **other numbers** you own simultaneously.
  * **Rogue Level:** *Overclock* (Permanently treats all other numbers as Level +1).

### 6️⃣ The Gambler (Risk)

  * **Role:** Brute Force & Ambiguity Solving.
  * **Key Ability:** Allows you to "Safe Bet" on 50/50 guesses without penalty.
  * **Rogue Level:** *Reality Warp* (Forces the puzzle solution to conform to your guess).

### 7️⃣ The Sniper (Solver)

  * **Role:** Precision Logic & Rerolls.
  * **Key Ability:** Highlights and solves **Hidden Singles**. Grants Shop Rerolls.
  * **Rogue Level:** *Domino Effect* (Solving a cell auto-solves any newly created singles).

### 8️⃣ The Powerhouse (Cleanser)

  * **Role:** Anti-Corruption.
  * **Key Ability:** Cleanses **Corruption** from boxes, rows, and columns.
  * **Rogue Level:** *Purification* (Cleanses the entire board instantly).

### 9️⃣ The Finisher (Scaling)

  * **Role:** Late-game Scaling & Rewards.
  * **Key Ability:** Massive Gold bonuses for completing houses (rows/cols/boxes).
  * **Rogue Level:** *Completionist* (Grants free upgrades for finishing puzzles).

-----

## 🛒 The Shop & Economy

Between puzzles, players spend Gold to build their engine.

### Upgrades

Buy levels for your numbers (1-9). Costs scale based on current level and inflation.

### Services

  * **System Cleanse:** Pay a high fee to reset current Corruption Inflation to 0%.
  * **Reroll:** Shuffle the shop inventory (uses Reroll tokens from Number 7).

### Artifacts (Rule Benders)

Rare items that fundamentally change the run:

  * **Oracle's Compass:** Allows safe guessing (Red/Green feedback) without penalties.
  * **Corrupted Core:** Gain Gold for making mistakes, but Corruption spreads faster.
  * **Auto-Penciler:** Starts the game with all candidates correctly filled.

-----

## 🎮 How to Play

1.  **Analyze:** Look at the grid. Identify standard Sudoku logic (Naked Singles, Pairs).
2.  **Assess Threats:** Is there Fog? Is a row Corrupted? Is there a Cell Lock?
3.  **Deploy:** Choose a number to place.
      * *Need Money?* Place a **2** or **9**.
      * *Scared of a Mistake?* Place a **4** to shield yourself.
      * *Board too messy?* Place an **8** to clean it.
      * *Want to nuke the board?* Place a **5** to trigger everything else.
4.  **Shop:** Survive the puzzle, collect your Gold, and upgrade your kit for the next, harder board.

-----

**Prerequisites:**

  * TypeScript, Expo

**Setup:**

```bash
# Clone the repository
git clone https://github.com/yourusername/sudoku-roguelike.git

# Navigate to directory
cd sudoku-roguelike

# Install dependencies
npm install  # or pip install -r requirements.txt

# Run the game
npm start    # or python main.py
```

-----

## ⚖️ Design Philosophy

1.  **Thinking Over Twitching:** We rejected time-based combos. Abilities trigger based on placement logic, allowing players to plan complex "turns."
2.  **The "Meta" is Flexible:**
      * *The "Rich" Build:* Maximize 2s and 9s to buy every Artifact.
      * *The "Safe" Build:* Maximize 4s and 6s to brute-force guesses without dying.
      * *The "Pure" Build:* Maximize 1s and 7s to solve the board using game-assisted logic.
3.  **Loss is Information:** Threats are deterministic. If you lost to Corruption, you needed more 8s. If you lost to Ambiguity, you needed 6s or 7s.

-----

## 🤝 Contributing

Pull requests are welcome\! Please check the `CONTRIBUTING.md` file for style guides. We are currently looking for help with:

  * Sudoku generation algorithms (specifically generating "ambiguous" boards for high levels).
  * UI/UX design for the Shop interface.
  * Balancing the "Corruption Inflation" curve.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
