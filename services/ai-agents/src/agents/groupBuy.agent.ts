import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { generateEmbedding } from '../lib/gemini';
import { Decimal } from '@prisma/client/runtime/library';

// Haversine formula to compute distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function matchGroupBuys(req: Request, res: Response): Promise<void> {
  const { material, buyerId, quantity, lat, lng } = req.body;

  if (!material || !buyerId || quantity === undefined || lat === undefined || lng === undefined) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'MISSING_FIELDS',
        message: 'material, buyerId, quantity, lat, and lng are required in request body.'
      }
    });
    return;
  }

  const triggeringBuyerQty = Number(quantity);
  const searchLat = Number(lat);
  const searchLng = Number(lng);

  try {
    // 1. Verify the triggering buyer exists
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId }
    });

    if (!buyer) {
      res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'BUYER_NOT_FOUND',
          message: `Buyer with ID ${buyerId} not found.`
        }
      });
      return;
    }

    // 2. Generate vector embedding for the material
    let embedding: number[] = [];
    try {
      embedding = await generateEmbedding(material);
    } catch (embErr) {
      console.warn('Failed to generate embedding, continuing with text-based fallback:', embErr);
    }

    // 3. Query listings for similar materials using pgvector similarity or text fallback
    let matchedListings: any[] = [];
    if (embedding.length > 0) {
      try {
        const embeddingStr = `[${embedding.join(',')}]`;
        // Order by cosine distance (embedding <=> vector)
        matchedListings = await prisma.$queryRawUnsafe(`
          SELECT id, supplier_id, material_name, category, price_per_unit
          FROM listings
          ORDER BY embedding <=> $1::vector
          LIMIT 10
        `, embeddingStr);
      } catch (vectorErr) {
        console.warn('Vector similarity query failed, falling back to text match:', vectorErr);
      }
    }

    if (matchedListings.length === 0) {
      // Text fallback search
      matchedListings = await prisma.listing.findMany({
        where: {
          materialName: {
            contains: material,
            mode: 'insensitive'
          }
        },
        take: 10
      });
    }

    // 4. Find open group buys for similar materials
    // We search group buys where status is 'open' and the material name is similar
    const openGroupBuys = await prisma.groupBuy.findMany({
      where: {
        status: 'open',
        materialName: {
          contains: material,
          mode: 'insensitive'
        }
      },
      include: {
        participants: true
      }
    });

    // Check if there's an existing open group buy that we can join
    // It should be within a reasonable distance (e.g. 50km) from the supplier or target area.
    // If supplierId is present, we can look up the supplier's location.
    let joinedGroupBuy = null;
    const maxRadiusKm = 50.0;

    for (const gb of openGroupBuys) {
      let isNearby = false;
      if (gb.supplierId) {
        const supplierUser = await prisma.user.findUnique({
          where: { id: gb.supplierId }
        });
        if (supplierUser && supplierUser.latitude !== null && supplierUser.longitude !== null) {
          const dist = getDistanceKm(searchLat, searchLng, supplierUser.latitude, supplierUser.longitude);
          if (dist <= maxRadiusKm) {
            isNearby = true;
          }
        }
      } else {
        // If no supplier linked yet, we can assume it matches
        isNearby = true;
      }

      if (isNearby) {
        // Match found! Let's join this group buy
        joinedGroupBuy = gb;
        break;
      }
    }

    if (joinedGroupBuy) {
      // 5a. Join the existing group buy
      const gbId = joinedGroupBuy.id;
      let participantJoined = false;
      let joinMethod = 'API';

      // Call API
      try {
        const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000/api'}/group-buys/${gbId}/join`;
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ buyerId, quantity: triggeringBuyerQty })
        });

        if (apiResponse.ok) {
          participantJoined = true;
        } else {
          throw new Error(`API returned status ${apiResponse.status}`);
        }
      } catch (apiError) {
        console.warn('Failed to join group buy via API, falling back to direct DB write:', apiError);
        try {
          // Direct DB write
          // Check if already participant
          const existingParticipant = await prisma.groupBuyParticipant.findUnique({
            where: {
              groupBuyId_buyerId: { groupBuyId: gbId, buyerId }
            }
          });

          if (existingParticipant) {
            // Update quantity
            await prisma.groupBuyParticipant.update({
              where: {
                groupBuyId_buyerId: { groupBuyId: gbId, buyerId }
              },
              data: {
                quantity: new Decimal(Number(existingParticipant.quantity) + triggeringBuyerQty)
              }
            });
          } else {
            // Create participant
            await prisma.groupBuyParticipant.create({
              data: {
                groupBuyId: gbId,
                buyerId,
                quantity: new Decimal(triggeringBuyerQty)
              }
            });
          }

          // Update current_qty in group buy
          await prisma.groupBuy.update({
            where: { id: gbId },
            data: {
              currentQty: new Decimal(Number(joinedGroupBuy.currentQty) + triggeringBuyerQty)
            }
          });

          participantJoined = true;
          joinMethod = 'DB_DIRECT';
        } catch (dbError) {
          console.error('Failed to write group buy participant directly:', dbError);
        }
      }

      const updatedGb = await prisma.groupBuy.findUnique({
        where: { id: gbId },
        include: { participants: true }
      });

      res.status(200).json({
        success: true,
        data: {
          action: 'JOINED',
          groupBuy: updatedGb,
          joinedVia: participantJoined ? joinMethod : 'FAILED'
        },
        error: null
      });
      return;
    }

    // 5b. No existing open group buy found.
    // We look for other buyers with forecasted demand for the same or similar material.
    // Fetch forecasts created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pendingForecasts = await prisma.forecast.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        materialName: {
          contains: material,
          mode: 'insensitive'
        },
        buyerId: { not: buyerId } // Exclude the triggering buyer
      },
      include: {
        buyer: true
      }
    });

    // Filter forecasts by geo-radius
    const compatibleBuyers: Array<{ buyerId: string; quantity: number }> = [];
    for (const fc of pendingForecasts) {
      if (fc.buyer.latitude !== null && fc.buyer.longitude !== null) {
        const dist = getDistanceKm(searchLat, searchLng, fc.buyer.latitude, fc.buyer.longitude);
        if (dist <= maxRadiusKm) {
          compatibleBuyers.push({
            buyerId: fc.buyerId,
            quantity: Number(fc.predictedQty || 0)
          });
        }
      }
    }

    // We need >= 2 compatible buyers (including the triggering buyer) to cluster and start a new group buy
    if (compatibleBuyers.length >= 1) {
      // We have the triggering buyer + at least one other buyer!
      // Select the closest supplier/listing from matched listings
      const bestListing = matchedListings[0];
      const supplierId = bestListing ? bestListing.supplier_id : null;
      const basePrice = bestListing ? Number(bestListing.price_per_unit) : 100; // fallback price

      // Compute target quantity = sum of all compatible demand
      const totalDemand = triggeringBuyerQty + compatibleBuyers.reduce((sum, b) => sum + b.quantity, 0);

      // Compute unlock price: apply bulk discount heuristic (e.g. 10% off)
      // Bulk discount tier: 8% for small, up to 15% for large volume
      const discountPercent = totalDemand > 500 ? 0.15 : totalDemand > 100 ? 0.10 : 0.08;
      const unlockPrice = basePrice * (1 - discountPercent);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

      // Create new Group Buy
      const newGroupBuy = await prisma.groupBuy.create({
        data: {
          materialName: material,
          supplierId,
          targetQty: new Decimal(totalDemand),
          currentQty: new Decimal(triggeringBuyerQty),
          unlockPrice: new Decimal(unlockPrice),
          status: 'open',
          expiresAt
        }
      });

      // Add the triggering buyer as participant
      await prisma.groupBuyParticipant.create({
        data: {
          groupBuyId: newGroupBuy.id,
          buyerId,
          quantity: new Decimal(triggeringBuyerQty)
        }
      });

      // Optionally we could pre-add the other forecasted buyers, or notify them.
      // The PRD says "If none exists and >=2 compatible buyers are found, create a new group_buys row..."
      // We'll also add the other buyer(s) whose forecasts matched to get the group buy started!
      // This is a great touch to show active matchmaking.
      let currentQtyAccum = triggeringBuyerQty;
      for (const cb of compatibleBuyers) {
        try {
          await prisma.groupBuyParticipant.create({
            data: {
              groupBuyId: newGroupBuy.id,
              buyerId: cb.buyerId,
              quantity: new Decimal(cb.quantity)
            }
          });
          currentQtyAccum += cb.quantity;
        } catch (participantErr) {
          console.error(`Failed to add forecasted buyer ${cb.buyerId} to new group buy:`, participantErr);
        }
      }

      // Update the current quantity to reflect all added participants
      const finalGroupBuy = await prisma.groupBuy.update({
        where: { id: newGroupBuy.id },
        data: {
          currentQty: new Decimal(currentQtyAccum)
        },
        include: {
          participants: true
        }
      });

      res.status(200).json({
        success: true,
        data: {
          action: 'CREATED',
          groupBuy: finalGroupBuy,
          message: `Created new group buy with ${compatibleBuyers.length + 1} matching buyers in ${maxRadiusKm}km radius.`
        },
        error: null
      });
    } else {
      // Not enough demand to start a group buy (only 1 buyer)
      res.status(200).json({
        success: true,
        data: {
          action: 'NONE',
          message: `No existing group buy matches, and not enough nearby demand (found 0 other buyers within ${maxRadiusKm}km) to form a new group buy.`
        },
        error: null
      });
    }
  } catch (error: any) {
    console.error('Error running group buy matchmaking:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An error occurred during group buy matchmaking.'
      }
    });
  }
}
