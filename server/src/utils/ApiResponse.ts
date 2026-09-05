export type ApiResponseBody<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export function successResponse<T>(
  message: string,
  data?: T,
): ApiResponseBody<T> {
  return data === undefined
    ? { success: true, message }
    : { success: true, message, data };
}
