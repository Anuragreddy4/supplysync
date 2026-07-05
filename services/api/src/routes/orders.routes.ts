import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';

const router = Router();

// GET /api/orders/mine
router.get('/mine', requireAuth, async (req: Request, res: Response) => {
  try {
    const dbUser = await prisma.users.findUnique({
      where: { firebase_uid: req.firebaseUser!.uid },
    });
    
    if (!dbUser) {
      res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
      return;
    }
    
    const orders = await prisma.orders.findMany({
      where: dbUser.role === 'buyer' 
        ? { buyer_id: dbUser.id } 
        : { supplier_id: dbUser.id },
      include: {
        listings: {
          select: {
            material_name: true,
            category: true,
            unit: true,
          }
        },
        users_buyer: { select: { display_name: true, business_name: true, phone: true } },
        users_supplier: { select: { display_name: true, business_name: true, phone: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    
    res.json(successResponse(orders));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch orders'));
  }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dbUser = await prisma.users.findUnique({
      where: { firebase_uid: req.firebaseUser!.uid },
    });
    
    if (!dbUser) {
      res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
      return;
    }
    
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        listings: {
          select: {
            material_name: true,
            category: true,
            unit: true,
          }
        },
        users_buyer: { select: { display_name: true, business_name: true, phone: true } },
        users_supplier: { select: { display_name: true, business_name: true, phone: true } },
      }
    });
    
    if (!order) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
      return;
    }
    
    // Ensure the user is either the buyer or supplier of this order
    if (order.buyer_id !== dbUser.id && order.supplier_id !== dbUser.id) {
      res.status(403).json(errorResponse('FORBIDDEN', 'You do not have permission to view this order'));
      return;
    }
    
    res.json(successResponse(order));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch order details'));
  }
});

// POST /api/orders
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const dbUser = await prisma.users.findUnique({
      where: { firebase_uid: req.firebaseUser!.uid },
    });
    
    if (!dbUser || dbUser.role !== 'buyer') {
      res.status(403).json(errorResponse('FORBIDDEN', 'Only buyers can place orders'));
      return;
    }
    
    const { listing_id, quantity } = req.body;
    
    if (!listing_id || quantity === undefined || quantity <= 0) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'listing_id and valid quantity are required'));
      return;
    }

    // Transaction to safely check inventory and decrement
    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.listings.findUnique({
        where: { id: listing_id },
      });
      
      if (!listing) {
        throw new Error('LISTING_NOT_FOUND');
      }
      
      if (Number(listing.stock_qty) < quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }
      
      const updatedListing = await tx.listings.update({
        where: { id: listing_id },
        data: {
          stock_qty: {
            decrement: quantity
          }
        }
      });
      
      const totalPrice = Number(listing.price_per_unit) * quantity;
      
      const order = await tx.orders.create({
        data: {
          buyer_id: dbUser.id,
          supplier_id: listing.supplier_id,
          listing_id: listing.id,
          quantity,
          total_price: totalPrice,
          status: 'pending',
        }
      });
      
      return order;
    });
    
    res.status(201).json(successResponse(result));
  } catch (error: any) {
    if (error.message === 'LISTING_NOT_FOUND') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Listing not found'));
    } else if (error.message === 'INSUFFICIENT_STOCK') {
      res.status(400).json(errorResponse('INSUFFICIENT_STOCK', 'Not enough stock available'));
    } else {
      res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to create order'));
    }
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, delivery_eta } = req.body; // status must be 'delivered', etc.
    
    const dbUser = await prisma.users.findUnique({
      where: { firebase_uid: req.firebaseUser!.uid },
    });
    
    if (!dbUser || dbUser.role !== 'supplier') {
      res.status(403).json(errorResponse('FORBIDDEN', 'Only suppliers can update order status'));
      return;
    }
    
    const existingOrder = await prisma.orders.findUnique({
      where: { id },
    });
    
    if (!existingOrder) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
      return;
    }
    
    if (existingOrder.supplier_id !== dbUser.id) {
      res.status(403).json(errorResponse('FORBIDDEN', 'You do not own this order'));
      return;
    }
    
    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: {
        status: status as any,
        delivery_eta: delivery_eta ? new Date(delivery_eta) : undefined,
        delivered_at: status === 'delivered' ? new Date() : undefined,
      }
    });
    
    // If transition to delivered, write a trust event
    if (status === 'delivered') {
      const now = new Date();
      const eta = existingOrder.delivery_eta || updatedOrder.delivery_eta;
      let event_type = 'on_time_delivery';
      
      if (eta && now > eta) {
        event_type = 'late_delivery';
      }
      
      await prisma.trust_events.create({
        data: {
          supplier_id: dbUser.id,
          order_id: id,
          event_type,
          score_delta: event_type === 'on_time_delivery' ? 1.0 : -2.0, // Arbitrary delta for DB entry
          note: `Delivery completed on ${now.toISOString()}`
        }
      });
      
      // Call AI Agents service (fire and forget)
      const agentUrl = process.env.AI_AGENTS_BASE_URL || 'http://localhost:5000';
      fetch(`${agentUrl}/api/trust/recompute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: dbUser.id })
      }).catch(err => console.error('Failed to trigger trust recompute:', err));
    }
    
    res.json(successResponse(updatedOrder));
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to update order status'));
  }
});

export default router;
