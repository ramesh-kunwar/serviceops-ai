import { useId, useState, type SubmitEvent } from 'react';
import { z } from 'zod';
import { createServiceRequestSchema } from './validation';

type ServiceRequestInput = z.input<typeof createServiceRequestSchema>;

const fieldClassName =
  'mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/20 aria-invalid:border-red-500 aria-invalid:focus-visible:ring-red-500/20 disabled:cursor-wait disabled:bg-slate-50 disabled:text-slate-500';

export default function ServiceRequestForm() {
  const formId = useId();
  const [customerName, setCustomerName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [toastVisible, setToastVisible] = useState(false);
  const isSubmitting = submissionStatus === 'submitting';

  const [validationError, setValidationError] =
    useState<z.ZodError<ServiceRequestInput> | null>(null);

  const errors = validationError
    ? z.flattenError(validationError).fieldErrors
    : {};

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmissionStatus('idle');
    setToastVisible(false);

    const result = createServiceRequestSchema.safeParse({
      customerName,
      title,
      description,
    });

    if (!result.success) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    setSubmissionStatus('submitting');

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        throw new Error('Service request submission failed');
      }

      setSubmissionStatus('success');
      setToastVisible(true);
    } catch {
      setSubmissionStatus('error');
      setToastVisible(true);
    }
  }

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor={`${formId}-customerName`}
            className="text-sm font-medium"
          >
            Customer name
          </label>
          <input
            className={fieldClassName}
            placeholder="Your full name"
            id={`${formId}-customerName`}
            name="customerName"
            type="text"
            autoComplete="name"
            required
            disabled={isSubmitting}
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            aria-invalid={Boolean(errors.customerName?.length)}
            aria-describedby={
              errors.customerName?.length
                ? `${formId}-customerName-error`
                : undefined
            }
          />
          {errors.customerName?.[0] && (
            <p
              id={`${formId}-customerName-error`}
              role="alert"
              className="mt-2 text-xs leading-5 text-red-700"
            >
              {errors.customerName[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-title`} className="text-sm font-medium">
            Title
          </label>
          <input
            className={fieldClassName}
            placeholder="A short summary of the issue"
            id={`${formId}-title`}
            name="title"
            type="text"
            required
            disabled={isSubmitting}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={Boolean(errors.title?.length)}
            aria-describedby={
              errors.title?.length ? `${formId}-title-error` : undefined
            }
          />
          {errors.title?.[0] && (
            <p
              id={`${formId}-title-error`}
              role="alert"
              className="mt-2 text-xs leading-5 text-red-700"
            >
              {errors.title[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${formId}-description`}
            className="text-sm font-medium"
          >
            Description
          </label>
          <textarea
            className={`${fieldClassName} min-h-36 resize-y`}
            placeholder="What happened, and how can we help?"
            id={`${formId}-description`}
            name="description"
            rows={5}
            required
            disabled={isSubmitting}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={Boolean(errors.description?.length)}
            aria-describedby={
              errors.description?.length
                ? `${formId}-description-error`
                : undefined
            }
          />
          {errors.description?.[0] && (
            <p
              id={`${formId}-description-error`}
              role="alert"
              className="mt-2 text-xs leading-5 text-red-700"
            >
              {errors.description[0]}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg
                  aria-hidden="true"
                  className="size-4 motion-safe:animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.25"
                  />
                  <path
                    d="M12 3a9 9 0 0 1 9 9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Submitting request…
              </>
            ) : (
              <>
                {submissionStatus === 'error' ? 'Try again' : 'Submit request'}
                <span aria-hidden="true">&rarr;</span>
              </>
            )}
          </button>
          <p
            role="status"
            className="mt-3 text-center text-xs leading-5 text-slate-500"
          >
            {isSubmitting
              ? 'Sending your request. Please keep this page open.'
              : ''}
          </p>
        </div>
      </form>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-sm sm:inset-x-auto sm:bottom-6 sm:right-6 sm:mx-0 sm:w-96"
      >
        {toastVisible && submissionStatus === 'success' && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-lg shadow-slate-900/10">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700"
            >
              ✓
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Request submitted
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Your service request has been received successfully.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastVisible(false)}
              aria-label="Dismiss success notification"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>

      <div
        role="alert"
        aria-atomic="true"
        className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-sm sm:inset-x-auto sm:bottom-6 sm:right-6 sm:mx-0 sm:w-96"
      >
        {toastVisible && submissionStatus === 'error' && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-lg shadow-slate-900/10">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-semibold text-red-700"
            >
              !
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Unable to submit
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                We couldn’t confirm your submission. Your entries are still
                here. Please check your connection before trying again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastVisible(false)}
              aria-label="Dismiss error notification"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
