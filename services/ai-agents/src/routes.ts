import { Router } from 'express';
import { runDemandForecast } from './agents/forecast.agent';
import { recomputeTrustScore } from './agents/trust.agent';
import { matchGroupBuys } from './agents/groupBuy.agent';
import { checkDynamicPricing } from './agents/pricing.agent';

const router = Router();

// Demand Forecast Agent Endpoint
router.post('/forecasts/run', runDemandForecast);

// Trust & Verification Agent Endpoint
router.post('/trust/recompute', recomputeTrustScore);

// Group-Buy Matchmaking Agent Endpoint
router.post('/group-buys/match', matchGroupBuys);

// Dynamic Pricing Agent Endpoint
router.post('/pricing/check', checkDynamicPricing);

export default router;
