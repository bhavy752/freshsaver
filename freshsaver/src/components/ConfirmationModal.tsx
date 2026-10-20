import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  variant = 'danger' 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slateink-900/40 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slateink-100 p-6 overflow-hidden"
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 ${variant === 'danger' ? 'bg-coral-500' : 'bg-amber-500'}`} />
        
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-coral-50 text-coral-500' : 'bg-amber-50 text-amber-500'}`}>
            <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-slateink-900 mb-2">{title}</h3>
          <p className="text-sm text-slateink-500 font-medium mb-8 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl bg-slateink-50 text-slateink-600 font-bold text-sm hover:bg-slateink-100 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 shadow-md ${
                variant === 'danger' ? 'bg-coral-500 hover:bg-coral-600 shadow-coral-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
