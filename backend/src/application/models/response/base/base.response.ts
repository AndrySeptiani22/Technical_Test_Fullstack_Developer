import { StatusCodes } from "http-status-codes";

export class BaseResponse {
  readonly isError = false as const;

  constructor(
    readonly message: string,
    readonly httpStatus = StatusCodes.OK,
  ) {}
}

export class BaseResponseWithData<TData> extends BaseResponse {
  constructor(
    message: string,
    readonly data: TData,
    httpStatus = StatusCodes.OK,
  ) {
    super(message, httpStatus);
  }
}

export class BaseResponseWithOptionalData<TData> extends BaseResponse {
  readonly data?: TData;

  constructor(
    message: string,
    data?: TData,
    httpStatus = StatusCodes.OK,
  ) {
    super(message, httpStatus);
    this.data = data;
  }
}
