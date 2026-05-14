import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './authContext';
import pb from '../services/pocketbase';
import type { User } from '../types';
import { logService } from '../services/logService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      return {
        id: pb.authStore.model.id,
        name: pb.authStore.model.name || pb.authStore.model.username,
        role: pb.authStore.model.role || 'player',
        faction: pb.authStore.model.faction as string | undefined,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, model) => {
      if (token && model) {
        setUser({
          id: model.id,
          name: model.name || model.username,
          role: model.role || 'player',
          faction: model.faction as string | undefined,
        });
      } else {
        setUser(null);
      }
    });
    
    setLoading(false);
    return () => unsub();
  }, []);

  const loginOAuth = useCallback(async () => {
    try {
      const authData = await pb.collection('users').authWithOAuth2({ provider: 'oidc' });
      await logService.log({
        action: 'LOGIN',
        entity: 'user',
        entityId: authData.record.id,
        details: { method: 'oauth2' },
        faction: authData.record.faction,
      });
    } catch (err) {
      console.error('OAuth Login failed:', err);
    }
  }, []);

  const logout = useCallback(() => {
    if (pb.authStore.model) {
      logService.log({
        action: 'LOGOUT',
        entity: 'user',
        entityId: pb.authStore.model.id,
      }).then(() => {
        pb.authStore.clear();
      }).catch(() => {
        pb.authStore.clear();
      });
    } else {
      pb.authStore.clear();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
