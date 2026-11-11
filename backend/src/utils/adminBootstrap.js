'use strict';
const bcrypt = require('bcrypt');
const { getPrismaClient } = require('../config/database');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Bootstrap the first admin user from environment variables.
 * Only runs when ADMIN_BOOTSTRAP_ENABLED=true.
 * Idempotent — safe to call multiple times; skips if admin already exists.
 *
 * IMPORTANT: Disable bootstrap after the first run by setting
 *            ADMIN_BOOTSTRAP_ENABLED=false in your environment.
 */
const bootstrapAdmin = async () => {
  const { bootstrapEmail, bootstrapPassword, bootstrapFirstName, bootstrapLastName } = config.admin;

  if (!bootstrapEmail || !bootstrapPassword) {
    logger.warn('Admin bootstrap enabled but credentials not set in environment');
    return;
  }

  const prisma = getPrismaClient();
  const existing = await prisma.user.findUnique({ where: { email: bootstrapEmail } });

  if (existing) {
    if (existing.role === 'ADMIN') {
      logger.info('Admin bootstrap: admin account already exists, skipping');
      return;
    }
    logger.warn('Admin bootstrap: email exists but is not an admin — skipping to avoid overwrite');
    return;
  }

  const passwordHash = await bcrypt.hash(bootstrapPassword, config.security.bcryptRounds);

  const admin = await prisma.user.create({
    data: {
      email: bootstrapEmail,
      passwordHash,
      firstName: bootstrapFirstName,
      lastName: bootstrapLastName,
      role: 'ADMIN',
      isActive: true,
    },
  });

  logger.info('Admin bootstrap: created admin account', { email: admin.email, id: admin.id });
  logger.warn('SECURITY: Disable ADMIN_BOOTSTRAP_ENABLED after setup and change the admin password immediately');
};

module.exports = { bootstrapAdmin };
