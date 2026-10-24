'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  tone?: 'danger' | 'default';
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  loading = false,
  tone = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} label={title} className="max-w-md" hideClose>
      <div className="p-6 sm:p-7">
        <div
          className={
            tone === 'danger'
              ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-500'
              : 'flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600'
          }
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-ink-950">{title}</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-ink-500">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
