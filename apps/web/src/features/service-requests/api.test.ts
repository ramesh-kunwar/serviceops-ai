import { afterEach, expect, it, vi } from 'vitest';
import { ApiError, createServiceRequest, getServiceRequests } from './api';

const input = {
  customerName: 'Alex Example',
  title: 'Broken air conditioner',
  description: 'The unit is not cooling.',
};

const savedRequest = {
  ...input,
  id: 'b21992fa-5374-456b-bb2b-7d259c522dd4',
  status: 'NEW',
  createdAt: '2026-11-07T00:00:00.000Z',
};

afterEach(() => vi.unstubAllGlobals());

it('fetches and returns the list of saved requests', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify([savedRequest])));
  vi.stubGlobal('fetch', fetchMock);

  await expect(getServiceRequests()).resolves.toEqual([savedRequest]);
  expect(fetchMock).toHaveBeenCalledWith('/api/requests', { method: 'GET' });
});

it('accepts an empty list', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]')));
  await expect(getServiceRequests()).resolves.toEqual([]);
});

it('posts trimmed JSON and returns the saved request', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(savedRequest), { status: 201 }),
    );
  vi.stubGlobal('fetch', fetchMock);

  await expect(
    createServiceRequest({ ...input, customerName: '  Alex Example  ' }),
  ).resolves.toEqual(savedRequest);
  expect(fetchMock).toHaveBeenCalledWith('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
});

it('rejects invalid input before contacting the API', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await expect(
    createServiceRequest({ ...input, title: ' ' }),
  ).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('preserves HTTP status and backend field errors', async () => {
  const details = [{ field: 'title', message: 'Title is required' }];
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: 'Invalid request data', details }),
          { status: 400 },
        ),
      ),
  );

  await expect(createServiceRequest(input)).rejects.toMatchObject({
    name: 'ApiError',
    kind: 'http',
    status: 400,
    message: 'Invalid request data',
    details,
  });
});

it('handles non-JSON server errors without mislabeling them as network errors', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response('<html>Bad gateway</html>', { status: 502 }),
      ),
  );
  await expect(getServiceRequests()).rejects.toMatchObject({
    kind: 'http',
    status: 502,
  });
});

it('reports network errors without retrying a POST', async () => {
  const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  vi.stubGlobal('fetch', fetchMock);
  await expect(createServiceRequest(input)).rejects.toMatchObject({
    kind: 'network',
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it.each(['not json', '{}', '[{"id": 1}]'])(
  'rejects an invalid list response: %s',
  async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
    await expect(getServiceRequests()).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  },
);

it('rejects an invalid creation confirmation', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('{"id": 1}', { status: 201 })),
  );
  await expect(createServiceRequest(input)).rejects.toBeInstanceOf(ApiError);
});

it('forwards cancellation and preserves the abort error', async () => {
  const controller = new AbortController();
  const abortError = new DOMException('Aborted', 'AbortError');
  controller.abort();
  const fetchMock = vi.fn().mockRejectedValue(abortError);
  vi.stubGlobal('fetch', fetchMock);

  await expect(getServiceRequests({ signal: controller.signal })).rejects.toBe(
    abortError,
  );
  expect(fetchMock).toHaveBeenCalledWith('/api/requests', {
    method: 'GET',
    signal: controller.signal,
  });
});
