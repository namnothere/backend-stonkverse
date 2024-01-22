export const REQUEST_ID_TOKEN_HEADER = 'x-request-id';

export const FORWARDED_FOR_TOKEN_HEADER = 'x-forwarded-for';

export enum RESULT_STATUS {
  FAILED = 0,
  SUCCEED = 1,
}

export const MESSAGES = {
  OK: 'ok',

  LOGIN_INCORRECT: 'login incorrect',

  USERNAME_ALREADY_EXIST: 'username already exist',
  USER_NOT_FOUND: 'user not found',
};

export const ROLES_KEY = 'roles';
