export function Skeleton({ className = "" }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function PageSkeleton({ variant = "dashboard" }) {
  return (
    <main className={`page-skeleton page-skeleton-${variant}`} aria-label="Loading page" aria-busy="true">
      <section className="page-panel skeleton-panel">
        <Skeleton className="skeleton-kicker" />
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-copy" />
        <Skeleton className="skeleton-copy skeleton-copy-short" />
      </section>
      <section className="page-panel skeleton-panel">
        <Skeleton className="skeleton-title skeleton-title-small" />
        <Skeleton className="skeleton-row" />
        <Skeleton className="skeleton-row" />
        <Skeleton className="skeleton-row" />
      </section>
    </main>
  );
}

export function ListSkeleton({ rows = 3 }) {
  return <div className="skeleton-list" aria-label="Loading content" aria-busy="true">{Array.from({ length: rows }, (_, index) => <Skeleton className="skeleton-row" key={index} />)}</div>;
}
