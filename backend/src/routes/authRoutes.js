'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { registerValidators, loginValidators, refreshValidators } = require('../validators/authValidators');

router.post('/register', authLimiter, registerValidators, validate, authController.register);
router.post('/login', authLimiter, loginValidators, validate, authController.login);
router.post('/refresh', refreshValidators, validate, authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
