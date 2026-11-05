/**
 * Sign-in code settings.
 *
 * No SMS provider is connected yet: nothing sends a code to the seller's phone, and a
 * production backend answers every code with OTP_PROVIDER_REQUIRED. Until Firebase Phone
 * Auth (or another provider) is wired in, the app says "Sign-in by code is not available
 * yet" and never claims a code was sent or re-sent.
 *
 * Development builds only (__DEV__): a development backend accepts a fixed test code, and
 * the OTP screen offers a "Use test code" button. Release builds never contain this path.
 */

/** Flip to true only when a real provider sends (and re-sends) codes. */
export const CODE_SENDING_AVAILABLE = false;

/** The development backend's fixed test code. null in release builds. */
export const DEV_TEST_CODE: string | null = __DEV__ ? '4892' : null;

/** Digits in a sign-in code. Firebase Phone Auth uses 6; the current backend uses 4. */
export const CODE_LENGTH = 4;

export const CODE_UNAVAILABLE_MESSAGE = 'Sign-in by code is not available yet';
