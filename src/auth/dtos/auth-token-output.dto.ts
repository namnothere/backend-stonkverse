import { Expose, Type } from 'class-transformer';

export class UserAccessTokenClaims {
  @Expose()
  id: string;

  @Expose()
  username: string;
}

export class UserAccessTokenClaimsAdmin {
  @Expose()
  id: string;

  @Expose()
  username: string;
}

export class AuthTokenOutput {
  @Expose()
  token: string;

  @Expose()
  refreshToken: string;

  @Expose()
  @Type(() => UserAccessTokenClaims)
  user: UserAccessTokenClaims;
}
