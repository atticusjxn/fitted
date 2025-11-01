import { useCallback, useState } from 'react';
import { fetchTradies, type TradieResponse } from '../services/mockApi.js';
import { postalCodeSchema, type Tradie } from '../types/index.js';

type Status = 'idle' | 'loading' | 'resolved' | 'empty' | 'error';

export function useTradieMatching() {
  const [tradies, setTradies] = useState<Tradie[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const executeLookup = useCallback(async (postalCode: string) => {
    const result = postalCodeSchema.safeParse(postalCode);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Enter a valid postcode');
      setStatus('error');
      return { status: 'invalid' as const };
    }

    setStatus('loading');
    setError(null);

    const response: TradieResponse = await fetchTradies(result.data);

    if (response.status === 'ok') {
      setTradies(response.tradies);
      setStatus('resolved');
      return { status: 'ok' as const, tradies: response.tradies };
    }

    if (response.status === 'empty') {
      setTradies([]);
      setStatus('empty');
      setError(response.message);
      return { status: 'empty' as const, message: response.message };
    }

    setTradies([]);
    setStatus('error');
    setError(response.message);
    return { status: 'error' as const, message: response.message };
  }, []);

  const reset = useCallback(() => {
    setTradies([]);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    tradies,
    status,
    error,
    executeLookup,
    reset
  };
}
