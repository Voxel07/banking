import pb from './pocketbase';
import type { Name, Faction } from '../types';
import { logService } from './logService';

export const nameService = {
  async getAll(): Promise<Name[]> {
    return await pb.collection('banking_names').getFullList<Name>({
      sort: 'name',
      requestKey: null,
    });
  },

  async createIfNotExists(name: string, faction: Faction): Promise<Name> {
    const filter = `name = '${name.replace(/'/g, "''")}'`;
    try {
      const records = await pb.collection('banking_names').getList<Name>(1, 1, { filter });
      if (records.items.length > 0) {
        return records.items[0];
      }
    } catch {
      // fall through to create
    }
    const record = await pb.collection('banking_names').create<Name>({ name, faction });
    logService.log({
      action: 'CREATE',
      entity: 'name',
      entityId: record.id,
      details: { new: record },
      faction: record.faction,
    });
    return record;
  },

  async findByNfcId(nfcId: string): Promise<Name | null> {
    try {
      const records = await pb.collection('banking_names').getList<Name>(1, 1, { filter: `nfcId = "${nfcId}"` });
      return records.items[0] || null;
    } catch {
      return null;
    }
  },

  async update(id: string, name: string): Promise<Name> {
    const oldRecord = await pb.collection('banking_names').getOne<Name>(id).catch(() => null);
    const record = await pb.collection('banking_names').update<Name>(id, { name });
    logService.log({
      action: 'UPDATE',
      entity: 'name',
      entityId: id,
      details: { old: oldRecord, new: record },
      faction: record.faction,
    });
    return record;
  },

  subscribe(callback: () => void): () => void {
    let cancelled = false;
    pb.collection('banking_names').subscribe('*', () => {
      if (!cancelled) callback();
    });
    return () => {
      cancelled = true;
      pb.collection('banking_names').unsubscribe('*');
    };
  },
};
