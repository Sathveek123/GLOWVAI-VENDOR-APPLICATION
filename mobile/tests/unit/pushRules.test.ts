import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENABLE_MESSAGES,
  NOT_SET_UP_MESSAGE,
  ORDER_UPDATES_CHANNEL,
  PUSH_PERMISSION_COPY,
  easProjectIdFrom,
  enableMessage,
  isExpoPushToken,
  tokenRegistrationBody,
} from '../../src/features/notifications/pushRules.ts';

test('the permission copy is exactly the approved wording', () => {
  assert.equal(
    PUSH_PERMISSION_COPY,
    'GlowVai sends order updates and delivery alerts. You can change this anytime in Settings.',
  );
});

test('the token request body carries the Expo token and tokenType EXPO, nothing else', () => {
  const token = 'ExponentPushToken[abcdefghij1234567890]';
  assert.deepEqual(tokenRegistrationBody(token), { token, tokenType: 'EXPO' });
  assert.deepEqual(Object.keys(tokenRegistrationBody(token)).sort(), ['token', 'tokenType']);
});

test('only Expo push token shapes are accepted', () => {
  assert.equal(isExpoPushToken('ExponentPushToken[abcdefghij1234567890]'), true);
  assert.equal(isExpoPushToken('ExpoPushToken[abcdefghij1234567890]'), true);
  assert.equal(isExpoPushToken('ExponentPushToken[short]'), false);
  assert.equal(isExpoPushToken('fcm-token-without-brackets-0123456789'), false);
  assert.equal(isExpoPushToken(undefined), false);
});

test('no EAS project id in app config means not set up (blank or missing counts as missing)', () => {
  assert.equal(easProjectIdFrom(null), null);
  assert.equal(easProjectIdFrom({}), null);
  assert.equal(easProjectIdFrom({ extra: {} }), null);
  assert.equal(easProjectIdFrom({ extra: { eas: { projectId: '   ' } } }), null);
  assert.equal(easProjectIdFrom({ extra: { eas: { projectId: 42 } } }), null);
  assert.equal(easProjectIdFrom({ extra: { eas: { projectId: ' 1234-abcd ' } } }), '1234-abcd');
});

test('the not-set-up outcome shows the exact message', () => {
  assert.equal(NOT_SET_UP_MESSAGE, 'Notifications are not set up yet');
  assert.equal(enableMessage({ kind: 'not-set-up' }), 'Notifications are not set up yet');
});

test('every other outcome has a plain message, and a failure keeps its own wording', () => {
  assert.equal(enableMessage({ kind: 'registered' }), 'Order updates are on for this device.');
  assert.equal(enableMessage({ kind: 'denied' }), ENABLE_MESSAGES.denied);
  assert.equal(enableMessage({ kind: 'unsupported' }), ENABLE_MESSAGES.unsupported);
  assert.equal(enableMessage({ kind: 'failed', message: 'Sign in again to continue.' }), 'Sign in again to continue.');
});

test('the Android channel is the order-updates channel at high importance', () => {
  assert.equal(ORDER_UPDATES_CHANNEL.id, 'order-updates');
  assert.equal(ORDER_UPDATES_CHANNEL.importance, 4);
});

test('the channel id matches the shop server EXPO_CHANNEL_ID (lib/shop/notifications/expoPush.ts)', () => {
  // Copied from the shop's constant. The shop sends vendor offer pushes on this channel id; if it changes there, change it here too.
  const SHOP_EXPO_CHANNEL_ID = 'order-updates';
  assert.equal(ORDER_UPDATES_CHANNEL.id, SHOP_EXPO_CHANNEL_ID);
});
