/**
 * Folded into Profile ("Sign-in & security"). This route stays only so old links still land somewhere useful.
 */
import { Redirect } from 'expo-router';
import React from 'react';

export default function MovedToProfile() {
  return <Redirect href="/(vendor)/profile" />;
}
