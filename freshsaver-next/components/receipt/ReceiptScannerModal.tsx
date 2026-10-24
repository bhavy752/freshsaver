'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  ScanLine,
  ScanText,
  Sparkles,
  Trash2,
  TriangleAlert,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Category, FoodItem, FoodUnit } from '@/lib/types';
import type { FoodItemInput } from '@/services/foodItems';
import { inferStorageLocation, parseReceipt } from '@/services/receipt';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { addDays, generateId, sleep, toDateInputValue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';

type ScanStep = 'upload' | 'scanning' | 'review' | 'success';

interface ReviewRow {
  id: string;
  include: boolean;
  name: string;
  quantity: string;
  unit: FoodUnit;
  categoryId: string;
  categoryName: string;
  expiry: string;
  cost: string;
  confidence: number;
}

const STATUS_MESSAGES = [
  'Extracting line items from the receipt…',
  'Reading dates and prices with OCR…',
  'Categorizing everything into your pantry…',
  'Checking for household staples and duplicates…',
  'Building your review list…',
];

const UNITS: Array<{ value: FoodUnit; label: string }> = [
  { value: 'pcs', label: 'pcs' },
  { value: 'kg', label: 'kg' },
  { value: 'liters', label: 'L' },
  { value: 'packs', label: 'packs' },
  { value: 'bunches', label: 'bunches' },
];

interface ReceiptScannerModalProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onImport: (inputs: FoodItemInput[]) => Promise<FoodItem[]>;
  onImported?: (count: number) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

function rowFromParsed(
  item: {
    name: string;
    categoryName: string;
    shelfLifeDays: number;
    quantity: number;
    unit: FoodUnit;
    estimatedCost?: number;
    confidence?: number;
  },
  categories: Category[]
): ReviewRow {
  const category =
    categories.find(
      (entry) => entry.name.toLowerCase() === item.categoryName.toLowerCase()
    ) ??
    categories.find((entry) => entry.name.toLowerCase().includes('other')) ??
    categories[0] ??
    null;
  const shelfLife = category?.default_expiry_days ?? item.shelfLifeDays ?? 7;

  return {
    id: generateId(),
    include: true,
    name: item.name,
    quantity: String(item.quantity || 1),
    unit: item.unit || 'pcs',
    categoryId: category?.id ?? '',
    categoryName: category?.name ?? item.categoryName,
    expiry: toDateInputValue(addDays(shelfLife)),
    cost: item.estimatedCost ? item.estimatedCost.toFixed(2) : '',
    confidence: item.confidence ?? 0.9,
  };
}

export function ReceiptScannerModal({
  open,
  categories,
  onClose,
  onImport,
  onImported,
}: ReceiptScannerModalProps) {
  const [step, setStep] = useState<ScanStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const scanRunRef = useRef(0);

  const includedRows = rows.filter((row) => row.include && row.name.trim());
  const averageConfidence =
    includedRows.length > 0
      ? Math.round(
          (includedRows.reduce((total, row) => total + row.confidence, 0) /
            includedRows.length) *
            100
        )
      : 0;

  function clearTimers() {
    if (statusTimerRef.current !== null) {
      window.clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  function resetScanner() {
    scanRunRef.current += 1;
    clearTimers();
    setStep('upload');
    setFile(null);
    setPreviewUrl(null);
    setDragging(false);
    setStatusIndex(0);
    setProgress(0);
    setRows([]);
    setError(null);
    setImporting(false);
    setImportedCount(0);
  }

  useEffect(() => {
    if (!open) resetScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleClose() {
    if (importing) return;
    onClose();
  }

  async function startScan(selectedFile: File | null) {
    const runId = scanRunRef.current + 1;
    scanRunRef.current = runId;
    setError(null);
    setStep('scanning');
    setProgress(4);
    setStatusIndex(0);

    statusTimerRef.current = window.setInterval(() => {
      setStatusIndex((current) => Math.min(STATUS_MESSAGES.length - 1, current + 1));
    }, 900);
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => Math.min(92, current + 3));
    }, 120);

    try {
      let base64 = '';
      if (selectedFile) {
        try {
          base64 = await fileToBase64(selectedFile);
        } catch {
          base64 = '';
        }
      }

      const supabase = getSupabaseBrowserClient();
      const [parsed] = await Promise.all([
        parseReceipt(supabase, base64, selectedFile?.type),
        sleep(3300),
      ]);

      if (scanRunRef.current !== runId) return;

      clearTimers();
      setProgress(100);
      setRows(parsed.map((item) => rowFromParsed(item, categories)));
      setStep('review');
    } catch (scanError) {
      if (scanRunRef.current !== runId) return;
      clearTimers();
      setError(
        scanError instanceof Error
          ? scanError.message
          : 'We could not read that receipt. Try another image.'
      );
      setStep('upload');
    }
  }

  function handleFile(selectedFile: File) {
    const validType =
      selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf';
    if (!validType) {
      toast.error('Upload a receipt image or PDF.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('That file is larger than 10 MB.');
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    void startScan(selectedFile);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const selectedFile = event.dataTransfer.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  }

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  function addBlankRow() {
    const category = categories[0] ?? null;
    setRows((current) => [
      ...current,
      {
        id: generateId(),
        include: true,
        name: '',
        quantity: '1',
        unit: 'pcs',
        categoryId: category?.id ?? '',
        categoryName: category?.name ?? 'Other',
        expiry: toDateInputValue(addDays(category?.default_expiry_days ?? 7)),
        cost: '',
        confidence: 1,
      },
    ]);
  }

  async function handleImport() {
    if (includedRows.length === 0) {
      setError('Select at least one item to import.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const inputs: FoodItemInput[] = includedRows.map((row) => {
        const category = categories.find((entry) => entry.id === row.categoryId) ?? null;
        const quantity = Number(row.quantity) || 1;
        const cost = row.cost.trim() ? Number(row.cost) : undefined;

        return {
          name: row.name.trim() || 'Unnamed Item',
          category_id: category?.id ?? null,
          quantity,
          unit: row.unit,
          expires_at: new Date(`${row.expiry}T12:00:00`).toISOString(),
          storage_location: inferStorageLocation(category?.name ?? row.categoryName),
          original_quantity: quantity,
          estimated_cost:
            cost !== undefined && Number.isFinite(cost) && cost >= 0 ? cost : undefined,
        };
      });

      const created = await onImport(inputs);
      setImportedCount(created.length);
      setStep('success');
      onImported?.(created.length);
      toast.success(`${created.length} items added to your pantry.`);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'Could not import the receipt. Please try again.'
      );
      toast.error('Import failed. Your review list is still here.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      label="Scan a receipt"
      description="Upload a receipt image or PDF, review the parsed items, and add them to your pantry."
      className="max-w-3xl"
      hideClose={importing}
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="border-b border-ink-100 bg-gradient-to-br from-emerald-50/80 to-cream-50 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                  <ScanLine className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black tracking-[-0.04em] text-ink-950">
                      Scan a receipt
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI OCR
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-ink-500">
                    We’ll extract items, dates, and prices, then let you confirm everything.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${
                  dragging
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-ink-200 bg-ink-50/40 hover:border-emerald-300 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-black text-ink-900">
                  Drop your receipt here
                </p>
                <p className="mt-1 max-w-sm text-[11px] font-medium leading-relaxed text-ink-400">
                  JPG, PNG, HEIC, or PDF · up to 10 MB. The image is processed securely and never
                  shown to anyone else.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => fileInputRef.current?.click()} size="sm">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Choose a file
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void startScan(null)}>
                    <FileText className="h-3.5 w-3.5" />
                    Try a sample receipt
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) handleFile(selected);
                    event.target.value = '';
                  }}
                />
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-coral-600"
                >
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              ) : null}

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  { icon: ScanText, title: 'Reads every line', copy: 'Items, quantities, prices' },
                  { icon: BadgeCheck, title: 'Smart categories', copy: 'Pantry, fridge, freezer' },
                  { icon: Sparkles, title: 'Expiry estimates', copy: 'Based on food type' },
                ].map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="rounded-xl border border-ink-100 bg-white px-3 py-2.5"
                    >
                      <Icon className="h-3.5 w-3.5 text-emerald-500" />
                      <p className="mt-1.5 text-[10px] font-black text-ink-800">{feature.title}</p>
                      <p className="text-[9px] font-medium text-ink-400">{feature.copy}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}

        {step === 'scanning' ? (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="border-b border-ink-100 bg-ink-950 px-5 pb-4 pt-5 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-ink-950">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.04em] text-white">
                    Reading your receipt
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-white/45">
                    This usually takes a few seconds.
                  </p>
                </div>
                <span className="ml-auto hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-200 sm:inline-flex">
                  Secure OCR
                </span>
              </div>
            </div>

            <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_1.1fr] sm:px-6">
              <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-950">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="h-64 w-full object-cover opacity-80 sm:h-72"
                  />
                ) : file?.type === 'application/pdf' ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink-900 to-ink-950 text-white/60 sm:h-72">
                    <FileText className="h-10 w-10 text-emerald-300" />
                    <p className="max-w-[12rem] truncate text-xs font-bold text-white">
                      {file.name}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">
                      PDF receipt
                    </p>
                  </div>
                ) : (
                  <div className="flex h-64 flex-col justify-center gap-2.5 bg-gradient-to-br from-ink-900 to-ink-950 px-6 sm:h-72">
                    {[80, 62, 90, 48, 72, 56, 84, 66].map((width, index) => (
                      <div
                        key={index}
                        className="h-2 rounded-full bg-white/10"
                        style={{ width: `${width}%` }}
                      />
                    ))}
                    <div className="mt-2 h-px w-full bg-white/10" />
                    <div className="flex justify-between">
                      <div className="h-2 w-16 rounded-full bg-white/10" />
                      <div className="h-2 w-10 rounded-full bg-emerald-400/40" />
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-grid-emerald bg-[size:22px_22px] opacity-30" />
                <div className="pointer-events-none absolute inset-x-0 h-20 animate-scan-line scan-sheen" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 to-transparent px-4 pb-3 pt-8">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
                    <ScanLine className="h-3 w-3" />
                    Scanning
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.12em] text-ink-400">
                  <span>Processing</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="mt-2 h-2" />

                <div className="mt-5 space-y-2.5">
                  {STATUS_MESSAGES.map((message, index) => {
                    const complete = index < statusIndex;
                    const active = index === statusIndex;
                    return (
                      <div key={message} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            complete
                              ? 'bg-emerald-500 text-white'
                              : active
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-ink-100 text-ink-300'
                          }`}
                        >
                          {complete ? (
                            <Check className="h-3 w-3" />
                          ) : active ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </span>
                        <p
                          className={`text-[11px] font-semibold leading-relaxed ${
                            complete || active ? 'text-ink-700' : 'text-ink-300'
                          }`}
                        >
                          {message}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2 text-[9px] font-medium leading-relaxed text-ink-400">
                  Keep this window open while we parse the receipt. Nothing is saved until you
                  review and confirm.
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {step === 'review' ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="border-b border-ink-100 bg-gradient-to-br from-emerald-50/80 to-cream-50 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <h2 className="text-xl font-black tracking-[-0.04em] text-ink-950">
                      Review & confirm
                    </h2>
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink-500">
                    {rows.length} items found · {averageConfidence}% average confidence
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI parsed
                </span>
              </div>
            </div>

            <div className="max-h-[calc(92vh-20rem)] space-y-2 overflow-y-auto px-5 py-4 sm:px-6">
              {rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-8 text-center">
                  <p className="text-sm font-black text-ink-800">No items left to import.</p>
                  <p className="mt-1 text-[11px] font-medium text-ink-400">
                    Add a row manually or scan another receipt.
                  </p>
                </div>
              ) : null}

              {rows.map((row) => (
                <div
                  key={row.id}
                  className={`rounded-2xl border p-3 transition-colors ${
                    row.include ? 'border-ink-100 bg-white' : 'border-ink-100 bg-ink-50/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateRow(row.id, { include: !row.include })}
                      aria-label={row.include ? 'Exclude this item' : 'Include this item'}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        row.include
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-ink-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </button>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={row.name}
                          onChange={(event) => updateRow(row.id, { name: event.target.value })}
                          placeholder="Item name"
                          className="h-9 flex-1 text-xs font-bold"
                          aria-label="Item name"
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          aria-label={`Remove ${row.name || 'item'}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-coral-50 hover:text-coral-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div>
                          <Label className="text-[8px]">Qty</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={row.quantity}
                            onChange={(event) =>
                              updateRow(row.id, { quantity: event.target.value })
                            }
                            className="mt-1 h-8 text-xs"
                            aria-label="Quantity"
                          />
                        </div>
                        <div>
                          <Label className="text-[8px]">Unit</Label>
                          <select
                            value={row.unit}
                            onChange={(event) =>
                              updateRow(row.id, { unit: event.target.value as FoodUnit })
                            }
                            className="mt-1 flex h-8 w-full rounded-lg border border-ink-200 bg-white px-2 text-xs font-medium text-ink-800 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
                            aria-label="Unit"
                          >
                            {UNITS.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[8px]">Expiry</Label>
                          <Input
                            type="date"
                            value={row.expiry}
                            onChange={(event) =>
                              updateRow(row.id, { expiry: event.target.value })
                            }
                            className="mt-1 h-8 text-xs"
                            aria-label="Expiry date"
                          />
                        </div>
                        <div>
                          <Label className="text-[8px]">Cost</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.cost}
                            onChange={(event) => updateRow(row.id, { cost: event.target.value })}
                            className="mt-1 h-8 text-xs"
                            placeholder="0.00"
                            aria-label="Estimated cost"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[8px]">Category</Label>
                        <select
                          value={row.categoryId}
                          onChange={(event) => {
                            const category =
                              categories.find((entry) => entry.id === event.target.value) ?? null;
                            updateRow(row.id, {
                              categoryId: event.target.value,
                              categoryName: category?.name ?? row.categoryName,
                            });
                          }}
                          className="mt-1 flex h-8 w-full rounded-lg border border-ink-200 bg-white px-2 text-xs font-medium text-ink-800 focus-visible:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
                          aria-label="Category"
                        >
                          <option value="">Uncategorized</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBlankRow}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-200 bg-white px-3 py-2.5 text-[10px] font-black text-ink-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a missing item
              </button>

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-coral-600"
                >
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-ink-50/40 px-5 py-4 sm:px-6">
              <Button
                variant="ghost"
                onClick={() => {
                  resetScanner();
                }}
                disabled={importing}
                className="px-3"
              >
                <ArrowLeft className="h-4 w-4" />
                Scan another
              </Button>
              <Button onClick={() => void handleImport()} disabled={importing || includedRows.length === 0}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Import {includedRows.length} {includedRows.length === 1 ? 'item' : 'items'}
              </Button>
            </div>
          </motion.div>
        ) : null}

        {step === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="px-6 py-10 text-center sm:px-8"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30"
            >
              <Check className="h-8 w-8" />
            </motion.div>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-ink-950">
              Receipt imported.
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-ink-500">
              {importedCount} {importedCount === 1 ? 'item is' : 'items are'} now tracked in your
              pantry. We’ll start watching expiry dates and savings immediately.
            </p>
            <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-[10px] font-semibold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              Your rescue radar is already updating.
            </div>
            <Button className="mt-6" onClick={handleClose}>
              Back to my pantry
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Modal>
  );
}
