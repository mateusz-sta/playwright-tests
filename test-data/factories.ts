import { faker } from '@faker-js/faker';

// Everything created by tests starts with this prefix, so test data is easy to spot
// (and clean up) on the shared test environment.
export const TEST_PREFIX = 'PW-TEST';

// Id that does not exist on the environment.
export const MISSING_ID = 999_999_999;

export function uniqueId(): string {
  return `${Date.now()}${faker.string.numeric(4)}`;
}

// Date in the YYYY-MM-DD format used by documents, orders, lists and shipments.
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
