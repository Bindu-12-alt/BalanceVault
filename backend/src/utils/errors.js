'use strict';
/**
 * Custom error hierarchy for BalanceVault.
 * Using typed errors lets the centralized handler set the right HTTP status codes.
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, fields = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class TransferError extends AppError {
  constructor(message, code = 'TRANSFER_ERROR') {
    super(message, 422, code);
  }
}

class InsufficientFundsError extends TransferError {
  constructor() {
    super('Insufficient balance for this transfer', 'INSUFFICIENT_FUNDS');
  }
}

class AccountSuspendedError extends TransferError {
  constructor(which = 'Account') {
    super(`${which} is not active`, 'ACCOUNT_NOT_ACTIVE');
  }
}

class IdempotencyError extends AppError {
  constructor() {
    super('Duplicate request detected', 409, 'DUPLICATE_REQUEST');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TransferError,
  InsufficientFundsError,
  AccountSuspendedError,
  IdempotencyError,
};
