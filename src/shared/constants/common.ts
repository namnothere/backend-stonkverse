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

  ACTIVATION_CODE_INCORRECT: 'activation code incorrect',
  INCORRECT_PASSWORD: 'incorrect password',

  USER_NOT_VERIFIED: 'user not verified',
  USER_ALREADY_VERIFIED: 'user already verified',

  COURSE_NOT_FOUND: 'course not found',
  COURSE_ALREADY_REGISTERED: 'course already registered',
  COURSE_DATA_NOT_FOUND: 'course data not found',

  USER_DOES_NOT_OWN_COURSE: 'user does not own course',
  USER_ALREADY_OWN_COURSE: 'user already own course',

  LAYOUT_NOT_FOUND: 'layout not found',
  CONTACT_NOT_FOUND: 'contact not found',

  ORDER_NOT_FOUND: 'order not found',

  PAYMENT_NOT_AUTHORIZED: 'payment not authorized',

  COMMENT_NOT_FOUND: 'comment not found',
  PARENT_COMMENT_NOT_FOUND: 'parent comment not found',

  PROMOTION_CODE_EXPIRED: 'Promotion code has expired',
  PROMOTION_CODE_INVALID: 'Promotion code is invalid',
  PROMOTION_CODE_EXISTS: 'Promotion code already exists',
  PROMOTION_CODE_NOT_FOUND: 'Promotion not found',

  SETTING_ALREADY_EXISTS: 'Setting already exists',
  SETTING_NOT_FOUND: 'Setting not found',
};

export const ROLES_KEY = 'roles';
export const CLOUDINARY = 'Cloudinary';
export const STRIPE = 'Stripe';
