import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageShell } from '@/components/auth/AuthPageShell';

export const metadata: Metadata = {
  title: 'Create your kitchen',
  description: 'Create a FreshSaver account and build a waste-free pantry.',
};

export default function SignupPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="signup" />
    </AuthPageShell>
  );
}
