import Link from 'next/link';

export default function NotFound() {
  return <main className="public-placeholder"><section className="public-placeholder__card"><p className="badge">404</p><h1>Page not found</h1><p>The requested page does not exist or is not published.</p><Link className="button" href="/">Return home</Link></section></main>;
}
