/**
 * Catalog Data Adapter
 * File: mobile/src/features/catalog/adapter.ts
 * Integrates real vendor inventory APIs with mock fallback flags for backend extensions
 */

export const USE_MOCK_CATALOG_EXTRAS = true;

export interface ProductVariant {
  variantId: string;
  name: string;
  shadeCode?: string;
  colorHex?: string;
  sku: string;
  mrp: number;
  price: number;
  stockOnHand: number;
  reservedStock: number;
  availableStock: number;
  isAvailable: boolean;
}

export interface CatalogProduct {
  productId: string;
  name: string;
  brand: string;
  category: string;
  subCategory?: string;
  sku: string;
  mrp: number;
  price: number;
  stockOnHand: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  shelfTag?: string;
  images: string[];
  description?: string;
  variants?: ProductVariant[];
  hasVariants?: boolean;
  expiringSoonDays?: number; // Lowest days to expiry
}

export interface BatchItem {
  batchId: string;
  productId: string;
  productName: string;
  variantName?: string;
  lotCode: string;
  mfgDate: string;
  expiryDate: string;
  qtyReceived: number;
  qtyRemaining: number;
  shelf?: string;
  status: 'Good' | 'Near expiry' | 'Critical' | 'Expired' | 'Quarantined';
}

export interface DemandInsight {
  insightId: string;
  productName: string;
  brand: string;
  category: string;
  imageUrl: string;
  demandLevel: 'High' | 'Rising' | 'Steady';
  reasonTags: string[];
  suggestedMrp: number;
  alreadyInCatalog: boolean;
  inStockCount?: number;
}

// ── Initial Mock Catalog Data ────────────────────────────────────────────────
const MOCK_PRODUCTS: CatalogProduct[] = [
  {
    productId: 'SKU-NIAC-001',
    name: 'Minimalist 10% Niacinamide Serum 30ml',
    brand: 'Minimalist',
    category: 'Skincare',
    sku: 'NIAC-30ML',
    mrp: 649,
    price: 599,
    stockOnHand: 24,
    reservedStock: 2,
    availableStock: 22,
    lowStockThreshold: 5,
    isAvailable: true,
    shelfTag: 'A-01-02',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80'],
    description: 'Niacinamide serum for acne marks and blemishes.',
    expiringSoonDays: 120,
  },
  {
    productId: 'SKU-CERAVE-002',
    name: 'CeraVe Hydrating Facial Cleanser 237ml',
    brand: 'CeraVe',
    category: 'Skincare',
    sku: 'CER-HYD-237',
    mrp: 950,
    price: 899,
    stockOnHand: 4,
    reservedStock: 1,
    availableStock: 3,
    lowStockThreshold: 5,
    isAvailable: true,
    shelfTag: 'A-01-05',
    images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80'],
    expiringSoonDays: 14, // Critical
  },
  {
    productId: 'SKU-MAYB-003',
    name: 'Maybelline Superstay Matte Ink Liquid Lipstick',
    brand: 'Maybelline',
    category: 'Makeup',
    sku: 'MAY-MAT-INK',
    mrp: 699,
    price: 649,
    stockOnHand: 0,
    reservedStock: 0,
    availableStock: 0,
    lowStockThreshold: 5,
    isAvailable: true,
    shelfTag: 'B-02-01',
    hasVariants: true,
    images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&q=80'],
    variants: [
      {
        variantId: 'V-MAY-01',
        name: 'Pioneer (Red)',
        shadeCode: '#20',
        colorHex: '#B91C1C',
        sku: 'MAY-MAT-20',
        mrp: 699,
        price: 649,
        stockOnHand: 0,
        reservedStock: 0,
        availableStock: 0,
        isAvailable: true,
      },
      {
        variantId: 'V-MAY-02',
        name: 'Lover (Dusty Pink)',
        shadeCode: '#15',
        colorHex: '#EC4899',
        sku: 'MAY-MAT-15',
        mrp: 699,
        price: 649,
        stockOnHand: 8,
        reservedStock: 1,
        availableStock: 7,
        isAvailable: true,
      },
    ],
  },
  {
    productId: 'SKU-DOT-004',
    name: 'Dot & Key Vitamin C + E Super Bright Sunscreen SPF 50',
    brand: 'Dot & Key',
    category: 'Skincare',
    sku: 'DOT-SUN-50',
    mrp: 495,
    price: 449,
    stockOnHand: 18,
    reservedStock: 0,
    availableStock: 18,
    lowStockThreshold: 5,
    isAvailable: true,
    shelfTag: 'A-02-04',
    images: ['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80'],
    expiringSoonDays: 45, // Near expiry
  },
];

const MOCK_BATCHES: BatchItem[] = [
  {
    batchId: 'BAT-2026-01',
    productId: 'SKU-CERAVE-002',
    productName: 'CeraVe Hydrating Facial Cleanser 237ml',
    lotCode: 'LOT-CRV-991',
    mfgDate: '2024-10-01',
    expiryDate: '2026-10-22',
    qtyReceived: 30,
    qtyRemaining: 4,
    shelf: 'A-01-05',
    status: 'Critical',
  },
  {
    batchId: 'BAT-2026-02',
    productId: 'SKU-DOT-004',
    productName: 'Dot & Key Vitamin C + E Super Bright Sunscreen SPF 50',
    lotCode: 'LOT-DOT-442',
    mfgDate: '2024-11-15',
    expiryDate: '2026-11-20',
    qtyReceived: 50,
    qtyRemaining: 18,
    shelf: 'A-02-04',
    status: 'Near expiry',
  },
];

const MOCK_DEMAND: DemandInsight[] = [
  {
    insightId: 'INS-01',
    productName: 'Cetaphil Gentle Skin Cleanser 250ml',
    brand: 'Cetaphil',
    category: 'Skincare',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    demandLevel: 'High',
    reasonTags: ['Trending in Vijayawada', 'Top Searched'],
    suggestedMrp: 599,
    alreadyInCatalog: false,
  },
  {
    insightId: 'INS-02',
    productName: 'Minimalist 10% Niacinamide Serum 30ml',
    brand: 'Minimalist',
    category: 'Skincare',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
    demandLevel: 'High',
    reasonTags: ['High Repeat Purchase'],
    suggestedMrp: 649,
    alreadyInCatalog: true,
    inStockCount: 22,
  },
  {
    insightId: 'INS-03',
    productName: 'Neutrogena Hydro Boost Water Gel 50g',
    brand: 'Neutrogena',
    category: 'Skincare',
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80',
    demandLevel: 'Rising',
    reasonTags: ['Summer Demand Surge'],
    suggestedMrp: 1050,
    alreadyInCatalog: false,
  },
];

// ── Catalog Adapter API Methods ──────────────────────────────────────────────

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  // In a full production environment, this merges API data with mock extras
  return MOCK_PRODUCTS;
}

export async function updateProductStock(productId: string, newOnHand: number): Promise<CatalogProduct> {
  const prod = MOCK_PRODUCTS.find(p => p.productId === productId);
  if (!prod) throw new Error('Product not found');
  
  if (newOnHand < prod.reservedStock) {
    throw new Error(`${prod.reservedStock} units are reserved for active orders.`);
  }

  prod.stockOnHand = newOnHand;
  prod.availableStock = prod.stockOnHand - prod.reservedStock;
  return { ...prod };
}

export async function fetchBatches(): Promise<BatchItem[]> {
  return MOCK_BATCHES;
}

export async function fetchDemandInsights(): Promise<DemandInsight[]> {
  return MOCK_DEMAND;
}
