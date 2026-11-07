import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import ServiceRequestForm from './ServiceRequestForm';

afterEach(() => {
  vi.unstubAllGlobals();
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
      new Response(JSON.stringify({ id: 1 }), { status: 201 }),
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

  resolveRequest(new Response(null, { status: 201 }));

  expect(await screen.findByText('Request submitted')).toBeInTheDocument();

  expect(screen.getByRole('button', { name: 'Submit request' })).toBeEnabled();
});
