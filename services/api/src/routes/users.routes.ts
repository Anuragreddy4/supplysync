import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';
import { user_role, business_type } from '@prisma/client';

const router = Router();

router.patch('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = req.firebaseUser!;
    const { business_type, business_name, phone, latitude, longitude, address_text, role } = req.body;

    // Fetch existing user to check if role is already set
    const existingUser = await prisma.users.findUnique({
      where: { firebase_uid: uid },
    });

    if (!existingUser) {
      res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
      return;
    }

    const updateData: any = {
      business_type: business_type as business_type | undefined,
      business_name,
      phone,
      latitude,
      longitude,
      address_text,
    };

    // Set role only if it hasn't been set yet
    if (!existingUser.role && role) {
      if (role === 'buyer' || role === 'supplier') {
        updateData.role = role as user_role;
      } else {
        res.status(400).json(errorResponse('INVALID_INPUT', 'Role must be buyer or supplier'));
        return;
      }
    } else if (existingUser.role && role && existingUser.role !== role) {
       res.status(403).json(errorResponse('FORBIDDEN', 'Role cannot be changed once set'));
       return;
    }

    const updatedUser = await prisma.users.update({
      where: { firebase_uid: uid },
      data: updateData,
    });

    res.json(successResponse(updatedUser));
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to update profile'));
  }
});

export default router;
