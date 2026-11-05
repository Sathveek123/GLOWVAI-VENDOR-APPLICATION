/**
 * Route guards for sign-in and onboarding screens.
 *
 * Onboarding needs a phone-verified session (the backend takes the phone from it).
 * Without one, the seller is sent to sign in instead of filling a form that cannot be
 * submitted. A seller whose application is already submitted, approved or suspended is
 * sent to the status screen (or the dashboard) instead of re-opening the form steps.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getSession, type VendorSession } from '../../services/session';
import { getCachedStatus, isNetworkError, STATUS_ROUTE, HOME_ROUTE, LOGIN_ROUTE } from './status';

export { isNetworkError };

export function useRequireSession(): { ready: boolean; session: VendorSession | null } {
  const router = useRouter();
  const [state, setState] = useState<{ ready: boolean; session: VendorSession | null }>({ ready: false, session: null });

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await getSession();
      if (!active) return;
      if (!s.token) {
        router.replace(LOGIN_ROUTE);
        return;
      }
      if (s.vendorId) {
        // Only rejected or "more information needed" applications can be edited.
        const status = await getCachedStatus();
        if (!active) return;
        if (status === 'APPROVED') {
          router.replace(HOME_ROUTE);
          return;
        }
        if (status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'SUSPENDED') {
          router.replace(STATUS_ROUTE);
          return;
        }
      }
      setState({ ready: true, session: s });
    })();
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
