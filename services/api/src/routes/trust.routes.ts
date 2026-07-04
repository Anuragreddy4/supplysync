import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';

const router = Router();

// GET /api/trust/:supplierId
router.get('/:supplierId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    
    const supplier = await prisma.users.findUnique({
      where: { id: supplierId },
      select: { trust_score: true, role: true },
    });
    
    if (!supplier || supplier.role !== 'supplier') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Supplier not found'));
      return;
    }
    
    const recentEvents = await prisma.trust_events.findMany({
      where: { supplier_id: supplierId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
    
    res.json(successResponse({
      trust_score: supplier.trust_score,
      trust_events: recentEvents,
    }));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch trust details'));
  }
});

// POST /api/trust/recompute (Internal AI Agent endpoint)
router.post('/recompute', async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId, new_score } = req.body;
    
    if (!supplierId || new_score === undefined) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'Missing supplierId or new_score'));
      return;
    }
    
    const updatedUser = await prisma.users.update({
      where: { id: supplierId },
      data: { trust_score: new_score },
    });
    
    res.json(successResponse({ trust_score: updatedUser.trust_score }));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to recompute trust score'));
  }
});

export default router;
