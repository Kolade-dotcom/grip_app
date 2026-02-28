/**
 * Root page — Whop loads the app iFrame at /dashboard/[companyId] directly.
 * If someone lands on the root URL, show a message directing them to Whop.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
      <div className="card-base rounded-card p-8 text-center max-w-md">
        <div className="text-4xl mb-4">🤝</div>
        <h1 className="font-heading text-xl font-bold text-text-primary mb-2">
          Grip — Retention Engine
        </h1>
        <p className="text-sm text-text-muted mb-4">
          This app runs inside your Whop dashboard. Open your community on{" "}
          <a
            href="https://whop.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            whop.com
          </a>{" "}
          and access Grip from the Apps section.
        </p>
      </div>
    </div>
  );
}
