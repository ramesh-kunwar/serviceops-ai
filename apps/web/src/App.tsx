import ServiceRequestForm from './features/service-requests/ServiceRequestForm';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5 sm:px-8">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white"
          >
            S
          </span>
          <span className="text-sm font-semibold tracking-tight">
            ServiceOps AI
          </span>
          <span className="ml-auto text-xs text-slate-500">
            Customer support
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="mb-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            We're here to help
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Submit a service request
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Tell us what you need help with. Include a few details so our team
            can understand the issue.
          </p>
        </div>

        <section
          aria-labelledby="request-details-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2
              id="request-details-heading"
              className="text-base font-semibold"
            >
              Request details
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              All fields are required.
            </p>
          </div>
          <ServiceRequestForm />
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Please leave out passwords, payment details, and other sensitive
          information.
        </p>
      </main>
    </div>
  );
}

export default App;
