export type Faction = 'Miliz' | 'KGG' | 'GOF' | 'Enklave';

export const FACTIONS: Faction[] = ['Miliz', 'KGG', 'GOF', 'Enklave'];

export const FACTION_STARTING_VALUES: Record<Faction, number> = {
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
  name: string;
  faction: Faction;
}

export interface TransactionCreateData {
  time: string;
  amount: number;
  name: string;
  faction: Faction;
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

export interface FactionSummary {
  faction: Faction;
  startingValue: number;
  total: number;
  diff: number;
  diffPercent: number;
  count: number;
}

export interface NameSummary {
  name: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export type SortField = 'time' | 'amount' | 'name' | 'faction';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
