import { z } from 'zod';
import { createServiceRequestSchema } from './validation';

const endpoint = '/api/requests';

const serviceRequestSchema = createServiceRequestSchema.extend({
  id: z.uuid(),
  status: z.literal('NEW'),
  // JSON transports timestamps as strings, not JavaScript Date objects.
  createdAt: z.iso.datetime({ offset: true }),
});

const errorResponseSchema = z.object({
  error: z.string(),
  details: z
    .array(z.object({ field: z.string(), message: z.string() }))
    .optional(),
});

export type ServiceRequest = z.infer<typeof serviceRequestSchema>;
export type CreateServiceRequestInput = z.input<
  typeof createServiceRequestSchema
>;
export type ApiFieldError = { field: string; message: string };

type RequestOptions = { signal?: AbortSignal };

export class ApiError extends Error {
  readonly kind: 'http' | 'network' | 'invalid-response';
  readonly status: number | undefined;
  readonly details: ApiFieldError[];

  constructor(
    message: string,
    kind: ApiError['kind'],
    status?: number,
    details: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  let response: Response;

  try {
    response = await fetch(endpoint, init);
  } catch (error) {
    // Cancellation is intentional; let callers handle it without an error toast.
    if (init.signal?.aborted) throw error;
    throw new ApiError('Unable to connect to the API.', 'network');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (init.signal?.aborted) throw error;
    // Non-JSON HTTP failures (for example a proxy error page) are still HTTP errors.
    if (!response.ok) {
      throw new ApiError('The API request failed.', 'http', response.status);
    }
    throw new ApiError(
      'The API returned unreadable JSON.',
      'invalid-response',
      response.status,
    );
  }

  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(body);
    throw new ApiError(
      parsed.success ? parsed.data.error : 'The API request failed.',
      'http',
      response.status,
      parsed.success ? parsed.data.details : undefined,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      'The API returned unexpected data.',
      'invalid-response',
      response.status,
    );
  }

  return parsed.data;
}

/** Fetch the latest requests, in the order returned by the backend. */
export function getServiceRequests(
  options: RequestOptions = {},
): Promise<ServiceRequest[]> {
  return request({ method: 'GET', ...options }, z.array(serviceRequestSchema));
}

/** Create a request and return the saved record. POST requests are never retried automatically. */
export async function createServiceRequest(
  input: CreateServiceRequestInput,
  options: RequestOptions = {},
): Promise<ServiceRequest> {
  const data = createServiceRequestSchema.parse(input);

  return request(
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    },
    serviceRequestSchema,
  );
}
