import { createContext, useContext } from 'react';
import type { Name, FactionConfig, ResolvedTransaction } from '../types';

export interface TransactionContextValue {
  transactions: ResolvedTransaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (data: { name: string; amount: number; faction: string; time: string; tracked: boolean }) => Promise<void>;
  updateTransaction: (id: string, data: { amount?: number; nameId?: string; tracked?: boolean }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  names: Name[];
  ensureName: (name: string, faction: string) => Promise<Name>;
  updateName: (id: string, name: string) => Promise<void>;
  factionConfigs: FactionConfig[];
  updateFactionStartValue: (faction: string, startingValue: number) => Promise<void>;
  online: boolean;
}

export const TransactionContext = createContext<TransactionContextValue | null>(null);

export function useTransactionContext(): TransactionContextValue {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactionContext must be used within TransactionProvider');
  return ctx;
}
