// Faction is now a dynamic string - configured per event
export type Faction = string;

export interface BankingEvent {
  id: string;
  name: string;
  active: boolean;
  factions: string[]; // factions participating in this event
  created: string;
  updated: string;
}

export interface User {
  id: string;
  name?: string;
  role: 'Admin' | 'banker' | 'player';
  faction?: string;
}

export interface Transaction {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  time: string;
  amount: number;
  nameId: string;
  eventId?: string;
  transferId?: string;
  tracked: boolean;
  expand?: {
    nameId: Name;
    eventId?: BankingEvent;
  };
}

// Resolved transaction with name/faction from relation
export interface ResolvedTransaction {
  id: string;
  time: string;
  amount: number;
  name: string;
  faction: string;
  tracked: boolean;
  nameId: string;
  eventId?: string;
}

export interface TransactionCreateData {
  time: string;
  amount: number;
  nameId: string;
  eventId?: string;
  tracked: boolean;
}

export interface Name {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  name: string;
  faction: string;
  userId?: string;
  nfcId?: string;
}

export interface FactionConfig {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  faction: string;
  startingValue: number;
}

export interface FactionSummary {
  faction: string;
  startingValue: number;
  total: number;
  currentValue: number;
  diff: number;
  diffPercent: number;
  count: number;
}

export interface NameSummary {
  name: string;
  faction: string;
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

export interface BankingTransfer {
  id: string;
  time: string;
  amount: number;
  senderId: string;
  receiverId: string;
  eventId?: string;
  tracked: boolean;
  expand?: {
    senderId: Name;
    receiverId: Name;
  };
}

export interface ResolvedTransfer {
  id: string;
  time: string;
  amount: number;
  senderName: string;
  senderFaction: string;
  receiverName: string;
  receiverFaction: string;
  senderId: string;
  receiverId: string;
  eventId?: string;
  tracked: boolean;
}

export interface TransferCreateData {
  time: string;
  amount: number;
  senderId: string;
  receiverId: string;
  eventId?: string;
  tracked: boolean;
}
