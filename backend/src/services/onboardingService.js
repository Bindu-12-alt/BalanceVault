'use strict';
const { getPrismaClient } = require('../config/database');
const { ConflictError, NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');

const prisma = () => getPrismaClient();

/**
 * Submit onboarding application for an account holder.
 */
const submitOnboarding = async (userId, data) => {
  const existing = await prisma().onboarding.findUnique({ where: { userId } });
  if (existing) {
    if (existing.status === 'APPROVED') {
      throw new ConflictError('Onboarding already approved');
    }
    if (existing.status === 'PENDING') {
      throw new ConflictError('Onboarding application already submitted and pending review');
    }
    // Allow resubmission if REJECTED
    const updated = await prisma().onboarding.update({
      where: { userId },
      data: { ...data, status: 'PENDING', reviewedById: null, reviewNote: null, reviewedAt: null },
    });
    return updated;
  }

  const onboarding = await prisma().onboarding.create({
    data: { userId, ...data, status: 'PENDING' },
  });
  return onboarding;
};

/**
 * Get onboarding status for a user.
 */
const getOnboardingStatus = async (userId) => {
  const onboarding = await prisma().onboarding.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return onboarding;
};

/**
 * Get all pending onboarding applications (admin).
 */
const listOnboardingApplications = async ({ status, page = 1, limit = 20 } = {}) => {
  const where = status ? { status } : {};
  const [applications, total] = await Promise.all([
    prisma().onboarding.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma().onboarding.count({ where }),
  ]);
  return { applications, total, page, limit };
};

/**
 * Get a single onboarding application (admin).
 */
const getOnboardingById = async (id) => {
  const app = await prisma().onboarding.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!app) throw new NotFoundError('Onboarding application');
  return app;
};

/**
 * Approve or reject an onboarding application (admin).
 */
const reviewOnboarding = async (id, adminId, { decision, reviewNote }) => {
  const app = await prisma().onboarding.findUnique({ where: { id } });
  if (!app) throw new NotFoundError('Onboarding application');
  if (app.status !== 'PENDING') {
    throw new ConflictError(`Application has already been ${app.status.toLowerCase()}`);
  }

  const newStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED';

  const updated = await prisma().$transaction(async (tx) => {
    const onboarding = await tx.onboarding.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedById: adminId,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
    });

    return onboarding;
  });

  return updated;
};

module.exports = {
  submitOnboarding,
  getOnboardingStatus,
  listOnboardingApplications,
  getOnboardingById,
  reviewOnboarding,
};
