'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../config/database');
const config = require('../config/env');
const {
  ConflictError,
  AuthenticationError,
} = require('../utils/errors');

const prisma = () => getPrismaClient();

/**
 * Register a new account holder.
 */
const register = async ({ email, password, firstName, lastName, phone }) => {
  const existing = await prisma().user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

  const user = await prisma().user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      role: 'ACCOUNT_HOLDER',
    },
    select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
  });

  return user;
};

/**
 * Login with email/password. Returns access token and refresh token.
 */
const login = async ({ email, password }) => {
  const user = await prisma().user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  // Constant-time check: always hash even if user not found, to prevent timing attacks
  const dummyHash = '$2b$12$invalidhashforunknownuserXXXXXXXXXXXXXXXXXXXXXXXXXX';
  const hashToCheck = user ? user.passwordHash : dummyHash;
  const valid = await bcrypt.compare(password, hashToCheck);

  if (!user || !valid) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account has been deactivated');
  }

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
};

/**
 * Get current user profile.
 */
const getMe = async (userId) => {
  const user = await prisma().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      onboarding: {
        select: { status: true, createdAt: true, reviewedAt: true, reviewNote: true },
      },
    },
  });
  return user;
};

/**
 * Refresh access token.
 */
const refreshAccessToken = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh') throw new AuthenticationError('Invalid token type');

  const user = await prisma().user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, email: true, isActive: true },
  });

  if (!user || !user.isActive) throw new AuthenticationError('User not found');

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return { accessToken };
};

module.exports = { register, login, getMe, refreshAccessToken };
