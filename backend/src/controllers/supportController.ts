/**
 * Support & Ticketing REST Controller
 * Direct ticket escalation between Vendor App and Centralized Admin Desk
 */

import { Request, Response } from 'express';

export const supportController = {
  // GET /api/support/tickets
  getTickets: async (req: Request, res: Response) => {
    try {
      const { vendorId, status } = req.query;
      res.json({
        ok: true,
        tickets: [
          {
            ticketNumber: 'TKT-4892',
            vendorId: vendorId || 'VND-001',
            subject: 'Payout mismatch for Order #ORD-699609',
            category: 'PAYOUT_DISPUTE',
            priority: 'HIGH',
            status: 'OPEN',
            createdAt: Date.now() - 3600000,
          },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },

  // POST /api/support/tickets
  createTicket: async (req: Request, res: Response) => {
    try {
      const { vendorId, subject, description, category, priority = 'MEDIUM', attachmentUrls } = req.body;
      if (!subject || !description) {
        return res.status(400).json({ ok: false, error: 'Subject and description are required' });
      }

      const ticket = {
        ticketNumber: 'TKT-' + Math.floor(1000 + Math.random() * 9000),
        vendorId: vendorId || 'VND-001',
        subject,
        description,
        category: category || 'GENERAL',
        priority,
        status: 'ESCALATED_TO_ADMIN',
        attachmentUrls: attachmentUrls || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      res.status(201).json({ ok: true, message: 'Ticket created and escalated to Admin Desk', ticket });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },
};
