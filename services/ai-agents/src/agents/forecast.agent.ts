import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { askGemini, cleanAndParseJson } from '../lib/gemini';
import { Decimal } from '@prisma/client/runtime/library';

interface ForecastGeminiResponse {
  predicted_qty: number;
  predicted_need_in_days: number;
  confidence: number;
  reasoning: string;
}

export async function runDemandForecast(req: Request, res: Response): Promise<void> {
  const { buyerId } = req.body;

  if (!buyerId) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'MISSING_FIELD',
        message: 'buyerId is required in request body.'
      }
    });
    return;
  }

  try {
    // 1. Fetch user to verify buyer exists
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

    // 2. Pull buyer's order history from database, including the listing to get material_name
    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: {
        listing: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (orders.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
        error: null,
        message: 'No orders found for this buyer. Cannot generate forecasts.'
      });
      return;
    }

    // 3. Group orders by material name
    const ordersByMaterial: Record<string, typeof orders> = {};
    for (const order of orders) {
      const matName = order.listing.materialName;
      if (!ordersByMaterial[matName]) {
        ordersByMaterial[matName] = [];
      }
      ordersByMaterial[matName].push(order);
    }

    const createdForecasts = [];
    const now = new Date();

    // 4. For each material with >= 2 orders, compute stats and query Gemini
    for (const [material, matOrders] of Object.entries(ordersByMaterial)) {
      if (matOrders.length < 2) {
        // Skip materials with less than 2 orders as we can't compute a re-order interval
        continue;
      }

      // Compute average quantity
      const totalQty = matOrders.reduce((sum, o) => sum + Number(o.quantity), 0);
      const avgQty = totalQty / matOrders.length;

      // Compute average re-order interval (in days)
      let totalIntervalDays = 0;
      for (let i = 1; i < matOrders.length; i++) {
        const diffMs = matOrders[i].createdAt.getTime() - matOrders[i - 1].createdAt.getTime();
        totalIntervalDays += diffMs / (1000 * 60 * 60 * 24);
      }
      const avgIntervalDays = totalIntervalDays / (matOrders.length - 1);

      // Compute days since last order
      const lastOrder = matOrders[matOrders.length - 1];
      const daysSinceLast = (now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      // Prepare order history for prompt
      const orderHistorySummary = matOrders.map(o => ({
        date: o.createdAt.toISOString().split('T')[0],
        quantity: Number(o.quantity)
      }));

      const prompt = `You are a supply forecasting assistant for a small business marketplace.
Given this buyer's order history for "${material}":
${JSON.stringify(orderHistorySummary, null, 2)}

And these computed stats:
- Average reorder interval: ${avgIntervalDays.toFixed(1)} days
- Average quantity per order: ${avgQty.toFixed(1)}
- Days since last order: ${daysSinceLast.toFixed(1)}

Respond ONLY with JSON in this exact shape, no markdown fences, no preamble:
{
  "predicted_qty": number,
  "predicted_need_in_days": number,
  "confidence": number (0 to 1),
  "reasoning": "one short sentence a small business owner would understand"
}`;

      // Default fallback in case of Gemini failure
      const fallbackDays = Math.max(1, Math.round(avgIntervalDays - daysSinceLast));
      const fallbackForecast: ForecastGeminiResponse = {
        predicted_qty: Math.round(avgQty * 100) / 100,
        predicted_need_in_days: fallbackDays,
        confidence: 0.50,
        reasoning: `Based on your average reorder cycle of ${avgIntervalDays.toFixed(0)} days, you may need more ${material} soon.`
      };

      let forecastResult: ForecastGeminiResponse;
      try {
        const rawResponse = await askGemini(prompt);
        forecastResult = cleanAndParseJson<ForecastGeminiResponse>(rawResponse, fallbackForecast);
      } catch (geminiError) {
        console.error(`Gemini call failed for forecast of ${material}:`, geminiError);
        forecastResult = fallbackForecast;
      }

      // Safeguard parsed values
      const predictedQty = new Decimal(forecastResult.predicted_qty || avgQty);
      const predictedNeedInDays = Math.max(1, forecastResult.predicted_need_in_days || fallbackDays);
      const confidence = new Decimal(Math.min(1, Math.max(0, forecastResult.confidence || 0.50)));
      const reasoning = forecastResult.reasoning || fallbackForecast.reasoning;

      const predictedNeedDate = new Date();
      predictedNeedDate.setDate(predictedNeedDate.getDate() + predictedNeedInDays);

      // 5. Save forecast row to DB
      const savedForecast = await prisma.forecast.create({
        data: {
          buyerId,
          materialName: material,
          predictedQty,
          predictedNeedDate,
          confidence,
          reasoning
        }
      });

      createdForecasts.push(savedForecast);
    }

    res.status(200).json({
      success: true,
      data: createdForecasts,
      error: null
    });
  } catch (error: any) {
    console.error('Error running demand forecast:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An error occurred while running demand forecast.'
      }
    });
  }
}
