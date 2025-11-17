# Powerup System Specification

## Overview

This document specifies the 1-9 number powerup system for 9x Rogue, a roguelike Sudoku game. The system is deterministic, schema-driven, and ensures puzzle uniqueness is never violated.

## Core Principles

1. **Determinism**: All powerup effects are reproducible given the same seed
2. **Uniqueness Preservation**: Powerups never create multiple valid solutions
3. **Delayed Validation**: Works with the game's delayed validation mechanic
4. **Corruption Integration**: Leverages corruption and ambiguity systems
5. **Rogue Auto-Trigger**: Rogue-rarity powerups automatically activate at level start

## Architecture

### Files

- `data/powerups.json` - Canonical powerup definitions (45 entries)
- `src/powerups/PowerupModel.ts` - Schema validation and typed constants
- `src/powerups/PowerupManager.ts` - Runtime application logic
- `src/shop/ShopIntegration.ts` - Shop pricing and purchase logic
- `tests/unit/PowerupUnitTests.test.ts` - Unit tests
- `tests/integration/PowerupIntegrationTests.test.ts` - Integration tests

### Data Flow

```
Shop Purchase → RunState.activePowerups
  ↓
Level Start → applyRogueStart() (auto-trigger Rogue powerups)
  ↓
Player Placement → applyOnPlacement() (trigger digit-specific powerups)
  ↓
RunState Updated → Persist appliedEffects for replay
```

## Powerup Catalog

### 1 — The Anker (Stabilization)

**Theme**: Stabilizes board and mitigates corruption spread

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | purify | Reduces corruption chance in row | `{ scope: "row", amount: 5 }` |
| Uncommon | purify | Cleans one corrupted cell in row | `{ scope: "row", cells: 1 }` |
| Rare     | purify | Cleans all corruption in row | `{ scope: "row", cells: "all" }` |
| Epic     | purify | Cleans row and column | `{ scope: "rowcol", cells: "all" }` |
| Rogue    | purify | Auto-purifies most corrupted cell at start | `{ scope: "global", cells: 1, autoTrigger: true }` |

**Acceptance Criteria**:
- Common: Corruption values in row reduced by 5
- Uncommon: Top corrupted cell in row set to 0
- Rare: All cells in row cleaned
- Epic: Row and column fully cleaned
- Rogue: Auto-triggers, cleans highest corruption cell globally

---

### 2 — The Duplicator (Automatic Placement)

**Theme**: Automatic correct placement reinforcement

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | revealCandidate | Reveals one correct candidate for 2 | `{ digit: 2, count: 1 }` |
| Uncommon | autoPlace | Places one extra correct 2 | `{ digit: 2, count: 1 }` |
| Rare     | autoPlace | Places two extra 2s | `{ digit: 2, count: 2 }` |
| Epic     | autoPlace | Places three extra 2s | `{ digit: 2, count: 3 }` |
| Rogue    | autoPlace | Auto-places one correct 2 at start | `{ digit: 2, count: 1, autoTrigger: true }` |

**Acceptance Criteria**:
- AutoPlace must verify uniqueness before placing
- If uniqueness check fails, fallback to revealCandidate
- Placements are solver-verified and deterministic
- Rogue auto-triggers at level start

**Fallback Behavior**:
```typescript
if (!checkUniquenessAfterAutoPlace(placements)) {
  console.warn('AutoPlace would break uniqueness, fallback to revealCandidate');
  return applyRevealCandidate(grid, solution, params, rng);
}
```

---

### 3 — The Shield (Protection)

**Theme**: Protection from corruption

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | lockBox | Slows corruption in 3x3 box | `{ boxEffect: "slowSpread", amountPct: 10 }` |
| Uncommon | lockBox | Prevents corruption in box (1 move) | `{ boxLock: true, durationMoves: 1 }` |
| Rare     | lockBox | Locks box (3 moves) | `{ boxLock: true, durationMoves: 3 }` |
| Epic     | lockBox | Locks box and row (5 moves) | `{ boxLock: true, durationMoves: 5, affectRow: true }` |
| Rogue    | lockBox | Auto-locks box at start (3 moves) | `{ boxLock: true, durationMoves: 3, autoTrigger: true }` |

**Acceptance Criteria**:
- Lock duration tracked in `cell.lockTurnsRemaining`
- BoxLocks stored in RunState for persistence
- Epic also locks the row

---

### 4 — The Unlucky (Restriction)

**Theme**: Restriction and strategic placement

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | forbidSlots | Marks one forbidden slot | `{ count: 1 }` |
| Uncommon | forbidSlots | Marks two forbidden slots | `{ count: 2 }` |
| Rare     | forbidSlots | Marks three forbidden slots | `{ count: 3 }` |
| Epic     | forbidSlots | Marks four forbidden slots | `{ count: 4 }` |
| Rogue    | forbidSlots | Auto-marks one slot at start | `{ count: 1, autoTrigger: true }` |

**Acceptance Criteria**:
- Forbidden slots are cells where solution[row][col] ≠ digit
- Never forbids cells that are part of the actual solution for that digit
- Stored in RunState.forbiddenSlots for UI rendering

---

### 5 — The Wildcard (Ambiguity Resolution)

**Theme**: Resolves ambiguity and aids decision-making

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | resolveAmbiguity | Reveals one correct cell in row | `{ scope: "row", count: 1 }` |
| Uncommon | resolveAmbiguity | Reveals one correct cell in column | `{ scope: "col", count: 1 }` |
| Rare     | resolveAmbiguity | Resolves one ambiguous cell | `{ scope: "global", count: 1 }` |
| Epic     | resolveAmbiguity | Resolves two ambiguous cells | `{ scope: "global", count: 2 }` |
| Rogue    | resolveAmbiguity | Auto-resolves one ambiguous cell at start | `{ scope: "global", count: 1, autoTrigger: true }` |

**Acceptance Criteria**:
- Resolves cells marked with `isAmbiguous: true`
- Sets `cell.value = solution[row][col]`
- Sets `cell.isAmbiguous = false`

---

### 6 — The Harmonizer (Corruption Cleanse)

**Theme**: Board-wide corruption influence

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | cleanAnywhere | Reduces corruption nearby | `{ amount: 3 }` |
| Uncommon | cleanAnywhere | Cleans one cell in box | `{ cells: 1 }` |
| Rare     | cleanAnywhere | Cleans two cells anywhere | `{ cells: 2 }` |
| Epic     | cleanAnywhere | Cleans three cells anywhere | `{ cells: 3 }` |
| Rogue    | cleanAnywhere | Auto-cleans one cell at start | `{ cells: 1, autoTrigger: true }` |

**Acceptance Criteria**:
- Uses `cleanseCells()` to find highest corruption cells
- Common reduces nearby cells by fixed amount
- Higher rarities clean more cells completely

---

### 7 — The Lucky (Currency Generation)

**Theme**: Generates currency for upgrades

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | grantCurrency | Adds 5 OF on placement | `{ currency: "OF", amount: 5 }` |
| Uncommon | grantCurrency | Adds 12 OF per placement | `{ currency: "OF", amount: 12 }` |
| Rare     | grantCurrency | Adds 25 OF + hint | `{ currency: "OF", amount: 25, alsoHint: true }` |
| Epic     | grantCurrency | Adds 45 OF + cleans cell | `{ currency: "OF", amount: 45, cleanCell: 1 }` |
| Rogue    | grantCurrency | Auto-grants 20 OF at start | `{ currency: "OF", amount: 20, autoTrigger: true }` |

**Acceptance Criteria**:
- Currency increments RunState.currency
- Epic also triggers cleanCell effect
- Rogue auto-grants at level start

---

### 8 — The Great (Candidate Manipulation)

**Theme**: Candidate manipulation and puzzle flexibility

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | clearPhantom | Clears one phantom candidate | `{ phantomCount: 1 }` |
| Uncommon | clearPhantom | Clears two phantom candidates | `{ phantomCount: 2 }` |
| Rare     | clearPhantom | Clears three phantom candidates | `{ phantomCount: 3 }` |
| Epic     | clearPhantom | Clears four phantom candidates | `{ phantomCount: 4 }` |
| Rogue    | clearPhantom | Auto-clears one at start | `{ phantomCount: 1, autoTrigger: true }` |

**Acceptance Criteria**:
- Targets corrupted cells with candidates
- Removes incorrect candidates while preserving correct value
- Deterministic candidate removal (50% chance per incorrect candidate)

---

### 9 — The Mistake (Mistake Neutralization)

**Theme**: Mistake neutralization, risk control

| Rarity   | Effect Key | Description | Params |
|----------|------------|-------------|---------|
| Common   | neutralizeMistake | Neutralizes next mistake | `{ count: 1 }` |
| Uncommon | neutralizeMistake | Neutralizes next two mistakes | `{ count: 2 }` |
| Rare     | neutralizeMistake | Neutralizes next three mistakes | `{ count: 3 }` |
| Epic     | neutralizeMistake | Neutralizes next five mistakes | `{ count: 5 }` |
| Rogue    | neutralizeMistake | Auto-neutralizes one at start | `{ count: 1, autoTrigger: true }` |

**Acceptance Criteria**:
- Tracks charges in `ActivePowerup.chargesRemaining`
- Integrated into delayed validation mistake counting
- Consumes charges on mistake detection
- Rogue charges applied at level start

---

## Shop Integration

### Inflation Formula

```typescript
inflation = min(0.5, corruptionPercent * 0.03)
finalOF = ceil(baseOF * (1 + inflation))
// ED costs never inflated
```

### Reroll Costs

**OF Reroll**:
```typescript
cost = 25 + (rerollCount * 15)
```

**ED Reroll Guarantees**:
- 15 ED → Guarantee Uncommon (limit once per shop)
- 30 ED → Guarantee Rare (limit once per shop)

### Purchase Flow

1. Calculate inflation based on `getTotalCorruption(grid)`
2. Display inflated OF price, base ED price
3. On purchase: deduct currency, add to `RunState.activePowerups`
4. Emit `shop_purchase` analytics event

---

## Analytics Events

All events logged to console with structured data:

### powerup_auto_triggered
```typescript
{
  id: string,          // powerup id
  floor: number,       // current floor
  runSeed: number      // run seed for replay
}
```

### powerup_applied
```typescript
{
  id: string,
  floor: number,
  runSeed: number,
  method: 'shop' | 'rogue' | 'script'
}
```

### powerup_effect_result
```typescript
{
  id: string,
  effectKey: string,
  beforeStateHash: string,  // grid hash before effect
  afterStateHash: string,   // grid hash after effect
}
```

---

## Running Tests

### Unit Tests

```bash
npm test tests/unit/PowerupUnitTests.test.ts
```

Tests verify:
- Each effectKey in isolation
- Deterministic behavior with seeded RNG
- Puzzle uniqueness preservation
- Parameter validation

### Integration Tests

```bash
npm test tests/integration/PowerupIntegrationTests.test.ts
```

Tests verify:
- Rogue auto-trigger at level start
- Shop purchase persistence
- Multi-powerup interactions
- Full run simulation

### Property Tests

Run 1000 deterministic simulations:

```bash
npm test tests/integration/PowerupPropertyTests.test.ts
```

Invariants checked:
- Invariant A: Underlying solution unchanged
- Invariant B: No autoPlace conflicts
- Invariant C: Corruption values ∈ [0, 100]

---

## Debugging Rogue Triggers

Enable debug logging:

```typescript
console.log('[PowerupManager] Rogue triggers:', getAutoTriggerPowerups());
```

Force a powerup in debug UI:

```typescript
import { applyRunPurchase } from '@/src/powerups/PowerupManager';

// Force add rogue powerup
const debugState = applyRunPurchase(runState, 'num_1_rogue');
```

Inspect applied effects:

```typescript
console.log('Applied effects:', runState.appliedEffects);
```

---

## Schema Reference

```json
{
  "id": "string",
  "digit": 1-9,
  "rarity": "Common" | "Uncommon" | "Rare" | "Epic" | "Rogue",
  "autoTrigger": boolean,
  "effectKey": "purify" | "autoPlace" | ... ,
  "params": { },
  "description": "string",
  "acceptance": {
    "unitTests": ["string"],
    "integrationTests": ["string"]
  }
}
```

## Error Handling

### Uniqueness Violation

```typescript
if (!checkUniquenessAfterAutoPlace(placements)) {
  console.warn('[PowerupManager] AutoPlace would break uniqueness, fallback');
  // Fallback to revealCandidate or grant currency
  // Never fail silently
}
```

### Invalid Parameters

```typescript
if (params.count < 0) {
  throw new Error(`Invalid count: ${params.count}`);
}
```

### Missing Powerup

```typescript
if (!powerup) {
  console.error(`[PowerupManager] Powerup not found: ${powerupId}`);
  return runState; // No-op, maintain state consistency
}
```

---

## Implementation Notes

1. **Determinism**: All RNG uses `SeededRandom` class with `runSeed + turnNumber`
2. **State Hashing**: Uses simple hash for before/after comparison
3. **Fallback Logging**: All fallbacks explicitly logged with reason
4. **Replay Support**: `appliedEffects` array enables full run replay
5. **No Side Effects**: All functions return new state, never mutate input

---

## Future Extensions

- Add ED-cost powerups (currently only OF)
- Implement multi-digit combo effects
- Add powerup synergy bonuses
- Persistent powerups across runs (unlocks)
- Powerup upgrade/fusion system

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-15  
**Maintained By**: 9x Rogue Development Team
