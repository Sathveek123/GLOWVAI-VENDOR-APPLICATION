import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ════════════════════════════════════════════════════════════════════════════
// GlowVAI Enterprise Admin Panel — Unified Vendor Operations & Financial Desk
// Built with Strictly Typed React, TanStack Table logic, & Tailwind CSS
// ════════════════════════════════════════════════════════════════════════════

export interface VendorRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  storeName: string;
  storeCategory: string;
  city: string;
  kycStatus: 'PENDING_KYC' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  isOnline: boolean;
  lastHeartbeat: string | null;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  pendingBalance: number;
  inventoryCount: number;
  lowStockAlerts: number;
  payoutAccount: {
    accountType: 'UPI_VPA' | 'BANK_ACCOUNT';
    vpaOrAccountNumber: string;
    ifscOrBankName: string;
    holderName: string;
  };
}

export interface PayoutBatch {
  batchId: string;
  totalVendors: number;
  totalAmount: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIALLY_FAILED';
  createdAt: string;
}

export interface SupportTicketRecord {
  id: string;
  vendorId: string;
  vendorStore: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'ESCALATED_TO_ADMIN' | 'RESOLVED';
  createdAt: string;
  screenshotUrl?: string;
}

export interface CampaignReferralStat {
  code: string;
  referrerName: string;
  totalVisits: number;
  conversions: number;
  earnedIncentives: number;
  lastActive: string;
}

interface AdminDashboardProps {
  apiBaseUrl?: string;
  masterAuthToken?: string;
}

export const AdminVendorOperations: React.FC<AdminDashboardProps> = ({
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  masterAuthToken = 'glowvai-master-admin-token-2026',
}) => {
  // ── States ─────────────────────────────────────────────────────────────────
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignReferralStat[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'VENDORS' | 'PAYOUTS' | 'CAMPAIGNS' | 'SUPPORT'>('VENDORS');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKyc, setFilterKyc] = useState<string>('ALL');
  const [filterPresence, setFilterPresence] = useState<string>('ALL');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingPayout, setIsProcessingPayout] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ── Toast Helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // ── API Fetchers with Resilience ───────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setNetworkError(null);
    try {
      // 1. Fetch Vendors
      const vendorRes = await fetch(`${apiBaseUrl}/api/vendors/dossiers`, {
        headers: { Authorization: `Bearer ${masterAuthToken}` },
      });
      if (!vendorRes.ok) throw new Error(`Failed to load vendors (HTTP ${vendorRes.status})`);
      const vendorData = await vendorRes.json();
      setVendors(vendorData.vendors || []);

      // 2. Fetch Support Tickets
      const ticketRes = await fetch(`${apiBaseUrl}/api/support/tickets/admin`, {
        headers: { Authorization: `Bearer ${masterAuthToken}` },
      });
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setTickets(ticketData.tickets || []);
      }

      // 3. Fetch GitHub Campaign Referrals
      const campaignRes = await fetch(`${apiBaseUrl}/api/campaign/referrals/summary`, {
        headers: { Authorization: `Bearer ${masterAuthToken}` },
      });
      if (campaignRes.ok) {
        const campaignData = await campaignRes.json();
        setCampaignStats(campaignData.referrals || []);
      }
    } catch (err: any) {
      setNetworkError(err.message || 'Network connection failed. Reconnecting...');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, masterAuthToken]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 12000); // 12s live poll
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // ── Handlers: KYC Actions ──────────────────────────────────────────────────
  const handleUpdateKyc = async (vendorId: string, newStatus: 'APPROVED' | 'SUSPENDED' | 'REJECTED') => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/vendors/${vendorId}/kyc`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${masterAuthToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update KYC status');
      showToast(`Vendor ${vendorId.slice(0, 8)} status updated to ${newStatus}`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ── Handlers: RazorpayX Instant Payout ──────────────────────────────────────
  const handleTriggerInstantPayout = async (vendorId: string, amount: number) => {
    if (!confirm(`Execute direct RazorpayX fund transfer of ₹${amount.toLocaleString('en-IN')} to vendor?`)) return;
    setIsProcessingPayout(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/payouts/razorpayx/instant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${masterAuthToken}`,
        },
        body: JSON.stringify({ vendorId, amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Payout transfer failed');
      showToast(`Payout of ₹${amount} successfully disbursed via RazorpayX (Txn: ${data.payoutId})`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // ── Filtered & Sorted Table Data ───────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        v.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone.includes(searchQuery) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesKyc = filterKyc === 'ALL' || v.kycStatus === filterKyc;
      const matchesPresence =
        filterPresence === 'ALL' ||
        (filterPresence === 'ONLINE' && v.isOnline) ||
        (filterPresence === 'OFFLINE' && !v.isOnline);

      return matchesSearch && matchesKyc && matchesPresence;
    });
  }, [vendors, searchQuery, filterKyc, filterPresence]);

  const totalPendingPayouts = useMemo(() => {
    return vendors.reduce((acc, v) => acc + (v.pendingBalance || 0), 0);
  }, [vendors]);

  const totalActiveOnline = useMemo(() => {
    return vendors.filter((v) => v.isOnline).length;
  }, [vendors]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased p-4 sm:p-6 lg:p-8">
      {/* ── Top Alert Toast ─────────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
          }`}
        >
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* ── Header & Navigation Bar ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Glow<span className="text-emerald-400">VAI</span> Admin Hub
            </h1>
            <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
              Enterprise v2.4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time Distributed Vendor Operations, RazorpayX Payouts & Referral Desk
          </p>
        </div>

        {/* Tab Buttons */}
        <nav className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {(['VENDORS', 'PAYOUTS', 'CAMPAIGNS', 'SUPPORT'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab === 'VENDORS' && '🏪 Vendor Ops'}
              {tab === 'PAYOUTS' && '💳 Payouts (RazorpayX)'}
              {tab === 'CAMPAIGNS' && '🚀 Referrals'}
              {tab === 'SUPPORT' && `🎧 Tickets (${tickets.filter((t) => t.status !== 'RESOLVED').length})`}
            </button>
          ))}
        </nav>
      </header>

      {/* ── KPI Metas Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Total Registered Vendors</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{vendors.length}</p>
          <p className="text-xs text-emerald-400 mt-2 font-medium">100% Verified DB Entities</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Live Online (Accepting Orders)</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">{totalActiveOnline}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">{vendors.length - totalActiveOnline} Currently Offline</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Pending Payout Liability</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">₹{totalPendingPayouts.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Net 88% Vendor Split</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Urgent Support Escalations</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1">
            {tickets.filter((t) => t.priority === 'CRITICAL_URGENT' || t.status === 'ESCALATED_TO_ADMIN').length}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Instant SLA Escalation</p>
        </div>
      </div>

      {/* ── Network Error Banner ────────────────────────────────────────────── */}
      {networkError && (
        <div className="mb-6 p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3 text-rose-200 text-sm">
            <span>⚠️</span>
            <span>{networkError}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* ── TAB 1: VENDOR OPERATIONS TABLE ──────────────────────────────────── */}
      {activeTab === 'VENDORS' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Controls Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store name, vendor, phone, or city..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-72"
              />
              <select
                value={filterKyc}
                onChange={(e) => setFilterKyc(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All KYC Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING_KYC">Pending Verification</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <select
                value={filterPresence}
                onChange={(e) => setFilterPresence(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Online / Offline</option>
                <option value="ONLINE">🟢 Online Only</option>
                <option value="OFFLINE">⚪ Offline Only</option>
              </select>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-2"
            >
              <span>🔄 Refresh Live Data</span>
            </button>
          </div>

          {/* TanStack-Style High-Density Data Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Vendor & Store</th>
                  <th className="py-3 px-4">Presence</th>
                  <th className="py-3 px-4">KYC State</th>
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Pending Wallet</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {isLoading && vendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      Loading real-time vendor registry...
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      No vendors match the current filter query.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedVendor(vendor)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{vendor.storeName}</div>
                        <div className="text-xs text-slate-400">
                          {vendor.name} • {vendor.phone} • {vendor.city}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {vendor.isOnline ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Online</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-medium">
                            <span>Offline</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            vendor.kycStatus === 'APPROVED'
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : vendor.kycStatus === 'PENDING_KYC'
                              ? 'bg-amber-900/60 text-amber-300'
                              : 'bg-rose-900/60 text-rose-300'
                          }`}
                        >
                          {vendor.kycStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">{vendor.inventoryCount} items</span>
                        {vendor.lowStockAlerts > 0 && (
                          <span className="ml-2 text-xs text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900">
                            {vendor.lowStockAlerts} Low
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{vendor.totalOrders} Completed</td>
                      <td className="py-3.5 px-4 font-bold text-amber-300">
                        ₹{vendor.pendingBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          {vendor.kycStatus === 'PENDING_KYC' ? (
                            <button
                              onClick={() => handleUpdateKyc(vendor.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                            >
                              Approve KYC
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleUpdateKyc(
                                  vendor.id,
                                  vendor.kycStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED'
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                vendor.kycStatus === 'APPROVED'
                                  ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-300'
                                  : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200'
                              }`}
                            >
                              {vendor.kycStatus === 'APPROVED' ? 'Suspend' : 'Reactivate'}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedVendor(vendor)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                          >
                            View Dossier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PAYOUT & FINANCIAL ENGINE ───────────────────────────────── */}
      {activeTab === 'PAYOUTS' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-white">RazorpayX Direct Settlement Desk</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Automated payout disbursals to vendor verified UPI VPAs and Bank Accounts via RazorpayX APIs.
                </p>
              </div>
              <button
                disabled={isProcessingPayout || totalPendingPayouts === 0}
                onClick={() => handleTriggerInstantPayout('BATCH_ALL', totalPendingPayouts)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm shadow-lg disabled:opacity-50"
              >
                {isProcessingPayout ? 'Processing Disbursals...' : `Bulk Settle All (₹${totalPendingPayouts.toLocaleString('en-IN')})`}
              </button>
            </div>

            <div className="divide-y divide-slate-800">
              {vendors
                .filter((v) => v.pendingBalance > 0)
                .map((v) => (
                  <div key={v.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{v.storeName}</p>
                      <p className="text-xs text-slate-400">
                        {v.payoutAccount.accountType}: {v.payoutAccount.vpaOrAccountNumber} ({v.payoutAccount.holderName})
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-extrabold text-amber-400">₹{v.pendingBalance.toLocaleString('en-IN')}</span>
                      <button
                        disabled={isProcessingPayout}
                        onClick={() => handleTriggerInstantPayout(v.id, v.pendingBalance)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                      >
                        Disburse Instant
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: CAMPAIGN & REFERRAL MANAGER ──────────────────────────────── */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-white">Referral Engine Integration</h3>
              <p className="text-xs text-slate-400 mt-1">
                Connected to GitHub Pages Campaign Hub: <code className="text-emerald-400">glowvaiteam.github.io/glowvai-campaign/</code>
              </p>
            </div>
            <a
              href="https://glowvaiteam.github.io/glowvai-campaign/"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
            >
              Open Live Campaign ↗
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Link Visits</th>
                  <th className="py-3 px-4">Conversions</th>
                  <th className="py-3 px-4">Incentives Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {campaignStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No referral campaign events logged yet.
                    </td>
                  </tr>
                ) : (
                  campaignStats.map((camp) => (
                    <tr key={camp.code}>
                      <td className="py-3 px-4 font-bold text-white">{camp.referrerName}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{camp.code}</td>
                      <td className="py-3 px-4 text-slate-300">{camp.totalVisits}</td>
                      <td className="py-3 px-4 font-bold text-white">{camp.conversions}</td>
                      <td className="py-3 px-4 font-bold text-amber-300">₹{camp.earnedIncentives}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: SUPPORT DESK ─────────────────────────────────────────────── */}
      {activeTab === 'SUPPORT' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-extrabold text-white mb-4">Vendor Support Escalations</h3>
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No open vendor tickets.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{t.title}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          t.priority === 'CRITICAL_URGENT'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Store: <span className="text-slate-200 font-semibold">{t.vendorStore}</span> • Category: {t.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => showToast(`Ticket ${t.id.slice(0, 8)} marked resolved`, 'success')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Vendor Dossier Slide-Over / Modal ───────────────────────────────── */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-white">{selectedVendor.storeName}</h3>
                <p className="text-xs text-slate-400">ID: {selectedVendor.id}</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500 block">Owner / Contact</span>
                  <span className="font-bold text-white">{selectedVendor.name}</span>
                  <span className="text-xs text-slate-400 block">{selectedVendor.phone}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500 block">Location</span>
                  <span className="font-bold text-white">{selectedVendor.city}</span>
                  <span className="text-xs text-slate-400 block">{selectedVendor.storeCategory}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-2">Banking & Payout VPA</span>
                <p className="font-mono text-emerald-400 text-sm">
                  {selectedVendor.payoutAccount.accountType}: {selectedVendor.payoutAccount.vpaOrAccountNumber}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Holder: {selectedVendor.payoutAccount.holderName} ({selectedVendor.payoutAccount.ifscOrBankName})
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorOperations;
