import { HttpErrorResponse } from '@angular/common/http';

type ErrorPayload =
  | string
  | {
      message?: string;
      detail?: string;
      messages?: string[] | Record<string, string[]>;
      errors?: Record<string, string[]>;
    }
  | null
  | undefined;

const extractMessage = (payload: ErrorPayload): string | undefined => {
  if (!payload) return undefined;
  if (typeof payload === 'string') return payload;
  if (payload.message) return String(payload.message);
  if (payload.detail) return String(payload.detail);
  if (Array.isArray(payload.messages)) return payload.messages.join(', ');
  if (payload.messages && typeof payload.messages === 'object') {
    return Object.values(payload.messages).flat().join(', ');
  }
  if (payload.errors && typeof payload.errors === 'object') {
    return Object.values(payload.errors).flat().join(', ');
  }
  return undefined;
};

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!err) return fallback;

  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Network error. Check your connection.';
    const message = extractMessage(err.error as ErrorPayload) || err.message;
    return message || fallback;
  }

  const anyErr = err as { error?: ErrorPayload; message?: string };
  const message = extractMessage(anyErr?.error) || anyErr?.message;
  return message || fallback;
};
