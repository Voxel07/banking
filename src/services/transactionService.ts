import pb from './pocketbase';
import type { Transaction, TransactionCreateData, ResolvedTransaction } from '../types';
import type { Faction } from '../types';

function resolveTransaction(tx: Transaction): ResolvedTransaction {
  const expanded = tx.expand?.nameId;
  return {
    id: tx.id,
    time: tx.time,
    amount: tx.amount,
    name: expanded?.name ?? 'Unknown',
    faction: (expanded?.faction ?? 'Miliz') as Faction,
    tracked: tx.tracked,
    nameId: tx.nameId,
  };
}

export const transactionService = {
  async getAll(): Promise<ResolvedTransaction[]> {
    const records = await pb.collection('banking_transactions').getFullList<Transaction>({
      sort: '-time',
      expand: 'nameId',
    });
    return records.map(resolveTransaction);
  },

  async create(data: TransactionCreateData): Promise<ResolvedTransaction> {
    const record = await pb.collection('banking_transactions').create<Transaction>(data, {
      expand: 'nameId',
    });
    return resolveTransaction(record);
  },

  async update(id: string, data: Partial<TransactionCreateData>): Promise<ResolvedTransaction> {
    const record = await pb.collection('banking_transactions').update<Transaction>(id, data, {
      expand: 'nameId',
    });
    return resolveTransaction(record);
  },

  async delete(id: string): Promise<void> {
    await pb.collection('banking_transactions').delete(id);
  },

  subscribe(callback: (transaction: ResolvedTransaction, action: string) => void): () => void {
    let cancelled = false;

    pb.collection('banking_transactions').subscribe<Transaction>('*', async (e) => {
      if (cancelled) return;
      if (e.action === 'delete') {
        // On delete we don't have expand, construct minimal resolved tx
        callback({
          id: e.record.id,
          time: e.record.time,
          amount: e.record.amount,
          name: '',
          faction: 'Miliz',
          tracked: e.record.tracked,
          nameId: e.record.nameId,
        }, e.action);
        return;
      }
      // For create/update, re-fetch with expand to get name data
      try {
        const full = await pb.collection('banking_transactions').getOne<Transaction>(e.record.id, {
          expand: 'nameId',
        });
        if (!cancelled) callback(resolveTransaction(full), e.action);
      } catch {
        if (!cancelled) callback(resolveTransaction(e.record), e.action);
      }
    });

    return () => {
      cancelled = true;
      pb.collection('banking_transactions').unsubscribe('*');
    };
  },
};
