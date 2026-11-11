'use strict';
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config/env');
const logger = require('./config/logger');
const requestId = require('./middleware/requestId');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transferRoutes = require('./routes/transferRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// --- Security Headers ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// --- CORS ---
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [config.frontendUrl];
    if (config.isDevelopment) {
      allowed.push('http://localhost:5173', 'http://localhost:3000');
    }
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// --- Body parsing ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// --- Compression ---
app.use(compression());

// --- Request ID (must come before logging) ---
app.use(requestId);

// --- HTTP logging (skip in test) ---
if (!config.isTest) {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.path === '/health',
  }));
}

// --- Rate limiting ---
app.use(apiLimiter);

// --- Health endpoints (no auth, no rate limit on health) ---
app.use('/', healthRoutes);

// --- API routes ---
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/onboarding`, onboardingRoutes);
app.use(`${API_PREFIX}/accounts`, accountRoutes);
app.use(`${API_PREFIX}/transfers`, transferRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// --- 404 & Error handling ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
