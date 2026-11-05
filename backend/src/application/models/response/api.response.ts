export interface ApiSuccessResponse<TData = undefined> {
  success: true;
  message: string;
  data?: TData;
  meta?: Record<string, number>;
}

export function apiSuccess<TData>(
  message: string,
  data: TData,
): ApiSuccessResponse<TData> {
  return { success: true, message, data };
}

export function apiSuccessWithoutData(message: string): ApiSuccessResponse {
  return { success: true, message };
}

export function apiListSuccess<TData>(
  data: TData[],
  meta: Record<string, number>,
): ApiSuccessResponse<TData[]> {
  return { success: true, message: "OK", data, meta };
}
