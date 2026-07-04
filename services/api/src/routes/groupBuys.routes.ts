import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';
import { group_buy_status } from '@prisma/client';

const router = Router();

// GET /api/group-buys?material=&lat=&lng=
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { material, lat, lng } = req.query;
    
    const whereClause: any = {
      status: 'open',
    };
    
    if (material) {
      whereClause.material_name = {
        contains: material as string,
        mode: 'insensitive',
      };
    }
    
    let groupBuys = await prisma.group_buys.findMany({
      where: whereClause,
      include: {
        users: { select: { business_name: true, display_name: true, latitude: true, longitude: true } },
        participants: true,
      },
      orderBy: { created_at: 'desc' },
    });
    
    if (lat && lng) {
       const userLat = parseFloat(lat as string);
       const userLng = parseFloat(lng as string);
       
       if (!isNaN(userLat) && !isNaN(userLng)) {
         // Sort by distance if supplier location exists (supplier_id can be null initially, but if present we can sort)
         groupBuys = groupBuys.sort((a, b) => {
           const aLat = a.users?.latitude;
           const aLng = a.users?.longitude;
           const bLat = b.users?.latitude;
           const bLng = b.users?.longitude;
           
           const distA = (aLat !== undefined && aLat !== null && aLng !== undefined && aLng !== null) ? calculateDistanceKm(userLat, userLng, aLat, aLng) : Infinity;
           const distB = (bLat !== undefined && bLat !== null && bLng !== undefined && bLng !== null) ? calculateDistanceKm(userLat, userLng, bLat, bLng) : Infinity;
           
           return distA - distB;
         });
       }
    }
    
    res.json(successResponse(groupBuys));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch group buys'));
  }
});

// POST /api/group-buys/:id/join
router.post('/:id/join', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'A valid quantity is required'));
      return;
    }
    
    const dbUser = await prisma.users.findUnique({
      where: { firebase_uid: req.firebaseUser!.uid },
    });
    
    if (!dbUser || dbUser.role !== 'buyer') {
      res.status(403).json(errorResponse('FORBIDDEN', 'Only buyers can join group buys'));
      return;
    }

    const groupBuy = await prisma.group_buys.findUnique({
      where: { id },
    });
    
    if (!groupBuy || groupBuy.status !== 'open') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Open group buy not found'));
      return;
    }
    
    // Check if user already joined
    const existingParticipant = await prisma.group_buy_participants.findUnique({
      where: {
        group_buy_id_buyer_id: {
          group_buy_id: id,
          buyer_id: dbUser.id,
        }
      }
    });
    
    if (existingParticipant) {
      res.status(400).json(errorResponse('ALREADY_JOINED', 'You have already joined this group buy'));
      return;
    }
    
    const result = await prisma.$transaction(async (tx) => {
      await tx.group_buy_participants.create({
        data: {
          group_buy_id: id,
          buyer_id: dbUser.id,
          quantity,
        }
      });
      
      const updatedGroupBuy = await tx.group_buys.update({
        where: { id },
        data: {
          current_qty: {
            increment: quantity,
          }
        }
      });
      
      if (Number(updatedGroupBuy.current_qty) >= Number(updatedGroupBuy.target_qty)) {
        console.log(`[Group Buy ${id}] Target quantity reached. Locking group buy...`);
        return await tx.group_buys.update({
          where: { id },
          data: {
            status: group_buy_status.locked,
          }
        });
      }
      
      return updatedGroupBuy;
    });
    
    res.json(successResponse(result));
  } catch (error) {
    console.error('Join Group Buy Error:', error);
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to join group buy'));
  }
});

// POST /api/group-buys/match (called by AI Agents service)
router.post('/match', async (req: Request, res: Response): Promise<void> => {
  try {
    // Note: For a real app, this endpoint should be authenticated for internal services only
    const { material_name, target_qty, unlock_price, supplier_id } = req.body;
    
    if (!material_name || !target_qty) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'Missing required fields'));
      return;
    }
    
    const newGroupBuy = await prisma.group_buys.create({
      data: {
        material_name,
        target_qty,
        unlock_price,
        supplier_id, // can be null if not yet assigned to a specific supplier
        status: group_buy_status.open,
      }
    });
    
    res.status(201).json(successResponse(newGroupBuy));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to create matched group buy'));
  }
});

export default router;
