import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, type MobileAuthSession, type User } from '../utils/api';

export type UserRole = 'citizen' | 'collector' | 'admin';

interface AuthContextType {
  userEmail: string | null;
  userPhone: string | null;
  userName: string | null;
  userId: number | null;
  userRole: UserRole;
  requestedRole: 'collector' | null;
  isLoading: boolean;
  isDemo: boolean;
  login: (session: MobileAuthSession) => Promise<void>;
  enterDemoMode: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserRole>;
}

const AuthContext = createContext<AuthContextType>({
  userEmail: null, userPhone: null, userName: null, userId: null, userRole: 'citizen', requestedRole: null, isLoading: true, isDemo: false,
  login: async () => {}, enterDemoMode: async () => {}, logout: async () => {}, refreshProfile: async () => 'citizen',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('citizen');
  const [requestedRole, setRequestedRole] = useState<'collector' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const applyProfile = useCallback((profile: User) => {
    setUserEmail(profile.email);
    setUserPhone(profile.phone ?? null);
    setUserName(profile.name);
    setUserId(profile.id);
    setUserRole(profile.role);
    setRequestedRole(profile.requestedRole ?? null);
    setIsDemo(false);
    void AsyncStorage.setItem('userProfile', JSON.stringify(profile));
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await api.getProfile();
    applyProfile(profile);
    return profile.role;
  }, [applyProfile]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [accessToken, refreshToken] = await Promise.all([
          SecureStore.getItemAsync('accessToken'),
          SecureStore.getItemAsync('refreshToken'),
        ]);
        api.restoreSessionTokens(accessToken, refreshToken);
        if (refreshToken) {
          const cachedProfile = await AsyncStorage.getItem('userProfile');
          if (active && cachedProfile) {
            try { applyProfile(JSON.parse(cachedProfile) as User); } catch { await AsyncStorage.removeItem('userProfile'); }
          }
          try {
            const profile = await api.getProfile();
            if (active) applyProfile(profile);
          } catch {
            // Keep the secure tokens and cached profile so temporary network issues do not sign the user out.
          }
        } else {
          await Promise.all([
            SecureStore.deleteItemAsync('identityToken'),
            SecureStore.deleteItemAsync('accessToken'),
            AsyncStorage.removeItem('userProfile'),
          ]);
        }
      } catch {
        if (active) {
          setUserEmail(null);
          setUserPhone(null);
          setUserName(null);
          setUserId(null);
          setUserRole('citizen');
          setRequestedRole(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [applyProfile]);

  const login = useCallback(async (session: MobileAuthSession) => {
    await api.setSessionTokens(session.accessToken, session.refreshToken);
    applyProfile(session.user);
  }, [applyProfile]);

  const enterDemoMode = useCallback(async () => {
    if (!__DEV__) return;
    await Promise.all([
      api.clearSessionTokens().catch(() => undefined),
      AsyncStorage.removeItem('userProfile').catch(() => undefined),
    ]);
    setUserEmail(null);
    setUserPhone(null);
    setUserName('Maya');
    setUserId(null);
    setUserRole('citizen');
    setRequestedRole(null);
    setIsDemo(true);
  }, []);

  const logout = useCallback(async () => {
    try { if (!isDemo) await api.logoutSession(); }
    finally {
      await api.clearSessionTokens();
      await AsyncStorage.removeItem('userProfile');
      setUserEmail(null);
      setUserPhone(null);
      setUserName(null);
      setUserId(null);
      setUserRole('citizen');
      setRequestedRole(null);
      setIsDemo(false);
    }
  }, [isDemo]);

  return (
    <AuthContext.Provider value={{ userEmail, userPhone, userName, userId, userRole, requestedRole, isLoading, isDemo, login, enterDemoMode, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
