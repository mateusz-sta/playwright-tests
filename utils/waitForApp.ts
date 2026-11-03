import { APIRequestContext } from '@playwright/test';

// The app (Render free plan) sleeps after ~15 minutes without traffic and needs
// 30–60 s to start. Polls the API docs until the app answers, so the first tests
// do not hit timeouts. Returns the number of attempts it took.
export async function waitForApp(
  request: APIRequestContext,
  { attempts = 12, intervalMs = 10_000, requestTimeoutMs = 20_000 } = {},
): Promise<number> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await request.get('/api/docs-json', {
        timeout: requestTimeoutMs,
      });
      if (response.ok()) return attempt;
    } catch {
      // Connection refused or timeout – the app is still starting.
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(
    `The app at BASE_URL did not respond after ${attempts} attempts – it may be down.`,
  );
}
