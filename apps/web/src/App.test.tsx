import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';
import type { ServiceRequest } from './features/service-requests/api';

const savedRequest: ServiceRequest = {
  id: 'b21992fa-5374-456b-bb2b-7d259c522dd4',
  customerName: 'Alex Example',
  title: 'Broken air conditioner',
  description: 'The air conditioner is not cooling.',
  status: 'NEW',
  createdAt: '2026-11-07T12:30:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

async function submitRequest() {
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText('Customer name'),
    savedRequest.customerName,
  );
  await user.type(screen.getByLabelText('Title'), savedRequest.title);
  await user.type(
    screen.getByLabelText('Description'),
    savedRequest.description,
  );
  await user.click(screen.getByRole('button', { name: 'Submit request' }));
}

it.each(['empty', 'error'])(
  'refreshes an initially %s list after a successful submission',
  async (initialState) => {
    let resolveRefresh!: (response: Response) => void;
    const pendingRefresh = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        initialState === 'empty'
          ? Response.json([])
          : new Response(null, { status: 500 }),
      )
      .mockResolvedValueOnce(Response.json(savedRequest, { status: 201 }))
      .mockReturnValueOnce(pendingRefresh);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    const list = within(
      screen.getByRole('region', { name: 'Service requests' }),
    );
    if (initialState === 'empty') {
      await list.findByText('No service requests yet.');
    } else {
      await list.findByRole('alert');
    }

    await submitRequest();

    expect(await screen.findByText('Request submitted')).toBeInTheDocument();
    expect(list.getByRole('status')).toHaveTextContent('Loading requests…');
    expect(list.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([, init]) => init.method)).toEqual([
      'GET',
      'POST',
      'GET',
    ]);

    resolveRefresh(Response.json([savedRequest]));

    expect(
      await list.findByRole('heading', { name: savedRequest.title }),
    ).toBeInTheDocument();
    expect(list.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('');
  },
);

it('does not refetch the list when submission fails', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([]))
    .mockResolvedValueOnce(new Response(null, { status: 500 }));
  vi.stubGlobal('fetch', fetchMock);

  render(<App />);
  await screen.findByText('No service requests yet.');

  await submitRequest();

  expect(await screen.findByText('Unable to submit')).toBeInTheDocument();
  expect(screen.getByText('No service requests yet.')).toBeInTheDocument();
  expect(fetchMock.mock.calls.map(([, init]) => init.method)).toEqual([
    'GET',
    'POST',
  ]);
  expect(screen.getByLabelText('Title')).toHaveValue(savedRequest.title);
});

it('keeps submission successful if refreshing the list fails', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json([]))
    .mockResolvedValueOnce(Response.json(savedRequest, { status: 201 }))
    .mockRejectedValueOnce(new TypeError('Failed to fetch'));
  vi.stubGlobal('fetch', fetchMock);

  render(<App />);
  await screen.findByText('No service requests yet.');

  await submitRequest();

  const list = within(screen.getByRole('region', { name: 'Service requests' }));
  expect(await list.findByRole('alert')).toHaveTextContent(
    'Unable to load service requests. Please try again.',
  );
  expect(screen.getByText('Request submitted')).toBeInTheDocument();
  expect(screen.queryByText('Unable to submit')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Title')).toHaveValue('');
});
