'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  Leaf,
  Loader2,
  Minus,
  Plus,
  Salad,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  createHousehold,
  updateHouseholdDetails,
  updateProfileHousehold,
} from '@/services/profiles';
import { sleep } from '@/lib/utils';
import type { Household } from '@/lib/types';

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🌱' },
  { value: 'vegan', label: 'Vegan', emoji: '🥦' },
  { value: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  { value: 'gluten-free', label: 'Gluten-free', emoji: '🌾' },
  { value: 'dairy-free', label: 'Dairy-free', emoji: '🥛' },
  { value: 'nut-free', label: 'Nut-free', emoji: '🥜' },
  { value: 'halal', label: 'Halal', emoji: '🕌' },
  { value: 'none', label: 'No restrictions', emoji: '🍽️' },
];

const STEPS = [
  { title: 'Your household', caption: 'Who are we feeding?', icon: Home },
  { title: 'Dietary north star', caption: 'What should recipes respect?', icon: Salad },
  { title: 'Ready to rescue', caption: 'Your kitchen is set up', icon: Sparkles },
];

interface OnboardingWizardProps {
  demo: boolean;
  userId: string;
  fullName: string;
  existingHousehold: Household | null;
  initialPreferences: string[];
}

export function OnboardingWizard({
  demo,
  userId,
  fullName,
  existingHousehold,
  initialPreferences,
}: OnboardingWizardProps) {
  const router = useRouter();
  const firstName = fullName.split(' ')[0] || 'there';

  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState(existingHousehold?.name ?? '');
  const [members, setMembers] = useState(existingHousehold?.family_members_count ?? 2);
  const [preferences, setPreferences] = useState<string[]>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = ((step + 1) / STEPS.length) * 100;
  const canContinue = step !== 0 || householdName.trim().length >= 2;

  function togglePreference(value: string) {
    setPreferences((current) => {
      if (value === 'none') return current.includes('none') ? [] : ['none'];
      const withoutNone = current.filter((item) => item !== 'none');
      return withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
    });
  }

  function goNext() {
    setError(null);
    if (!canContinue) {
      setError('Give your household a name with at least 2 characters.');
      return;
    }
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function finish() {
    setSaving(true);
    setError(null);

    try {
      if (demo) {
        await sleep(850);
        toast.success(`Welcome home, ${firstName}.`);
        router.push('/dashboard');
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase is not configured.');

      if (existingHousehold) {
        await updateHouseholdDetails(supabase, existingHousehold.id, {
          name: householdName,
          familyMembersCount: members,
          dietaryPreferences: preferences,
        });
      } else {
        const household = await createHousehold(supabase, {
          name: householdName,
          familyMembersCount: members,
          dietaryPreferences: preferences,
        });
        await updateProfileHousehold(supabase, userId, household.id);
      }

      toast.success('Your kitchen is ready.');
      router.push('/dashboard');
      router.refresh();
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : 'Could not finish setup. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.15),transparent_36%),radial-gradient(circle_at_80%_90%,rgba(251,191,36,0.1),transparent_34%)]" />
        <div className="absolute inset-0 bg-grid-emerald bg-[size:44px_44px] opacity-20" />

        <div className="relative z-10 flex items-center gap-2.5 px-9 pt-9">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-black tracking-[-0.04em] text-white">FreshSaver</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-9 py-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
            Setup · 2 minutes
          </p>
          <h1 className="mt-3 max-w-sm text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white">
            Let’s make waste the rarest thing in your kitchen.
          </h1>

          <div className="mt-9 space-y-3">
            {STEPS.map((entry, index) => {
              const active = index === step;
              const complete = index < step;
              const Icon = entry.icon;
              return (
                <div
                  key={entry.title}
                  className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-all ${
                    active
                      ? 'border-emerald-400/30 bg-emerald-500/10'
                      : complete
                        ? 'border-white/5 bg-white/[0.03]'
                        : 'border-white/5 bg-transparent'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      complete
                        ? 'bg-emerald-400 text-slate-950'
                        : active
                          ? 'bg-emerald-400/15 text-emerald-300'
                          : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div>
                    <p
                      className={`text-xs font-black ${
                        active || complete ? 'text-white' : 'text-white/40'
                      }`}
                    >
                      {entry.title}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-white/30">
                      {entry.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 px-9 py-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/35">
            <Users className="h-3.5 w-3.5" />
            Join 12,000+ households saving food together
          </div>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col overflow-hidden px-5 py-7 sm:px-8 lg:px-12 bg-slate-950">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-emerald-950/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-950/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="text-base font-black tracking-[-0.04em] text-white">
              FreshSaver
            </span>
          </Link>
          <p className="ml-auto text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              <span>{STEPS[step].title}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              className="mt-2 bg-slate-700"
              barClassName="bg-emerald-500"
            />
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-900/60 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 ? (
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                      <Home className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">
                      What should we call your household?
                    </h2>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-400">
                      This is the shared name everyone sees. You can invite family members later.
                    </p>

                    <div className="mt-6 space-y-1.5">
                      <Label htmlFor="householdName" className="text-xs font-black text-slate-300">Household name</Label>
                      <Input
                        id="householdName"
                        value={householdName}
                        onChange={(event) => setHouseholdName(event.target.value)}
                        placeholder="The Green Table"
                        maxLength={48}
                        autoFocus
                        className="bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-emerald-500/30"
                      />
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-black text-white">People in your kitchen</p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            Used to size recipes and shopping lists.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMembers((count) => Math.max(1, count - 1))}
                            aria-label="Remove a household member"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600 bg-slate-900 text-white transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
                            disabled={members <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-black text-white">
                            {members}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMembers((count) => Math.min(20, count + 1))}
                            aria-label="Add a household member"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600 bg-slate-900 text-white transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
                            disabled={members >= 20}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                      <Salad className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">
                      Any dietary preferences?
                    </h2>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-400">
                      We’ll use these to shape rescue recipes and smart shopping suggestions.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((option) => {
                        const selected = preferences.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => togglePreference(option.value)}
                            aria-pressed={selected}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
                              selected
                                ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                                : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-emerald-500/50 hover:text-white'
                            }`}
                          >
                            <span aria-hidden="true">{option.emoji}</span>
                            {option.label}
                            {selected ? <Check className="h-3 w-3" /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-[11px] font-medium text-slate-500">
                      Optional — you can change these anytime in settings.
                    </p>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">
                      Your kitchen is ready, {firstName}.
                    </h2>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-400">
                      Here’s what we’re setting up. You can change everything later.
                    </p>

                    <div className="mt-6 space-y-2.5">
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Household
                          </p>
                          <p className="mt-0.5 text-sm font-black text-white">
                            {householdName || 'Your kitchen'}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                          <Users className="h-3 w-3" />
                          {members}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                          Dietary preferences
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {preferences.length === 0 ? (
                            <span className="text-xs font-semibold text-slate-400">
                              No restrictions — flexible recipes
                            </span>
                          ) : (
                            preferences.map((value) => {
                              const option = DIETARY_OPTIONS.find((item) => item.value === value);
                              return (
                                <span
                                  key={value}
                                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300"
                                >
                                  {option?.emoji} {option?.label ?? value}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                          Next up
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-200">
                          Scan your first receipt or add an item manually. We’ll start tracking
                          expiry dates and savings immediately.
                        </p>
                      </div>
                    </div>

                    {demo ? (
                      <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] font-semibold leading-relaxed text-amber-300">
                        Demo mode: setup is simulated. Connect Supabase to persist your household.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-red-300"
                  role="alert"
                >
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-7 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={step === 0 || saving}
                className="px-3 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button onClick={goNext} disabled={saving} className="bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-300 disabled:opacity-60">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finish} disabled={saving} className="bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Enter my kitchen
                </Button>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] font-semibold text-slate-500">
            Your data stays private to your household. No ads, no resale.
          </p>
        </div>
      </section>
    </main>
  );
}