import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageShell } from '@/components/auth/AuthPageShell';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your FreshSaver kitchen.',
};

export default function LoginPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="login" />
    </AuthPageShell>
  );
}
