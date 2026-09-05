export type TokenType = "access" | "refresh";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type AccessTokenPayload = AuthUser & {
  type: "access";
};

export type RefreshTokenPayload = AuthUser & {
  type: "refresh";
};
