import { act, renderHook } from '@testing-library/react-native';
import { useToast } from '@/hooks/use-toast';

describe('useToast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('başlangıçta gizli ve boş', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast.gorunur).toBe(false);
    expect(result.current.toast.mesaj).toBe('');
  });

  it('goster() çağrılınca toast görünür olur', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.goster('İşlem başarılı', 'basari'); });
    expect(result.current.toast.gorunur).toBe(true);
    expect(result.current.toast.mesaj).toBe('İşlem başarılı');
    expect(result.current.toast.tip).toBe('basari');
  });

  it('3 saniye sonra otomatik kapanır', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.goster('Test mesajı', 'bilgi'); });
    expect(result.current.toast.gorunur).toBe(true);
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.toast.gorunur).toBe(false);
  });

  it('varsayılan tip "bilgi" olur', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.goster('test'); });
    expect(result.current.toast.tip).toBe('bilgi');
  });

  it('ardışık çağrılarda son mesaj gösterilir ve timer sıfırlanır', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.goster('birinci', 'bilgi'); });
    act(() => { jest.advanceTimersByTime(1500); });
    act(() => { result.current.goster('ikinci', 'hata'); });
    // 1500ms geçmiş ama timer sıfırlandı, daha görünür olmalı
    act(() => { jest.advanceTimersByTime(1500); });
    expect(result.current.toast.gorunur).toBe(true);
    expect(result.current.toast.mesaj).toBe('ikinci');
    // Toplamda 3000ms geçince kapanmalı
    act(() => { jest.advanceTimersByTime(1500); });
    expect(result.current.toast.gorunur).toBe(false);
  });

  it('hata tipi doğru set edilir', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.goster('Bağlantı hatası', 'hata'); });
    expect(result.current.toast.tip).toBe('hata');
  });
});
