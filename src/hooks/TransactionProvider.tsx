import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { transactionService } from '../services/transactionService';
import { nameService } from '../services/nameService';
import { factionService } from '../services/factionService';
import type { ResolvedTransaction, TransactionCreateData, Name, Faction, FactionConfig } from '../types';
import { TransactionContext } from './transactionContext';

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<ResolvedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState<Name[]>([]);
  const [factionConfigs, setFactionConfigs] = useState<FactionConfig[]>([]);
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
      if (!cancelled) { setTransactions(data); setLoading(false); }
    }).catch((err) => {
      if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load transactions'); setLoading(false); }
    });

    nameService.getAll().then((data) => {
      if (!cancelled) setNames(data);
    }).catch(() => {});

    factionService.getAll().then((data) => {
      if (!cancelled) setFactionConfigs(data);
    }).catch(() => {});

    const txUnsub = transactionService.subscribe((tx, action) => {
      if (cancelled) return;
      setTransactions((prev) => {
        switch (action) {
          case 'create': return [tx, ...prev];
          case 'update': return prev.map((t) => (t.id === tx.id ? tx : t));
          case 'delete': return prev.filter((t) => t.id !== tx.id);
          default: return prev;
        }
      });
    });

    const nameUnsub = nameService.subscribe(() => {
      if (!cancelled) {
        nameService.getAll().then((d) => { if (!cancelled) setNames(d); }).catch(() => {});
        // Also refresh transactions since name changes affect resolved data
        transactionService.getAll().then((d) => { if (!cancelled) setTransactions(d); }).catch(() => {});
      }
    });

    const factionUnsub = factionService.subscribe(() => {
      if (!cancelled) factionService.getAll().then((d) => { if (!cancelled) setFactionConfigs(d); }).catch(() => {});
    });

    return () => { cancelled = true; txUnsub(); nameUnsub(); factionUnsub(); };
  }, []);

  // Re-fetch when coming back online
  useEffect(() => {
    if (!online) return;
    const controller = new AbortController();
    transactionService.getAll().then((data) => { if (!controller.signal.aborted) setTransactions(data); }).catch(() => {});
    nameService.getAll().then((data) => { if (!controller.signal.aborted) setNames(data); }).catch(() => {});
    factionService.getAll().then((data) => { if (!controller.signal.aborted) setFactionConfigs(data); }).catch(() => {});
    return () => controller.abort();
  }, [online]);

  const createTransaction = useCallback(async (data: { name: string; amount: number; faction: Faction; time: string; tracked: boolean }) => {
    try {
      // Ensure name exists and get its ID
      const nameRecord = await nameService.createIfNotExists(data.name, data.faction);
      const txData: TransactionCreateData = {
        nameId: nameRecord.id,
        amount: data.amount,
        time: data.time,
        tracked: data.tracked,
      };
      await transactionService.create(txData);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create transaction', { cause: err });
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, data: { amount?: number; nameId?: string; tracked?: boolean }) => {
    try { await transactionService.update(id, data); }
    catch (err) { throw new Error(err instanceof Error ? err.message : 'Failed to update transaction', { cause: err }); }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try { await transactionService.delete(id); }
    catch (err) { throw new Error(err instanceof Error ? err.message : 'Failed to delete transaction', { cause: err }); }
  }, []);

  const ensureName = useCallback(async (name: string, faction: Faction): Promise<Name> => {
    return await nameService.createIfNotExists(name, faction);
  }, []);

  const updateName = useCallback(async (id: string, name: string) => {
    await nameService.update(id, name);
  }, []);

  const updateFactionStartValue = useCallback(async (faction: Faction, startingValue: number) => {
    await factionService.upsert(faction, startingValue);
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions, loading, error,
        createTransaction, updateTransaction, deleteTransaction,
        names, ensureName, updateName,
        factionConfigs, updateFactionStartValue,
        online,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}
