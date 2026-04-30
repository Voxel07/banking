import { createContext, useContext } from 'react';
import type { TransactionCreateData, Faction, Name } from '../types';
import type { Transaction } from '../types';

export interface TransactionContextValue {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (data: TransactionCreateData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  names: Name[];
  ensureName: (name: string, faction: Faction) => Promise<void>;
  online: boolean;
}

export const TransactionContext = createContext<TransactionContextValue | null>(null);

export function useTransactionContext(): TransactionContextValue {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactionContext must be used within TransactionProvider');
  return ctx;
}
