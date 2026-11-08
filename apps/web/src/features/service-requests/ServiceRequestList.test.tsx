import { act, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ServiceRequestList from './ServiceRequestList';
import type { ServiceRequest } from './api';

const requests: ServiceRequest[] = [
  {
    id: 'b21992fa-5374-456b-bb2b-7d259c522dd4',
    customerName: 'Alex Example',
    title: 'Broken air conditioner',
    description: 'The air conditioner is not cooling.',
    status: 'NEW',
    createdAt: '2026-11-07T12:30:00.000Z',
  },
  {
    id: '1884bf5c-c151-45ad-ae18-a5c7fe1b2839',
    customerName: 'Sam Example',
    title: 'Leaking faucet',
    description: 'The kitchen faucet keeps dripping.',
    status: 'NEW',
    createdAt: '2026-11-06T09:15:00.000Z',
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows a loading status until the requests arrive', async () => {
  let resolveResponse!: (response: Response) => void;
  const pendingResponse = new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  });
  const fetchMock = vi.fn().mockReturnValue(pendingResponse);
  vi.stubGlobal('fetch', fetchMock);

  render(<ServiceRequestList />);

  expect(
    screen.getByRole('region', { name: 'Service requests' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Loading requests…');
  expect(
    screen.queryByText('No service requests yet.'),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/requests', {
    method: 'GET',
    signal: expect.any(AbortSignal),
  });

  resolveResponse(Response.json(requests));

  expect(await screen.findByRole('list')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('renders every request and its details in the order returned by the API', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(requests)));

  render(<ServiceRequestList />);

  const list = await screen.findByRole('list');
  const items = within(list).getAllByRole('listitem');
  expect(items).toHaveLength(requests.length);

  requests.forEach((request, index) => {
    const item = within(items[index]);
    expect(
      item.getByRole('heading', { level: 3, name: request.title }),
    ).toBeInTheDocument();
    expect(item.getByText(request.description)).toBeInTheDocument();
    expect(item.getByText(request.customerName)).toBeInTheDocument();
    expect(item.getByText(request.status)).toBeInTheDocument();
    expect(
      item.getByText(new Date(request.createdAt).toLocaleString()),
    ).toHaveAttribute('datetime', request.createdAt);
  });

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(
    screen.queryByText('No service requests yet.'),
  ).not.toBeInTheDocument();
});

it('shows the empty state when the API returns no requests', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([])));

  render(<ServiceRequestList />);

  expect(
    await screen.findByText('No service requests yet.'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
});

it.each([
  {
    failure: 'an HTTP error',
    respond: () => Promise.resolve(new Response(null, { status: 500 })),
  },
  {
    failure: 'a network error',
    respond: () => Promise.reject(new TypeError('Failed to fetch')),
  },
  {
    failure: 'unreadable JSON',
    respond: () => Promise.resolve(new Response('not JSON')),
  },
  {
    failure: 'an invalid response shape',
    respond: () => Promise.resolve(Response.json({ requests })),
  },
])('shows an error after $failure', async ({ respond }) => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(respond));

  render(<ServiceRequestList />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load service requests. Please try again.',
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(
    screen.queryByText('No service requests yet.'),
  ).not.toBeInTheDocument();
});

it('aborts the pending API request when unmounted', async () => {
  let rejectResponse!: (reason: unknown) => void;
  const pendingResponse = new Promise<Response>((_resolve, reject) => {
    rejectResponse = reject;
  });
  const fetchMock = vi.fn().mockReturnValue(pendingResponse);
  vi.stubGlobal('fetch', fetchMock);

  const { unmount } = render(<ServiceRequestList />);
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
  expect(signal.aborted).toBe(false);

  unmount();

  expect(signal.aborted).toBe(true);
  await act(async () => {
    rejectResponse(new DOMException('The request was aborted.', 'AbortError'));
  });
});
