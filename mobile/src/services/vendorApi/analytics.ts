/**
 * Store analytics from GET /api/vendor/analytics?days=7|30. The server computes every number
 * from this store's own orders (bounded to the latest 500); the app only shows them. A null
 * metric means "no data yet" and is never shown as zero. The pure rules are in analyticsRules.ts.
 */
import { vendorFetch } from './http';
import { analyticsPath, normalizeAnalytics, type Analytics, type AnalyticsDays } from './analyticsRules';

export * from './analyticsRules';

export const analyticsApi = {
  get: async (days: AnalyticsDays): Promise<Analytics> => {
    const res = await vendorFetch<{ ok: true } & Record<string, unknown>>(analyticsPath(days));
    return normalizeAnalytics(res);
  },
};
