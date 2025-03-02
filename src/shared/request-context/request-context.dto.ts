import {
  UserAccessTokenClaims,
  UserAccessTokenClaimsAdmin,
} from '../../auth/dtos';

export class RequestContext {
  public requestID: string | undefined;

  public url: string;

  public ip: string | undefined;

  // TODO : Discuss with team if this import is acceptable or if we should move UserAccessTokenClaims to shared.
  public user: UserAccessTokenClaims;
}

export class RequestContextAdmin {
  public requestID: string | undefined;

  public url: string;

  public ip: string | undefined;

  // TODO : Discuss with team if this import is acceptable or if we should move UserAccessTokenClaims to shared.
  public user: UserAccessTokenClaimsAdmin;
}
