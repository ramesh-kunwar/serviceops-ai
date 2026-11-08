import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import ServiceRequestForm from './ServiceRequestForm';

const savedRequest = {
  id: 'b21992fa-5374-456b-bb2b-7d259c522dd4',
  customerName: 'Alex Example',
  title: 'Broken air conditioner',
  description: 'The air conditioner is not cooling.',
  status: 'NEW',
  createdAt: '2026-11-07T00:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it.each([
  ['Customer name', 'Customer name is required', 'Alex Example'],
  ['Title', 'Title is required', 'Broken air conditioner'],
  ['Description', 'Description is required', 'The unit is not cooling.'],
])('updates the error as %s is corrected', async (label, message, value) => {
  const user = userEvent.setup();
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<ServiceRequestForm />);

  await user.click(screen.getByRole('button', { name: 'Submit request' }));
  const field = screen.getByLabelText(label);

  await user.type(field, '   ');
  expect(screen.getByText(message)).toBeInTheDocument();

  await user.type(field, value);
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  expect(field).toHaveAttribute('aria-invalid', 'false');
  // Correcting one field must not hide the other fields' errors.
  expect(screen.getAllByText(/is required$/)).toHaveLength(2);
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
  {
    failure: 'HTTP 400',
    status: 400,
    message: /The server rejected your request/,
  },
  {
    failure: 'a network failure',
    status: null,
    message: /A network error interrupted your submission/,
  },
  {
    failure: 'an unreadable confirmation',
    status: 201,
    message: /We couldn’t read the submission confirmation/,
  },
])('explains $failure and preserves input', async ({ status, message }) => {
  const user = userEvent.setup();
  const fetchMock =
    status === null
      ? vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
      : vi.fn().mockResolvedValue(new Response(null, { status }));
  vi.stubGlobal('fetch', fetchMock);
  render(<ServiceRequestForm />);

  await user.type(screen.getByLabelText('Customer name'), 'Alex Example');
  await user.type(screen.getByLabelText('Title'), 'Broken air conditioner');
  await user.type(
    screen.getByLabelText('Description'),
    'The unit is not cooling.',
  );
  await user.click(screen.getByRole('button', { name: 'Submit request' }));

  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(screen.getByLabelText('Customer name')).toHaveValue('Alex Example');
  expect(screen.getByLabelText('Title')).toHaveValue('Broken air conditioner');
  expect(screen.getByLabelText('Description')).toHaveValue(
    'The unit is not cooling.',
  );
  expect(screen.queryByText('Request submitted')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  if (status === 400) {
    expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
  }
});

it('shows required errors without sending an API request', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn();

  vi.stubGlobal('fetch', fetchMock);

  render(<ServiceRequestForm />);

  await user.click(screen.getByRole('button', { name: 'Submit request' }));

  expect(screen.getByText('Customer name is required')).toBeInTheDocument();

  expect(screen.getByText('Title is required')).toBeInTheDocument();

  expect(screen.getByText('Description is required')).toBeInTheDocument();

  expect(fetchMock).not.toHaveBeenCalled();
});

it('sends validated data and displays a success message', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(savedRequest), { status: 201 }),
    );

  vi.stubGlobal('fetch', fetchMock);

  render(<ServiceRequestForm />);

  await user.type(screen.getByLabelText('Customer name'), '  Alex Example  ');
  await user.type(screen.getByLabelText('Title'), 'Broken air conditioner');
  await user.type(
    screen.getByLabelText('Description'),
    'The air conditioner is not cooling.',
  );

  await user.click(screen.getByRole('button', { name: 'Submit request' }));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith('/api/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerName: 'Alex Example',
      title: 'Broken air conditioner',
      description: 'The air conditioner is not cooling.',
    }),
  });

  expect(await screen.findByText('Request submitted')).toBeInTheDocument();

  expect(screen.getByLabelText('Customer name')).toHaveValue('');
  expect(screen.getByLabelText('Title')).toHaveValue('');
  expect(screen.getByLabelText('Description')).toHaveValue('');

  // Clicking again must not resend the previously submitted values.
  await user.click(screen.getByRole('button', { name: 'Submit request' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Customer name is required')).toBeInTheDocument();
});

it('shows an error and preserves the fields when the API fails', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 500 }));

  vi.stubGlobal('fetch', fetchMock);

  render(<ServiceRequestForm />);

  await user.type(screen.getByLabelText('Customer name'), 'Alex Example');
  await user.type(screen.getByLabelText('Title'), 'Broken air conditioner');
  await user.type(
    screen.getByLabelText('Description'),
    'The air conditioner is not cooling.',
  );

  await user.click(screen.getByRole('button', { name: 'Submit request' }));

  expect(await screen.findByText('Unable to submit')).toBeInTheDocument();
  expect(
    screen.getByText(/The server couldn’t process your request/),
  ).toBeInTheDocument();
  expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();

  expect(screen.queryByText('Request submitted')).not.toBeInTheDocument();

  expect(screen.getByLabelText('Customer name')).toHaveValue('Alex Example');
  expect(screen.getByLabelText('Title')).toHaveValue('Broken air conditioner');
  expect(screen.getByLabelText('Description')).toHaveValue(
    'The air conditioner is not cooling.',
  );

  expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
});

it('disables submission while the request is processing', async () => {
  const user = userEvent.setup();

  let resolveRequest!: (response: Response) => void;

  const pendingResponse = new Promise<Response>((resolve) => {
    resolveRequest = resolve;
  });

  const fetchMock = vi.fn().mockReturnValue(pendingResponse);
  vi.stubGlobal('fetch', fetchMock);

  render(<ServiceRequestForm />);

  await user.type(screen.getByLabelText('Customer name'), 'Alex Example');
  await user.type(screen.getByLabelText('Title'), 'Broken air conditioner');
  await user.type(
    screen.getByLabelText('Description'),
    'The air conditioner is not cooling.',
  );

  await user.click(screen.getByRole('button', { name: 'Submit request' }));

  const submittingButton = screen.getByRole('button', {
    name: 'Submitting request…',
  });

  expect(submittingButton).toBeDisabled();
  expect(screen.getByLabelText('Customer name')).toBeDisabled();
  expect(screen.getByLabelText('Title')).toBeDisabled();
  expect(screen.getByLabelText('Description')).toBeDisabled();

  await user.click(submittingButton);

  expect(fetchMock).toHaveBeenCalledTimes(1);

  resolveRequest(new Response(JSON.stringify(savedRequest), { status: 201 }));

  expect(await screen.findByText('Request submitted')).toBeInTheDocument();

  expect(screen.getByRole('button', { name: 'Submit request' })).toBeEnabled();
});
