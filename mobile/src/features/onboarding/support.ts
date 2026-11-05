/**
 * Seller support contact shown on the application status screens.
 *
 * Set EXPO_PUBLIC_SELLER_SUPPORT_EMAIL and/or EXPO_PUBLIC_SELLER_SUPPORT_PHONE at build time.
 * When neither is set, the screens say so plainly instead of showing a made-up contact.
 * (Read with the static process.env form so Expo can inline the values.)
 */
export const SELLER_SUPPORT = {
  email: (process.env.EXPO_PUBLIC_SELLER_SUPPORT_EMAIL ?? '').trim(),
  phone: (process.env.EXPO_PUBLIC_SELLER_SUPPORT_PHONE ?? '').trim(),
};

export const hasSellerSupport = () => !!(SELLER_SUPPORT.email || SELLER_SUPPORT.phone);
