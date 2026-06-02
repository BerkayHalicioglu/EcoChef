import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const PING_INTERVAL_MS = 15000;
const PING_TIMEOUT_MS = 4000;

async function backendCevapliyorMu(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/`, {
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': '1' },
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export type NetworkDurum = 'online' | 'backend_kapali' | 'cevrimdisi';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [durum, setDurum] = useState<NetworkDurum>('online');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const kontrol = async () => {
    const backendAcik = await backendCevapliyorMu();
    setIsOnline(backendAcik);
    if (backendAcik) {
      setDurum('online');
    } else {
      // Backend'e ulaşamıyorsa nedenini ayırt et:
      // navigator.onLine tarayıcı/RN ortamında güvenilir işaret
      const internetVar = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setDurum(internetVar ? 'backend_kapali' : 'cevrimdisi');
    }
  };

  const baslat = () => {
    kontrol();
    intervalRef.current = setInterval(kontrol, PING_INTERVAL_MS);
  };

  const durdur = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    baslat();

    const appStateHandler = (state: AppStateStatus) => {
      if (state === 'active') baslat();
      else durdur();
    };

    const sub = AppState.addEventListener('change', appStateHandler);
    return () => {
      durdur();
      sub.remove();
    };
  }, []);

  return { isOnline, durum };
}
