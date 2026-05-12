import axios from 'axios';

type ErrBody = { success?: boolean; error?: { message?: string }; message?: string };

export function messageFromUnknownError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ErrBody | undefined;
    const apiMsg =
      typeof body?.error?.message === 'string'
        ? body.error.message
        : typeof body?.message === 'string'
          ? body.message
          : undefined;
    if (apiMsg) return apiMsg;
    if (error.message) return error.message;
    return error.response?.statusText || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
