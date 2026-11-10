export default function Loading() {
  return (
    <main id="contenuto" tabIndex={-1} className="page-container">
      <div className="loading-page" role="status">
        <span className="loading-book" aria-hidden="true" />
        Un attimo, apriamo il quaderno…
      </div>
    </main>
  );
}
