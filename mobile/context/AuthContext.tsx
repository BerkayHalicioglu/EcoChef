import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'ecochef_token';
const USER_KEY = 'ecochef_user';

function hataMesaji(detail: any, varsayilan: string): string {
  if (!detail) return varsayilan;
  if (typeof detail === 'string') return detail;
  // Pydantic v2 validation error array: [{type, loc, msg, input, ctx}, ...]
  if (Array.isArray(detail)) {
    return detail.map((e: any) => e.msg ?? e.message ?? String(e)).join(', ');
  }
  return varsayilan;
}

const API_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '1',
};

type AuthState = {
  token: string | null;
  kullaniciAdi: string | null;
  diyetTercihleri: string[];
  yukleniyor: boolean;
  girisYap: (kullaniciAdi: string, sifre: string) => Promise<string | null>;
  kayitOl: (kullaniciAdi: string, sifre: string) => Promise<string | null>;
  cikisYap: () => Promise<void>;
  profilGuncelle: (tercihler: string[]) => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [kullaniciAdi, setKullaniciAdi] = useState<string | null>(null);
  const [diyetTercihleri, setDiyetTercihleri] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    (async () => {
      const kaydedilen = await SecureStore.getItemAsync(TOKEN_KEY);
      const kaydedilenUser = await SecureStore.getItemAsync(USER_KEY);
      if (kaydedilen && kaydedilenUser) {
        setToken(kaydedilen);
        setKullaniciAdi(kaydedilenUser);
        // Token'ı doğrula; expire olmuşsa otomatik temizle
        fetch(`${BASE_URL}/auth/me`, {
          headers: { ...API_HEADERS, Authorization: `Bearer ${kaydedilen}` },
        })
          .then(async r => {
            if (r.status === 401) {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              await SecureStore.deleteItemAsync(USER_KEY);
              setToken(null);
              setKullaniciAdi(null);
              return null;
            }
            return r.ok ? r.json() : null;
          })
          .then(data => { if (data?.dietary_preferences) setDiyetTercihleri(data.dietary_preferences); })
          .catch(() => {});
      }
      setYukleniyor(false);
    })();
  }, []);

  const _tokenKaydet = async (t: string, u: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    await SecureStore.setItemAsync(USER_KEY, u);
    setToken(t);
    setKullaniciAdi(u);
  };

  const profilGuncelle = async (tercihler: string[]): Promise<string | null> => {
    if (!token) return 'Giriş yapılmamış.';
    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dietary_preferences: tercihler }),
      });
      const data = await res.json();
      if (!res.ok) return hataMesaji(data.detail, 'Güncellenemedi.');
      setDiyetTercihleri(data.dietary_preferences ?? []);
      return null;
    } catch {
      return 'Sunucuya ulaşılamadı.';
    }
  };

  const girisYap = async (kadi: string, sifre: string): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ kullanici_adi: kadi, sifre }),
      });
      const data = await res.json();
      if (!res.ok) return hataMesaji(data.detail, 'Giriş başarısız.');
      await _tokenKaydet(data.access_token, data.kullanici_adi);
      return null;
    } catch {
      return 'Sunucuya ulaşılamadı.';
    }
  };

  const kayitOl = async (kadi: string, sifre: string): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ kullanici_adi: kadi, sifre }),
      });
      const data = await res.json();
      if (!res.ok) return hataMesaji(data.detail, 'Kayıt başarısız.');
      await _tokenKaydet(data.access_token, data.kullanici_adi);
      return null;
    } catch {
      return 'Sunucuya ulaşılamadı.';
    }
  };

  // Uygulama arka plandan ön plana geldiğinde token süresi kontrol edilir
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && token) {
        fetch(`${BASE_URL}/auth/me`, {
          headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        })
          .then(async (r) => {
            if (r.status === 401) {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              await SecureStore.deleteItemAsync(USER_KEY);
              setToken(null);
              setKullaniciAdi(null);
            }
          })
          .catch(() => {});
      }
    });
    return () => sub.remove();
  }, [token]);

  const cikisYap = async () => {
    const mevcutToken = token;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setKullaniciAdi(null);
    if (mevcutToken) {
      fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${mevcutToken}` },
      }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{ token, kullaniciAdi, diyetTercihleri, yukleniyor, girisYap, kayitOl, cikisYap, profilGuncelle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  return ctx;
}
