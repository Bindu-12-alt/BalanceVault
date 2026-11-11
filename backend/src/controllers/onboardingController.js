'use strict';
const onboardingService = require('../services/onboardingService');
const { success, created } = require('../utils/response');
const { recordAudit } = require('../middleware/auditLogger');

const submitOnboarding = async (req, res, next) => {
  try {
    const onboarding = await onboardingService.submitOnboarding(req.user.id, req.body);
    await recordAudit({
      actorId: req.user.id, actorRole: req.user.role,
      action: 'ONBOARDING_SUBMIT', targetType: 'Onboarding', targetId: onboarding.id,
      outcome: 'SUCCESS', requestId: req.requestId, ipAddress: req.ip,
    });
    return created(res, { onboarding }, 'Onboarding application submitted');
  } catch (err) { next(err); }
};

const getOnboardingStatus = async (req, res, next) => {
  try {
    const onboarding = await onboardingService.getOnboardingStatus(req.user.id);
    return success(res, { onboarding });
  } catch (err) { next(err); }
};

const listOnboardingApplications = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await onboardingService.listOnboardingApplications({
      status, page: parseInt(page) || 1, limit: parseInt(limit) || 20,
    });
    return success(res, result);
  } catch (err) { next(err); }
};

const getOnboardingById = async (req, res, next) => {
  try {
    const app = await onboardingService.getOnboardingById(req.params.id);
    return success(res, { application: app });
  } catch (err) { next(err); }
};

const reviewOnboarding = async (req, res, next) => {
  try {
    const { decision, reviewNote } = req.body;
    const updated = await onboardingService.reviewOnboarding(req.params.id, req.user.id, { decision, reviewNote });
    await recordAudit({
      actorId: req.user.id, actorRole: req.user.role,
      action: `ONBOARDING_${decision.toUpperCase()}`,
      targetType: 'Onboarding', targetId: req.params.id,
      outcome: 'SUCCESS', requestId: req.requestId, ipAddress: req.ip,
      metadata: { decision, reviewNote },
    });
    return success(res, { application: updated }, `Application ${decision}d successfully`);
  } catch (err) { next(err); }
};

module.exports = { submitOnboarding, getOnboardingStatus, listOnboardingApplications, getOnboardingById, reviewOnboarding };
