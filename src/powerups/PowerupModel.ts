import powerupsData from '@/data/powerups.json';

export type PowerupRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Rogue';

export type EffectKey =
  | 'purify'
  | 'autoPlace'
  | 'revealCandidate'
  | 'lockBox'
  | 'forbidSlots'
  | 'resolveAmbiguity'
  | 'cleanAnywhere'
  | 'grantCurrency'
  | 'clearPhantom'
  | 'neutralizeMistake';

export interface PowerupParams {
  scope?: 'row' | 'col' | 'global' | 'rowcol' | 'box';
  amount?: number;
  cells?: number | 'all';
  digit?: number;
  count?: number;
  boxEffect?: 'slowSpread';
  amountPct?: number;
  boxLock?: boolean;
  durationMoves?: number;
  affectRow?: boolean;
  currency?: 'OF' | 'ED';
  alsoHint?: boolean;
  cleanCell?: number;
  phantomCount?: number;
}

export interface PowerupAcceptance {
  unitTests: string[];
  integrationTests: string[];
}

export interface Powerup {
  id: string;
  digit: number;
  rarity: PowerupRarity;
  autoTrigger: boolean;
  effectKey: EffectKey;
  params: PowerupParams;
  description: string;
  acceptance: PowerupAcceptance;
}

function validatePowerup(data: any): data is Powerup {
  if (typeof data.id !== 'string' || !data.id) {
    throw new Error(`Invalid powerup: missing or invalid 'id'`);
  }

  if (typeof data.digit !== 'number' || data.digit < 1 || data.digit > 9) {
    throw new Error(`Invalid powerup ${data.id}: 'digit' must be between 1-9`);
  }

  const validRarities: PowerupRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Rogue'];
  if (!validRarities.includes(data.rarity)) {
    throw new Error(`Invalid powerup ${data.id}: invalid 'rarity'`);
  }

  if (typeof data.autoTrigger !== 'boolean') {
    throw new Error(`Invalid powerup ${data.id}: 'autoTrigger' must be boolean`);
  }

  const validEffectKeys: EffectKey[] = [
    'purify',
    'autoPlace',
    'revealCandidate',
    'lockBox',
    'forbidSlots',
    'resolveAmbiguity',
    'cleanAnywhere',
    'grantCurrency',
    'clearPhantom',
    'neutralizeMistake',
  ];
  if (!validEffectKeys.includes(data.effectKey)) {
    throw new Error(`Invalid powerup ${data.id}: invalid 'effectKey'`);
  }

  if (!data.params || typeof data.params !== 'object') {
    throw new Error(`Invalid powerup ${data.id}: 'params' must be an object`);
  }

  if (typeof data.description !== 'string') {
    throw new Error(`Invalid powerup ${data.id}: 'description' must be a string`);
  }

  if (
    !data.acceptance ||
    !Array.isArray(data.acceptance.unitTests) ||
    !Array.isArray(data.acceptance.integrationTests)
  ) {
    throw new Error(`Invalid powerup ${data.id}: invalid 'acceptance' structure`);
  }

  return true;
}

function loadPowerups(): Powerup[] {
  const powerups: Powerup[] = [];
  const seenIds = new Set<string>();

  for (const data of powerupsData) {
    if (seenIds.has(data.id)) {
      throw new Error(`Duplicate powerup id: ${data.id}`);
    }
    seenIds.add(data.id);

    validatePowerup(data);
    powerups.push(data as Powerup);
  }

  console.log(`[PowerupModel] Loaded ${powerups.length} powerups`);
  return powerups;
}

export const POWERUPS = loadPowerups();

export function getPowerupById(id: string): Powerup | undefined {
  return POWERUPS.find(p => p.id === id);
}

export function getPowerupsByDigit(digit: number): Powerup[] {
  return POWERUPS.filter(p => p.digit === digit);
}

export function getPowerupsByRarity(rarity: PowerupRarity): Powerup[] {
  return POWERUPS.filter(p => p.rarity === rarity);
}

export function getAutoTriggerPowerups(): Powerup[] {
  return POWERUPS.filter(p => p.autoTrigger);
}

export function getPowerupsByEffectKey(effectKey: EffectKey): Powerup[] {
  return POWERUPS.filter(p => p.effectKey === effectKey);
}

export const POWERUP_BY_ID: Record<string, Powerup> = {};
for (const powerup of POWERUPS) {
  POWERUP_BY_ID[powerup.id] = powerup;
}
