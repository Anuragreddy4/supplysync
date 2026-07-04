import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { askGemini } from '../lib/gemini';
import { Decimal } from '@prisma/client/runtime/library';

export async function recomputeTrustScore(req: Request, res: Response): Promise<void> {
  const { supplierId } = req.body;

  if (!supplierId) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'MISSING_FIELD',
        message: 'supplierId is required in request body.'
      }
    });
    return;
  }

  try {
    // 1. Fetch supplier to verify existence and get current score
    const supplier = await prisma.user.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: `Supplier with ID ${supplierId} not found.`
        }
      });
      return;
    }

    // 2. Pull all trust events and reviews for the supplier
    const trustEvents = await prisma.trustEvent.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' }
    });

    const reviews = await prisma.review.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' }
    });

    const listings = await prisma.listing.findMany({
      where: { supplierId }
    });

    // 3. Compute score deterministically
    // Base score is 50.00
    let calculatedScore = 50.00;

    // Adjust for on-time deliveries (+2.0 each, with a capped contribution of +30.0 total)
    const onTimeEvents = trustEvents.filter(e => e.eventType === 'on_time_delivery');
    const onTimeContribution = Math.min(30.0, onTimeEvents.length * 2.0);
    calculatedScore += onTimeContribution;

    // Adjust for late deliveries (-3.0 each)
    const lateEvents = trustEvents.filter(e => e.eventType === 'late_delivery');
    calculatedScore -= lateEvents.length * 3.0;

    // Adjust for reviews: weighted by rating (rating - 3) * 1.5
    let reviewsAdjustment = 0;
    for (const review of reviews) {
      reviewsAdjustment += (review.rating - 3) * 1.5;
    }
    calculatedScore += reviewsAdjustment;

    // Adjust for price consistency: small positive/negative adjustment
    // If supplier has any listings flagged high or exceeding fair price, apply -2.0 penalty.
    // If they have listings and none are flagged high, apply +2.0 bonus.
    let priceConsistencyAdjustment = 0;
    if (listings.length > 0) {
      const hasFlagged = listings.some(l => l.isFlaggedHigh || (l.fairPriceMax && l.pricePerUnit.greaterThan(l.fairPriceMax)));
      priceConsistencyAdjustment = hasFlagged ? -2.0 : 2.0;
    }
    calculatedScore += priceConsistencyAdjustment;

    // Clamp score to [0, 100]
    const finalScore = Math.min(100.0, Math.max(0.0, calculatedScore));
    const roundedScore = Math.round(finalScore * 100) / 100;

    // 4. Call Gemini to generate a qualitative summary of why the score moved
    const scoreDiff = roundedScore - Number(supplier.trustScore);
    const scoreDirection = scoreDiff >= 0 ? 'rose' : 'dropped';

    const eventsSummary = `
- On-time deliveries: ${onTimeEvents.length} (contributed +${onTimeContribution.toFixed(1)} points)
- Late deliveries: ${lateEvents.length} (subtracted -${(lateEvents.length * 3.0).toFixed(1)} points)
- Reviews: ${reviews.length} reviews, with net review rating adjustment of ${reviewsAdjustment >= 0 ? '+' : ''}${reviewsAdjustment.toFixed(1)} points
- Pricing: ${listings.length} listings. Price consistency adjustment of ${priceConsistencyAdjustment >= 0 ? '+' : ''}${priceConsistencyAdjustment.toFixed(1)} points
`;

    const prompt = `You are a Trust and Verification assistant for a supply marketplace.
A supplier's trust score changed from ${Number(supplier.trustScore).toFixed(2)} to ${roundedScore.toFixed(2)} (it ${scoreDirection} by ${Math.abs(scoreDiff).toFixed(2)} points).

Here is the activity breakdown:
${eventsSummary}

Based on this activity, write a single-sentence explanation (under 15 words) explaining why the trust score changed.
The explanation should be professional, objective, and easy for a buyer to read.
Example format: "Score rose due to consistent on-time deliveries and positive buyer reviews."
Do not include any JSON wrapper, markdown formatting, or introductory text. Just output the single sentence.`;

    let summary = '';
    const fallbackSummary = scoreDiff >= 0
      ? 'Score increased due to reliable deliveries and positive reviews.'
      : 'Score decreased due to delivery delays or below-average reviews.';

    try {
      const geminiResponse = await askGemini(prompt);
      summary = geminiResponse.trim();
      // Defensive cleanups
      if (summary.startsWith('"') && summary.endsWith('"')) {
        summary = summary.substring(1, summary.length - 1);
      }
    } catch (geminiError) {
      console.error('Gemini call failed for trust score summary:', geminiError);
      summary = fallbackSummary;
    }

    // 5. Update users.trust_score via API with fallback to direct DB write
    let updateSuccess = false;
    let updateMethod = 'API';

    try {
      const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000/api'}/users/${supplierId}`;
      const apiResponse = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trust_score: roundedScore })
      });

      if (apiResponse.ok) {
        updateSuccess = true;
      } else {
        throw new Error(`API returned status ${apiResponse.status}`);
      }
    } catch (apiError) {
      console.warn(`Failed to update trust score via API to Person 1's backend. Falling back to direct database write. Error:`, apiError);
      try {
        await prisma.user.update({
          where: { id: supplierId },
          data: {
            trustScore: new Decimal(roundedScore)
          }
        });
        updateSuccess = true;
        updateMethod = 'DB_DIRECT';
      } catch (dbError) {
        console.error('Failed to write trust score directly to database:', dbError);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        supplierId,
        previousScore: Number(supplier.trustScore),
        newScore: roundedScore,
        scoreDiff: Math.round(scoreDiff * 100) / 100,
        explanation: summary,
        updatedVia: updateSuccess ? updateMethod : 'FAILED'
      },
      error: null
    });
  } catch (error: any) {
    console.error('Error recomputing trust score:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An error occurred while recomputing trust score.'
      }
    });
  }
}
