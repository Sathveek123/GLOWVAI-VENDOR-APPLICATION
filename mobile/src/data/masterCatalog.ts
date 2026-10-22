/**
 * GlowVAI Master Beauty & Skincare Catalog
 * Standardized, verified SKUs with official fixed MRPs, brand tags, categories, and 12% platform fee calculation.
 */

export interface MasterProduct {
  sku: string;
  name: string;
  brand: string;
  category: 'Skincare' | 'Sunscreen' | 'Cleanser' | 'Makeup' | 'Hair Care' | 'Body Care';
  mrp: number;
  image: string;
  volume: string;
  rating: number;
  demandTag: '🔥 HOT' | '⚡ FAST MOVING' | '⭐ TOP SELLER' | '✨ NEW';
  shelfBin: string;
}

export const GLOWVAI_COMMISSION_RATE = 0.12; // 12% Flat GlowVAI 10-Min Dispatch & Tech Fee

export function calculateVendorPayout(mrp: number): {
  mrp: number;
  platformFee: number;
  vendorPayout: number;
  payoutPercent: number;
} {
  const platformFee = Math.round(mrp * GLOWVAI_COMMISSION_RATE * 100) / 100;
  const vendorPayout = Math.round((mrp - platformFee) * 100) / 100;
  return {
    mrp,
    platformFee,
    vendorPayout,
    payoutPercent: 88, // 100 - 12%
  };
}

export const MASTER_BEAUTY_CATALOG: MasterProduct[] = [
  {
    sku: 'MIN-NIAC-30ML',
    name: 'Minimalist 10% Niacinamide Face Serum with Zinc',
    brand: 'Minimalist',
    category: 'Skincare',
    mrp: 599,
    volume: '30 ml',
    image: '🧴',
    rating: 4.9,
    demandTag: '🔥 HOT',
    shelfBin: 'RACK-A-01',
  },
  {
    sku: 'CER-HYD-CLNS-237',
    name: 'CeraVe Hydrating Facial Cleanser for Normal to Dry Skin',
    brand: 'CeraVe',
    category: 'Cleanser',
    mrp: 999,
    volume: '237 ml',
    image: '🧼',
    rating: 4.95,
    demandTag: '⭐ TOP SELLER',
    shelfBin: 'RACK-A-04',
  },
  {
    sku: 'REQ-MATTE-SPF50',
    name: 'Re\'equil Ultra Matte Dry Touch Sunscreen Gel SPF 50 PA++++',
    brand: 'Re\'equil',
    category: 'Sunscreen',
    mrp: 699,
    volume: '50 g',
    image: '☀️',
    rating: 4.88,
    demandTag: '⚡ FAST MOVING',
    shelfBin: 'RACK-B-02',
  },
  {
    sku: 'DOT-VITC-20ML',
    name: 'Dot & Key 10% Vitamin C + E Super Bright Face Serum',
    brand: 'Dot & Key',
    category: 'Skincare',
    mrp: 499,
    volume: '20 ml',
    image: '🍊',
    rating: 4.82,
    demandTag: '🔥 HOT',
    shelfBin: 'RACK-A-08',
  },
  {
    sku: 'ORD-SALIC-30ML',
    name: 'The Ordinary Salicylic Acid 2% Solution',
    brand: 'The Ordinary',
    category: 'Skincare',
    mrp: 700,
    volume: '30 ml',
    image: '✨',
    rating: 4.91,
    demandTag: '⭐ TOP SELLER',
    shelfBin: 'RACK-A-02',
  },
  {
    sku: 'PLM-TONER-200ML',
    name: 'Plum Green Tea Alcohol-Free Face Toner',
    brand: 'Plum',
    category: 'Skincare',
    mrp: 390,
    volume: '200 ml',
    image: '🍵',
    rating: 4.78,
    demandTag: '⚡ FAST MOVING',
    shelfBin: 'RACK-B-09',
  },
  {
    sku: 'MAY-LIP-INK-15',
    name: 'Maybelline Superstay Matte Ink Liquid Lipstick - Lover',
    brand: 'Maybelline',
    category: 'Makeup',
    mrp: 699,
    volume: '5 ml',
    image: '💄',
    rating: 4.85,
    demandTag: '🔥 HOT',
    shelfBin: 'RACK-C-01',
  },
  {
    sku: 'CET-GENT-CLNS-250',
    name: 'Cetaphil Gentle Skin Cleanser for All Skin Types',
    brand: 'Cetaphil',
    category: 'Cleanser',
    mrp: 435,
    volume: '250 ml',
    image: '🧴',
    rating: 4.92,
    demandTag: '⭐ TOP SELLER',
    shelfBin: 'RACK-A-05',
  },
  {
    sku: 'NYK-MATTE-LIP-CHAI',
    name: 'Nykaa Matte to Last! Liquid Lipstick - Chai 05',
    brand: 'Nykaa',
    category: 'Makeup',
    mrp: 675,
    volume: '4.5 ml',
    image: '💋',
    rating: 4.8,
    demandTag: '⚡ FAST MOVING',
    shelfBin: 'RACK-C-03',
  },
  {
    sku: 'LOR-HYAL-SERUM-30',
    name: 'L\'Oreal Paris Revitalift 1.5% Hyaluronic Acid Serum',
    brand: 'L\'Oreal',
    category: 'Skincare',
    mrp: 999,
    volume: '30 ml',
    image: '💧',
    rating: 4.89,
    demandTag: '🔥 HOT',
    shelfBin: 'RACK-A-03',
  },
  {
    sku: 'NEU-HYDRO-BOOST-50',
    name: 'Neutrogena Hydro Boost Water Gel Moisturizer',
    brand: 'Neutrogena',
    category: 'Skincare',
    mrp: 950,
    volume: '50 g',
    image: '🌊',
    rating: 4.94,
    demandTag: '⭐ TOP SELLER',
    shelfBin: 'RACK-B-01',
  },
  {
    sku: 'DER-10NIAC-30ML',
    name: 'The Derma Co 10% Niacinamide Face Serum with Zinc',
    brand: 'The Derma Co',
    category: 'Skincare',
    mrp: 599,
    volume: '30 ml',
    image: '🧬',
    rating: 4.81,
    demandTag: '⚡ FAST MOVING',
    shelfBin: 'RACK-A-09',
  },
];
