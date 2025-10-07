import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if token packages already exist
  const existingPackages = await prisma.tokenPackage.findMany();
  
  if (existingPackages.length > 0) {
    console.log(`📦 Found ${existingPackages.length} existing token packages. Skipping creation.`);
    console.log('Existing packages:');
    existingPackages.forEach(pkg => {
      console.log(`  - ${pkg.name}: ${pkg.tokens} tokens (₹${pkg.price})`);
    });
    return;
  }

  // Create token packages
  console.log('📦 Creating token packages...');
  
  const packages = [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for trying out video generation",
      tokens: 10,
      price: 150,
      currency: "INR",
      isActive: true
    },
    {
      id: "growth",
      name: "Growth", 
      description: "Great for content creators and small businesses",
      tokens: 50,
      price: 650,
      currency: "INR",
      isActive: true
    },
    {
      id: "pro",
      name: "Pro",
      description: "Best value for regular users",
      tokens: 120,
      price: 1440,
      currency: "INR",
      isActive: true
    },
    {
      id: "agency",
      name: "Agency",
      description: "For heavy usage and teams",
      tokens: 300,
      price: 3300,
      currency: "INR",
      isActive: true
    }
  ];

  for (const pkg of packages) {
    const created = await prisma.tokenPackage.create({
      data: pkg
    });
    console.log(`✅ Created package: ${created.name} (${created.tokens} tokens - ₹${created.price})`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
