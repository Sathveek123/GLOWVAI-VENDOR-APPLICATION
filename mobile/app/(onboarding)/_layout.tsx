import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="step-a" />
      <Stack.Screen name="step-b" />
      <Stack.Screen name="step-c" />
      <Stack.Screen name="step-d" />
      <Stack.Screen name="pending" />
      <Stack.Screen name="approved" />
    </Stack>
  );
}
