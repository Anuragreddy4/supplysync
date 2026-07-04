import { PrismaClient, user_role, business_type, order_status, group_buy_status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo database...');

  // 1. Create 3 demo suppliers
  const supplier1 = await prisma.users.upsert({
    where: { email: 'supplier1@demo.com' },
    update: {},
    create: {
      firebase_uid: 'demo_supplier_1',
      email: 'supplier1@demo.com',
      display_name: 'Acme Materials',
      role: user_role.supplier,
      business_type: business_type.manufacturer,
      business_name: 'Acme Materials Corp',
      phone: '+1-555-0101',
      latitude: 40.7128,
      longitude: -74.0060,
      address_text: '123 Factory Blvd, NY',
      trust_score: 85.00,
    },
  });

  const supplier2 = await prisma.users.upsert({
    where: { email: 'supplier2@demo.com' },
    update: {},
    create: {
      firebase_uid: 'demo_supplier_2',
      email: 'supplier2@demo.com',
      display_name: 'Global Metals',
      role: user_role.supplier,
      business_type: business_type.distributor,
      business_name: 'Global Metals Inc',
      phone: '+1-555-0102',
      latitude: 40.7328,
      longitude: -73.9960,
      address_text: '456 Warehouse St, NY',
      trust_score: 92.50,
    },
  });

  const supplier3 = await prisma.users.upsert({
    where: { email: 'supplier3@demo.com' },
    update: {},
    create: {
      firebase_uid: 'demo_supplier_3',
      email: 'supplier3@demo.com',
      display_name: 'Quality Plastics',
      role: user_role.supplier,
      business_type: business_type.manufacturer,
      business_name: 'Quality Plastics LLC',
      phone: '+1-555-0103',
      latitude: 40.7528,
      longitude: -73.9860,
      address_text: '789 Industry Ave, NY',
      trust_score: 78.00,
    },
  });

  // 2. Create 3 demo buyers
  const buyer1 = await prisma.users.upsert({
    where: { email: 'buyer1@demo.com' },
    update: {},
    create: {
      firebase_uid: 'demo_buyer_1',
      email: 'buyer1@demo.com',
      display_name: 'ConstructCo',
      role: user_role.buyer,
      business_type: business_type.retail_shop,
      business_name: 'ConstructCo Builders',
      phone: '+1-555-0201',
      latitude: 40.7228,
      longitude: -74.0160,
      address_text: '101 Builder Rd, NY',
    },
  });

  const buyer2 = await prisma.users.upsert({
    where: { email: 'buyer2@demo.com' },
    update: {},
    create: {
      firebase_uid: 'demo_buyer_2',
      email: 'buyer2@demo.com',
      display_name: 'DesignBuild',
      role: user_role.buyer,
      business_type: business_type.retail_shop,
      business_name: 'DesignBuild Studio',
      phone: '+1-555-0202',
      latitude: 40.7428,
      longitude: -74.0060,
      address_text: '202 Design Ln, NY',
    },
  });

  const buyer3 = await prisma.users.upsert({
    where: { email: 'buyer3@demo.com' },
    update: {},
    create: {
      firebase_uid: 'demo_buyer_3',
      email: 'buyer3@demo.com',
      display_name: 'RenovateRight',
      role: user_role.buyer,
      business_type: business_type.retail_shop,
      business_name: 'RenovateRight Contractors',
      phone: '+1-555-0203',
      latitude: 40.7628,
      longitude: -73.9960,
      address_text: '303 Renovation St, NY',
    },
  });

  // Create listings for suppliers
  const listing1 = await prisma.listings.create({
    data: {
      supplier_id: supplier1.id,
      material_name: 'Steel Rebar',
      category: 'Metals',
      stock_qty: 10000,
      unit: 'kg',
      price_per_unit: 1.20,
    }
  });

  const listing2 = await prisma.listings.create({
    data: {
      supplier_id: supplier2.id,
      material_name: 'Aluminum Sheets',
      category: 'Metals',
      stock_qty: 5000,
      unit: 'kg',
      price_per_unit: 2.50,
    }
  });

  // 3. Create 1 open group-buy
  const groupBuy = await prisma.group_buys.create({
    data: {
      material_name: 'Premium Cement',
      target_qty: 5000,
      current_qty: 1000,
      unlock_price: 8.50,
      status: group_buy_status.open,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  });

  // Add one participant to group buy
  await prisma.group_buy_participants.create({
    data: {
      group_buy_id: groupBuy.id,
      buyer_id: buyer1.id,
      quantity: 1000,
    }
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
