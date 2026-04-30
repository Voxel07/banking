import pb from './pocketbase';
import type { FactionConfig, Faction } from '../types';

export const factionService = {
  async getAll(): Promise<FactionConfig[]> {
    return pb.collection('banking_factions').getFullList<FactionConfig>({ sort: 'faction' });
  },

  async upsert(faction: Faction, startingValue: number): Promise<FactionConfig> {
    const filter = `faction = '${faction}'`;
    try {
      const records = await pb.collection('banking_factions').getList<FactionConfig>(1, 1, { filter });
      if (records.items.length > 0) {
        return pb.collection('banking_factions').update<FactionConfig>(records.items[0].id, { startingValue });
      }
    } catch {
      // fall through
    }
    return pb.collection('banking_factions').create<FactionConfig>({ faction, startingValue });
  },

  subscribe(callback: () => void): () => void {
    let cancelled = false;
    pb.collection('banking_factions').subscribe('*', () => {
      if (!cancelled) callback();
    });
    return () => {
      cancelled = true;
      pb.collection('banking_factions').unsubscribe('*');
    };
  },
};
