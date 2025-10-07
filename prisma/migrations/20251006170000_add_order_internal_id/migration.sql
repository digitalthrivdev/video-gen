-- Add orderInternalId column to Payment table
ALTER TABLE "Payment" ADD COLUMN "orderInternalId" VARCHAR(255);

-- Create unique index on orderInternalId
CREATE UNIQUE INDEX "Payment_orderInternalId_key" ON "Payment"("orderInternalId");

-- Add foreign key constraint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderInternalId_fkey" FOREIGN KEY ("orderInternalId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update existing Payment records to have orderInternalId
-- This will need to be done manually for existing records
-- UPDATE "Payment" SET "orderInternalId" = (SELECT "id" FROM "Order" WHERE "Order"."orderId" = "Payment"."orderId");
