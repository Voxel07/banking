import pb from './pocketbase';
import type { Name, Faction } from '../types';

export const nameService = {
  async getAll(): Promise<Name[]> {
    return pb.collection('banking_names').getFullList<Name>({ sort: 'name' });
  },

  async createIfNotExists(name: string, faction: Faction): Promise<Name> {
    // Use PocketBase filter with single-quoted values
    const filter = `name = '${name.replace(/'/g, "''")}'`;
    try {
      const records = await pb.collection('banking_names').getList<Name>(1, 1, { filter });
      if (records.items.length > 0) {
        return records.items[0];
      }
    } catch {
      // If filter fails, fall through to create
    }
    return pb.collection('banking_names').create<Name>({ name, faction });
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
