import pb from './pocketbase';
import type { RecordModel } from 'pocketbase';

export type LogAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE';
export type LogEntity = 'transaction' | 'transfer' | 'name' | 'faction' | 'event' | 'user';

export interface LogEntry {
  action: LogAction;
  entity: LogEntity;
  entityId?: string;
  details?: Record<string, any>;
  faction?: string;
  userId?: string;
}

export interface ResolvedLog extends RecordModel, LogEntry {
  userName?: string;
  userRole?: string;
}

class LogService {
  async log(entry: LogEntry): Promise<void> {
    try {
      const authModel = pb.authStore.model;
      const payload = {
        ...entry,
        userId: authModel?.id,
      };
      // If faction isn't provided but user has a faction, we can potentially default to it, 
      // but usually the entity's faction is what matters for 'banker' visibility.
      // If we don't pass a faction, a banker might not see it unless we set it.
      if (!payload.faction && authModel?.faction) {
        payload.faction = authModel.faction;
      }

      await pb.collection('banking_logs').create(payload);
    } catch (err) {
      console.error('Failed to write audit log', err);
    }
  }

  async getAll(): Promise<ResolvedLog[]> {
    const records = await pb.collection('banking_logs').getFullList({
      sort: 'created',
      expand: 'userId',
      requestKey: null,
    });
    return records.map(this.resolveLog);
  }

  subscribe(callback: (log: ResolvedLog, action: 'create' | 'update' | 'delete') => void) {
    pb.collection('banking_logs').subscribe('*', (e) => {
      const log = this.resolveLog(e.record);
      callback(log, e.action as any);
    }, { expand: 'userId' });

    return () => {
      pb.collection('banking_logs').unsubscribe('*');
    };
  }

  private resolveLog(record: RecordModel): ResolvedLog {
    const user = record.expand?.userId;
    return {
      ...record,
      action: record.action as LogAction,
      entity: record.entity as LogEntity,
      userName: user?.name || user?.username || 'Unknown',
      userRole: user?.role || '',
    } as ResolvedLog;
  }
}

export const logService = new LogService();
