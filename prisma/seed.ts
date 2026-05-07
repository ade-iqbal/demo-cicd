import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create a demo user
  const hashedPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      username: "demo_user",
      password: hashedPassword,
      name: "Demo User",
    },
  });

  // Create 10 products
  const products = [
    { name: "Smartphone X", description: "Latest model with stunning display", price: 999.99, stock: 50 },
    { name: "Laptop Pro", description: "Powerful laptop for professionals", price: 1499.99, stock: 30 },
    { name: "Wireless Earbuds", description: "Crystal clear sound with noise cancellation", price: 199.99, stock: 100 },
    { name: "Smartwatch Elite", description: "Track your fitness and stay connected", price: 299.99, stock: 75 },
    { name: "Gaming Console", description: "Next-gen gaming experience", price: 499.99, stock: 20 },
    { name: "4K Monitor", description: "Ultra HD resolution for crisp visuals", price: 349.99, stock: 40 },
    { name: "Mechanical Keyboard", description: "Tactile typing experience for enthusiasts", price: 129.99, stock: 60 },
    { name: "Gaming Mouse", description: "High precision mouse with customizable RGB", price: 79.99, stock: 85 },
    { name: "External SSD 1TB", description: "Fast storage for your large files", price: 159.99, stock: 55 },
    { name: "Bluetooth Speaker", description: "Portable speaker with deep bass", price: 89.99, stock: 120 },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
