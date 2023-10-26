// import { RoleOutput } from '../shared/dtos';

export interface JwtSign {
  access_token: string;
  refresh_token: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  // roles: RoleOutput[];
}

export interface Payload {
  id: string;
  email: string;
  // roles: RoleOutput[];
}

export interface RefreshTokenPayload {
  sub: string;
}
