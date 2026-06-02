import { useCallback, useRef, useState } from 'react';
import type { ToastTipi } from '@/components/Toast';

type ToastState = { mesaj: string; tip: ToastTipi; gorunur: boolean };

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ mesaj: '', tip: 'bilgi', gorunur: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goster = useCallback((mesaj: string, tip: ToastTipi = 'bilgi') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ mesaj, tip, gorunur: true });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, gorunur: false }));
    }, 3000);
  }, []);

  return { toast, goster };
}
