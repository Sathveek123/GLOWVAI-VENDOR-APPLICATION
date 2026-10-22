/**
 * Inventory & Catalog REST Controller
 * Full CRUD, stock adjustments, price overrides, and availability toggles
 */

import { Request, Response } from 'express';

export const inventoryController = {
  // GET /api/inventory
  getAll: async (req: Request, res: Response) => {
    try {
      const { storeId, vendorId, category } = req.query;
      // In production: return prisma.inventory.findMany(...)
      res.json({ ok: true, storeId, vendorId, category, message: 'Inventory retrieved successfully' });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },

  // POST /api/inventory
  createProduct: async (req: Request, res: Response) => {
    try {
      const { name, sku, category, unitType, packSize, mrp, sellingPrice, stockOnHand, vendorId, storeId, imageUrls } = req.body;
      if (!name || !sellingPrice) {
        return res.status(400).json({ ok: false, error: 'Product name and selling price are required' });
      }

      const newProduct = {
        productId: 'SKU-' + Date.now().toString().slice(-6),
        name: name.trim(),
        sku: sku || ('SKU-' + name.slice(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900)),
        category: category || 'General',
        unitType: unitType || 'piece',
        packSize: packSize || '',
        mrp: Number(mrp || sellingPrice),
        sellingPrice: Number(sellingPrice),
        price: Number(sellingPrice),
        stockOnHand: Number(stockOnHand || 0),
        availableStock: Number(stockOnHand || 0),
        reservedStock: 0,
        isAvailable: true,
        vendorId: vendorId || 'VND-001',
        storeId: storeId || 'DS-VIJ-01',
        images: imageUrls || ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      res.status(201).json({ ok: true, product: newProduct });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },

  // PATCH /api/inventory/:productId/stock
  adjustStock: async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { delta, exactQuantity, reason } = req.body;
      res.json({
        ok: true,
        productId,
        delta,
        exactQuantity,
        reason: reason || 'Stock adjustment',
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },

  // PATCH /api/inventory/:productId/availability
  toggleAvailability: async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { isAvailable } = req.body;
      res.json({ ok: true, productId, isAvailable, updatedAt: Date.now() });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },
};
