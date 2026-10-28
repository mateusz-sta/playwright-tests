import { requireEnv } from '../utils/helpers';

export type User = {
  username: string;
  password: string;
};

export function getTestUser(): User {
  return {
    username: requireEnv('TEST_USER_USERNAME'),
    password: requireEnv('TEST_USER_PASSWORD'),
  };
}
