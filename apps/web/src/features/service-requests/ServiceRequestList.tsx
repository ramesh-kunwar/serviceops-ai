import { useState, useEffect } from 'react';
import { getServiceRequests, type ServiceRequest } from './api';

export default function ServiceRequestList() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRequests() {
      try {
        const data = await getServiceRequests({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setRequests(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Unable to load service requests. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRequests();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section aria-labelledby="service-requests-heading">
      <h2
        id="service-requests-heading"
        className="text-xl font-semibold text-slate-900"
      >
        Service requests
      </h2>

      {isLoading && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          Loading requests…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!isLoading && !error && requests.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No service requests yet.</p>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <ul className="mt-5 space-y-4">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-slate-900">
                  {request.title}
                </h3>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {request.status}
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
                {request.description}
              </p>

              <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>{request.customerName}</span>

                <time dateTime={request.createdAt}>
                  {new Date(request.createdAt).toLocaleString()}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
