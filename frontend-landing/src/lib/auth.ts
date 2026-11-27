export interface VerifiedSession {
  name: string;
  email: string;
  role?: string;
  isVerified: boolean;
  isPro?: boolean;
  isAdmin?: boolean;
  plan?: string;
  avatar?: string;
  token: string;
}

export function clearStoredSession(): void {
  try {
    sessionStorage.removeItem('hea_session');
    localStorage.removeItem('hea_session');
    sessionStorage.removeItem('hea_token');
    localStorage.removeItem('hea_token');
  } catch {
    // ignore storage errors
  }
}

export function isJwtExpired(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return true;
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function getVerifiedSession(): VerifiedSession | null {
  try {
    const raw = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token =
      (parsed && parsed.token) ||
      sessionStorage.getItem('hea_token') ||
      localStorage.getItem('hea_token') ||
      '';
    if (
      !parsed ||
      !parsed.isVerified ||
      !parsed.email ||
      parsed.email === 'john@example.com' ||
      !token ||
      isJwtExpired(token)
    ) {
      clearStoredSession();
      return null;
    }
    return { ...parsed, token };
  } catch {
    clearStoredSession();
    return null;
  }
}
