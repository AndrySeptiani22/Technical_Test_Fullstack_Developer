import {
  BaseResponse,
  BaseResponseWithData,
  BaseResponseWithOptionalData,
} from "./base.response";

export class GlobalResponse extends BaseResponse {}

export class GlobalResponseWithData<
  TData,
> extends BaseResponseWithData<TData> {}

export class GlobalResponseWithOptionalData<
  TData,
> extends BaseResponseWithOptionalData<TData> {}
