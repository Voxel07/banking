export type Faction = 'Miliz' | 'KGG' | 'GOF' | 'Enklave';

export const FACTIONS: Faction[] = ['Miliz', 'KGG', 'GOF', 'Enklave'];

export const DEFAULT_FACTION_STARTING_VALUES: Record<Faction, number> = {
  Miliz: 500_000,
  KGG: 750_000,
  GOF: 600_000,
  Enklave: 400_000,
};

export interface Transaction {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  time: string;
  amount: number;
  nameId: string;
  tracked: boolean;
  expand?: {
    nameId: Name;
  };
}

// Resolved transaction with name/faction from relation
export interface ResolvedTransaction {
  id: string;
  time: string;
  amount: number;
  name: string;
  faction: Faction;
  tracked: boolean;
  nameId: string;
}

export interface TransactionCreateData {
  time: string;
  amount: number;
  nameId: string;
  tracked: boolean;
}

export interface Name {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  name: string;
  faction: Faction;
}

export interface FactionConfig {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  faction: Faction;
  startingValue: number;
}

export interface FactionSummary {
  faction: Faction;
  startingValue: number;
  total: number;
  currentValue: number;
  diff: number;
  diffPercent: number;
  count: number;
}

export interface NameSummary {
  name: string;
  faction: Faction;
  total: number;
  count: number;
  transactions: ResolvedTransaction[];
}

export type SortField = 'time' | 'amount' | 'name' | 'faction';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
