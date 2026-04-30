import pb from './pocketbase';
import type { Transaction, TransactionCreateData } from '../types';

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    const records = await pb.collection('banking_transactions').getFullList<Transaction>({
      sort: '-time',
    });
    return records;
  },

  async create(data: TransactionCreateData): Promise<Transaction> {
    return pb.collection('banking_transactions').create<Transaction>(data);
  },

  async delete(id: string): Promise<void> {
    await pb.collection('banking_transactions').delete(id);
  },

  subscribe(callback: (transaction: Transaction, action: string) => void): () => void {
    let cancelled = false;

    pb.collection('banking_transactions').subscribe<Transaction>('*', (e) => {
      if (!cancelled) callback(e.record, e.action);
    });

    return () => {
      cancelled = true;
      pb.collection('banking_transactions').unsubscribe('*');
    };
  },
};
