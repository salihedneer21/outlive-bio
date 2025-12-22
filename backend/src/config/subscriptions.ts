export const SUBSCRIPTION_CATEGORY_ID = 18;
/**
 * Category row in the `categories` table that represents "Subscription Plans".
 * All subscription plan products (Standard/Premium) belong to this category.
 * Several parts of the existing system assume this ID is stable.
 */

export const TIER_2_STATES = ['NY', 'NJ', 'CT', 'MA', 'NH', 'RI'] as const;
/**
 * States that use premium subscription tier (`pricing_tier = 'tier_2'`).
 * Rhode Island (RI) is currently blocked entirely at the intake layer.
 */

export const BIOREFERENCE_STATES = ['NY', 'NJ'] as const;
/**
 * States that use the BioReference lab provider and require at-home phlebotomy.
 */

export const BLOCKED_STATES = ['RI'] as const;
/**
 * States we currently do not support for subscription onboarding.
 */

export const DEFAULT_PHLEBOTOMY_PRICE_CENTS = 9900;
/**
 * Default at-home phlebotomy add-on price in cents.
 * If the business changes this (e.g. to $75), adjust this constant
 * and keep frontend/backend in sync.
 */

