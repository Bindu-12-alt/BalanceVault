'use strict';
const { execSync } = require('child_process');

module.exports = async () => {
  process.env.NODE_ENV = 'test';

  const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error('DATABASE_URL or TEST_DATABASE_URL environment variable required for tests');
  }

  process.env.DATABASE_URL = testDatabaseUrl;

  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  }
};
