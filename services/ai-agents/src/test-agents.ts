import { runDemandForecast } from './agents/forecast.agent';
import { recomputeTrustScore } from './agents/trust.agent';
import { matchGroupBuys } from './agents/groupBuy.agent';
import { checkDynamicPricing } from './agents/pricing.agent';
import { prisma } from './lib/db';
import * as gemini from './lib/gemini';
import { Decimal } from '@prisma/client/runtime/library';

// Mock request and response helpers
function mockResponse() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log('=== RUNNING AI AGENT UNIT TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Enable test mode for Gemini client
  process.env.NODE_ENV = 'test';

  // ==========================================
  // Test 1: Demand Forecast Agent
  // ==========================================
  try {
    const mockBuyerId = 'buyer-uuid';
    
    // Mock database queries
    prisma.user.findUnique = async () => ({ id: mockBuyerId } as any);
    
    // Mock 3 orders spaced by 10 days
    const mockDate1 = new Date();
    mockDate1.setDate(mockDate1.getDate() - 20);
    const mockDate2 = new Date();
    mockDate2.setDate(mockDate2.getDate() - 10);
    const mockDate3 = new Date(); // now

    prisma.order.findMany = async () => [
      {
        id: 'order-1',
        buyerId: mockBuyerId,
        quantity: new Decimal(100),
        createdAt: mockDate1,
        listing: { materialName: 'Cement' }
      },
      {
        id: 'order-2',
        buyerId: mockBuyerId,
        quantity: new Decimal(110),
        createdAt: mockDate2,
        listing: { materialName: 'Cement' }
      },
      {
        id: 'order-3',
        buyerId: mockBuyerId,
        quantity: new Decimal(105),
        createdAt: mockDate3,
        listing: { materialName: 'Cement' }
      }
    ] as any;

    const createdForecasts: any[] = [];
    prisma.forecast.create = async (args: any) => {
      createdForecasts.push(args.data);
      return args.data;
    };

    const req: any = { body: { buyerId: mockBuyerId } };
    const res = mockResponse();

    await runDemandForecast(req, res);

    assert(res.statusCode === 200, 'Demand Forecast Agent: Status Code 200');
    assert(createdForecasts.length === 1, 'Demand Forecast Agent: Created one forecast');
    assert(createdForecasts[0].materialName === 'Cement', 'Demand Forecast Agent: Forecast is for Cement');
    assert(createdForecasts[0].confidence.toString() === '0.85', 'Demand Forecast Agent: Confidence matches Gemini mock');
    assert(createdForecasts[0].reasoning.includes('Gemini reasoning'), 'Demand Forecast Agent: Reasoning parsed from Gemini response');
  } catch (err) {
    console.error('Error during Test 1:', err);
    failed++;
  }

  // ==========================================
  // Test 2: Trust & Verification Agent
  // ==========================================
  try {
    const mockSupplierId = 'supplier-uuid';
    
    prisma.user.findUnique = async () => ({
      id: mockSupplierId,
      trustScore: new Decimal(50.00)
    } as any);

    // Mock 3 on_time_delivery events and 1 late_delivery
    prisma.trustEvent.findMany = async () => [
      { eventType: 'on_time_delivery' },
      { eventType: 'on_time_delivery' },
      { eventType: 'on_time_delivery' },
      { eventType: 'late_delivery' }
    ] as any;

    // Mock 1 review with 5 rating (adds +3.0)
    prisma.review.findMany = async () => [
      { rating: 5 }
    ] as any;

    // Mock listings (none flagged, adds +2.0)
    prisma.listing.findMany = async () => [
      { pricePerUnit: new Decimal(100), isFlaggedHigh: false }
    ] as any;

    let updatedScore = 0;
    prisma.user.update = async (args: any) => {
      updatedScore = Number(args.data.trustScore);
      return args.data;
    };

    // Mock fetch to simulate API endpoint response
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: true } as any);

    const req: any = { body: { supplierId: mockSupplierId } };
    const res = mockResponse();

    await recomputeTrustScore(req, res);

    // Deterministic calculation:
    // Base: 50.00
    // On-time: 3 * 2.0 = +6.0
    // Late: 1 * -3.0 = -3.0
    // Reviews: (5 - 3) * 1.5 = +3.0
    // Price consistency: +2.0 (no flagged listings)
    // Expected: 50 + 6 - 3 + 3 + 2 = 58.00
    assert(res.statusCode === 200, 'Trust & Verification Agent: Status Code 200');
    assert(res.jsonData.data.newScore === 58, `Trust & Verification Agent: Score calculates correctly (expected 58, got ${res.jsonData.data.newScore})`);
    assert(res.jsonData.data.explanation === 'Score rose due to on-time deliveries.', 'Trust & Verification Agent: Gemini summary retrieved');
    
    global.fetch = originalFetch;
  } catch (err) {
    console.error('Error during Test 2:', err);
    failed++;
  }

  // ==========================================
  // Test 3: Group-Buy Matchmaking Agent
  // ==========================================
  try {
    const mockBuyerId = 'buyer-uuid';
    prisma.user.findUnique = async () => ({
      id: mockBuyerId,
      latitude: 12.9716,
      longitude: 77.5946
    } as any);

    // Mock groupBuy.findMany returning empty to force creation
    prisma.groupBuy.findMany = async () => [] as any;

    // Mock forecasts from other buyers: 1 buyer nearby (Bangalore, 10km away) and 1 far away
    prisma.forecast.findMany = async () => [
      {
        buyerId: 'nearby-buyer',
        materialName: 'Cement',
        predictedQty: new Decimal(200),
        buyer: {
          latitude: 12.9816, // very close
          longitude: 77.6046
        }
      },
      {
        buyerId: 'far-buyer',
        materialName: 'Cement',
        predictedQty: new Decimal(500),
        buyer: {
          latitude: 19.0760, // Mumbai (far away)
          longitude: 72.8777
        }
      }
    ] as any;

    let createdGroupBuy: any = null;
    prisma.groupBuy.create = async (args: any) => {
      createdGroupBuy = { id: 'new-gb-uuid', ...args.data };
      return createdGroupBuy;
    };

    prisma.groupBuyParticipant.create = async (args: any) => {
      return args.data;
    };

    prisma.groupBuy.update = async (args: any) => {
      if (createdGroupBuy) {
        createdGroupBuy.currentQty = args.data.currentQty;
      }
      return createdGroupBuy;
    };

    const req: any = {
      body: {
        material: 'Cement',
        buyerId: mockBuyerId,
        quantity: 100,
        lat: 12.9716,
        lng: 77.5946
      }
    };
    const res = mockResponse();

    await matchGroupBuys(req, res);

    assert(res.statusCode === 200, 'Group-Buy Matchmaking Agent: Status Code 200');
    assert(res.jsonData.data.action === 'CREATED', 'Group-Buy Matchmaking Agent: Clusters nearby buyers and creates group buy');
    assert(Number(createdGroupBuy.targetQty) === 300, `Group-Buy Matchmaking Agent: Target quantity sums correctly (expected 300, got ${createdGroupBuy.targetQty})`);
    assert(Number(createdGroupBuy.currentQty) === 300, `Group-Buy Matchmaking Agent: Current quantity matches (expected 300, got ${createdGroupBuy.currentQty})`);
  } catch (err) {
    console.error('Error during Test 3:', err);
    failed++;
  }

  // ==========================================
  // Test 4: Dynamic Pricing Agent
  // ==========================================
  try {
    // Scenario 4A: Fewer than 3 listings (should fallback to Gemini)
    prisma.listing.findMany = async () => [
      { pricePerUnit: new Decimal(20) }
    ] as any;

    const reqA: any = {
      body: {
        material: 'Bricks',
        price: 35, // Quote is 35, Gemini fair range is 15 to 25
        supplierId: 'supplier-uuid'
      }
    };
    const resA = mockResponse();

    await checkDynamicPricing(reqA, resA);

    assert(resA.statusCode === 200, 'Dynamic Pricing Agent (Gemini fallback): Status Code 200');
    assert(resA.jsonData.data.basis === 'estimated', 'Dynamic Pricing Agent (Gemini fallback): Basis is estimated');
    assert(resA.jsonData.data.isFlaggedHigh === true, 'Dynamic Pricing Agent (Gemini fallback): Price 35 flagged high against max 25');

    // Scenario 4B: 3 or more listings (should use statistical band)
    // Listings: 10, 12, 14, 16, 18
    // Median = 14
    // Mean = 14
    // StdDev = 2.828
    // Range = 11.17 to 16.83
    prisma.listing.findMany = async () => [
      { pricePerUnit: new Decimal(10) },
      { pricePerUnit: new Decimal(12) },
      { pricePerUnit: new Decimal(14) },
      { pricePerUnit: new Decimal(16) },
      { pricePerUnit: new Decimal(18) }
    ] as any;

    let updatedListing: any = null;
    prisma.listing.update = async (args: any) => {
      updatedListing = args.data;
      return args.data;
    };

    const reqB: any = {
      body: {
        material: 'Bricks',
        price: 18,
        supplierId: 'supplier-uuid',
        listing_id: 'listing-uuid'
      }
    };
    const resB = mockResponse();

    await checkDynamicPricing(reqB, resB);

    assert(resB.statusCode === 200, 'Dynamic Pricing Agent (Statistical): Status Code 200');
    assert(resB.jsonData.data.basis === 'market_data', 'Dynamic Pricing Agent (Statistical): Basis is market_data');
    assert(resB.jsonData.data.fairPriceMin === 11.17, `Dynamic Pricing Agent (Statistical): Min price correct (expected 11.17, got ${resB.jsonData.data.fairPriceMin})`);
    assert(resB.jsonData.data.fairPriceMax === 16.83, `Dynamic Pricing Agent (Statistical): Max price correct (expected 16.83, got ${resB.jsonData.data.fairPriceMax})`);
    assert(resB.jsonData.data.isFlaggedHigh === true, 'Dynamic Pricing Agent (Statistical): Price 18 flagged high against max 16.83');
    assert(updatedListing !== null, 'Dynamic Pricing Agent (Statistical): Database row updated');
    assert(updatedListing.is_flagged_high === undefined && updatedListing.isFlaggedHigh === true, 'Dynamic Pricing Agent (Statistical): Database column isFlaggedHigh updated to true');
  } catch (err) {
    console.error('Error during Test 4:', err);
    failed++;
  }

  // Restore node env
  delete process.env.NODE_ENV;

  console.log('\n=== TEST SUMMARY ===');
  console.log(`Passed: ${passed}/${passed + failed}`);
  console.log(`Failed: ${failed}/${passed + failed}`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
