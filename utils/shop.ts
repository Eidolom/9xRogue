import { ShopOffer, ShopSession, Rarity } from '@/types/shop';
import { 
  NUMBER_UPGRADES, 
  RELICS_PERMANENT, 
  RELICS_RUN, 
  CONSUMABLES, 
  RULE_MUTATORS
} from '@/constants/shopOffers';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  weightedChoice<T extends { weight: number }>(items: T[]): T | null {
    if (items.length === 0) return null;
    
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }
    
    return items[items.length - 1];
  }
}

export function generateShopSeed(runSeed: number, floor: number, rerollCount: number): number {
  return runSeed * 1000 + floor * 100 + rerollCount;
}

function filterByRarity(offers: ShopOffer[], rarity: Rarity): ShopOffer[] {
  return offers.filter(o => o.rarity === rarity);
}

function filterByDependencies(offers: ShopOffer[], ownedIds: string[]): ShopOffer[] {
  return offers.filter(offer => {
    if (!offer.dependency) return true;
    return ownedIds.includes(offer.dependency);
  });
}

function selectOfferByRarity(
  pool: ShopOffer[], 
  rng: SeededRandom, 
  excludeIds: string[],
  ownedIds: string[],
  guaranteeRarity?: Rarity
): ShopOffer | null {
  let availableOffers = pool.filter(o => !excludeIds.includes(o.id));
  availableOffers = filterByDependencies(availableOffers, ownedIds);
  
  if (availableOffers.length === 0) return null;
  
  if (guaranteeRarity) {
    const rarityOffers = filterByRarity(availableOffers, guaranteeRarity);
    if (rarityOffers.length > 0) {
      return rng.weightedChoice(rarityOffers);
    }
  }
  
  return rng.weightedChoice(availableOffers);
}

function generateSlot1(
  rng: SeededRandom, 
  excludeIds: string[], 
  ownedIds: string[],
  guaranteeRarity?: Rarity
): ShopOffer | null {
  return selectOfferByRarity(NUMBER_UPGRADES, rng, excludeIds, ownedIds, guaranteeRarity);
}

function generateSlot2(
  rng: SeededRandom, 
  excludeIds: string[], 
  ownedIds: string[],
  guaranteeRarity?: Rarity
): ShopOffer | null {
  const roll = rng.next();
  
  let pool: ShopOffer[];
  if (roll < 0.70) {
    pool = CONSUMABLES;
  } else if (roll < 0.95) {
    pool = RELICS_RUN;
  } else {
    pool = RELICS_PERMANENT;
  }
  
  return selectOfferByRarity(pool, rng, excludeIds, ownedIds, guaranteeRarity);
}

function generateSlot3(
  rng: SeededRandom, 
  excludeIds: string[], 
  ownedIds: string[],
  guaranteeRarity?: Rarity
): ShopOffer | null {
  const roll = rng.next();
  
  const pool = roll < 0.50 ? NUMBER_UPGRADES : RULE_MUTATORS;
  return selectOfferByRarity(pool, rng, excludeIds, ownedIds, guaranteeRarity);
}

export function generateShopOffers(
  runSeed: number,
  floor: number,
  rerollCount: number,
  ownedIds: string[],
  rerollsSinceLastPurchase: number,
  raresSeenCount: number,
  shopsOpened: number
): ShopOffer[] {
  const seed = generateShopSeed(runSeed, floor, rerollCount);
  const rng = new SeededRandom(seed);
  
  const offers: ShopOffer[] = [];
  const excludeIds: string[] = [];
  
  let guaranteeUncommon = false;
  let guaranteeRare = false;
  
  if (rerollsSinceLastPurchase >= 3) {
    guaranteeUncommon = true;
    console.log('[Shop] Pity: Guaranteeing Uncommon after 3 rerolls without purchase');
  }
  
  if (shopsOpened - raresSeenCount >= 8) {
    guaranteeRare = true;
    console.log('[Shop] Pity: Guaranteeing Rare after 8 shops without seeing one');
  }
  
  const slot1 = generateSlot1(
    rng, 
    excludeIds, 
    ownedIds,
    guaranteeRare ? 'Rare' : guaranteeUncommon ? 'Uncommon' : undefined
  );
  if (slot1) {
    offers.push(slot1);
    excludeIds.push(slot1.id);
  }
  
  const slot2 = generateSlot2(
    rng, 
    excludeIds, 
    ownedIds,
    guaranteeRare && !slot1 ? 'Rare' : undefined
  );
  if (slot2) {
    offers.push(slot2);
    excludeIds.push(slot2.id);
  }
  
  const slot3 = generateSlot3(
    rng, 
    excludeIds, 
    ownedIds
  );
  if (slot3) {
    offers.push(slot3);
    excludeIds.push(slot3.id);
  }
  
  const hasCommon = offers.some(o => o.rarity === 'Common');
  const hasRare = offers.some(o => o.rarity === 'Rare');
  
  if (!hasCommon && offers.length > 0) {
    console.log('[Shop] No Common found, rerolling slot');
  }
  
  if (hasRare) {
    console.log('[Shop] Rare offer generated');
  }
  
  return offers;
}

export function calculateRerollCost(rerollCount: number, isOF: boolean): number {
  if (!isOF) return 0;
  
  const baseCost = 25;
  const increment = 15;
  return baseCost + (rerollCount * increment);
}

export function calculateEDRerollCost(isPremium: boolean): number {
  return isPremium ? 30 : 15;
}

export function createShopSession(
  floor: number,
  runSeed: number,
  ownedIds: string[],
  raresSeenCount: number,
  shopsOpened: number
): ShopSession {
  const shopSeed = generateShopSeed(runSeed, floor, 0);
  const currentOffers = generateShopOffers(runSeed, floor, 0, ownedIds, 0, raresSeenCount, shopsOpened);
  
  return {
    floor,
    shopSeed,
    rerollCount: 0,
    currentOffers,
    purchasedOffers: [],
    rerollsSinceLastPurchase: 0,
    raresSeenCount,
  };
}

export function rerollShop(
  session: ShopSession,
  runSeed: number,
  ownedIds: string[],
  shopsOpened: number
): ShopSession {
  const newRerollCount = session.rerollCount + 1;
  const newOffers = generateShopOffers(
    runSeed, 
    session.floor, 
    newRerollCount, 
    ownedIds,
    session.rerollsSinceLastPurchase + 1,
    session.raresSeenCount,
    shopsOpened
  );
  
  const hasRare = newOffers.some(o => o.rarity === 'Rare');
  
  return {
    ...session,
    rerollCount: newRerollCount,
    currentOffers: newOffers,
    rerollsSinceLastPurchase: session.rerollsSinceLastPurchase + 1,
    raresSeenCount: hasRare ? session.raresSeenCount + 1 : session.raresSeenCount,
  };
}

export function purchaseOffer(
  session: ShopSession,
  offerId: string
): ShopSession {
  return {
    ...session,
    purchasedOffers: [...session.purchasedOffers, offerId],
    rerollsSinceLastPurchase: 0,
  };
}

export function emitShopAnalytics(
  eventType: 'shop_open' | 'shop_reroll' | 'shop_purchase' | 'shop_skip' | 'shop_pity_triggered',
  payload: any
): void {
  console.log(`[Analytics] ${eventType}`, JSON.stringify(payload, null, 2));
}
