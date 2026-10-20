import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: 'rounded-2xl shadow-lg border border-slateink-100',
              success: 'bg-white text-slateink-800',
              error: 'bg-white text-slateink-800',
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
