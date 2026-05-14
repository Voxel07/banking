import pb from './pocketbase';
import type { ResolvedTransfer, TransferCreateData, BankingTransfer, Transaction } from '../types';
import { logService } from './logService';

function resolveTransfer(tx: BankingTransfer): ResolvedTransfer {
  const senderExpanded = tx.expand?.senderId;
  const receiverExpanded = tx.expand?.receiverId;
  
  return {
    id: tx.id,
    time: tx.time,
    amount: tx.amount,
    senderName: senderExpanded?.name ?? 'Unknown',
    senderFaction: senderExpanded?.faction ?? 'Unknown',
    receiverName: receiverExpanded?.name ?? 'Unknown',
    receiverFaction: receiverExpanded?.faction ?? 'Unknown',
    senderId: tx.senderId,
    receiverId: tx.receiverId,
    eventId: tx.eventId,
    tracked: tx.tracked,
  };
}

export const transferService = {
  async getAll(eventId?: string | null): Promise<ResolvedTransfer[]> {
    const filter = eventId ? `eventId = "${eventId}"` : '';
    const records = await pb.collection('banking_transfers').getFullList<BankingTransfer>({
      sort: '-time',
      expand: 'senderId,receiverId',
      filter,
      requestKey: null,
    });
    return records.map(resolveTransfer);
  },

  async create(data: TransferCreateData): Promise<ResolvedTransfer> {
    const record = await pb.collection('banking_transfers').create<BankingTransfer>(data, {
      expand: 'senderId,receiverId',
    });
    
    // Create corresponding transactions to actually move the funds
    try {
      await pb.collection('banking_transactions').create({
        time: data.time,
        amount: -data.amount, // Deduct from sender
        nameId: data.senderId,
        eventId: data.eventId || null,
        transferId: record.id,
        tracked: data.tracked,
      });
      await pb.collection('banking_transactions').create({
        time: data.time,
        amount: data.amount, // Add to receiver
        nameId: data.receiverId,
        eventId: data.eventId || null,
        transferId: record.id,
        tracked: data.tracked,
      });
    } catch (err) {
      console.error('Failed to create balancing transactions for transfer:', err);
    }

    const resolved = resolveTransfer(record);
    logService.log({
      action: 'CREATE',
      entity: 'transfer',
      entityId: record.id,
      details: { new: resolved },
      faction: resolved.senderFaction,
    });
    return resolved;
  },

  async update(id: string, data: { amount?: number; tracked?: boolean }): Promise<ResolvedTransfer> {
    const oldTransfer = await pb.collection('banking_transfers').getOne<BankingTransfer>(id, { expand: 'senderId,receiverId' });
    const record = await pb.collection('banking_transfers').update<BankingTransfer>(id, data, {
      expand: 'senderId,receiverId',
    });

    try {
      const txs = await pb.collection('banking_transactions').getFullList<Transaction>({
        filter: `transferId = "${id}"`,
        requestKey: null,
      });

      for (const tx of txs) {
        if (tx.nameId === oldTransfer.senderId) {
          await pb.collection('banking_transactions').update(tx.id, {
            amount: data.amount !== undefined ? -data.amount : tx.amount,
            tracked: data.tracked !== undefined ? data.tracked : tx.tracked,
          });
        } else if (tx.nameId === oldTransfer.receiverId) {
          await pb.collection('banking_transactions').update(tx.id, {
            amount: data.amount !== undefined ? data.amount : tx.amount,
            tracked: data.tracked !== undefined ? data.tracked : tx.tracked,
          });
        }
      }
    } catch (err) {
      console.error('Failed to update balancing transactions for transfer:', err);
    }

    const resolved = resolveTransfer(record);
    logService.log({
      action: 'UPDATE',
      entity: 'transfer',
      entityId: id,
      details: { old: resolveTransfer(oldTransfer), new: resolved },
      faction: resolved.senderFaction,
    });
    return resolved;
  },

  async delete(id: string): Promise<void> {
    // IMPORTANT: Fetch the transfer record and linked transactions BEFORE deleting the transfer.
    // If we delete the transfer first, PocketBase may null out the transferId relation on the
    // linked transactions, making the filter query return 0 results and balances never reverting.
    const oldRecord = await pb.collection('banking_transfers')
      .getOne<BankingTransfer>(id, { expand: 'senderId,receiverId' })
      .catch(() => null);

    // Step 1: delete the balancing transactions first while the relation is still intact
    try {
      const txs = await pb.collection('banking_transactions').getFullList<Transaction>({
        filter: `transferId = "${id}"`,
        requestKey: null,
      });
      for (const tx of txs) {
        await pb.collection('banking_transactions').delete(tx.id);
      }
    } catch (err) {
      console.error('Failed to delete balancing transactions for transfer:', err);
    }

    // Step 2: now delete the transfer record itself
    await pb.collection('banking_transfers').delete(id);

    if (oldRecord) {
      const resolved = resolveTransfer(oldRecord);
      logService.log({
        action: 'DELETE',
        entity: 'transfer',
        entityId: id,
        details: { old: resolved },
        faction: resolved.senderFaction,
      });
    }
  },

  subscribe(callback: (transfer: ResolvedTransfer, action: string) => void): () => void {
    let cancelled = false;

    pb.collection('banking_transfers').subscribe<BankingTransfer>('*', async (e) => {
      if (cancelled) return;
      if (e.action === 'delete') {
        callback({
          id: e.record.id,
          time: e.record.time,
          amount: e.record.amount,
          senderName: '',
          senderFaction: 'Unknown',
          receiverName: '',
          receiverFaction: 'Unknown',
          senderId: e.record.senderId,
          receiverId: e.record.receiverId,
          eventId: e.record.eventId,
          tracked: e.record.tracked,
        }, e.action);
        return;
      }
      try {
        const full = await pb.collection('banking_transfers').getOne<BankingTransfer>(e.record.id, {
          expand: 'senderId,receiverId',
        });
        if (!cancelled) callback(resolveTransfer(full), e.action);
      } catch {
        if (!cancelled) callback(resolveTransfer(e.record), e.action);
      }
    });

    return () => {
      cancelled = true;
      pb.collection('banking_transfers').unsubscribe('*');
    };
  },
};
