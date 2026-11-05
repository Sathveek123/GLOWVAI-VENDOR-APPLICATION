/**
 * Screen-level error boundary. Wrap a screen (or a risky part of one) so a render
 * crash shows a calm card with "Try again" instead of a blank screen.
 *
 *   <ErrorBoundary screen="Orders">
 *     <OrdersContent />
 *   </ErrorBoundary>
 *
 * or wrap a whole screen component: `export default withErrorBoundary(OrdersScreen, 'Orders')`.
 * ScreenShell also accepts `errorBoundary` to wrap its body.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, BorderRadii, Shadows } from '../theme/tokens';
import { FontFamily } from '../theme/typography';

interface Props {
  children: React.ReactNode;
  /** Name of the screen, used in the message ("Orders couldn't load"). */
  screen?: string;
  /** Replaces the default fallback. Receives a reset function. */
  fallback?: (reset: () => void) => React.ReactNode;
  /** Called once per caught error (send it to crash reporting here). */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) console.warn(`[ErrorBoundary${this.props.screen ? `: ${this.props.screen}` : ''}]`, error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset);
    return <ErrorFallback screen={this.props.screen} onRetry={this.reset} detail={__DEV__ ? this.state.error.message : undefined} />;
  }
}

export function ErrorFallback({ screen, onRetry, detail }: { screen?: string; onRetry: () => void; detail?: string }) {
  return (
    <View style={s.wrap} accessibilityRole="alert">
      <View style={s.card}>
        <View style={s.icon}>
          <Ionicons name="alert-circle-outline" size={26} color={Colors.dangerText} />
        </View>
        <Text style={s.title}>{screen ? `${screen} couldn’t load` : 'This screen couldn’t load'}</Text>
        <Text style={s.body}>Something went wrong on our side. Your data is safe. Try again, and if it keeps happening, restart the app.</Text>
        {detail ? <Text style={s.detail}>{detail}</Text> : null}
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [s.button, pressed && { backgroundColor: Colors.primaryPressed }]}
        >
          <Text style={s.buttonText}>Try again</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function withErrorBoundary<P extends object>(Screen: React.ComponentType<P>, screen?: string) {
  function Wrapped(props: P) {
    return (
      <ErrorBoundary screen={screen}>
        <Screen {...props} />
      </ErrorBoundary>
    );
  }
  Wrapped.displayName = `withErrorBoundary(${Screen.displayName || Screen.name || 'Screen'})`;
  return Wrapped;
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: Spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.canvas },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.sheet,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, color: Colors.textPrimary, textAlign: 'center' },
  body: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 21, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  detail: { fontFamily: FontFamily.mono, fontSize: 12, lineHeight: 16, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  button: {
    marginTop: Spacing.lg,
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadii.button,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: FontFamily.semibold, fontSize: 16, color: Colors.textOnPrimary },
});
