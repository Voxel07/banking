import pb from './pocketbase';
import type { BankingEvent } from '../types';

function parseFactions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string' && raw.trim()) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return [];
}

function hydrateEvent(record: BankingEvent & { factions?: unknown }): BankingEvent {
  return {
    ...record,
    factions: parseFactions(record.factions),
  };
}

export const eventService = {
  async getAll(): Promise<BankingEvent[]> {
    const records = await pb.collection('banking_events').getFullList<BankingEvent>({
      sort: '-created',
    });
    return records.map(hydrateEvent);
  },

  async create(name: string, active: boolean = false, factions: string[] = []): Promise<BankingEvent> {
    const record = await pb.collection('banking_events').create<BankingEvent>({
      name,
      active,
      factions: JSON.stringify(factions),
    });
    return hydrateEvent(record);
  },

  async update(id: string, data: Partial<Omit<BankingEvent, 'factions'> & { factions?: string[] }>): Promise<BankingEvent> {
    const payload: Record<string, unknown> = { ...data };
    if (data.factions !== undefined) {
      payload.factions = JSON.stringify(data.factions);
    }
    const record = await pb.collection('banking_events').update<BankingEvent>(id, payload);
    return hydrateEvent(record);
  },

  async delete(id: string): Promise<void> {
    await pb.collection('banking_events').delete(id);
  },

  subscribe(callback: (event: BankingEvent, action: string) => void): () => void {
    let cancelled = false;

    pb.collection('banking_events').subscribe<BankingEvent>('*', (e) => {
      if (!cancelled) callback(hydrateEvent(e.record), e.action);
    });

    return () => {
      cancelled = true;
      pb.collection('banking_events').unsubscribe('*');
    };
  },
};
