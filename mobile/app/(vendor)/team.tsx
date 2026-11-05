/**
 * Folded into Profile ("People with access"). This route stays only so old links still land somewhere useful.
 */
import { Redirect } from 'expo-router';
import React from 'react';

export default function MovedToProfile() {
  return <Redirect href="/(vendor)/profile" />;
}
