export type TokenType = "access" | "refresh";

export type Role = "user" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  role?: Role;
};

export type AccessTokenPayload = AuthUser & {
  type: "access";
};

export type RefreshTokenPayload = AuthUser & {
  type: "refresh";
};
