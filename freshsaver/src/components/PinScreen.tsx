import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Check, Loader2, AlertCircle, Delete, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { verifyPin } from '@/lib/pin';

interface PinScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function PinScreen({ onSuccess, onBack }: PinScreenProps) {
  const { profile, user, setupPin, removePin } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState<'enter' | 'setup' | 'confirm-setup'>(
    profile?.pin_code_hash ? 'enter' : 'setup'
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    setError('');
    if (mode === 'enter' && pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleVerifyPin(newPin);
      }
    } else if (mode === 'setup' && pin.length < 4) {
      setPin(pin + digit);
    } else if (mode === 'confirm-setup' && confirmPin.length < 4) {
      const newConfirm = confirmPin + digit;
      setConfirmPin(newConfirm);
      if (newConfirm.length === 4) {
        confirmSetup(newConfirm);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (mode === 'confirm-setup') {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleVerifyPin = async (enteredPin: string) => {
    if (!user) {
      setError('Session expired. Please sign in again.');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      const isValid = await verifyPin(enteredPin, user.id, profile?.pin_code_hash ?? '');
      if (isValid) {
        onSuccess();
      } else {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Something went wrong. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async (enteredConfirm: string) => {
    if (enteredConfirm !== pin) {
      setError('PINs do not match. Start again.');
      setPin('');
      setConfirmPin('');
      setMode('setup');
      return;
    }

    setLoading(true);
    try {
      const { error: pinError } = await setupPin(pin);
      if (pinError) {
        setError(pinError);
        setPin('');
        setConfirmPin('');
        setMode('setup');
      } else {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: pinError } = await removePin();
      if (pinError) {
        setError(pinError);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not skip PIN setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayValue = mode === 'confirm-setup' ? confirmPin : pin;
  const title = mode === 'enter' ? 'Enter your PIN' : mode === 'setup' ? 'Set a Quick PIN' : 'Confirm your PIN';
  const subtitle = mode === 'enter'
    ? 'Quick access to your fridge 🥬'
    : mode === 'setup'
    ? 'Skip full login next time with a 4-digit code 🔐'
    : 'Re-enter to confirm ✅';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950 text-white flex flex-col items-center justify-center px-5 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute top-10 left-8 text-4xl opacity-20 animate-float">🍎</span>
        <span className="absolute top-24 right-10 text-3xl opacity-20 animate-float-slow">🥛</span>
        <span className="absolute bottom-24 left-12 text-4xl opacity-15 animate-float-slow">🥑</span>
        <span className="absolute bottom-16 right-14 text-4xl opacity-20 animate-float">🍞</span>
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-emerald-900/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm flex flex-col items-center"
      >
        <button
          onClick={onBack}
          className="self-start inline-flex items-center gap-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-emerald-500/30 px-3 py-2 text-sm font-bold text-emerald-200 hover:text-emerald-100 hover:bg-slate-800 transition-all duration-200 active:scale-95 mb-8 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Back
        </button>

        <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30 mb-5">
          <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-sm text-emerald-200/70 font-medium mt-1.5 text-center">{subtitle}</p>

        <div
          className="flex items-center gap-4 my-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 px-6 py-4 shadow-xl"
          role="status"
          aria-label={`${displayValue.length} of 4 digits entered`}
        >
          {[0, 1, 2, 3].map((i) => {
            const filled = i < displayValue.length;
            return (
              <motion.div
                key={i}
                animate={{ scale: displayValue.length === i + 1 ? [1, 1.25, 1] : 1 }}
                transition={{ duration: 0.2 }}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  filled
                    ? 'bg-emerald-400 border-2 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.8)] scale-110'
                    : 'bg-slate-800 border-2 border-slate-700 ring-2 ring-slate-900/50'
                }`}
              />
            );
          })}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2.5 mb-4 overflow-hidden text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" strokeWidth={2.5} />
              <p className="text-sm font-bold">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" strokeWidth={2.5} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              disabled={loading}
              className="flex items-center justify-center w-full aspect-square rounded-2xl bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 text-xl font-extrabold text-emerald-100 hover:bg-emerald-500/20 hover:border-emerald-400 hover:scale-[1.03] active:scale-90 transition-all duration-200 shadow-sm disabled:opacity-60"
            >
              {digit}
            </button>
          ))}
          <div className="w-full aspect-square" aria-hidden="true" />
          <button
            onClick={() => handleDigit('0')}
            disabled={loading}
            className="col-start-2 flex items-center justify-center w-full aspect-square rounded-2xl bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 text-xl font-extrabold text-emerald-100 hover:bg-emerald-500/20 hover:border-emerald-400 hover:scale-[1.03] active:scale-90 transition-all duration-200 shadow-sm disabled:opacity-60"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            aria-label="Delete last digit"
            className="flex items-center justify-center w-full aspect-square rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 active:scale-90 transition-all duration-200 disabled:opacity-60"
          >
            <Delete className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {mode !== 'enter' && (
          <button
            onClick={handleSkip}
            disabled={loading}
            className="mt-6 w-full max-w-xs flex items-center justify-center gap-2 rounded-2xl bg-amber-400 text-slate-900 border-2 border-amber-500 px-6 py-4 text-base font-extrabold shadow-lg shadow-amber-200/70 hover:bg-amber-300 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          >
            Skip for now
            <ChevronRight className="w-5 h-5" strokeWidth={3} />
          </button>
        )}

        {mode === 'setup' && pin.length === 4 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { setMode('confirm-setup'); setConfirmPin(''); setError(''); }}
            className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-500 text-white font-bold text-base px-8 py-3.5 hover:bg-emerald-600 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Check className="w-5 h-5" strokeWidth={2.5} />
            Continue
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}