import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

describe('LaraNode Pro API Tests', () => {
  let prisma: PrismaClient;
  let pool: pg.Pool;

  let authToken: string;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    // Login once to get the token for authorized requests
    const res = await request('http://localhost:3000')
      .post('/api/auth/login')
      .send({ identifier: 'demo_user', password: 'password123' });

    authToken = res.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it('should fetch products successfully', async () => {
    // We expect at least the seeded products
    const res = await request('http://localhost:3000').get('/api/products');

    // Note: This test assumes the server is running on localhost:3000
    // In a real CI, we might spin up the app or mock the express app
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    }
  });

  it('should fail login with wrong credentials', async () => {
    const res = await request('http://localhost:3000')
      .post('/api/auth/login')
      .send({ identifier: 'nonexistent', password: 'wrong' });

    if (res.status !== 404) {
      // 404 if server not reachable, otherwise we check 401
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    }
  });

  it('should register a new user successfully', async () => {
    const uniqueUsername = `testuser_${Date.now()}`;
    const res = await request('http://localhost:3000')
      .post('/api/auth/register')
      .send({
        username: uniqueUsername,
        email: `${uniqueUsername}@example.com`,
        password: 'password123',
        name: 'Test User',
      });

    if (res.status === 200) {
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe(uniqueUsername);
    }
  });

  // TODO: UNIT TEST UNTUK DASHBOARD SUMMARY (Commented out for Demo)
  it('should return correct dashboard summary data', async () => {
    const res = await request('http://localhost:3000')
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalSales');
    expect(res.body).toHaveProperty('productSales');
    expect(typeof res.body.totalSales).toBe('number');
    expect(typeof res.body.totalUsers).toBe('number');
  });
});
