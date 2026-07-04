import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/responseEnvelope.js';
import { calculateDistanceKm } from '../utils/geo.js';

const router = Router();

// Middleware to ensure user is a supplier
const requireSupplier = async (req: Request, res: Response, next: Function) => {
  try {
    const user = await prisma.users.findUnique({
      where: { firebase_uid: req.firebaseUser!.uid },
    });
    
    if (user?.role !== 'supplier') {
      res.status(403).json(errorResponse('FORBIDDEN', 'Only suppliers can perform this action'));
      return;
    }
    
    // Attach database user to request for convenience
    (req as any).dbUser = user;
    next();
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to authenticate user role'));
  }
};

// GET /api/listings/mine (supplier-only)
router.get('/mine', requireAuth, requireSupplier, async (req: Request, res: Response) => {
  try {
    const dbUser = (req as any).dbUser;
    
    const listings = await prisma.listings.findMany({
      where: { supplier_id: dbUser.id },
      orderBy: { created_at: 'desc' },
    });
    
    res.json(successResponse(listings));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch listings'));
  }
});

// POST /api/listings
router.post('/', requireAuth, requireSupplier, async (req: Request, res: Response) => {
  try {
    const dbUser = (req as any).dbUser;
    const { material_name, category, stock_qty, unit, price_per_unit } = req.body;
    
    if (!material_name || stock_qty === undefined || !unit || price_per_unit === undefined) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'Missing required fields'));
      return;
    }
    
    const listing = await prisma.listings.create({
      data: {
        supplier_id: dbUser.id,
        material_name,
        category,
        stock_qty,
        unit,
        price_per_unit,
      },
    });
    
    res.status(201).json(successResponse(listing));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to create listing'));
  }
});

// PATCH /api/listings/:id
router.patch('/:id', requireAuth, requireSupplier, async (req: Request, res: Response): Promise<void> => {
  try {
    const dbUser = (req as any).dbUser;
    const { id } = req.params;
    const { stock_qty, price_per_unit, is_flagged_high } = req.body;
    
    // Ensure the listing belongs to the supplier
    const existing = await prisma.listings.findUnique({
      where: { id },
    });
    
    if (!existing) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Listing not found'));
      return;
    }
    
    if (existing.supplier_id !== dbUser.id) {
      res.status(403).json(errorResponse('FORBIDDEN', 'You do not own this listing'));
      return;
    }
    
    const listing = await prisma.listings.update({
      where: { id },
      data: {
        stock_qty: stock_qty !== undefined ? stock_qty : undefined,
        price_per_unit: price_per_unit !== undefined ? price_per_unit : undefined,
        is_flagged_high: is_flagged_high !== undefined ? is_flagged_high : undefined,
        updated_at: new Date(),
      },
    });
    
    res.json(successResponse(listing));
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to update listing'));
  }
});

// GET /api/listings?lat=&lng=&radius_km=&material=
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(req.query.radius_km as string);
    const material = req.query.material as string;
    
    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
      res.status(400).json(errorResponse('INVALID_INPUT', 'lat, lng, and radius_km are required and must be numbers'));
      return;
    }
    
    const whereClause: any = {};
    if (material) {
      whereClause.material_name = {
        contains: material,
        mode: 'insensitive',
      };
    }
    
    // Fetch listings with supplier included to get their location
    const allListings = await prisma.listings.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            display_name: true,
            business_name: true,
            latitude: true,
            longitude: true,
            trust_score: true,
          }
        }
      }
    });
    
    // Filter and map by distance
    const filteredListings = allListings
      .map(listing => {
        const supplierLat = listing.users.latitude;
        const supplierLng = listing.users.longitude;
        
        let distance = null;
        if (supplierLat !== null && supplierLng !== null) {
          distance = calculateDistanceKm(lat, lng, supplierLat, supplierLng);
        }
        
        return {
          ...listing,
          distance,
        };
      })
      .filter(listing => listing.distance !== null && listing.distance <= radiusKm)
      .sort((a, b) => (a.distance as number) - (b.distance as number));
      
    res.json(successResponse(filteredListings));
  } catch (error) {
    console.error('Listings Search Error:', error);
    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'Failed to search listings'));
  }
});

export default router;
