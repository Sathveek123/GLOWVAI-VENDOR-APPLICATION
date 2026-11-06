/**
 * Store sign-in with Firebase Auth email + password (project glowvai-38bde).
 *
 * Phone number + SMS code sign-in needs a paid SMS plan, so it is not available yet.
 * Every failure is turned into plain copy by authErrorMessage(); raw Firebase messages
 * ("Firebase: Error (auth/...)") are never shown.
 */
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '../../config/firebase';
import { PASSWORD_MIN } from './validation';

export const PHONE_SIGN_IN_NOTE =
  'Signing in with a mobile number and SMS code is not available yet. Use your email address and password.';

const COPY: Record<string, string> = {
  'auth/wrong-password': 'That password is not right. Try again, or reset it.',
  'auth/invalid-credential': 'The email or password is not right. Check both and try again.',
  'auth/invalid-login-credentials': 'The email or password is not right. Check both and try again.',
  'auth/user-not-found': 'There is no store account with this email. Check it, or create an account.',
  'auth/email-already-in-use': 'A store account already uses this email. Sign in instead, or reset the password.',
  'auth/weak-password': `Choose a stronger password with at least ${PASSWORD_MIN} characters.`,
  'auth/invalid-email': 'Enter a valid email, like name@example.com.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/user-disabled': 'This account has been switched off. Please contact GlowVai.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes, then try again.',
  'auth/network-request-failed': "Can't reach GlowVai. Check your internet and try again.",
  'auth/operation-not-allowed': 'Store sign-in is not switched on yet. Please contact GlowVai.',
  'auth/requires-recent-login': 'For your security, enter your current password again.',
  'auth/user-token-expired': 'Your session has ended. Please sign in again.',
  'auth/quota-exceeded': 'GlowVai is getting too many requests right now. Try again in a few minutes.',
};

/** Plain copy for any sign-in error. */
export function authErrorMessage(err: unknown): string {
  const code = typeof (err as { code?: unknown })?.code === 'string' ? (err as { code: string }).code : '';
  if (code && COPY[code]) return COPY[code];
  if (/^Firebase is not configured/.test(String((err as Error)?.message))) {
    return 'Sign-in is not set up in this version of the app. Please install the latest GlowVai Seller app.';
  }
  return 'Something went wrong. Please try again.';
}

export const authErrorCode = (err: unknown): string =>
  typeof (err as { code?: unknown })?.code === 'string' ? (err as { code: string }).code : '';

const clean = (email: string) => email.trim().toLowerCase();

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), clean(email), password);
  return cred.user;
}

/** Creates the account and sends the verification email. */
export async function createAccount(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), clean(email), password);
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // The verify screen offers "Resend"; the account itself was created.
  }
  return cred.user;
}

export async function sendReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), clean(email));
}

export async function resendVerification(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw Object.assign(new Error('signed out'), { code: 'auth/user-token-expired' });
  await sendEmailVerification(user);
}

/**
 * Reloads the user from Firebase and refreshes the ID token so the server sees the new
 * email_verified claim. Returns whether the email is now verified.
 */
export async function refreshVerification(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw Object.assign(new Error('signed out'), { code: 'auth/user-token-expired' });
  await user.reload();
  const fresh = getFirebaseAuth().currentUser;
  if (fresh?.emailVerified) {
    await fresh.getIdToken(true);
    return true;
  }
  return false;
}

/** Confirms the current password, then sets a new one. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw Object.assign(new Error('signed out'), { code: 'auth/user-token-expired' });
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
}
