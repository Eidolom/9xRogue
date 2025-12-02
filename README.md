9x Rogue: Sudoku Dungeon Crawler

"What if Sudoku fought back?"
A mobile-first logic puzzle game that fuses constraint-based problem solving with roguelike progression mechanics.

The Concept

9x Rogue reimags the classic Sudoku grid as a dungeon map.

The Grid: A 9x9 Sudoku board where every cell is a "room."

The Twist: You don't just fill numbers. You navigate a character through the grid.

The Constraints: You can only move to cells that obey valid Sudoku rules relative to your current position.

The Roguelike: Enemies, loot, and traps are procedurally placed based on the numerical value of the cell.

I built this to challenge myself with complex algorithmic generation (creating valid Sudoku grids on the fly) and state management (inventory/permadeath) within a mobile architecture.

Engineering Challenges

1. Procedural Generation (Backtracking)

Unlike standard apps that fetch pre-made puzzles, 9x Rogue generates valid grids in real-time.

Algorithm: Implemented a randomized Recursive Backtracking algorithm in C++ / TypeScript.

Optimization: Uses bitwise operators to validate Row/Column/Box constraints instantly, ensuring zero lag even on older devices.

2. State Management & Permadeath

Turn-Based Logic: Every move validates against Sudoku rules and updates enemy states.

Persistence: Robust local storage integration to handle "Run" saves while enforcing strict permadeath rules.

Development Setup

This app was initialized with Rork (Expo Router + React Native).

Prerequisites

You need Node.js & Bun installed.

