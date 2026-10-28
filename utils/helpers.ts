/**
 * Returns the value of an environment variable or throws when it is missing,
 * so a test fails with a clear message instead of using `undefined`.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Check your .env file.`,
    );
  }
  return value;
}
