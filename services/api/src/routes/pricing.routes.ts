import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';

const router = Router();

// POST /api/pricing/check (Internal AI Agent endpoint)
router.post('/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const { listing_id, is_flagged_high, fair_price_min, fair_price_max } = req.body;
    
    if (!listing_id) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'Missing listing_id'));
      return;
    }
    
    const updatedListing = await prisma.listings.update({
      where: { id: listing_id },
      data: {
        is_flagged_high: is_flagged_high !== undefined ? is_flagged_high : undefined,
        fair_price_min: fair_price_min !== undefined ? fair_price_min : undefined,
        fair_price_max: fair_price_max !== undefined ? fair_price_max : undefined,
      }
    });
    
    res.json(successResponse(updatedListing));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to process pricing check'));
  }
});

export default router;
