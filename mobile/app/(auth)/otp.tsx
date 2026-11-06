/**
 * Sign-in by SMS code is not available yet (SMS needs a paid plan). Old links to this
 * screen open email sign-in instead.
 */
import React from 'react';
import { Redirect } from 'expo-router';

export default function OtpMoved() {
  return <Redirect href="/(auth)/login" />;
}
