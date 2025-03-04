import { Expose, Type } from 'class-transformer';

import { RESULT_STATUS } from '../constants';

export class BaseApiResponse<T> {
  @Expose()
  error?: boolean;

  @Expose()
  data?: T;

  @Expose()
  message?: string;

  @Expose()
  code?: number;

  @Expose()
  status: RESULT_STATUS = RESULT_STATUS.SUCCEED;

  @Expose()
  meta?: any;
}

export class BasePaginationResponse<T> {
  @Expose()
  listData: T[];

  @Expose()
  total: number;
}

export class BaseApiErrorObject {
  public statusCode: number;

  public message: string;

  public localizedMessage: string;

  public errorName: string;

  public details: unknown;

  public path: string;

  public requestId: string;

  public timestamp: string;
}

export class BaseApiErrorResponse {
  public error: BaseApiErrorObject;
}

export class BasePaginationResponseAdmin<T> extends BasePaginationResponse<T> {
  @Expose()
  @Type(() => Number)
  totalPrice?: number;
}
