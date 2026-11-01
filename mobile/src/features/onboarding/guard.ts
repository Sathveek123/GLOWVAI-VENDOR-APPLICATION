/**
 * Onboarding needs a phone-verified session (the backend takes the phone from it).
 * Without one, send the seller to sign in instead of letting them fill a form that
 * cannot be submitted.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getSession, type VendorSession } from '../../services/session';

export function useRequireSession(): { ready: boolean; session: VendorSession | null } {
  const router = useRouter();
  const [state, setState] = useState<{ ready: boolean; session: VendorSession | null }>({ ready: false, session: null });

  useEffect(() => {
    let active = true;
    getSession().then(s => {
      if (!active) return;
      if (!s.token) {
        router.replace('/(auth)/login');
        return;
      }
      setState({ ready: true, session: s });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/** Goes back when there is history (keeps the previous step's values), otherwise opens `fallback`. */
export function goBackOr(router: ReturnType<typeof useRouter>, fallback: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as any);
}

/** True when a fetch failed before reaching the server (offline, DNS, CORS, server down). */
export function isNetworkError(e: any): boolean {
  return !!e && !('status' in e) && (e.name === 'TypeError' || /network|fetch/i.test(String(e.message)));
}
