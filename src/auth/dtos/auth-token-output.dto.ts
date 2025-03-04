import { Expose, Type } from 'class-transformer';

export class UserAccessTokenClaims {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  role: string;
}

export class UserAccessTokenClaimsAdmin {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  role: string;
}

export class AuthTokenOutput {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  @Type(() => UserAccessTokenClaims)
  user: UserAccessTokenClaims;
}
