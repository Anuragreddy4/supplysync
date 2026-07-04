import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';

const router = Router();

// POST /api/reviews
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id, rating, comment } = req.body;
    
    if (!order_id || rating === undefined || rating < 1 || rating > 5) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'Valid order_id and rating (1-5) are required'));
      return;
    }
    
    const dbUser = await prisma.users.findUnique({
      where: { firebase_uid: req.firebaseUser!.uid },
    });
    
    if (!dbUser || dbUser.role !== 'buyer') {
      res.status(403).json(errorResponse('FORBIDDEN', 'Only buyers can submit reviews'));
      return;
    }
    
    const order = await prisma.orders.findUnique({
      where: { id: order_id },
    });
    
    if (!order) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
      return;
    }
    
    if (order.buyer_id !== dbUser.id) {
      res.status(403).json(errorResponse('FORBIDDEN', 'You did not place this order'));
      return;
    }
    
    // Check if review already exists
    const existingReview = await prisma.reviews.findFirst({
      where: { order_id },
    });
    
    if (existingReview) {
      res.status(400).json(errorResponse('ALREADY_REVIEWED', 'You have already reviewed this order'));
      return;
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.reviews.create({
        data: {
          order_id,
          buyer_id: dbUser.id,
          supplier_id: order.supplier_id,
          rating,
          comment,
        }
      });
      
      const scoreDelta = rating >= 4 ? 1.5 : (rating <= 2 ? -2.0 : 0);
      
      await tx.trust_events.create({
        data: {
          supplier_id: order.supplier_id,
          order_id,
          event_type: 'review',
          score_delta: scoreDelta,
          note: `Received a ${rating}-star review`,
        }
      });
      
      return review;
    });
    
    // Call AI Agents service (fire and forget)
    const agentUrl = process.env.AI_AGENTS_BASE_URL || 'http://localhost:5000';
    fetch(`${agentUrl}/api/trust/recompute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId: order.supplier_id })
    }).catch(err => console.error('Failed to trigger trust recompute for review:', err));
    
    res.status(201).json(successResponse(result));
  } catch (error) {
    console.error('Submit Review Error:', error);
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to submit review'));
  }
});

export default router;
