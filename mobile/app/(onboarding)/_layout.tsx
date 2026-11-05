import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="step-a" />
      <Stack.Screen name="step-b" />
      <Stack.Screen name="step-c" />
      <Stack.Screen name="step-d" />
      {/* Status screens are a fresh start: no swipe back into the form steps. */}
      <Stack.Screen name="pending" options={{ gestureEnabled: false }} />
      <Stack.Screen name="approved" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
