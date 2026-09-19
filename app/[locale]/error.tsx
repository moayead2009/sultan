'use client';

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="public-placeholder"><section className="public-placeholder__card"><p className="badge">Error</p><h1>Something went wrong</h1><p>Please retry. Technical details are not exposed publicly.</p><button className="button" onClick={() => reset()}>Try again</button></section></main>;
}
