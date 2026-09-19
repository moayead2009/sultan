'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { safeCallbackPath } from '@/lib/security-url';

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const result = await signIn('credentials', {
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      redirect: false,
      callbackUrl: '/admin'
    });
    setPending(false);
    if (!result?.ok) {
      setError('Unable to sign in with those credentials.');
      return;
    }
    router.replace(safeCallbackPath(search.get('callbackUrl')));
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
