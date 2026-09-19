'use client';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="admin-card" role="alert">
      <h1>Unable to load this administration screen</h1>
      <p>The requested operation could not be completed. No content was changed unless the server confirmed the save.</p>
      <button className="button" onClick={() => reset()} type="button">Try again</button>
    </div>
  );
}
