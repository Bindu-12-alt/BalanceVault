'use strict';
require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { getPrismaClient } = require('../../src/config/database');
const { cleanTestData } = require('../helpers');

const EMAIL_PREFIX = 'authtest';
const prisma = getPrismaClient();

afterAll(async () => {
  await cleanTestData(EMAIL_PREFIX);
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  const validUser = {
    email: `${EMAIL_PREFIX}-register@example.com`,
    password: 'Register@12345',
    firstName: 'Reg',
    lastName: 'User',
  };

  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.role).toBe('ACCOUNT_HOLDER');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  it('rejects weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      ...validUser, email: `${EMAIL_PREFIX}-weak@example.com`, password: 'weak',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      ...validUser, email: 'not-an-email',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  const creds = {
    email: `${EMAIL_PREFIX}-login@example.com`,
    password: 'Login@12345',
    firstName: 'Login',
    lastName: 'User',
  };

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send(creds);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: creds.email,
      password: creds.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(creds.email);
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: creds.email,
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: `${EMAIL_PREFIX}-unknown@example.com`,
      password: 'Any@12345',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  let token;
  beforeAll(async () => {
    const email = `${EMAIL_PREFIX}-me@example.com`;
    await request(app).post('/api/v1/auth/register').send({
      email, password: 'Me@12345', firstName: 'Me', lastName: 'User',
    });
    const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Me@12345' });
    token = res.body.data.accessToken;
  });

  it('returns profile for authenticated user', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toHaveProperty('email');
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
