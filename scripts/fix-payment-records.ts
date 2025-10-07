import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function fixPaymentRecords() {
  console.log('🔧 Fixing payment records...');

  try {
    // Use raw SQL to update existing payments
    const result = await prisma.$executeRaw`
      UPDATE "Payment" 
      SET "orderInternalId" = "Order"."id"
      FROM "Order" 
      WHERE "Payment"."orderId" = "Order"."orderId"
      AND "Payment"."orderInternalId" IS NULL
    `;

    console.log(`✅ Updated ${result} payment records with orderInternalId`);

    // Verify the fix
    const remainingNulls = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Payment" WHERE "orderInternalId" IS NULL
    `;

    console.log(`📊 Remaining payments without orderInternalId: ${remainingNulls[0].count}`);

    console.log('🎉 Payment records fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing payment records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaymentRecords();
