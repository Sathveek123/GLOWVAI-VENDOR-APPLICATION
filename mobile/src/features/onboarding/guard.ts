/**
 * Route guard for the onboarding form steps.
 *
 * The form needs a signed-in vendor with a verified email whose store state still allows an
 * application to be (re)submitted: NO_APPLICATION, SUBMITTED, DOCUMENTS_REQUESTED or REJECTED.
 * Anyone else is sent where they belong (sign in, verify email, status screen or home).
 * When GlowVai can't be reached the screen gets friendly copy and a Retry, never a blank page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import type { User } from 'firebase/auth';
import { loadVendorMe, type MeResponse } from '../../services/vendorApi/account';
import { VendorApiError, friendlyError } from '../../services/vendorApi/http';
import { authReady, signOutVendor } from '../../services/session';
import { claimDrafts } from './draft';
import { canEditApplication, routeForState, LOGIN_ROUTE, VERIFY_ROUTE } from './status';

export type OnboardingGate =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'ready'; me: MeResponse; user: User };

export function useOnboardingGate(): OnboardingGate {
  const router = useRouter();
  const [gate, setGate] = useState<OnboardingGate>({ status: 'loading' });
  const active = useRef(true);

  const run = useCallback(async () => {
    setGate({ status: 'loading' });
    const user = await authReady();
    if (!active.current) return;
    if (!user) return router.replace(LOGIN_ROUTE);
    if (!user.emailVerified) return router.replace(VERIFY_ROUTE);
    await claimDrafts(user.uid);
    try {
      const me = await loadVendorMe();
      if (!active.current) return;
      if (!canEditApplication(me.vendor.state)) return router.replace(routeForState(me.vendor.state) as never);
      setGate({ status: 'ready', me, user });
    } catch (e) {
      if (!active.current) return;
      if (e instanceof VendorApiError && e.code === 'UNAUTHENTICATED') {
        await signOutVendor();
        return router.replace(LOGIN_ROUTE);
      }
      setGate({ status: 'error', message: friendlyError(e), retry: () => run() });
    }
  }, [router]);

  useEffect(() => {
    active.current = true;
    run();
    return () => {
      active.current = false;
    };
  }, []);

  return gate;
}

/** Goes back when there is history (keeps the previous step's values), otherwise opens `fallback`. */
export function goBackOr(router: ReturnType<typeof useRouter>, fallback: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as never);
}
