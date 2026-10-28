// Request and response shapes from the API documentation:
// https://magazyn-test.onrender.com/api/docs (JSON: /api/docs-json)

// LoginDto
export type LoginRequest = {
  username: string;
  password: string;
};

// LoginResponseDto
export type LoginResponse = {
  accessToken: string;
  expiresAt: string;
  username: string;
};

// CurrentUserDto
export type CurrentUser = {
  id: number;
  username: string;
};
