import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { transactionService } from '../services/transactionService';
import { nameService } from '../services/nameService';
import type { Transaction, TransactionCreateData, Name, Faction } from '../types';
import { TransactionContext } from './transactionContext';

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState<Name[]>([]);
  const [online, setOnline] = useState(navigator.onLine);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch data + subscribe
  useEffect(() => {
    let cancelled = false;

    transactionService.getAll().then((data) => {
      if (!cancelled) {
        setTransactions(data);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
        setLoading(false);
      }
    });

    nameService.getAll().then((data) => {
      if (!cancelled) setNames(data);
    }).catch(() => { /* non-critical */ });

    // Subscribe for real-time updates
    const txUnsub = transactionService.subscribe((tx, action) => {
      if (cancelled) return;
      setTransactions((prev) => {
        switch (action) {
          case 'create':
            return [tx, ...prev];
          case 'update':
            return prev.map((t) => (t.id === tx.id ? tx : t));
          case 'delete':
            return prev.filter((t) => t.id !== tx.id);
          default:
            return prev;
        }
      });
    });

    const nameUnsub = nameService.subscribe(() => {
      if (!cancelled) {
        nameService.getAll().then((data) => {
          if (!cancelled) setNames(data);
        }).catch(() => { /* non-critical */ });
      }
    });

    return () => {
      cancelled = true;
      txUnsub();
      nameUnsub();
    };
  }, []);

  // Re-fetch when coming back online
  useEffect(() => {
    if (!online) return;

    const controller = new AbortController();

    transactionService.getAll().then((data) => {
      if (!controller.signal.aborted) {
        setTransactions(data);
      }
    }).catch(() => { /* will retry on next online event */ });

    nameService.getAll().then((data) => {
      if (!controller.signal.aborted) setNames(data);
    }).catch(() => { /* non-critical */ });

    return () => controller.abort();
  }, [online]);

  const createTransaction = useCallback(async (data: TransactionCreateData) => {
    try {
      await transactionService.create(data);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create transaction',
        { cause: err },
      );
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await transactionService.delete(id);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete transaction',
        { cause: err },
      );
    }
  }, []);

  const ensureName = useCallback(async (name: string, faction: Faction) => {
    await nameService.createIfNotExists(name, faction);
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        error,
        createTransaction,
        deleteTransaction,
        names,
        ensureName,
        online,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}
