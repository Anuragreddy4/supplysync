import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';

const router = Router();

router.post('/session', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.firebaseUser!;
    
    // Check if a user with this email already exists – email is unique in the DB
    let dbUser = await prisma.users.findUnique({
      where: { email: user.email || '' },
    });
    if (!dbUser) {
      // No existing user, create a new one
      dbUser = await prisma.users.create({
        data: {
          firebase_uid: user.uid,
          email: user.email || '',
          display_name: user.name || 'Unknown User',
          photo_url: user.picture || null,
          role: null,
        },
      });
    } else {
      // Existing user – optionally update firebase_uid if it changed
      if (dbUser.firebase_uid !== user.uid) {
        dbUser = await prisma.users.update({
          where: { id: dbUser.id },
          data: { firebase_uid: user.uid },
        });
      }
    }

    res.json(successResponse(dbUser));
  } catch (error) {
  } catch (error) {
    console.error('Session Error:', error);
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', `Failed to process session: ${error instanceof Error ? error.message : String(error)}`));
  }
});

export default router;
