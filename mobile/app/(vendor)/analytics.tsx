import Ionicons from '@expo/vector-icons/Ionicons';
import { withComingSoon } from '../../src/components/ComingSoon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

export type TimeRange = 'today' | '7days' | '30days' | 'month';
export type MetricType = 'gross' | 'net' | 'orders' | 'aov';

export interface DailyDataPoint {
  day: string;
  gross: number;
  net: number;
  orders: number;
  aov: number;
}

const MOCK_DAILY_DATA: DailyDataPoint[] = [
  { day: 'Mon', gross: 18450, net: 16236, orders: 19, aov: 971 },
  { day: 'Tue', gross: 21200, net: 18656, orders: 22, aov: 963 },
  { day: 'Wed', gross: 19800, net: 17424, orders: 20, aov: 990 },
  { day: 'Thu', gross: 24500, net: 21560, orders: 25, aov: 980 },
  { day: 'Fri', gross: 28900, net: 25432, orders: 30, aov: 963 },
  { day: 'Sat', gross: 32000, net: 28160, orders: 34, aov: 941 },
  { day: 'Sun', gross: 18000, net: 15840, orders: 18, aov: 1000 },
];

function BusinessAnalyticsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [activeMetric, setActiveMetric] = useState<MetricType>('gross');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRunExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setIsExportModalOpen(false);
      showToast(`📥 Business Performance Report (${exportFormat.toUpperCase()}) downloaded successfully`);
    }, 1500);
  };

  // Maximum value for bar scaling
  const maxVal = Math.max(...MOCK_DAILY_DATA.map((d) => d[activeMetric]));

  return (
    <View style={styles.container}>
      {/* Toast Notification Banner */}
      {notification && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{notification}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header & Breadcrumbs */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbLink}>Analytics</Text>
              <Text style={styles.breadcrumbSep}> / </Text>
              <Text style={styles.breadcrumbCurrent}>Overview</Text>
            </View>
            <View style={styles.titleRowFlex}>
              <Text style={styles.pageTitle}>Business insights</Text>
              <View style={styles.freshnessPill}>
                <View style={styles.freshDot} />
                <Text style={styles.freshText}>Updated 5 minutes ago</Text>
              </View>
            </View>
            <Text style={styles.subCaption}>
              Actionable performance metrics, order fulfillment health, and store revenue trends.
            </Text>
          </View>

          <View style={styles.headerRightControls}>
            {/* Time Range Selector */}
            <View style={styles.timeRangePills}>
              <TouchableOpacity
                style={[styles.timePill, timeRange === 'today' && styles.timePillActive]}
                onPress={() => setTimeRange('today')}
              >
                <Text style={[styles.timePillText, timeRange === 'today' && styles.timePillTextActive]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timePill, timeRange === '7days' && styles.timePillActive]}
                onPress={() => setTimeRange('7days')}
              >
                <Text style={[styles.timePillText, timeRange === '7days' && styles.timePillTextActive]}>Last 7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timePill, timeRange === '30days' && styles.timePillActive]}
                onPress={() => setTimeRange('30days')}
              >
                <Text style={[styles.timePillText, timeRange === '30days' && styles.timePillTextActive]}>Last 30 Days</Text>
              </TouchableOpacity>
            </View>

            {/* Export CTA */}
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsExportModalOpen(true)}>
              <Text style={styles.primaryBtnText}>📥 Export Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Tax Disclaimer Banner */}
        <View style={styles.legalDisclaimerCard}>
          <Text style={styles.legalIcon}>ℹ️</Text>
          <Text style={styles.legalText}>
            Financial values represent backend-verified settled ledger records. Figures are provided for operational decision support and should not be used as official tax filings without consulting your tax advisor.
          </Text>
        </View>

        {/* 6 Key Metric Summary Cards */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Gross Sales */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Gross sales</Text>
            <Text style={styles.metricValue}>₹1,62,850.00</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendUpText}>↑ +14.2%</Text>
              <Text style={styles.trendSubText}>vs prev 7 days</Text>
            </View>
          </View>

          {/* Card 2: Net Earnings */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Net earnings</Text>
            <Text style={styles.metricValue}>₹1,43,308.00</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendUpText}>↑ +13.8%</Text>
              <Text style={styles.trendSubText}>88% net after split</Text>
            </View>
          </View>

          {/* Card 3: Total Orders */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total orders</Text>
            <Text style={styles.metricValue}>168 Orders</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendUpText}>↑ +8.5%</Text>
              <Text style={styles.trendSubText}>165 completed</Text>
            </View>
          </View>

          {/* Card 4: Average Order Value */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg order value (AOV)</Text>
            <Text style={styles.metricValue}>₹969.34</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendUpText}>↑ +5.2%</Text>
              <Text style={styles.trendSubText}>per basket</Text>
            </View>
          </View>

          {/* Card 5: Fulfillment Rate */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Fulfillment rate</Text>
            <Text style={styles.metricValue}>98.6%</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendUpText}>↑ +0.4%</Text>
              <Text style={styles.trendSubText}>prep SLA &lt;3m</Text>
            </View>
          </View>

          {/* Card 6: Store Rating */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Store rating</Text>
            <Text style={styles.metricValue}>4.96 ★</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendNeutralText}>• Stable</Text>
              <Text style={styles.trendSubText}>284 verified reviews</Text>
            </View>
          </View>
        </View>

        {/* Two-Column Analysis Workspace */}
        <View style={styles.analysisWorkspaceRow}>
          {/* Left Area: Sales & Order Trend Visualizer */}
          <View style={styles.leftChartCard}>
            <View style={styles.chartHeaderRow}>
              <View>
                <Text style={styles.cardHeaderTitle}>Sales & Order Performance Trend</Text>
                <Text style={styles.cardHeaderSub}>Daily breakdown for selected date range</Text>
              </View>

              <View style={styles.chartViewToggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'chart' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('chart')}
                >
                  <Text style={[styles.toggleText, viewMode === 'chart' && styles.toggleTextActive]}>📊 Chart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('table')}
                >
                  <Text style={[styles.toggleText, viewMode === 'table' && styles.toggleTextActive]}>📋 Table</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Metric Switcher Tabs */}
            <View style={styles.metricTabsRow}>
              <TouchableOpacity
                style={[styles.metricTab, activeMetric === 'gross' && styles.metricTabActive]}
                onPress={() => setActiveMetric('gross')}
              >
                <Text style={[styles.metricTabText, activeMetric === 'gross' && styles.metricTabTextActive]}>
                  Gross Sales (₹)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metricTab, activeMetric === 'net' && styles.metricTabActive]}
                onPress={() => setActiveMetric('net')}
              >
                <Text style={[styles.metricTabText, activeMetric === 'net' && styles.metricTabTextActive]}>
                  Net Earnings (₹)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metricTab, activeMetric === 'orders' && styles.metricTabActive]}
                onPress={() => setActiveMetric('orders')}
              >
                <Text style={[styles.metricTabText, activeMetric === 'orders' && styles.metricTabTextActive]}>
                  Order Count
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metricTab, activeMetric === 'aov' && styles.metricTabActive]}
                onPress={() => setActiveMetric('aov')}
              >
                <Text style={[styles.metricTabText, activeMetric === 'aov' && styles.metricTabTextActive]}>
                  AOV (₹)
                </Text>
              </TouchableOpacity>
            </View>

            {/* View Mode: Interactive Bar Chart View */}
            {viewMode === 'chart' ? (
              <View style={styles.chartContainer}>
                <View style={styles.barsRow}>
                  {MOCK_DAILY_DATA.map((d, idx) => {
                    const heightPct = Math.round((d[activeMetric] / maxVal) * 100);
                    return (
                      <View key={idx} style={styles.barColumn}>
                        <Text style={styles.barValText}>
                          {activeMetric === 'orders' ? d.orders : `₹${(d[activeMetric] / 1000).toFixed(1)}k`}
                        </Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                        </View>
                        <Text style={styles.barDayText}>{d.day}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* View Mode: Accessible Table View */
              <View style={styles.tableContainer}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, styles.flex1]}>Day</Text>
                  <Text style={[styles.thCell, styles.flex1]}>Gross Sales</Text>
                  <Text style={[styles.thCell, styles.flex1]}>Net Earnings</Text>
                  <Text style={[styles.thCell, styles.flex1]}>Orders</Text>
                  <Text style={[styles.thCell, styles.flex1]}>AOV</Text>
                </View>
                {MOCK_DAILY_DATA.map((d, idx) => (
                  <View key={idx} style={styles.tableDataRow}>
                    <Text style={[styles.tdCell, styles.flex1, styles.fw700]}>{d.day}</Text>
                    <Text style={[styles.tdCell, styles.flex1]}>₹{d.gross.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.tdCell, styles.flex1, styles.colorGreen]}>₹{d.net.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.tdCell, styles.flex1]}>{d.orders}</Text>
                    <Text style={[styles.tdCell, styles.flex1]}>₹{d.aov}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Area: Operations Health Panel */}
          <View style={styles.rightHealthCard}>
            <Text style={styles.cardHeaderTitle}>Operations Health & SLA Panel</Text>
            <Text style={styles.cardHeaderSub}>Real-time fulfillment metrics & benchmarks</Text>

            <View style={styles.healthList}>
              {/* Health Item 1 */}
              <View style={styles.healthItem}>
                <View style={styles.healthItemTop}>
                  <Text style={styles.healthTitle}>Order Acceptance Rate</Text>
                  <Text style={styles.healthValGreen}>99.2%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '99.2%', backgroundColor: '#16A34A' }]} />
                </View>
                <Text style={styles.healthSub}>Target: &gt;98.0% • 45s offer timer SLA</Text>
              </View>

              {/* Health Item 2 */}
              <View style={styles.healthItem}>
                <View style={styles.healthItemTop}>
                  <Text style={styles.healthTitle}>Average Preparation Time</Text>
                  <Text style={styles.healthValGreen}>2.4 mins</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '80%', backgroundColor: '#16A34A' }]} />
                </View>
                <Text style={styles.healthSub}>Target: &lt;3.0 mins • Quick pickup ready</Text>
              </View>

              {/* Health Item 3 */}
              <View style={styles.healthItem}>
                <View style={styles.healthItemTop}>
                  <Text style={styles.healthTitle}>Ready-on-Time SLA Rate</Text>
                  <Text style={styles.healthValGreen}>97.8%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '97.8%', backgroundColor: '#16A34A' }]} />
                </View>
                <Text style={styles.healthSub}>Target: &gt;95.0% • Rider handover speed</Text>
              </View>

              {/* Health Item 4 */}
              <View style={styles.healthItem}>
                <View style={styles.healthItemTop}>
                  <Text style={styles.healthTitle}>Order Cancellation Rate</Text>
                  <Text style={styles.healthValGreen}>0.8%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '8%', backgroundColor: '#16A34A' }]} />
                </View>
                <Text style={styles.healthSub}>Target: &lt;2.0% • Low out-of-stock cancels</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actionable AI Insights Row */}
        <Text style={styles.sectionHeaderTitle}>⚡ Actionable Business Insights</Text>
        <View style={styles.insightsGrid}>
          {/* Insight 1 */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightBadgeAmber}>⚠️ Inventory SLA Risk</Text>
              <Text style={styles.insightEvidence}>Basis: Last 7 Days • 12 SKUs</Text>
            </View>
            <Text style={styles.insightTitle}>Low-stock SKUs affecting 8% of order baskets</Text>
            <Text style={styles.insightDesc}>
              Shade 128 foundation and Niacinamide serum are out-of-stock, causing item substitution requests.
            </Text>
            <TouchableOpacity
              style={styles.insightActionBtn}
              onPress={() => router.push('/(vendor)/catalog' as any)}
            >
              <Text style={styles.insightActionText}>Manage Catalog & Stock →</Text>
            </TouchableOpacity>
          </View>

          {/* Insight 2 */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightBadgeBlue}>💡 Peak Demand Opportunity</Text>
              <Text style={styles.insightEvidence}>Basis: 42% Daily Sales</Text>
            </View>
            <Text style={styles.insightTitle}>Peak order demand is between 6 PM and 9 PM</Text>
            <Text style={styles.insightDesc}>
              Evening surge volume increases preparation load. Ensure 2 packers are active during peak hours.
            </Text>
            <TouchableOpacity
              style={styles.insightActionBtn}
              onPress={() => router.push('/(vendor)/team' as any)}
            >
              <Text style={styles.insightActionText}>Review Staff Roster →</Text>
            </TouchableOpacity>
          </View>

          {/* Insight 3 */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightBadgeGreen}>⭐ Customer Feedback</Text>
              <Text style={styles.insightEvidence}>Basis: 284 Customer Reviews</Text>
            </View>
            <Text style={styles.insightTitle}>Packaging quality rating maintained at 4.92★</Text>
            <Text style={styles.insightDesc}>
              Tamper-evident security seals on beauty liquid bottles received positive customer feedback.
            </Text>
            <TouchableOpacity
              style={styles.insightActionBtn}
              onPress={() => router.push('/(vendor)/reviews' as any)}
            >
              <Text style={styles.insightActionText}>View Customer Reviews →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Export Report Modal */}
      <Modal visible={isExportModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Performance Report</Text>
              <TouchableOpacity onPress={() => setIsExportModalOpen(false)}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Report Format</Text>
              <View style={styles.formatOptionsRow}>
                <TouchableOpacity
                  style={[styles.formatBtn, exportFormat === 'pdf' && styles.formatBtnActive]}
                  onPress={() => setExportFormat('pdf')}
                >
                  <Text style={[styles.formatBtnText, exportFormat === 'pdf' && styles.formatBtnTextActive]}>
                    📄 Detailed PDF Summary
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formatBtn, exportFormat === 'csv' && styles.formatBtnActive]}
                  onPress={() => setExportFormat('csv')}
                >
                  <Text style={[styles.formatBtnText, exportFormat === 'csv' && styles.formatBtnTextActive]}>
                    📊 Raw CSV Data Export
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalNoteText}>
                Includes itemized sales, net earnings after 88/12 split, order fulfillment SLA breakdowns, and review counts for the selected date range.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsExportModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleRunExport}
                disabled={isExporting}
              >
                <Text style={styles.modalSubmitText}>
                  {isExporting ? 'Generating...' : 'Download Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toastContainer: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 0,
    marginBottom: 16,
    gap: 16,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  breadcrumbLink: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontWeight: '500',
  },
  breadcrumbSep: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#94A3B8',
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  titleRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  freshnessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freshDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  freshText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  subCaption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeRangePills: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timePillActive: {
    backgroundColor: '#1D4ED8',
  },
  timePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  timePillTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
  },
  legalDisclaimerCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  legalIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
  },
  legalText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: Platform.OS === 'web' ? '15.5%' : '48%',
    minWidth: 170,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendUpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#16A34A',
  },
  trendNeutralText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  trendSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  analysisWorkspaceRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
    marginBottom: 28,
  },
  leftChartCard: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  cardHeaderSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chartViewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#0F172A',
  },
  metricTabsRow: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 20,
  },
  metricTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  metricTabActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  metricTabText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  metricTabTextActive: {
    color: '#1D4ED8',
  },
  chartContainer: {
    height: 220,
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  barTrack: {
    width: 28,
    height: 140,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#1D4ED8',
    borderRadius: 6,
  },
  barDayText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
    marginTop: 6,
  },
  tableContainer: {
    paddingTop: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  thCell: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  tableDataRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdCell: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#0F172A',
  },
  flex1: {
    flex: 1,
  },
  fw700: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  colorGreen: {
    color: '#16A34A',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  rightHealthCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  healthList: {
    gap: 16,
    marginTop: 16,
  },
  healthItem: {
    gap: 4,
  },
  healthItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  healthValGreen: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#16A34A',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  insightsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightBadgeAmber: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  insightBadgeBlue: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  insightBadgeGreen: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  insightEvidence: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  insightTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  insightDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 14,
  },
  insightActionBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignSelf: 'flex-start',
  },
  insightActionText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#1D4ED8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: '#64748B',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  formatOptionsRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  formatBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
  },
  formatBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  formatBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  formatBtnTextActive: {
    color: '#1D4ED8',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  modalNoteText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
  },
  modalSubmitText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default withComingSoon(BusinessAnalyticsScreen, 'Analytics');
