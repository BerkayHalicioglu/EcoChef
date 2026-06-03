import * as SecureStore from 'expo-secure-store';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

const okFetch = (body: object) => ({
  ok: true, status: 200,
  json: () => Promise.resolve(body),
  clone: () => ({ json: () => Promise.resolve(body) }),
  headers: { get: () => null },
});

const failFetch = (status: number, body: object) => ({
  ok: false, status,
  json: () => Promise.resolve(body),
  clone: () => ({ json: () => Promise.resolve(body) }),
  headers: { get: () => null },
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (global.fetch as jest.Mock).mockResolvedValue(okFetch({}));
  });

  it('başlangıçta token ve kullanıcı adı null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.token).toBeNull();
    expect(result.current.kullaniciAdi).toBeNull();
  });

  it('girisYap başarılı: token ve kullanıcıAdı set edilir', async () => {
    // Token yok → /auth/me çağrılmaz → tek mock: login yanıtı
    (global.fetch as jest.Mock).mockResolvedValue(
      okFetch({ access_token: 'test-token-123', kullanici_adi: 'berkay' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let hata: string | null = 'bekliyor';
    await act(async () => { hata = await result.current.girisYap('berkay', 'sifre123'); });

    expect(hata).toBeNull();
    expect(result.current.token).toBe('test-token-123');
    expect(result.current.kullaniciAdi).toBe('berkay');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ecochef_token', 'test-token-123');
  });

  it('girisYap hata döndürürse hata mesajı alınır', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      failFetch(401, { detail: 'Hatalı şifre' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let hata: string | null = null;
    await act(async () => { hata = await result.current.girisYap('berkay', 'yanlis'); });

    expect(hata).toBe('Hatalı şifre');
    expect(result.current.token).toBeNull();
  });

  it('girisYap ağ hatası: sunucuya ulaşılamadı mesajı döner', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let hata: string | null = null;
    await act(async () => { hata = await result.current.girisYap('berkay', 'sifre'); });

    expect(hata).toBe('Sunucuya ulaşılamadı.');
  });

  it('kayitOl başarılı: token set edilir', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okFetch({ access_token: 'yeni-token', kullanici_adi: 'yenikullanici' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let hata: string | null = 'bekliyor';
    await act(async () => { hata = await result.current.kayitOl('yenikullanici', 'sifre'); });

    expect(hata).toBeNull();
    expect(result.current.token).toBe('yeni-token');
  });

  it('cikisYap token ve kullanıcıAdını temizler', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okFetch({ access_token: 'tok', kullanici_adi: 'berkay' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.girisYap('berkay', 'sifre'); });
    expect(result.current.token).toBeTruthy();

    await act(async () => { await result.current.cikisYap(); });

    expect(result.current.token).toBeNull();
    expect(result.current.kullaniciAdi).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ecochef_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ecochef_user');
  });

  it("SecureStore'da kayıtlı token varsa açılışta otomatik yüklenir", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'ecochef_token') return Promise.resolve('kayitli-token');
      if (key === 'ecochef_user') return Promise.resolve('kayitlikullanici');
      return Promise.resolve(null);
    });
    // /auth/me başarılı
    (global.fetch as jest.Mock).mockResolvedValue(
      okFetch({ dietary_preferences: ['vegan'] })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.token).toBe('kayitli-token');
    expect(result.current.kullaniciAdi).toBe('kayitlikullanici');
    expect(result.current.diyetTercihleri).toEqual(['vegan']);
  });

  it('kayıtlı token 401 dönerse otomatik temizlenir', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'ecochef_token') return Promise.resolve('suresi-dolmus');
      if (key === 'ecochef_user') return Promise.resolve('kullanici');
      return Promise.resolve(null);
    });
    (global.fetch as jest.Mock).mockResolvedValue(failFetch(401, {}));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => {}); // /auth/me fetch tamamlanmasını bekle

    expect(result.current.token).toBeNull();
  });
});
