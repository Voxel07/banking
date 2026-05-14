import pb from './pocketbase';
import type { Transaction, TransactionCreateData, ResolvedTransaction } from '../types';
import type { Faction } from '../types';
import { logService } from './logService';

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
    eventId: tx.eventId,
  };
}

export const transactionService = {
  async getAll(eventId?: string | null): Promise<ResolvedTransaction[]> {
    const filter = eventId ? `eventId = "${eventId}"` : '';
    const records = await pb.collection('banking_transactions').getFullList<Transaction>({
      sort: '-time',
      expand: 'nameId,eventId',
      filter,
      requestKey: null,
    });
    return records.map(resolveTransaction);
  },

  async create(data: TransactionCreateData): Promise<ResolvedTransaction> {
    const record = await pb.collection('banking_transactions').create<Transaction>(data, {
      expand: 'nameId',
    });
    const resolved = resolveTransaction(record);
    logService.log({
      action: 'CREATE',
      entity: 'transaction',
      entityId: record.id,
      details: { new: resolved },
      faction: resolved.faction,
    });
    return resolved;
  },

  async update(id: string, data: Partial<TransactionCreateData>): Promise<ResolvedTransaction> {
    const oldRecord = await pb.collection('banking_transactions').getOne<Transaction>(id, { expand: 'nameId' }).catch(() => null);
    const record = await pb.collection('banking_transactions').update<Transaction>(id, data, {
      expand: 'nameId',
    });
    const resolved = resolveTransaction(record);
    logService.log({
      action: 'UPDATE',
      entity: 'transaction',
      entityId: id,
      details: { old: oldRecord ? resolveTransaction(oldRecord) : null, new: resolved },
      faction: resolved.faction,
    });
    return resolved;
  },

  async delete(id: string): Promise<void> {
    const oldRecord = await pb.collection('banking_transactions').getOne<Transaction>(id, { expand: 'nameId' }).catch(() => null);
    await pb.collection('banking_transactions').delete(id);
    if (oldRecord) {
      const resolved = resolveTransaction(oldRecord);
      logService.log({
        action: 'DELETE',
        entity: 'transaction',
        entityId: id,
        details: { old: resolved },
        faction: resolved.faction,
      });
    }
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
          eventId: e.record.eventId,
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
