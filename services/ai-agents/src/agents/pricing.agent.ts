import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { askGemini, cleanAndParseJson, generateEmbedding } from '../lib/gemini';
import { Decimal } from '@prisma/client/runtime/library';

interface PricingGeminiResponse {
  fair_price_min: number;
  fair_price_max: number;
  reasoning: string;
}

export async function checkDynamicPricing(req: Request, res: Response): Promise<void> {
  const { material, price, supplierId, listing_id } = req.body;

  if (!material || price === undefined) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'MISSING_FIELDS',
        message: 'material and price are required in request body.'
      }
    });
    return;
  }

  const checkPrice = Number(price);

  try {
    // 1. Generate embedding for similarity search
    let embedding: number[] = [];
    try {
      embedding = await generateEmbedding(material);
    } catch (embErr) {
      console.warn('Failed to generate embedding for pricing, continuing with text fallback:', embErr);
    }

    // 2. Query similar listings across all suppliers
    let comparableListings: any[] = [];
    if (embedding.length > 0) {
      try {
        const embeddingStr = `[${embedding.join(',')}]`;
        comparableListings = await prisma.$queryRawUnsafe(`
          SELECT id, price_per_unit, material_name
          FROM listings
          ORDER BY embedding <=> $1::vector
          LIMIT 10
        `, embeddingStr);
      } catch (vectorErr) {
        console.warn('Vector similarity query failed in pricing, falling back to text:', vectorErr);
      }
    }

    if (comparableListings.length === 0) {
      // Fallback text match
      comparableListings = await prisma.listing.findMany({
        where: {
          materialName: {
            contains: material,
            mode: 'insensitive'
          }
        },
        take: 10
      });
    }

    let fairPriceMin: number;
    let fairPriceMax: number;
    let basis: 'market_data' | 'estimated';
    let reasoning = '';

    // 3. Compute price band
    if (comparableListings.length >= 3) {
      // Statistical band calculation
      const prices = comparableListings.map(l => Number(l.price_per_unit || l.pricePerUnit));
      prices.sort((a, b) => a - b);

      // Median
      const len = prices.length;
      const mid = Math.floor(len / 2);
      const median = len % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

      // Mean
      const sum = prices.reduce((a, b) => a + b, 0);
      const mean = sum / len;

      // Standard Deviation
      const sqDiffs = prices.map(p => Math.pow(p - mean, 2));
      const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / len;
      const stdDev = Math.sqrt(avgSqDiff);

      // Band: Median +/- 1 StdDev (with min clamped at 0)
      fairPriceMin = Math.max(0, median - stdDev);
      fairPriceMax = median + stdDev;
      basis = 'market_data';
      reasoning = `Calculated using statistical market data from ${prices.length} comparable listings.`;
    } else {
      // Fallback to Gemini
      basis = 'estimated';
      const prompt = `You are a dynamic pricing assistant for a small business supply marketplace.
A supplier is quoting a price of ${checkPrice} per unit for "${material}".
We have very little market data for this material.

Based on your general knowledge, estimate a fair price range (min and max) per unit for "${material}".
Respond ONLY with JSON in this exact shape, no markdown fences, no preamble:
{
  "fair_price_min": number,
  "fair_price_max": number,
  "reasoning": "one short sentence explaining the estimate"
}`;

      const fallbackBand: PricingGeminiResponse = {
        fair_price_min: Math.round(checkPrice * 0.8 * 100) / 100,
        fair_price_max: Math.round(checkPrice * 1.2 * 100) / 100,
        reasoning: 'Estimated using a default +/-20% variance around the quoted price due to lack of market listings.'
      };

      let geminiResult: PricingGeminiResponse;
      try {
        const rawResponse = await askGemini(prompt);
        geminiResult = cleanAndParseJson<PricingGeminiResponse>(rawResponse, fallbackBand);
      } catch (geminiError) {
        console.error('Gemini call failed for pricing check:', geminiError);
        geminiResult = fallbackBand;
      }

      fairPriceMin = geminiResult.fair_price_min || fallbackBand.fair_price_min;
      fairPriceMax = geminiResult.fair_price_max || fallbackBand.fair_price_max;
      reasoning = geminiResult.reasoning || fallbackBand.reasoning;
    }

    // 4. Check if quoted price is flagged high
    const isFlaggedHigh = checkPrice > fairPriceMax;

    // 5. Write back to listings table if listing_id is provided
    if (listing_id) {
      try {
        await prisma.listing.update({
          where: { id: listing_id },
          data: {
            fairPriceMin: new Decimal(Math.round(fairPriceMin * 100) / 100),
            fairPriceMax: new Decimal(Math.round(fairPriceMax * 100) / 100),
            isFlaggedHigh
          }
        });
      } catch (dbErr) {
        console.error(`Failed to update listing ${listing_id} with pricing bands:`, dbErr);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        material,
        quotedPrice: checkPrice,
        fairPriceMin: Math.round(fairPriceMin * 100) / 100,
        fairPriceMax: Math.round(fairPriceMax * 100) / 100,
        isFlaggedHigh,
        basis,
        reasoning
      },
      error: null
    });
  } catch (error: any) {
    console.error('Error in dynamic pricing check:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An error occurred during dynamic pricing check.'
      }
    });
  }
}
