/**
 * SCREEN 12: Order Detail & Customer Substitution
 * Desktop 1440x1024 2-Column Picking Console & Substitution Drawer
 * File: mobile/app/(vendor)/order-detail.tsx
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Wordmark from '../../src/components/Wordmark';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadii } from '../../src/theme/tokens';
import useVendorStore from '../../src/store/useVendorStore';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

interface PickItem {
  id: string;
  name: string;
  brand: string;
  variant: string;
  price: number;
  quantity: number;
  shelfLocation: string;
  isPicked: boolean;
  isUnavailable?: boolean;
  substitutionStatus?: 'pending_approval' | 'approved' | 'declined' | 'expired' | 'no_alternative' | 'removed';
  replacementName?: string;
  priceDiff?: string;
  options?: { title: string; variant: string; priceDiff: string }[];
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isExpanded = width >= 1024;
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [shelfFilter, setShelfFilter] = useState('');
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  // Substitution Drawer State
  const [activeSubItem, setActiveSubItem] = useState<PickItem | null>(null);

  // Structured Picking Checklist Items
  // The picking list comes from the real order in the store. No demo basket.
  const storeOrder = useVendorStore(s => s.orders.find(o => o.orderId === orderId));
  const [items, setItems] = useState<PickItem[]>([]);

  useEffect(() => {
    if (!storeOrder) return;
    setItems(
      storeOrder.items.map((it, idx) => ({
        id: `${storeOrder.orderId}-${idx}`,
        name: it.productName,
        brand: "",
        variant: it.sku ?? "",
        price: it.price,
        quantity: it.quantity,
        shelfLocation: it.sku ? `SKU ${it.sku}` : "Shelf not set",
        isPicked: false,
      }))
    );
  }, [storeOrder]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `Order #${orderId || 'GV-9912'} Picking Console | GlowVAI Vendor`;
    }
  }, [orderId]);

  // Toggle item picking status
  const toggleItemPick = (itemId: string) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id === itemId && !it.isUnavailable) {
          return { ...it, isPicked: !it.isPicked };
        }
        return it;
      })
    );
  };

  // Open Substitution Drawer
  const openSubstitutionDrawer = (item: PickItem) => {
    setActiveSubItem(item);
  };

  // Suggest Replacement Handler
  const handleSuggestReplacement = (replacementName: string, priceDiff: string) => {
    if (!activeSubItem) return;

    setItems(prev =>
      prev.map(it => {
        if (it.id === activeSubItem.id) {
          return {
            ...it,
            isUnavailable: true,
            substitutionStatus: 'pending_approval',
            replacementName,
            priceDiff,
          };
        }
        return it;
      })
    );
    setActiveSubItem(null);
    Alert.alert('Substitution Sent 📲', `Customer notified of replacement: ${replacementName}. Awaiting customer approval.`);
  };

  // Remove Item Handler
  const handleRemoveItem = () => {
    if (!activeSubItem) return;

    setItems(prev =>
      prev.map(it => {
        if (it.id === activeSubItem.id) {
          return {
            ...it,
            isUnavailable: true,
            substitutionStatus: 'removed',
          };
        }
        return it;
      })
    );
    setActiveSubItem(null);
  };

  // Filter items by shelf location or name
  const filteredItems = useMemo(() => {
    if (!shelfFilter.trim()) return items;
    const q = shelfFilter.toLowerCase();
    return items.filter(
      it =>
        it.shelfLocation.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        it.brand.toLowerCase().includes(q)
    );
  }, [items, shelfFilter]);

  // Calculation stats
  const pickedCount = items.filter(i => i.isPicked).length;
  const totalCount = items.length;
  const pickingProgress = totalCount ? Math.round((pickedCount / totalCount) * 100) : 0;

  const hasUnresolvedIssue = items.some(it => it.isUnavailable && it.substitutionStatus === 'pending_approval');
  const allPicked = items.every(it => it.isPicked || (it.isUnavailable && it.substitutionStatus !== 'pending_approval'));

  const subtotal = items.reduce((acc, it) => acc + (it.isUnavailable && it.substitutionStatus === 'removed' ? 0 : it.price * it.quantity), 0);
  const platformFee = Math.round(subtotal * 0.12);
  const netEarnings = (subtotal - platformFee).toFixed(2);

  const handlePrimaryAction = () => {
    if (hasUnresolvedIssue) {
      setErrorMessage('Please resolve unavailable item substitution or await customer approval before packing.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push({
        pathname: '/(vendor)/pack-order' as any,
        params: { orderId: orderId || 'GV-9912' },
      });
    }, 600);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.desktopLayout}>

        {/* ── Desktop Left Navigation Rail ───────────────────────────────────────── */}
        {isExpanded && (
          <View style={s.navRail}>
            <View style={s.railBrandGroup}>
              <View style={s.railBrandLogo}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={s.railBrandLogoIcon} />
              </View>
              <View>
                <Wordmark size={17} />
                <Text style={s.railBrandSub}>Vendor Console</Text>
              </View>
            </View>

            <View style={s.railNavGroup}>
              <TouchableOpacity style={s.railNavItem} onPress={() => router.replace('/(vendor)/home')} activeOpacity={0.8}>
                <Ionicons name="home-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.railNavItem, s.railNavItemActive]} onPress={() => router.push('/(vendor)/orders')} activeOpacity={0.8}>
                <Ionicons name="clipboard-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={[s.railNavLabel, s.railNavLabelActive]}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/catalog')} activeOpacity={0.8}>
                <Ionicons name="cube-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/earnings')} activeOpacity={0.8}>
                <Ionicons name="wallet-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railNavItem} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <Ionicons name="settings-outline" size={18} color="#475569" style={s.railNavIcon} />
                <Text style={s.railNavLabel}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={s.railFooter}>
              <TouchableOpacity style={s.storeSelectorPill} activeOpacity={0.8}>
                <Text style={s.storeSelectorText} numberOfLines={1}>📍 Benz Circle Store ▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railHelpBtn} activeOpacity={0.8}>
                <Text style={s.railHelpText}>Help & Support 💬</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.railProfileCard} onPress={() => router.push('/(vendor)/profile')} activeOpacity={0.8}>
                <View style={s.railAvatar}>
                  <Text style={s.railAvatarText}>S</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.railProfileName} numberOfLines={1}>Store account</Text>
                  <Text style={s.railProfileRole}>Store Admin</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Main Content Console ────────────────────────────────────────────── */}
        <View style={s.mainConsole}>

          {/* Top Header */}
          <View style={s.topHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={s.backIcon}>‹</Text>
              </TouchableOpacity>
              <View>
                {/* Breadcrumbs */}
                <Text style={s.breadcrumbText}>Orders / Order #{orderId || 'GV-9912'}</Text>
                <Text style={s.pageTitle}>Picking & Preparation Workstation</Text>
              </View>
            </View>

            <View style={s.headerActionsRight}>
              <View style={s.statusPill}>
                <Text style={s.statusPillText}>⚡ PREPARING</Text>
              </View>

              <TouchableOpacity style={s.overflowBtn} onPress={() => setShowOverflowMenu(!showOverflowMenu)} activeOpacity={0.7}>
                <Text style={s.overflowIcon}>⋮ Support</Text>
              </TouchableOpacity>

              <CustomerAppRedirectButton storeName="Your store" />
            </View>
          </View>

          {/* Console Body Scroll Area */}
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.container1200}>

              {/* Error Banner */}
              {errorMessage !== '' && (
                <View style={s.errorBanner}>
                  <Text style={s.errorBannerText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {/* Picking Progress Bar Header */}
              <View style={s.progressHeaderCard}>
                <View style={s.progressHeaderTop}>
                  <Text style={s.progressTitleText}>
                    Picking Progress: <Text style={{ color: Colors.primary }}>{pickedCount} of {totalCount} items picked</Text> ({pickingProgress}%)
                  </Text>
                  <View style={s.slaBadge}>
                    <Text style={s.slaBadgeText}>⏱️ Target SLA: 04:15 remaining</Text>
                  </View>
                </View>

                <View style={s.progressBarTrack}>
                  <View style={[s.progressBarFill, { width: `${pickingProgress}%` }]} />
                </View>
              </View>

              {/* ── 2-COLUMN DESKTOP COMPOSITION ────────────────────────────────── */}
              <View style={[s.gridRow, isExpanded && s.gridRowExpanded]}>

                {/* LEFT COLUMN (7/12): Items to Pick Checklist Table */}
                <View style={s.colLeft}>
                  <View style={s.sectionCard}>
                    <View style={s.sectionHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.sectionTitle}>Items to Pick ({filteredItems.length})</Text>
                        <Text style={s.sectionSubText}>Tap checkbox when item is verified from dark store shelf bin</Text>
                      </View>

                      {/* Shelf Filter Input */}
                      <View style={s.shelfFilterWrap}>
                        <TextInput
                          style={s.shelfFilterInput}
                          placeholder="Filter shelf (e.g. A-01)..."
                          placeholderTextColor={Colors.textMuted}
                          value={shelfFilter}
                          onChangeText={setShelfFilter}
                        />
                      </View>
                    </View>

                    {/* Picking Table Rows */}
                    <View style={s.itemList}>
                      {filteredItems.map(item => (
                        <View
                          key={item.id}
                          style={[
                            s.itemCard,
                            item.isPicked && s.itemCardPicked,
                            item.isUnavailable && s.itemCardUnavailable,
                          ]}
                        >
                          {/* Accessible Checkbox */}
                          <TouchableOpacity
                            style={s.checkboxArea}
                            onPress={() => toggleItemPick(item.id)}
                            disabled={item.isUnavailable}
                            activeOpacity={0.8}
                          >
                            <View style={[
                              s.checkbox,
                              item.isPicked && s.checkboxPicked,
                              item.isUnavailable && s.checkboxDisabled,
                            ]}>
                              {item.isPicked && <Ionicons name="checkmark" size={18} style={{ color: '#475569' }} />}
                              {item.isUnavailable && <Text style={s.warnIconText}>!</Text>}
                            </View>
                          </TouchableOpacity>

                          {/* Item Details */}
                          <View style={{ flex: 1 }}>
                            <View style={s.brandRow}>
                              <Text style={s.itemBrandText}>{item.brand}</Text>
                              <View style={s.shelfTag}>
                                <Text style={s.shelfTagText}>📍 {item.shelfLocation}</Text>
                              </View>
                            </View>

                            <Text style={[s.itemNameText, item.isPicked && s.itemNameTextPicked]}>
                              {item.name}
                            </Text>
                            <Text style={s.itemVariantText}>{item.variant} • Qty: {item.quantity}</Text>

                            <Text style={s.itemPriceText}>₹{item.price * item.quantity}</Text>

                            {/* Out of Stock / Substitution State Banner */}
                            {item.isUnavailable && (
                              <View style={s.subStatusBox}>
                                {item.substitutionStatus === 'pending_approval' && (
                                  <View style={s.subPendingBox}>
                                    <Text style={s.subPendingText}>
                                      ⚠️ <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' }}>Item Unavailable in Shelf.</Text> Substitution suggested: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.primary }}>{item.replacementName}</Text> ({item.priceDiff}). Awaiting customer approval via app.
                                    </Text>
                                    <TouchableOpacity
                                      style={s.changeSubBtn}
                                      onPress={() => openSubstitutionDrawer(item)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={s.changeSubBtnText}>Modify suggestion →</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}

                                {item.substitutionStatus === 'approved' && (
                                  <View style={s.subApprovedBox}>
                                    <Text style={s.subApprovedText}>✓ Customer Approved Substitution: {item.replacementName}</Text>
                                  </View>
                                )}

                                {item.substitutionStatus === 'declined' && (
                                  <View style={s.subDeclinedBox}>
                                    <Text style={s.subDeclinedText}>✕ Customer Declined Substitution. Item removed from order.</Text>
                                  </View>
                                )}

                                {item.substitutionStatus === 'removed' && (
                                  <Text style={s.subRemovedText}>✕ Item marked unavailable and removed from order payout.</Text>
                                )}
                              </View>
                            )}
                          </View>

                          {/* Unavailable Button */}
                          {!item.isPicked && !item.isUnavailable && (
                            <TouchableOpacity
                              style={s.markUnavailableBtn}
                              onPress={() => openSubstitutionDrawer(item)}
                              activeOpacity={0.7}
                            >
                              <Text style={s.markUnavailableBtnText}>Item unavailable</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* RIGHT COLUMN (5/12): Order Context, Customer Privacy & Payout Summary */}
                <View style={s.colRight}>
                  
                  {/* Customer Privacy Card */}
                  <View style={s.sectionCard}>
                    <Text style={s.drawerSectionLabel}>CUSTOMER & LOCALITY</Text>
                    <Text style={s.customerNameText}>Priya S. • 📍 Benz Circle Area</Text>
                    <Text style={s.customerSubText}>Hub Zone 2 • Standard 10-min delivery radius</Text>

                    <View style={s.privacyNoticeBox}>
                      <Text style={s.privacyNoticeText}>
                        🔒 Customer phone number and exact door unit are protected by GlowVAI Privacy Guard until rider assignment.
                      </Text>
                    </View>

                    <TouchableOpacity style={s.supportEscalateBtn}>
                      <Text style={s.supportEscalateBtnText}>Report Order Issue / Support 💬</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Payment & Vendor Payout Breakdown */}
                  <View style={s.sectionCard}>
                    <Text style={s.drawerSectionLabel}>ORDER FINANCIAL SUMMARY</Text>

                    <View style={s.feeRow}>
                      <Text style={s.feeLabel}>Item Subtotal</Text>
                      <Text style={s.feeVal}>₹{subtotal}</Text>
                    </View>

                    <View style={s.feeRow}>
                      <Text style={s.feeLabel}>Platform Commission (12%)</Text>
                      <Text style={s.feeVal}>-₹{platformFee}</Text>
                    </View>

                    <View style={s.feeRow}>
                      <Text style={s.feeLabel}>GST on Commission (18%)</Text>
                      <Text style={s.feeVal}>-₹{(platformFee * 0.18).toFixed(2)}</Text>
                    </View>

                    <View style={[s.feeRow, s.netPayoutRow]}>
                      <Text style={s.netPayoutLabel}>Vendor Net Payout</Text>
                      <Text style={s.netPayoutVal}>₹{netEarnings}</Text>
                    </View>
                    <Text style={s.payoutSubNote}>88% net earnings auto-settled IMPS T+1 06:00 AM</Text>
                  </View>

                  {/* Right Column Sticky CTA */}
                  <View style={s.actionCard}>
                    <TouchableOpacity
                      style={[
                        s.ctaBtn,
                        hasUnresolvedIssue && s.ctaBtnWarning,
                        loading && s.ctaBtnDisabled,
                      ]}
                      onPress={handlePrimaryAction}
                      disabled={items.length === 0 || loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={s.ctaBtnText}>
                          {hasUnresolvedIssue
                            ? 'Resolve item issue →'
                            : allPicked
                            ? 'Start packing order →'
                            : 'Continue packing →'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                </View>
              </View>

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Item Substitution Modal Drawer */}
      <Modal
        visible={!!activeSubItem}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setActiveSubItem(null)}
      >
        <View style={s.modalOverlayNavy}>
          <View style={s.modalSheetContainer}>
            <View style={s.modalSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.modalSheetTitle}>Suggest Product Substitution</Text>
                <Text style={s.modalItemNotice}>
                  Original SKU Out of Stock: <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: Colors.textPrimary }}>{activeSubItem?.name}</Text> ({activeSubItem?.variant})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveSubItem(null)} style={s.modalCloseBtn}>
                <Ionicons name="close" size={18} style={{ color: '#475569' }} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSectionLabel}>COMPATIBLE IN-STOCK CATALOG ALTERNATIVES</Text>

            <ScrollView style={s.modalSubList} showsVerticalScrollIndicator={false}>
              {activeSubItem?.options?.map((opt, idx) => (
                <View key={idx} style={s.subOptionCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.subOptionTitle}>{opt.title}</Text>
                    <Text style={s.subOptionSub}>{opt.variant}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.suggestBtn}
                    onPress={() => handleSuggestReplacement(opt.title, opt.priceDiff)}
                  >
                    <Text style={s.suggestBtnText}>Suggest to Customer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={s.modalFooterRow}>
              <TouchableOpacity style={s.removeItemBtn} onPress={handleRemoveItem}>
                <Text style={s.removeItemBtnText}>Remove item from order</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.cancelSubBtn} onPress={() => setActiveSubItem(null)}>
                <Text style={s.cancelSubBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface, // Warm off-white #F8FAFC
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Navigation Rail */
  navRail: {
    width: 240,
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  railBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  railBrandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBrandLogoIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  railBrandTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  railBrandSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  railNavGroup: {
    gap: 6,
    flex: 1,
  },
  railNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadii.input,
  },
  railNavItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  railNavIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
  },
  railNavLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  railNavLabelActive: {
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  railFooter: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  storeSelectorPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: 8,
  },
  storeSelectorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railHelpBtn: {
    paddingVertical: 4,
  },
  railHelpText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  railProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 6,
  },
  railAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  railProfileName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  railProfileRole: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  /* Main Console Area */
  mainConsole: {
    flex: 1,
  },
  topHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  breadcrumbText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  overflowBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  overflowIcon: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Scroll Area */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  container1200: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadii.input,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Progress Bar Header */
  progressHeaderCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitleText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  slaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  slaBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.warning,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },

  /* 2-Column Grid Layout */
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  gridRowExpanded: {
    flexDirection: 'row',
  },
  colLeft: {
    flex: 7,
  },
  colRight: {
    flex: 5,
  },

  /* Section Cards & Checklist Table */
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  shelfFilterWrap: {
    width: 180,
  },
  shelfFilterInput: {
    height: 32,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    paddingHorizontal: 8,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  itemList: {
    gap: Spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  itemCardPicked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    opacity: 0.85,
  },
  itemCardUnavailable: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  checkboxArea: {
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxPicked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkboxDisabled: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  checkIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  warnIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemBrandText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  shelfTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadii.pill,
  },
  shelfTagText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  itemNameText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemNameTextPicked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  itemVariantText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  itemPriceText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 4,
  },

  /* Unavailable & Substitution Banners */
  markUnavailableBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadii.pill,
  },
  markUnavailableBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  subStatusBox: {
    marginTop: Spacing.xs,
  },
  subPendingBox: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: BorderRadii.input,
    gap: 4,
  },
  subPendingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.warning,
    lineHeight: 16,
  },
  changeSubBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  changeSubBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },
  subApprovedBox: {
    backgroundColor: '#F0FDF4',
    padding: Spacing.xs,
    borderRadius: BorderRadii.input,
  },
  subApprovedText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  subDeclinedBox: {
    backgroundColor: Colors.dangerLight,
    padding: Spacing.xs,
    borderRadius: BorderRadii.input,
  },
  subDeclinedText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  subRemovedText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Right Column Context Cards */
  drawerSectionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  customerNameText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customerSubText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  privacyNoticeBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    padding: 8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  privacyNoticeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  supportEscalateBtn: {
    paddingVertical: 4,
  },
  supportEscalateBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Financial Breakdown */
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  feeLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  feeVal: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  netPayoutRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  netPayoutLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.success,
  },
  netPayoutVal: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.success,
  },
  payoutSubNote: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  /* Sticky Right / Bottom Action Card */
  actionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  ctaBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnWarning: {
    backgroundColor: Colors.warning,
  },
  ctaBtnDisabled: {
    opacity: 0.7,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },

  /* Modal Overlay Drawer */
  modalOverlayNavy: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalSheetContainer: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: Colors.card,
    borderRadius: BorderRadii.card,
    padding: Spacing.xl,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseIcon: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Colors.textMuted,
  },
  modalItemNotice: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  modalSubList: {
    maxHeight: 240,
    marginBottom: Spacing.lg,
  },
  subOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadii.input,
    backgroundColor: Colors.surface,
    marginBottom: 8,
    gap: Spacing.md,
  },
  subOptionTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subOptionSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  suggestBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadii.input,
  },
  suggestBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  removeItemBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeItemBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.danger,
  },
  cancelSubBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSubBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
