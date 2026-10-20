import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { PinScreen } from '@/components/PinScreen';
import { Loader2 } from 'lucide-react';

type View = 'landing' | 'signin' | 'signup';

function App() {
  const { session, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [pinUnlocked, setPinUnlocked] = useState(false);

  // Re-lock whenever the signed-in user changes so a PIN is never shared between sessions.
  useEffect(() => {
    setPinUnlocked(false);
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin" strokeWidth={2} />
        <p className="text-sm text-slateink-400 font-medium mt-3">Loading...</p>
      </div>
    );
  }

  if (session) {
    if (!pinUnlocked) {
      return (
        <PinScreen
          onSuccess={() => setPinUnlocked(true)}
          onBack={() => { void signOut(); }}
        />
      );
    }
    return <Dashboard />;
  }

  if (view === 'signin' || view === 'signup') {
    return (
      <AuthPage
        mode={view}
        onBack={() => setView('landing')}
        onToggleMode={() => setView(view === 'signin' ? 'signup' : 'signin')}
      />
    );
  }

  return (
    <LandingPage
      onGetStarted={() => setView('signup')}
      onSignIn={() => setView('signin')}
    />
  );
}

export default App;
