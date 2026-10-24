'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MailCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { sleep } from '@/lib/utils';

type AuthMode = 'login' | 'signup';

const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const passwordSchema = z.string().min(8, 'Use at least 8 characters');

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function passwordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 35;
  if (password.length >= 12) score += 20;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;
  return Math.min(100, score);
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isSignup = mode === 'signup';
  const strength = useMemo(() => passwordScore(password), [password]);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (isSignup && fullName.trim().length < 2) {
      nextErrors.fullName = 'Tell us what to call you';
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) nextErrors.email = emailResult.error.issues[0]?.message ?? 'Enter a valid email';

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      nextErrors.password = passwordResult.error.issues[0]?.message ?? 'Use at least 8 characters';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      if (!configured) {
        await sleep(850);
        toast.success(
          isSignup ? 'Demo household created — welcome aboard.' : 'Welcome back to the demo kitchen.'
        );
        router.push(isSignup ? '/onboarding' : '/dashboard');
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase is not configured.');

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;

        if (data.session) {
          toast.success('Account created. Let’s set up your kitchen.');
          router.push('/onboarding');
        } else {
          setEmailSent(true);
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success('Welcome back.');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      if (!configured) {
        await sleep(800);
        toast.success('Demo mode: signed in with Google.');
        router.push(isSignup ? '/onboarding' : '/dashboard');
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${isSignup ? '/onboarding' : '/dashboard'}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Google sign-in is unavailable right now.'
      );
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setFieldErrors((current) => ({
        ...current,
        email: 'Enter your email first, then tap reset.',
      }));
      return;
    }

    if (!configured) {
      toast.info('Password reset is available once Supabase is connected.');
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      });
      if (error) throw error;
      toast.success('Password reset link sent. Check your inbox.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the reset link.');
    }
  }

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-400">
          We sent a confirmation link to <span className="font-bold text-emerald-200">{email}</span>.
          Tap it to finish creating your kitchen.
        </p>
        <Button className="mt-6 w-full bg-emerald-400 text-slate-950 font-black hover:bg-emerald-300" onClick={() => setEmailSent(false)}>
          Back to sign up
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
            {isSignup ? 'Start fresh' : 'Welcome back'}
          </p>
          <h1 className="mt-2 text-3xl font-black leading-[1.02] tracking-[-0.05em] text-white">
            {isSignup ? 'Build your kitchen brain.' : 'Your pantry missed you.'}
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-400">
            {isSignup
              ? 'Create an account and turn every receipt into an organized, waste-free pantry.'
              : 'Sign in to see what needs rescuing, what’s in sync, and what’s for dinner.'}
          </p>
        </div>
      </div>

      {!configured ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-amber-300">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          Demo mode is active. Add Supabase keys to enable real accounts and sync.
        </div>
      ) : null}

      <Button
        variant="outline"
        className="mt-5 h-11 w-full bg-slate-900/60 backdrop-blur-md border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 transition-all"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-700" />
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-slate-700" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {isSignup ? (
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-black text-slate-300">Your name</Label>
            <Input
              id="fullName"
              name="name"
              autoComplete="name"
              placeholder="Avery Chen"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
              className="bg-slate-900/40 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-emerald-500/30"
            />
            {fieldErrors.fullName ? (
              <p id="fullName-error" className="text-[11px] font-semibold text-red-400">
                {fieldErrors.fullName}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-black text-slate-300">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@kitchen.com"
              className="pl-10 bg-slate-900/40 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-emerald-500/30"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
          </div>
          {fieldErrors.email ? (
            <p id="email-error" className="text-[11px] font-semibold text-red-400">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-black text-slate-300">Password</Label>
            {!isSignup ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] font-bold text-emerald-400 transition-colors hover:text-emerald-200"
              >
                Forgot password?
              </button>
            ) : null}
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              className="pr-11 bg-slate-900/40 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-emerald-500/30"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="password-error" className="text-[11px] font-semibold text-red-400">
              {fieldErrors.password}
            </p>
          ) : null}
          {isSignup && password ? (
            <div className="space-y-1.5 pt-1">
              <Progress
                value={strength}
                barClassName={
                  strength >= 70
                    ? 'bg-emerald-500'
                    : strength >= 40
                      ? 'bg-amber-400'
                      : 'bg-red-500'
                }
                className="h-1.5 bg-slate-700 overflow-hidden rounded-full"
              />
              <p className="text-[10px] font-semibold text-slate-400">
                {strength >= 70
                  ? 'Strong password'
                  : strength >= 40
                    ? 'Good — add a number or symbol'
                    : 'Use 8+ characters with a mix of letters and numbers'}
              </p>
            </div>
          ) : null}
        </div>

        <AnimatePresence>
          {formError ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-red-300"
              role="alert"
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
              {formError}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Button type="submit" className="h-11 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl py-3 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60" disabled={loading || googleLoading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSignup ? 'Create my kitchen' : 'Sign in to FreshSaver'}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        {isSignup ? (
          <p className="text-center text-[10px] font-medium leading-relaxed text-slate-500">
            By creating an account you agree to keep good food out of the bin.
          </p>
        ) : null}
      </form>

      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
        {isSignup ? 'Already have a kitchen?' : 'New to FreshSaver?'}
        <Link
          href={isSignup ? '/login' : '/signup'}
          className="inline-flex items-center gap-1 font-black text-emerald-400 transition-colors hover:text-emerald-200"
        >
          {isSignup ? 'Sign in' : 'Create an account'}
          <CheckCircle2 className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}