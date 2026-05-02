export class HttpError<TData = unknown> extends Error {
  status: number;
  data: TData | undefined;

  constructor(message: string, status: number, data?: TData) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

type RequestJsonOptions = RequestInit & {
  fallbackMessage?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(data: unknown, fallbackMessage: string): string {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (!isRecord(data)) {
    return fallbackMessage;
  }

  const message = data.message;
  const error = data.error;
  const detail = data.detail;
  const details = data.details;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (typeof error === 'string' && typeof detail === 'string' && detail.trim()) {
    return `${error}: ${detail}`;
  }

  if (typeof error === 'string' && typeof details === 'string' && details.trim()) {
    return `${error}: ${details}`;
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (typeof details === 'string' && details.trim()) {
    return details;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallbackMessage;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const rawBody = await response.text();
  if (!rawBody) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return rawBody;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

export async function requestJson<TResponse, TError = unknown>(
  input: RequestInfo | URL,
  options: RequestJsonOptions = {},
): Promise<TResponse> {
  const { fallbackMessage, headers, body, ...init } = options;
  const finalHeaders = new Headers(headers);

  if (body && !(body instanceof FormData) && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    body,
    headers: finalHeaders,
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new HttpError<TError>(
      getErrorMessage(
        data,
        fallbackMessage ?? `Request failed with status ${response.status}`,
      ),
      response.status,
      data as TError,
    );
  }

  return data as TResponse;
}

export function isHttpError<TData = unknown>(
  error: unknown,
): error is HttpError<TData> {
  return error instanceof HttpError;
}
