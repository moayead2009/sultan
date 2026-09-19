import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';

export const metadata = { robots: { index: false, follow: false } };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.status === 'ACTIVE') redirect('/admin');

  return (
    <main className="public-placeholder">
      <section className="public-placeholder__card" style={{ maxWidth: 520 }}>
        <div className="badge">Protected administration</div>
        <h1>Sign in</h1>
        <LoginForm />
      </section>
    </main>
  );
}
