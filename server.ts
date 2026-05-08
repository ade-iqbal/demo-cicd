import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body; // identifier can be email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: '1d',
      });
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res
        .status(500)
        .json({
          error: 'Login failed',
          details: error instanceof Error ? error.message : String(error),
        });
    }
  });

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, name } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, email, password: hashedPassword, name },
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: '1d',
      });
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res
        .status(400)
        .json({
          error: 'Registration failed. User might already exist.',
          details: error instanceof Error ? error.message : String(error),
        });
    }
  });

  // Middleware to verify JWT
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err)
        return res
          .status(401)
          .json({ message: 'Failed to authenticate token' });
      req.userId = decoded.userId;
      next();
    });
  };

  // Products: List
  app.get('/api/products', async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
  });

  // Products: Manage (Create/Update/Delete) - Simplied for demo
  app.post('/api/products', authenticate, async (req, res) => {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  });

  app.put('/api/products/:id', authenticate, async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  });

  app.delete('/api/products/:id', authenticate, async (req, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  // Checkout
  app.post('/api/checkout', authenticate, async (req: any, res) => {
    const { items } = req.body; // Array of { productId, quantity }
    try {
      const result = await prisma.$transaction(async (tx) => {
        let total = 0;
        const orderItemsData = [];

        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product || product.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product?.name || 'product'}`,
            );
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          total += product.price * item.quantity;
          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          });
        }

        const order = await tx.order.create({
          data: {
            userId: req.userId,
            totalPrice: total,
            status: 'COMPLETED',
            items: { create: orderItemsData },
          },
          include: { items: true },
        });
        return order;
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // User Profile Update
  app.put('/api/profile', authenticate, async (req: any, res) => {
    const { name, username, email } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { name, username, email },
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Profile update failed' });
    }
  });

  // --- DASHBOARD SUMMARY (TODO: Commented out for demo) ---

  // TODO: Fitur tambahan untuk menampilkan summary data
  // app.get('/api/dashboard/summary', authenticate, async (req, res) => {
  //   try {
  //     const totalUsers = (await prisma.user.count()).toString();
  //     const totalSales = await prisma.order.aggregate({
  //       _sum: { totalPrice: true },
  //     });
  //     const productSales = await prisma.product.findMany({
  //       include: {
  //         _count: { select: { orderItems: true } },
  //       },
  //     });

  //     // Intentional logic complexity or potential bug could be introduced here
  //     res.json({
  //       totalUsers,
  //       totalSales: totalSales._sum.totalPrice || 0,
  //       productSales: productSales.map((p) => ({
  //         name: p.name,
  //         count: p._count.orderItems,
  //       })),
  //     });
  //   } catch (error) {
  //     res.status(500).json({ error: 'Dashboard summary failed' });
  //   }
  // });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
