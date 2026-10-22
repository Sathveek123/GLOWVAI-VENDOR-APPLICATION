/**
 * Support & Returns Data Adapter
 * File: mobile/src/features/support/adapter.ts
 * Manages customer returns, reviews, rating analytics, and order-scoped chat threads
 */

export const USE_MOCK_SUPPORT_EXTRAS = true;

export interface ReturnItem {
  returnId: string;
  orderId: string;
  productId: string;
  productName: string;
  variant?: string;
  quantity: number;
  customerFirstName: string;
  customerArea: string;
  reason: string;
  customerNote: string;
  customerPhotos: string[];
  vendorPhotos?: string[];
  refundRequestedAmount: number;
  status:
    | 'Requested'
    | 'Pickup scheduled'
    | 'In transit'
    | 'Received'
    | 'Inspecting'
    | 'Approved'
    | 'Partially approved'
    | 'Rejected'
    | 'Refunded'
    | 'Escalated'
    | 'Closed';
  slaDeadlineMinutes: number;
  createdAt: string;
}

export interface ReviewItem {
  reviewId: string;
  orderId: string;
  productId: string;
  productName: string;
  variant?: string;
  stars: number;
  text: string;
  customerFirstName: string;
  createdAt: string;
  vendorReply?: {
    text: string;
    createdAt: string;
  };
  photos?: string[];
}

export interface ChatMessage {
  messageId: string;
  threadId: string;
  sender: 'vendor' | 'customer' | 'system' | 'support';
  text: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  attachments?: string[];
  state?: 'Sending' | 'Sent' | 'Delivered' | 'Read' | 'Failed';
}

export interface ChatThread {
  threadId: string;
  orderId: string;
  orderStatus: string;
  customerFirstName: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
  status: 'Open' | 'Waiting for customer' | 'Waiting for you' | 'Closed' | 'Escalated';
  tags: string[];
}

// ── Mock Initial Data ────────────────────────────────────────────────────────
const MOCK_RETURNS: ReturnItem[] = [
  {
    returnId: 'RT-1042',
    orderId: 'GV-9912',
    productId: 'SKU-MAYB-003',
    productName: 'Maybelline Superstay Matte Ink Lipstick',
    variant: 'Pioneer (Red)',
    quantity: 1,
    customerFirstName: 'Priya',
    customerArea: 'Benz Circle',
    reason: 'Damaged on arrival',
    customerNote: 'Outer cap was cracked upon delivery.',
    customerPhotos: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&q=80'],
    refundRequestedAmount: 649,
    status: 'Inspecting',
    slaDeadlineMinutes: 180, // 3 hours left
    createdAt: '2026-10-07T14:30:00Z',
  },
  {
    returnId: 'RT-1043',
    orderId: 'GV-9911',
    productId: 'SKU-CERAVE-002',
    productName: 'CeraVe Hydrating Facial Cleanser 237ml',
    quantity: 1,
    customerFirstName: 'Ananya',
    customerArea: 'MG Road',
    reason: 'Skin reaction or allergy',
    customerNote: 'Mild redness after first application.',
    customerPhotos: [],
    refundRequestedAmount: 899,
    status: 'Requested',
    slaDeadlineMinutes: 320,
    createdAt: '2026-10-07T16:15:00Z',
  },
];

const MOCK_REVIEWS: ReviewItem[] = [
  {
    reviewId: 'REV-201',
    orderId: 'GV-9912',
    productId: 'SKU-NIAC-001',
    productName: 'Minimalist 10% Niacinamide Serum 30ml',
    stars: 5,
    text: 'Genuine skincare product! Packaging was intact and delivery was super fast.',
    customerFirstName: 'Priya',
    createdAt: '2026-10-06T18:20:00Z',
    photos: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80'],
  },
  {
    reviewId: 'REV-202',
    orderId: 'GV-9908',
    productId: 'SKU-DOT-004',
    productName: 'Dot & Key Vitamin C Sunscreen SPF 50',
    stars: 4,
    text: 'Good sunscreen, no white cast. Would appreciate slightly cooler packaging next time.',
    customerFirstName: 'Rajesh',
    createdAt: '2026-10-05T11:45:00Z',
    vendorReply: {
      text: 'Thank you for your feedback! We pack all cosmetics in temperature-shielded mailers.',
      createdAt: '2026-10-05T14:00:00Z',
    },
  },
];

const MOCK_THREADS: ChatThread[] = [
  {
    threadId: 'TH-301',
    orderId: 'GV-9912',
    orderStatus: 'PACKING',
    customerFirstName: 'Priya',
    lastMessage: 'Can you please ensure the bottle cap is sealed tight?',
    unreadCount: 1,
    updatedAt: '10:14 AM',
    status: 'Waiting for you',
    tags: ['Packaging', 'Order GV-9912'],
  },
  {
    threadId: 'TH-302',
    orderId: 'GV-9911',
    orderStatus: 'DISPATCHED',
    customerFirstName: 'Ananya',
    lastMessage: 'Rider is on the way, thank you!',
    unreadCount: 0,
    updatedAt: 'Yesterday',
    status: 'Waiting for customer',
    tags: ['Delivery'],
  },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'TH-301': [
    {
      messageId: 'M1',
      threadId: 'TH-301',
      sender: 'system',
      text: 'Order #GV-9912 accepted by store. Order-scoped chat active.',
      sentAt: '10:05 AM',
    },
    {
      messageId: 'M2',
      threadId: 'TH-301',
      sender: 'customer',
      text: 'Can you please ensure the bottle cap is sealed tight?',
      sentAt: '10:14 AM',
    },
  ],
};

// ── Data Methods ─────────────────────────────────────────────────────────────

export async function fetchReturns(): Promise<ReturnItem[]> {
  return MOCK_RETURNS;
}

export async function submitReturnDecision(returnId: string, decision: 'Approved' | 'Partially approved' | 'Rejected', reason?: string): Promise<boolean> {
  const ret = MOCK_RETURNS.find(r => r.returnId === returnId);
  if (ret) {
    ret.status = decision;
  }
  return true;
}

export async function fetchReviews(): Promise<ReviewItem[]> {
  return MOCK_REVIEWS;
}

export async function postReviewReply(reviewId: string, replyText: string): Promise<boolean> {
  const rev = MOCK_REVIEWS.find(r => r.reviewId === reviewId);
  if (rev) {
    rev.vendorReply = {
      text: replyText,
      createdAt: new Date().toISOString(),
    };
  }
  return true;
}

export async function fetchChatThreads(): Promise<ChatThread[]> {
  return MOCK_THREADS;
}

export async function fetchThreadMessages(threadId: string): Promise<ChatMessage[]> {
  return MOCK_MESSAGES[threadId] || [];
}

export async function sendChatMessage(threadId: string, text: string): Promise<ChatMessage> {
  // Privacy & Safety Check Guard
  const phoneOrContactRegex = /(\+?\d{10,12}|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\bupi\b|http|www\.)/i;
  if (phoneOrContactRegex.test(text)) {
    throw new Error("For your safety, don't share contact details (phone, email, links, or UPI IDs) here.");
  }

  const newMsg: ChatMessage = {
    messageId: `M-${Date.now()}`,
    threadId,
    sender: 'vendor',
    text,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    state: 'Sent',
  };

  if (!MOCK_MESSAGES[threadId]) MOCK_MESSAGES[threadId] = [];
  MOCK_MESSAGES[threadId].push(newMsg);
  return newMsg;
}
