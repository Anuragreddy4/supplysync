import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';

const router = Router();

router.post('/session', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.firebaseUser!;
    
    // Find existing user
    let dbUser = await prisma.users.findUnique({
      where: { firebase_uid: user.uid },
    });

    if (!dbUser) {
      dbUser = await prisma.users.create({
        data: {
          firebase_uid: user.uid,
          email: user.email || '',
          display_name: user.name || 'Unknown User',
          photo_url: user.picture || null,
          role: null, 
        },
      });
    }

    res.json(successResponse(dbUser));
  } catch (error) {
    console.error('Session Error:', error);
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to process session'));
  }
});

export default router;
