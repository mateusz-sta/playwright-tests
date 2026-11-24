import { APIResponse } from '@playwright/test';

// For test data code, where a failed precondition should stop the test.
export async function readCreated<T>(
  response: APIResponse,
  what: string,
): Promise<T> {
  if (response.status() !== 201) {
    throw new Error(
      `Could not create ${what}: ${response.status()} ${await response.text()}`,
    );
  }
  return response.json();
}

export async function readList<T>(
  response: APIResponse,
  what: string,
): Promise<T[]> {
  if (response.status() !== 200) {
    throw new Error(
      `Could not list ${what}: ${response.status()} ${await response.text()}`,
    );
  }
  return response.json();
}

// Missing items (already deleted by the test) are fine.
export async function deleteIgnoringMissing(
  response: APIResponse,
): Promise<void> {
  if (![200, 204, 404].includes(response.status())) {
    throw new Error(
      `Cleanup failed: ${response.status()} ${await response.text()}`,
    );
  }
}
