import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Mail, Lock, ArrowRight, ArrowLeft, Loader2, AlertCircle, User, Home, KeyRound, Users, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signUpSchema } from '@/validation';

interface AuthPageProps {
  mode: 'signin' | 'signup';
  onBack: () => void;
  onToggleMode: () => void;
}

export function AuthPage({ mode, onBack, onToggleMode }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [familyMembersCount, setFamilyMembersCount] = useState('2');
  const [joinCode, setJoinCode] = useState('');
  const [householdMode, setHouseholdMode] = useState<'create' | 'join'>('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSignUp) {
      if (!email.trim() || !password) {
        setError('Please enter both email and password');
        return;
      }
      setLoading(true);
      try {
        const { error: authError } = await signIn(email.trim(), password);
        if (authError) setError(authError);
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const result = signUpSchema.safeParse({
      email: email.trim(),
      password,
      username: username.trim(),
      fullName: fullName.trim(),
      householdName: householdMode === 'create' ? householdName.trim() : 'Joined Household',
      familyMembersCount: parseInt(familyMembersCount) || 1,
      joinCode: householdMode === 'join' ? joinCode.trim() : '',
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your inputs');
      return;
    }

    if (householdMode === 'join' && !joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await signUp(
        result.data.email,
        result.data.password,
        result.data.username,
        result.data.fullName,
        householdMode === 'create' ? result.data.householdName : '',
        result.data.familyMembersCount,
        householdMode === 'join' ? result.data.joinCode ?? '' : ''
      );

      if (authError) {
        setError(authError);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream-50 to-sage-50 flex flex-col">
      <div className="px-5 py-5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-20">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-sage-500 shadow-lg shadow-sage-500/20 mb-4">
              <Leaf className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1.5 text-center">
              {isSignUp ? 'Start tracking your food and stop wasting today' : 'Sign in to access your fridge tracker'}
            </p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 rounded-2xl bg-coral-50 border border-coral-200 px-4 py-3 mb-5 overflow-hidden"
              >
                <AlertCircle className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-sm font-bold text-coral-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" strokeWidth={2} />
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="w-full text-base font-medium text-slate-800 bg-white rounded-xl pl-12 pr-4 py-3.5 border border-slate-100 outline-none focus:border-sage-300 transition-colors"
                  autoComplete="email" autoFocus={!isSignUp} />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" strokeWidth={2} />
                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                  className="w-full text-base font-medium text-slate-800 bg-white rounded-xl pl-12 pr-4 py-3.5 border border-slate-100 outline-none focus:border-sage-300 transition-colors"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'} />
              </div>
            </div>

            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Username</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" strokeWidth={2} />
                        <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }}
                          placeholder="e.g. chef_amy"
                          className="w-full text-base font-medium text-slate-800 bg-white rounded-xl pl-12 pr-4 py-3.5 border border-slate-100 outline-none focus:border-sage-300 transition-colors"
                          autoComplete="username" autoFocus />
                      </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Full Name <span className="text-slate-300 font-normal">(optional)</span></label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Amy Smith"
                        className="w-full text-base font-medium text-slate-800 bg-white rounded-xl pl-4 pr-4 py-3.5 border border-slate-100 outline-none focus:border-sage-300 transition-colors"
                        autoComplete="name" />
                  </div>

                  {/* Household mode toggle */}
                  <div>
                    <label className="text-sm font-bold text-slateink-700 block mb-2">Household</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setHouseholdMode('create'); setError(''); }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all active:scale-95 ${
                          householdMode === 'create' ? 'bg-sage-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100 hover:bg-sage-50'
                        }`}>
                        <Home className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Create New
                      </button>
                      <button type="button" onClick={() => { setHouseholdMode('join'); setError(''); }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all active:scale-95 ${
                          householdMode === 'join' ? 'bg-sage-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100 hover:bg-sage-50'
                        }`}>
                        <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Join Existing
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {householdMode === 'create' ? (
                      <motion.div
                        key="create"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">Household Name</label>
                        <div className="relative">
                          <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" strokeWidth={2} />
                          <input type="text" value={householdName} onChange={(e) => { setHouseholdName(e.target.value); setError(''); }}
                            placeholder="e.g. The Smith Family"
                            className="w-full text-base font-medium text-slate-800 bg-white rounded-xl pl-12 pr-4 py-3.5 border border-slate-100 outline-none focus:border-sage-300 transition-colors" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          You will get a join code to share with family members
                        </p>
                      </div>

                        <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">Family Members</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" strokeWidth={2} />
                          <input type="number" value={familyMembersCount} onChange={(e) => setFamilyMembersCount(e.target.value)}
                            min="1" max="20"
                            className="w-full text-base font-medium text-slate-800 bg-white rounded-xl pl-12 pr-4 py-3.5 border border-slate-100 outline-none focus:border-sage-300 transition-colors" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-1.5">How many people are in your household?</p>
                      </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="join"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div>
                          <label className="text-sm font-bold text-slate-700 block mb-1.5">Join Code</label>
                          <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" strokeWidth={2} />
                            <input type="text" value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                              placeholder="e.g. ABCD23"
                              maxLength={6}
                              className="w-full text-base font-bold tracking-widest text-slate-800 bg-white rounded-xl pl-12 pr-4 py-3.5 border border-slate-100 outline-none focus:border-sage-300 transition-colors uppercase" />
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-1.5">Ask a family member for your 6-character household code</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2 text-base disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} /> : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={onToggleMode} className="text-sage-600 font-bold hover:text-sage-700 transition-colors">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
