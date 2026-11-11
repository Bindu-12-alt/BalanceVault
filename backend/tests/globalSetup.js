'use strict';
const { execSync } = require('child_process');
require('dotenv').config();

module.exports = async () => {
  process.env.NODE_ENV = 'test';

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL is required; tests must use a dedicated test database');
  }

  const appDatabaseUrl = process.env.DATABASE_URL;
  if (appDatabaseUrl) {
    const databaseIdentity = (value) => {
      const url = new URL(value);
      return `${url.protocol}//${url.hostname}:${url.port}${url.pathname}`;
    };

    if (databaseIdentity(testDatabaseUrl) === databaseIdentity(appDatabaseUrl)) {
      throw new Error('TEST_DATABASE_URL must point to a different database than DATABASE_URL');
    }
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
