import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, Check, X, Loader2, AlertTriangle, Barcode, ReceiptText, Keyboard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, FoodUnit, StorageLocation } from '@/types';
import { parseReceipt as parseReceiptService, parsedItemsToFoodItems } from '@/services/receipt';
import BarcodeScanner, { initializeBarcodeScanner, type ScannedProduct, type BarcodeScanResult } from '@/services/barcodeScanner';
import { SkeletonCard } from '@/components/Skeleton';
import { getFoodEmoji, getStorageVisuals, STORAGE_VISUALS } from '@/utils/foodEmojis';

const SKELETON_COUNT = 3;

type ScanPhase = 'idle' | 'scanning' | 'processing' | 'review' | 'done';

interface PreviewItem {
  name: string;
  category_id: string | null;
  quantity: number;
  unit: FoodUnit;
  expires_at: string;
  storage_location: StorageLocation;
}

export interface ScanViewProps {
  categories: Category[];
  onAddItems: (items: PreviewItem[]) => Promise<void>;
  loading?: boolean;
}

const STORAGE_OPTIONS: StorageLocation[] = ['fridge', 'pantry', 'freezer'];

export function ScanView({ categories, onAddItems, loading = false }: ScanViewProps) {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [scanner, setScanner] = useState<BarcodeScanner | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('pantry');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let mounted = true;
    const initScanner = async () => {
      try {
        const s = await initializeBarcodeScanner();
        if (mounted) setScanner(s);
      } catch {
        // Scanner unavailable — UI still works for manual entry/receipt upload
      }
    };
    initScanner();
    return () => { mounted = false; };
  }, []);

  const handleBarcodeResult = useCallback((product: ScannedProduct) => {
    setScannedProduct(product);
    setPhase('review');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startScan = async () => {
    if (!scanner) {
      setCameraError('Barcode scanner could not be initialized');
      return;
    }
    setCameraError(null);
    setPhase('scanning');

    try {
      await scanner.startScan(videoRef.current!, (result: BarcodeScanResult) => {
        if (result.success && result.product) {
          handleBarcodeResult(result.product);
        } else {
          setPhase('idle');
          toast.error(result.error?.message || 'Scan failed');
        }
      });
    } catch {
      setPhase('idle');
      setCameraError('Camera access failed. Please check permissions.');
    }
  };

  const stopScan = async () => {
    setPhase('idle');
    if (scanner) await scanner.stopScan();
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleAddScannedProduct = async () => {
    if (!scannedProduct) return;

    const payload = scanner?.productToFoodItemPayload(scannedProduct, categories);
    if (!payload) {
      toast.error('Could not build an item from this product');
      return;
    }

    setPhase('processing');
    try {
      await onAddItems([{ ...payload, storage_location: storageLocation }]);
      setScannedProduct(null);
      setPhase('done');
      setTimeout(() => setPhase('idle'), 1600);
    } catch {
      setPhase('review');
      toast.error('Failed to add item');
    }
  };

  const handleManualScan = async () => {
    if (!manualCode.trim()) return;
    setPhase('processing');
    try {
      if (!scanner) {
        toast.error('Scanner service unavailable. Try uploading a receipt instead.');
        setPhase('idle');
        return;
      }
      const product = await scanner.lookupProduct(manualCode.trim());
      if (product) {
        handleBarcodeResult(product);
      } else {
        toast.error('Product not found in database');
        setPhase('idle');
      }
    } catch {
      toast.error('Error looking up product');
      setPhase('idle');
    }
  };

  const handleUploadReceipt = async (file: File) => {
    setPhase('processing');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setReceiptImage(base64);
      try {
        const parsedItems = await parseReceiptService(base64);
        const foodItems = parsedItemsToFoodItems(parsedItems, categories);
        setPreviewItems(foodItems.map((item) => ({ ...item, storage_location: storageLocation })));
        setPhase('review');
      } catch {
        setPhase('idle');
        toast.error('Failed to parse receipt');
      }
    };
    reader.onerror = () => {
      setPhase('idle');
      toast.error('Could not read that image');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await handleUploadReceipt(file);
  };

  const handleConfirmItems = async () => {
    if (previewItems.length === 0) return;
    setPhase('processing');
    try {
      await onAddItems(previewItems);
      setPreviewItems([]);
      setReceiptImage(null);
      setScannedProduct(null);
      setPhase('done');
      setTimeout(() => setPhase('idle'), 1600);
    } catch {
      setPhase('review');
      toast.error('Failed to add items');
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setPreviewItems([]);
    setReceiptImage(null);
    setScannedProduct(null);
    setCameraError(null);
    setManualCode('');
  };

  // Loading state: show skeleton when loading prop is true
  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        <div className="space-y-2">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Scan & Add 📷</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Snap a barcode or your shopping receipt</p>
        </div>
        <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 text-xl animate-float">
          🛒
        </span>
      </div>

      {/* Phase: Camera scanning */}
      {phase === 'scanning' && (
        <div className="rounded-3xl bg-white border-2 border-sky-100 p-4 shadow-sm">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 rounded-2xl bg-black object-cover"
          />
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-sky-500" /> Position barcode in view
            </p>
            <button onClick={stopScan} className="text-xs font-bold text-coral-500 hover:text-coral-700 transition-colors py-2 px-4 rounded-xl hover:bg-coral-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Phase: Review scanned product */}
      {phase === 'review' && scannedProduct && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-emerald-100 p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              {scannedProduct.image_url ? (
                <img src={scannedProduct.image_url} alt={scannedProduct.name} className="w-16 h-16 rounded-2xl object-cover border border-emerald-100" />
              ) : (
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-emerald-100 text-3xl shadow-sm">
                  {getFoodEmoji(scannedProduct.name, scannedProduct.category)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold">
                  <Check className="w-3 h-3" /> Product found
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1 truncate">{scannedProduct.name}</h3>
                {scannedProduct.brand && <p className="text-xs text-slate-500 font-medium">{scannedProduct.brand}</p>}
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                  <Barcode className="w-3 h-3" /> {scannedProduct.code}
                </p>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Store it in</label>
              <div className="grid grid-cols-3 gap-2">
                {STORAGE_OPTIONS.map((location) => {
                  const visuals = STORAGE_VISUALS[location];
                  const isSelected = storageLocation === location;
                  return (
                    <button
                      key={location}
                      type="button"
                      onClick={() => setStorageLocation(location)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold border-2 transition-all duration-200 active:scale-95 ${
                        isSelected ? `${visuals.bg} ${visuals.text} ${visuals.border}` : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span>{visuals.emoji}</span> {visuals.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border-2 border-slate-100 px-3 py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {scannedProduct.category ?? 'Uncategorised'}
                </p>
              </div>
              <div className="rounded-xl bg-white border-2 border-slate-100 px-3 py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expiry</p>
                <p className="text-sm font-bold text-slate-700">
                  Auto-estimated ✨
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex-1 text-xs font-bold text-slate-600 hover:text-slate-800 py-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:scale-[1.01] active:scale-95 transition-all duration-200">
              Rescan
            </button>
            <button onClick={handleAddScannedProduct} className="flex-1 text-xs font-extrabold text-white py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.01] active:scale-95 transition-all duration-200 shadow-md shadow-emerald-200">
              Add to Inventory ✓
            </button>
          </div>
        </motion.div>
      )}

      {/* Phase: Review parsed receipt items */}
      {phase === 'review' && receiptImage && previewItems.length > 0 && !scannedProduct && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-2 border-amber-100 p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-amber-100 flex items-center justify-center shrink-0 text-3xl">
                🧾
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-slate-900">Receipt Parsed ✨</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Review {previewItems.length} item{previewItems.length === 1 ? '' : 's'} before adding</p>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Store them in</label>
              <div className="grid grid-cols-3 gap-2">
                {STORAGE_OPTIONS.map((location) => {
                  const visuals = getStorageVisuals(location);
                  const isSelected = storageLocation === location;
                  return (
                    <button
                      key={location}
                      type="button"
                      onClick={() => {
                        setStorageLocation(location);
                        setPreviewItems((prev) => prev.map((item) => ({ ...item, storage_location: location })));
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold border-2 transition-all duration-200 active:scale-95 ${
                        isSelected ? `${visuals.bg} ${visuals.text} ${visuals.border}` : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span>{visuals.emoji}</span> {visuals.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {previewItems.map((item, i) => {
                const storage = getStorageVisuals(item.storage_location);
                return (
                  <div key={`${item.name}-${i}`} className="flex items-center gap-3 p-2.5 rounded-2xl border border-emerald-100 bg-white hover:scale-[1.01] transition-all duration-200">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-xl shrink-0">
                      {getFoodEmoji(item.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {item.quantity} {item.unit} · {storage.emoji} {storage.label}
                      </p>
                    </div>
                    <button
                      onClick={() => setPreviewItems(previewItems.filter((_, idx) => idx !== i))}
                      aria-label={`Remove ${item.name}`}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-coral-500 hover:bg-coral-50 transition-all active:scale-90"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex-1 text-xs font-bold text-slate-600 py-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:scale-[1.01] active:scale-95 transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirmItems} className="flex-1 text-xs font-extrabold text-white py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-[1.01] active:scale-95 transition-all duration-200 shadow-md shadow-emerald-200">
              Add {previewItems.length} Item{previewItems.length === 1 ? '' : 's'} ✓
            </button>
          </div>
        </motion.div>
      )}

      {/* Phase: Done confirmation */}
      {phase === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 animate-pulse-soft">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">Added to Inventory 🎉</h3>
          <p className="text-sm text-slate-500 font-medium">Items successfully scanned and stored</p>
          <button onClick={handleReset} className="mt-6 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            Scan Again
          </button>
        </motion.div>
      )}

      {/* Phase: Processing */}
      {phase === 'processing' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-2">Processing…</h3>
          <p className="text-sm text-slate-500 font-medium">
            {receiptImage ? 'Parsing receipt…' : 'Adding to inventory…'}
          </p>
        </div>
      )}

      {/* Phase: Idle - scan options */}
      {phase === 'idle' && (
        <div className="space-y-4 pb-8">
          {cameraError && (
            <div className="flex items-center gap-3 rounded-2xl bg-coral-50 border-2 border-coral-200 p-4">
              <AlertTriangle className="w-5 h-5 text-coral-500 shrink-0" strokeWidth={2.5} />
              <div>
                <p className="text-sm font-bold text-coral-700">{cameraError}</p>
                <p className="text-xs text-coral-500 font-medium mt-0.5">Use receipt upload instead</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              onClick={startScan}
              disabled={!scanner}
              className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-sky-50 to-cyan-50 border-2 border-sky-200 p-5 text-left hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-sky-600 shrink-0 shadow-sm">
                <Camera className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900">{!scanner ? 'Scanner Unavailable 📷' : 'Scan Barcode 📷'}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {scanner ? 'Point your camera at a product barcode' : 'Barcode scanner could not initialize'}
                </p>
              </div>
            </motion.button>

            <label className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-5 text-left hover:shadow-md hover:scale-[1.01] transition-all duration-200 active:scale-[0.98] cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-amber-600 shrink-0 shadow-sm">
                <ReceiptText className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900">Upload Receipt 🧾</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Parse a receipt image into items</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </label>
          </div>

          {/* Manual barcode entry */}
          <div className="rounded-3xl bg-white border-2 border-emerald-100 p-4">
            <p className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-emerald-500" /> Or type a barcode
            </p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 0123456789012"
                inputMode="numeric"
                className="flex-1 text-sm font-medium text-slate-800 bg-white rounded-xl px-3 py-2.5 border-2 border-slate-100 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
              />
              <button
                onClick={handleManualScan}
                disabled={!manualCode.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-3.5 h-3.5" /> Look up
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50/60 border border-emerald-100 py-3 px-4 text-xs font-medium text-emerald-700">
            <Sparkles className="w-4 h-4" />
            Scanned items get an automatic expiry estimate and category emoji.
          </div>
        </div>
      )}
    </div>
  );
}
