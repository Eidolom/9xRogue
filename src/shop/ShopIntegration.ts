import { getTotalCorruption } from '@/utils/corruption';
import { GameGrid } from '@/types/game';
import { RunState } from '@/src/powerups/PowerupManager';
import { getPowerupById } from '@/src/powerups/PowerupModel';

export interface ShopPricing {
  baseOF: number;
  basED: number;
  finalOF: number;
  finalED: number;
  inflationFactor: number;
  corruptionPercent: number;
}

export interface RerollCost {
  ofCost: number;
  edCost: number;
  rerollCount: number;
}

export interface PurchaseResult {
  success: boolean;
  newOF: number;
  newED: number;
  runState: RunState;
  message?: string;
}

export function calculateCorruptionPercent(grid: GameGrid): number {
  const totalCorruption = getTotalCorruption(grid);
  const maxCorruption = 81 * 100;
  return Math.min(100, (totalCorruption / maxCorruption) * 100);
}

export function calculateShopInflation(corruptionPercent: number): number {
  return Math.min(0.5, corruptionPercent * 0.03);
}

export function calculateShopPricing(
  baseOF: number,
  baseED: number,
  grid: GameGrid
): ShopPricing {
  const corruptionPercent = calculateCorruptionPercent(grid);
  const inflationFactor = calculateShopInflation(corruptionPercent);
  
  const finalOF = Math.ceil(baseOF * (1 + inflationFactor));
  const finalED = baseED;
  
  console.log(`[ShopIntegration] Inflation: ${(inflationFactor * 100).toFixed(1)}% | Corruption: ${corruptionPercent.toFixed(1)}%`);
  
  return {
    baseOF,
    basED: baseED,
    finalOF,
    finalED,
    inflationFactor,
    corruptionPercent,
  };
}

export function calculateOFRerollCost(rerollCount: number): number {
  const baseCost = 25;
  const increment = 15;
  return baseCost + rerollCount * increment;
}

export function calculateEDRerollCost(guaranteeType: 'Uncommon' | 'Rare'): number {
  if (guaranteeType === 'Uncommon') {
    return 15;
  } else if (guaranteeType === 'Rare') {
    return 30;
  }
  return 0;
}

export function getRerollCostInfo(
  rerollCount: number,
  canGuaranteeUncommon: boolean,
  canGuaranteeRare: boolean
): RerollCost & { guaranteeOptions: string[] } {
  const ofCost = calculateOFRerollCost(rerollCount);
  const edCostUncommon = canGuaranteeUncommon ? calculateEDRerollCost('Uncommon') : 0;
  const edCostRare = canGuaranteeRare ? calculateEDRerollCost('Rare') : 0;
  
  const guaranteeOptions: string[] = [];
  if (canGuaranteeUncommon) {
    guaranteeOptions.push(`${edCostUncommon} ED → Guarantee Uncommon`);
  }
  if (canGuaranteeRare) {
    guaranteeOptions.push(`${edCostRare} ED → Guarantee Rare`);
  }
  
  return {
    ofCost,
    edCost: Math.max(edCostUncommon, edCostRare),
    rerollCount,
    guaranteeOptions,
  };
}

export function canAffordOF(currentOF: number, cost: number): boolean {
  return currentOF >= cost;
}

export function canAffordED(currentED: number, cost: number): boolean {
  return currentED >= cost;
}

export function purchasePowerupWithOF(
  runState: RunState,
  powerupId: string,
  cost: number
): PurchaseResult {
  if (!canAffordOF(runState.currency, cost)) {
    return {
      success: false,
      newOF: runState.currency,
      newED: runState.entropyDust,
      runState,
      message: `Insufficient OF. Need ${cost}, have ${runState.currency}`,
    };
  }
  
  const newState: RunState = {
    ...runState,
    currency: runState.currency - cost,
    activePowerups: [
      ...runState.activePowerups,
      {
        id: powerupId,
        powerup: getPowerupById(powerupId)!,
      },
    ],
  };
  
  console.log(`[ShopIntegration] Purchased ${powerupId} for ${cost} OF`);
  console.log(`[Analytics] shop_purchase`, { powerupId, cost, currency: 'OF' });
  
  return {
    success: true,
    newOF: newState.currency,
    newED: newState.entropyDust,
    runState: newState,
    message: `Purchased ${powerupId}`,
  };
}

export function purchasePowerupWithED(
  runState: RunState,
  powerupId: string,
  cost: number
): PurchaseResult {
  if (!canAffordED(runState.entropyDust, cost)) {
    return {
      success: false,
      newOF: runState.currency,
      newED: runState.entropyDust,
      runState,
      message: `Insufficient ED. Need ${cost}, have ${runState.entropyDust}`,
    };
  }
  
  const newState: RunState = {
    ...runState,
    entropyDust: runState.entropyDust - cost,
    activePowerups: [
      ...runState.activePowerups,
      {
        id: powerupId,
        powerup: getPowerupById(powerupId)!,
      },
    ],
  };
  
  console.log(`[ShopIntegration] Purchased ${powerupId} for ${cost} ED`);
  console.log(`[Analytics] shop_purchase`, { powerupId, cost, currency: 'ED' });
  
  return {
    success: true,
    newOF: newState.currency,
    newED: newState.entropyDust,
    runState: newState,
    message: `Purchased ${powerupId}`,
  };
}

export function deductRerollOF(currentOF: number, rerollCount: number): { newOF: number; cost: number } {
  const cost = calculateOFRerollCost(rerollCount);
  if (!canAffordOF(currentOF, cost)) {
    throw new Error(`Cannot afford OF reroll. Need ${cost}, have ${currentOF}`);
  }
  
  console.log(`[ShopIntegration] Rerolled for ${cost} OF`);
  console.log(`[Analytics] shop_reroll`, { cost, currency: 'OF', rerollCount });
  
  return {
    newOF: currentOF - cost,
    cost,
  };
}

export function deductRerollED(
  currentED: number,
  guaranteeType: 'Uncommon' | 'Rare'
): { newED: number; cost: number } {
  const cost = calculateEDRerollCost(guaranteeType);
  if (!canAffordED(currentED, cost)) {
    throw new Error(`Cannot afford ED reroll. Need ${cost}, have ${currentED}`);
  }
  
  console.log(`[ShopIntegration] Rerolled for ${cost} ED (guarantee ${guaranteeType})`);
  console.log(`[Analytics] shop_reroll`, { cost, currency: 'ED', guaranteeType });
  
  return {
    newED: currentED - cost,
    cost,
  };
}

export function emitShopOpenAnalytics(floor: number, runSeed: number, corruption: number): void {
  console.log(`[Analytics] shop_open`, { floor, runSeed, corruption });
}

export function emitShopSkipAnalytics(floor: number, runSeed: number): void {
  console.log(`[Analytics] shop_skip`, { floor, runSeed });
}

export function emitShopPityTriggeredAnalytics(
  type: 'Uncommon' | 'Rare',
  rerollsSinceLastPurchase: number,
  shopsWithoutRare?: number
): void {
  console.log(`[Analytics] shop_pity_triggered`, {
    type,
    rerollsSinceLastPurchase,
    shopsWithoutRare,
  });
}
