import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { EventContext } from './eventContext';
import { eventService } from '../services/eventService';
import type { BankingEvent } from '../types';

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<BankingEvent[]>([]);
  const [activeEventId, setActiveEventIdState] = useState<string | null>(() => {
    return localStorage.getItem('activeEventId') || null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    eventService.getAll().then((data) => {
      if (!cancelled) {
        setEvents(data);
        setError(null);
        setLoading(false);
        
        // Auto-select active event if none selected and there is one marked active in DB
        if (!activeEventId && data.length > 0) {
          const dbActive = data.find(e => e.active);
          if (dbActive) {
            setActiveEventIdState(dbActive.id);
            localStorage.setItem('activeEventId', dbActive.id);
          }
        }
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setLoading(false);
      }
    });

    const unsub = eventService.subscribe((ev, action) => {
      if (cancelled) return;
      setEvents((prev) => {
        switch (action) {
          case 'create': return [ev, ...prev];
          case 'update': return prev.map((e) => (e.id === ev.id ? ev : e));
          case 'delete': {
            if (activeEventId === ev.id) {
              setActiveEventIdState(null);
              localStorage.removeItem('activeEventId');
            }
            return prev.filter((e) => e.id !== ev.id);
          }
          default: return prev;
        }
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [activeEventId]);

  const setActiveEventId = useCallback((id: string | null) => {
    setActiveEventIdState(id);
    if (id) {
      localStorage.setItem('activeEventId', id);
    } else {
      localStorage.removeItem('activeEventId');
    }
  }, []);

  const createEvent = useCallback(async (name: string, active: boolean = false) => {
    const newEvent = await eventService.create(name, active);
    if (active || !activeEventId) {
      setActiveEventId(newEvent.id);
    }
  }, [activeEventId, setActiveEventId]);

  const activeEvent = events.find(e => e.id === activeEventId) || null;

  return (
    <EventContext.Provider value={{ events, activeEvent, setActiveEventId, createEvent, loading, error }}>
      {children}
    </EventContext.Provider>
  );
}
