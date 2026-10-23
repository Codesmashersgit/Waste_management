import * as SecureStore from 'expo-secure-store';
import type { UserRole } from '../contexts/AuthContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export type User = { id: number; email: string | null; name: string; role: UserRole; requestedRole?: 'collector' | null; phone?: string | null };
export type MobileAuthSession = { accessToken: string; refreshToken: string; expiresIn: number; user: User };
export type WasteReport = {
  id: number; location: string; latitude?: number | null; longitude?: number | null;
  wasteType: string; amount: string; status: string; date?: string; createdAt?: string;
  collectorId?: number | null; collectorName?: string | null; collectorPhone?: string | null;
  collectorLatitude?: number | null; collectorLongitude?: number | null; collectorLastLocationAt?: string | null;
  imageUrl?: string | null; saleRevenue?: number | null; soldAt?: string | null;
};
export type Leader = { rank?: number; name: string; points: number; avatar?: string };
export type Transaction = { id: number; type: string; amount: number; description: string; date: string };
export type MobileReferralInfo = { code: string; shareUrl: string; rewardPoints: number };
export type WasteVerification = {
  isWaste: boolean;
  wasteTypes: string[];
  estimatedAmount: string;
  confidence: number;
  notes: string;
  verificationToken: string;
};
export type OtpVerification = { verified: true; needsProfile: true; profileSetupToken: string; phone: string } | ({ verified: true; needsProfile: false } & MobileAuthSession);

type ApiErrorBody = { error?: unknown };

function errorMessage(body: ApiErrorBody | null, status: number) {
  return typeof body?.error === 'string' ? body.error : `WasteChain service returned ${status}.`;
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    if (!BASE_URL || !refreshToken) return false;
    try {
      const response = await fetch(`${BASE_URL}/api/mobile/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (response.status === 401) {
        accessToken = null;
        refreshToken = null;
        await Promise.all([SecureStore.deleteItemAsync('accessToken'), SecureStore.deleteItemAsync('refreshToken')]);
        return false;
      }
      if (!response.ok) return false;
      const session = await response.json() as MobileAuthSession;
      accessToken = session.accessToken;
      refreshToken = session.refreshToken;
      await Promise.all([
        SecureStore.setItemAsync('accessToken', session.accessToken),
        SecureStore.setItemAsync('refreshToken', session.refreshToken),
      ]);
      return true;
    } catch (error) {
      console.warn('WasteChain session refresh failed:', error);
      return false;
    }
  })();
  try { return await refreshInFlight; }
  finally { refreshInFlight = null; }
}

async function send<T>(path: string, init?: RequestInit): Promise<{ response: Response; value: T | null }> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json', 'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    console.warn('WasteChain API request failed:', error);
    throw new Error('Could not reach WasteChain. Check your connection and API URL.');
  }
  if (response.status === 204) return { response, value: null };
  const value = await response.json().catch(() => null) as T | null;
  return { response, value };
}

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!BASE_URL) return null;
  let result = await send<T>(path, init);
  const isPublicAuth = path.startsWith('/api/mobile/auth/');
  if (result.response.status === 401 && !isPublicAuth && refreshToken && await refreshSession()) {
    result = await send<T>(path, init);
  }
  if (!result.response.ok) throw new Error(errorMessage(result.value as ApiErrorBody | null, result.response.status));
  return result.value;
}

export const api = {
  get isConfigured() { return Boolean(BASE_URL); },
  get adminDashboardUrl() { return BASE_URL ? `${BASE_URL}/admin` : null; },
  restoreSessionTokens: (access: string | null, refresh: string | null) => {
    accessToken = access;
    refreshToken = refresh;
  },
  setSessionTokens: async (access: string, refresh: string) => {
    accessToken = access;
    refreshToken = refresh;
    await Promise.all([
      SecureStore.setItemAsync('accessToken', access),
      SecureStore.setItemAsync('refreshToken', refresh),
      SecureStore.deleteItemAsync('identityToken'),
    ]);
  },
  clearSessionTokens: async () => {
    accessToken = null;
    refreshToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
      SecureStore.deleteItemAsync('identityToken'),
    ]);
  },
  requestOtp: async (phone: string) => {
    const result = await request<{ success: boolean; phone: string; retryAfter: number; developmentCode?: string }>('/api/mobile/auth/request-otp', {
      method: 'POST', body: JSON.stringify({ phone }),
    });
    if (!result) throw new Error('Account service is not configured.');
    return result;
  },
  verifyOtp: async (phone: string, code: string) => {
    const result = await request<OtpVerification>('/api/mobile/auth/verify-otp', {
      method: 'POST', body: JSON.stringify({ phone, code }),
    });
    if (!result) throw new Error('Account service is not configured.');
    return result;
  },
  completePhoneProfile: async (profileSetupToken: string, name: string, referralCode?: string, requestedRole: UserRole = 'citizen') => {
    const result = await request<MobileAuthSession>('/api/mobile/auth/complete-profile', {
      method: 'POST', body: JSON.stringify({ profileSetupToken, name, referralCode, requestedRole }),
    });
    if (!result) throw new Error('Account service is not configured.');
    return result;
  },
  logoutSession: async () => {
    if (!BASE_URL || !refreshToken) return;
    try {
      await fetch(`${BASE_URL}/api/mobile/auth/logout`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Local sign-out still completes when the device is offline.
    }
  },
  getProfile: async () => {
    const profile = await request<User>('/api/mobile/user');
    if (!profile) throw new Error('Could not load account profile.');
    return profile;
  },
  requestCollectorAccess: async () => {
    const result = await request<User>('/api/mobile/user', { method: 'PATCH', body: JSON.stringify({ requestCollectorAccess: true }) });
    if (!result) throw new Error('Account service is not configured.');
    return result;
  },
  updateProfile: async (payload: { name?: string }) => {
    const profile = await request<User>('/api/mobile/user', { method: 'PATCH', body: JSON.stringify(payload) });
    if (!profile) throw new Error('Could not save your profile. Please try again.');
    return profile;
  },
  getReports: async () => (await request<WasteReport[]>('/api/mobile/reports?limit=20')) ?? [],
  verifyWaste: async (payload: { imageBase64: string; mimeType: string; selectedTypes: string[]; language: 'en' | 'hi' }) => {
    if (!BASE_URL) throw new Error('Verification service is not configured.');
    const result = await request<WasteVerification>('/api/mobile/verify', { method: 'POST', body: JSON.stringify(payload) });
    if (!result) throw new Error('Verification service returned no result.');
    return result;
  },
  submitReport: async (payload: { location: string; latitude: number; longitude: number; wasteType: string; amount: string; details?: string; imageBase64?: string; mimeType?: string; verificationResult?: WasteVerification }) => {
    const { details, imageBase64, mimeType, verificationResult, ...report } = payload;
    const result = await request<WasteReport>('/api/mobile/reports', { method: 'POST', body: JSON.stringify({
      ...report,
      imageUrl: imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined,
      verificationResult: JSON.stringify({ ...(verificationResult ?? {}), ...(details ? { details } : {}) }),
    }) });
    if (!result) throw new Error('Could not submit your report. Please try again.');
    return result;
  },
  getTasks: async () => (await request<WasteReport[]>('/api/mobile/collect?limit=20')) ?? [],
  setCollectorAvailability: async (available: boolean, latitude?: number, longitude?: number) => {
    return request<{ success: boolean; assignedCount: number }>('/api/mobile/collect', { method: 'PUT', body: JSON.stringify({ available, latitude, longitude }) });
  },
  updateCollectorLocation: async (latitude: number, longitude: number) => {
    return request<{ success: boolean }>('/api/mobile/collect', { method: 'PATCH', body: JSON.stringify({ latitude, longitude }) });
  },
  collectTask: async (reportId: number) => {
    const result = await request<{ success: boolean }>('/api/mobile/collect', { method: 'POST', body: JSON.stringify({ action: 'collect', reportId }) });
    if (!result) throw new Error('Could not update this collection.');
    return result;
  },
  declineTask: async (reportId: number) => {
    const result = await request<{ success: boolean }>('/api/mobile/collect', { method: 'POST', body: JSON.stringify({ action: 'decline', reportId }) });
    if (!result) throw new Error('Could not decline this task.');
    return result;
  },
  recordSale: async (reportId: number, saleRevenue: number) => {
    const result = await request<{ success: boolean }>('/api/mobile/collect', { method: 'POST', body: JSON.stringify({ action: 'sale', reportId, saleRevenue }) });
    if (!result) throw new Error('Could not record this sale.');
    return result;
  },
  getRewards: async () => {
    const result = await request<{ balance: number; transactions: Transaction[] }>('/api/mobile/rewards');
    if (!result) throw new Error('Points service is not configured.');
    return result;
  },
  getReferralInfo: async () => {
    const result = await request<MobileReferralInfo>('/api/mobile/referral');
    if (!result) throw new Error('Referral service is not configured.');
    return result;
  },
  getLeaderboard: async () => {
    const result = await request<Leader[]>('/api/mobile/leaderboard?limit=20');
    if (!result) throw new Error('Community service is not configured.');
    return result;
  },
};
