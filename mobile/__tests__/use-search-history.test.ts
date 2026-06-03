import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { useSearchHistory } from '@/hooks/use-search-history';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

describe('useSearchHistory', () => {
  beforeEach(() => {
    (AsyncStorage as any).clear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
      clone: () => ({ json: () => Promise.resolve({}) }),
      headers: { get: () => null },
    });
  });

  it('başlangıçta boş geçmiş', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    expect(result.current.gecmis).toHaveLength(0);
    expect(result.current.sonBes).toHaveLength(0);
  });

  it('kaydet() aramayı geçmişe ekler', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.kaydet('tavuk', 'metin'); });
    expect(result.current.gecmis).toHaveLength(1);
    expect(result.current.gecmis[0].sorgu).toBe('tavuk');
    expect(result.current.gecmis[0].mod).toBe('metin');
  });

  it('aynı sorgu tekrar eklenince duplicate olmaz, başa alınır', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.kaydet('mercimek', 'metin'); });
    await act(async () => { await result.current.kaydet('domates', 'metin'); });
    await act(async () => { await result.current.kaydet('mercimek', 'metin'); });
    expect(result.current.gecmis).toHaveLength(2);
    expect(result.current.gecmis[0].sorgu).toBe('mercimek');
  });

  it('büyük/küçük harf duyarsız duplicate tespiti', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.kaydet('Tavuk', 'metin'); });
    await act(async () => { await result.current.kaydet('TAVUK', 'metin'); });
    expect(result.current.gecmis).toHaveLength(1);
  });

  it('boş sorgu eklenmez', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.kaydet('   ', 'metin'); });
    expect(result.current.gecmis).toHaveLength(0);
  });

  it('kaldir() kaydı siler', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.kaydet('pilav', 'metin'); });
    const id = result.current.gecmis[0].id;
    await act(async () => { await result.current.kaldir(id); });
    expect(result.current.gecmis).toHaveLength(0);
  });

  it('tumunuSil() tüm geçmişi temizler', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.kaydet('birinci', 'metin'); });
    await act(async () => { await result.current.kaydet('ikinci', 'metin'); });
    expect(result.current.gecmis).toHaveLength(2);
    await act(async () => { await result.current.tumunuSil(); });
    expect(result.current.gecmis).toHaveLength(0);
  });

  it('sonBes sadece metin modundaki ilk 5 aramayı döner', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    for (let i = 1; i <= 7; i++) {
      await act(async () => { await result.current.kaydet(`tarif${i}`, 'metin'); });
    }
    expect(result.current.sonBes).toHaveLength(5);
  });

  it("AsyncStorage'dan önceki geçmişi yükler", async () => {
    const kaydedilmis = [
      { id: '1', sorgu: 'önceden kaydedilmiş', mod: 'metin', tarih: '2024-01-01' },
    ];
    await AsyncStorage.setItem('ecochef_arama_gecmisi_misafir', JSON.stringify(kaydedilmis));
    const { result } = renderHook(() => useSearchHistory(), { wrapper });
    await act(async () => {});
    expect(result.current.gecmis[0].sorgu).toBe('önceden kaydedilmiş');
  });
});
