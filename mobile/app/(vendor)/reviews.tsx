/**
 * Ratings & reviews (PRD screen 19): average rating with the star distribution, the review
 * list, and a Report action. Reviews come only from verified, delivered orders.
 *
 * No trend chart, quality dimensions or public replies. The backend has no reviews endpoint
 * yet, so the screen says so instead of showing samples. Desktop layout comes from the shell.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../../src/components/ScreenShell';
import { formatDateIST, friendlyError } from '../../src/features/money/format';
import { Card, ErrorCard, LoadingCard, Segmented, StateCard, kit, page } from '../../src/features/money/ui';
import { REVIEW_REPORTING_CONNECTED, fetchReviews, summarize, type Review } from '../../src/features/support/reviews';
import { Colors, Spacing } from '../../src/theme/tokens';
import { FontFamily, TypeScale } from '../../src/theme/typography';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'not-connected' } | { state: 'ready'; items: Review[] };
type Filter = 'all' | 'attention';

export default function ReviewsScreen() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [filter, setFilter] = useState<Filter>('all');

  const fetchData = useCallback(async () => {
    setLoad({ state: 'loading' });
    try {
      const res = await fetchReviews();
      setLoad(res.connected ? { state: 'ready', items: res.items } : { state: 'not-connected' });
    } catch (err) {
      setLoad({ state: 'error', message: friendlyError(err) });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const items = load.state === 'ready' ? load.items : [];
  const summary = useMemo(() => summarize(items), [items]);
  const visible = filter === 'attention' ? items.filter((r) => r.rating <= 3) : items;

  return (
    <ScreenShell header={{ title: 'Ratings & reviews', showBack: true }} backgroundColor={Colors.surface}>
      <View style={page.body}>
        {load.state === 'loading' ? <LoadingCard label="Loading reviews" /> : null}
        {load.state === 'error' ? <ErrorCard title="Could not load reviews" message={load.message} onRetry={fetchData} /> : null}
        {load.state === 'not-connected' ? (
          <StateCard
            icon="star-outline"
            title="Ratings are not shown in the app yet"
            body="When they are connected, your average rating and the reviews customers leave after a delivered order will show here."
          />
        ) : null}
        {load.state === 'ready' && !summary ? (
          <StateCard icon="star-outline" title="No ratings yet" body="Customers can rate their order after it is delivered. Their reviews will show here." />
        ) : null}

        {summary ? (
          <>
            <Card style={s.summary}>
              <View style={s.avgBox} accessible accessibilityLabel={`Average rating ${summary.average} out of 5 from ${summary.count} reviews`}>
                <Text style={s.avg}>{summary.average.toFixed(1)}</Text>
                <Stars rating={Math.round(summary.average)} />
                <Text style={kit.muted}>{summary.count === 1 ? '1 review' : `${summary.count} reviews`}</Text>
              </View>
              <View style={s.dist}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = summary.distribution[star - 1];
                  return (
                    <View key={star} style={s.distRow} accessible accessibilityLabel={`${star} stars: ${n}`}>
                      <Text style={s.distStar}>{star}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: `${(n / summary.count) * 100}%` }]} />
                      </View>
                      <Text style={s.distCount}>{n}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            <Segmented<Filter>
              label="Show reviews"
              value={filter}
              onChange={setFilter}
              options={[
                { key: 'all', label: 'All' },
                { key: 'attention', label: '3 stars or less' },
              ]}
            />

            {visible.length === 0 ? (
              <Card>
                <Text style={kit.body}>No reviews with 3 stars or less.</Text>
              </Card>
            ) : (
              <Card padded={false}>
                {visible.map((r, i) => (
                  <ReviewRow key={r.id} review={r} last={i === visible.length - 1} />
                ))}
              </Card>
            )}
            {!REVIEW_REPORTING_CONNECTED ? (
              <Text style={kit.muted}>Reporting a review is not available in the app yet. To report one now, contact GlowVai support with the order reference.</Text>
            ) : null}
          </>
        ) : null}
      </View>
    </ScreenShell>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={s.stars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color={i <= rating ? Colors.warning : Colors.textMuted} />
      ))}
    </View>
  );
}

function ReviewRow({ review, last }: { review: Review; last: boolean }) {
  const meta = [review.firstName, review.atMs ? formatDateIST(review.atMs, { weekday: false }) : null].filter(Boolean).join(' · ');
  return (
    <View style={[s.row, !last && s.divider]}>
      <View style={s.rowTop} accessible accessibilityLabel={`${review.rating} out of 5 stars. ${meta}`}>
        <Stars rating={review.rating} />
        {meta ? <Text style={kit.muted}>{meta}</Text> : null}
      </View>
      {review.product ? <Text style={s.product}>{review.product}</Text> : null}
      {review.text ? <Text style={kit.body}>{review.text}</Text> : null}
      <View style={s.rowFoot}>
        {review.orderId ? <Text style={s.order}>{review.orderId}</Text> : <View />}
        <Pressable
          disabled={!REVIEW_REPORTING_CONNECTED}
          accessibilityRole="button"
          accessibilityLabel="Report this review"
          accessibilityState={{ disabled: !REVIEW_REPORTING_CONNECTED }}
          accessibilityHint={REVIEW_REPORTING_CONNECTED ? undefined : 'Not available yet'}
          style={[s.report, !REVIEW_REPORTING_CONNECTED && { opacity: 0.5 }]}
        >
          <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.reportText}>Report</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  summary: { flexDirection: 'row', gap: Spacing.xl, alignItems: 'center' },
  avgBox: { alignItems: 'center', gap: 4, minWidth: 88 },
  avg: { fontFamily: FontFamily.semibold, fontSize: 36, lineHeight: 42, color: Colors.textPrimary },
  stars: { flexDirection: 'row', gap: 2 },
  dist: { flex: 1, gap: 6 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  distStar: { ...TypeScale.caption, color: Colors.textSecondary, width: 12, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.surface, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  distCount: { ...TypeScale.caption, color: Colors.textSecondary, width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] },
  row: { padding: Spacing.lg, gap: Spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  product: { ...TypeScale.body, fontFamily: FontFamily.medium, color: Colors.textPrimary },
  rowFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  order: { fontFamily: FontFamily.mono, fontSize: 12, color: Colors.textMuted },
  report: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: Spacing.sm },
  reportText: { ...TypeScale.body, color: Colors.textSecondary },
});
