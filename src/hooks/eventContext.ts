import { createContext, useContext } from 'react';
import type { BankingEvent } from '../types';

interface EventContextType {
  events: BankingEvent[];
  activeEvent: BankingEvent | null;
  setActiveEventId: (id: string | null) => void;
  createEvent: (name: string, active?: boolean) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const EventContext = createContext<EventContextType | null>(null);

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEventContext must be used within EventProvider');
  return ctx;
}
