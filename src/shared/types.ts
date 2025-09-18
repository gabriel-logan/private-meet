export interface AuthPayload {
  sub: string;
  username: string;
}

export interface JwtPayload extends AuthPayload {
  iat: number;
  exp: number;
}
