import {
  CreatePackageRequest,
  CreatePlatformRequest,
  CreateProductRequest,
} from '../api/types';
import { faker } from '@faker-js/faker';

// Everything created by tests starts with this prefix, so test data is easy to spot
// (and clean up) on the shared test environment.
export const TEST_PREFIX = 'PW-TEST';

export function uniqueId(): string {
  return `${Date.now()}${faker.string.numeric(4)}`;
}

// Date in the YYYY-MM-DD format used by documents, orders, lists and shipments.
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildProduct(
  overrides: Partial<CreateProductRequest> = {},
): CreateProductRequest {
  return {
    name: `${TEST_PREFIX} ${faker.commerce.productName()}`,
    // The API stores symbols in uppercase.
    symbol: `${TEST_PREFIX}-${uniqueId()}`,
    netPricePer1000: 42.5,
    vatRate: 23,
    ...overrides,
  };
}

export function buildPlatform(
  overrides: Partial<CreatePlatformRequest> = {},
): CreatePlatformRequest {
  return {
    name: `${TEST_PREFIX} ${uniqueId()}`,
    kind: 'OTHER',
    ...overrides,
  };
}

export function buildPackage(
  platformId: number,
  productId: number,
  overrides: Partial<CreatePackageRequest> = {},
): CreatePackageRequest {
  return {
    platformId,
    productId,
    name: `${TEST_PREFIX} package ${uniqueId()}`,
    sku: `${TEST_PREFIX}-${uniqueId()}`,
    quantity: 100,
    weightG: 450,
    ...overrides,
  };
}

// Usernames: 3–50 chars, lowercase letters, digits, dot, dash, underscore.
export function buildUsername(): string {
  return `pw.test.${uniqueId()}`;
}
