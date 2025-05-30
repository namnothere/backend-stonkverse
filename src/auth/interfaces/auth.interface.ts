export interface JwtSign {
  access_token: string;
  refresh_token: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

export interface Payload {
  userId: string;
  username: string;
  role: string;
}
