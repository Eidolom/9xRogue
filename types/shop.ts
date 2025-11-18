export type OfferType = 'NumberUpgrade' | 'RelicPermanent' | 'RelicRun' | 'Consumable' | 'RuleMutator';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Rogue';
export type Permanence = 'Run' | 'Permanent';

export interface ShopOffer {
  id: string;
  type: OfferType;
  digit?: number;
  tier?: number;
  rarity?: Rarity;
  baseCostOF: number;
  baseCostED: number;
  runLimited: boolean;
  descriptionShort: string;
  descriptionFull: string;
  entropyDrainPerFloor: number;
  dependency?: string;
  weight: number;
  effect: string;
  icon?: string;
}

export interface ShopSession {
  floor: number;
  shopSeed: number;
  rerollCount: number;
  currentOffers: ShopOffer[];
  purchasedOffers: string[];
  rerollsSinceLastPurchase: number;
  raresSeenCount: number;
}

export interface ShopState {
  orderFragments: number;
  entropyDust: number;
  currentSession: ShopSession | null;
}

export interface AnalyticsEvent {
  type: 'shop_open' | 'shop_reroll' | 'shop_purchase' | 'shop_skip' | 'shop_pity_triggered';
  payload: any;
}
