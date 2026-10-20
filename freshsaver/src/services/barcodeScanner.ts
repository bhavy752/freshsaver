import type { Category, FoodUnit } from '@/types';
import { addDaysToDate } from '@/utils';

export interface ScannedProduct {
  code: string;
  name: string;
  brand?: string;
  category?: string;
  packaging?: string;
  quantity?: number;
  quantity_unit?: string;
  nutrition?: {
    energy_kcal?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
    sugars?: number;
    fiber?: number;
    sodium?: number;
  };
  ingredients?: string;
  allergens?: string[];
  countries?: string;
  trace?: string;
  serving_size?: string;
  image_url?: string;
}

export interface BarcodeScanResult {
  success: boolean;
  product?: ScannedProduct;
  error?: {
    type: 'permission_denied' | 'camera_unavailable' | 'scan_timeout' | 'unrecognized' | 'network_error' | 'user_cancelled';
    message: string;
    recovery?: string;
  };
  scanned_at: Date;
}

interface NativeBarcodeDetector {
  getSupportedFormats: () => Promise<string[]>;
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
}

class BarcodeScanner {
  private barcodeDetector?: NativeBarcodeDetector;
  private zxingWorker?: Worker;
  private cameraStream?: MediaStream;
  private scanTimeout?: ReturnType<typeof setTimeout>;
  private isScanning = false;
  private scanCallback?: (result: BarcodeScanResult) => void;

  async initialize(): Promise<boolean> {
    // Try to initialize BarcodeDetector (native API)
    if ('BarcodeDetector' in window) {
      const DetectorCtor = (window as unknown as {
        BarcodeDetector?: new (options: { types: string[] }) => NativeBarcodeDetector;
      }).BarcodeDetector;
      if (DetectorCtor) {
        try {
          this.barcodeDetector = new DetectorCtor({
            types: ['ean13', 'ean8', 'upc-a', 'upc-e', 'code128', 'code39', 'code93', 'codabar']
          });

          const supportedTypes = await this.barcodeDetector.getSupportedFormats();
          console.log('BarcodeDetector supported formats:', supportedTypes);

          // If it supports enough formats, use it
          if (supportedTypes.length >= 3) {
            console.log('Using native BarcodeDetector');
            return true;
          }
        } catch (error) {
          console.warn('BarcodeDetector failed to initialize:', error);
        }
      }
    }
    
    // Fallback to zxing worker
    console.log('Falling back to ZXing worker');
    return this.initializeZxingWorker();
  }

  private async initializeZxingWorker(): Promise<boolean> {
    try {
      // Try to create a worker with ZXing
      this.zxingWorker = new Worker(new URL('./zxing-worker.js', import.meta.url), {
        type: 'module'
      });
      
      this.zxingWorker.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'barcode-scanned' && this.scanCallback) {
          this.scanCallback(data);
        }
      };
      
      this.zxingWorker.onerror = (error) => {
        console.error('ZXing worker error:', error);
        if (this.scanCallback) {
          this.scanCallback({
            success: false,
            error: {
              type: 'camera_unavailable',
              message: 'Barcode scanner failed to initialize',
              recovery: 'Please try again or scan manually'
            },
            scanned_at: new Date()
          });
        }
      };
      
      // Initialize the worker with supported formats
      this.zxingWorker.postMessage({
        type: 'initialize',
        formats: ['EAN13', 'EAN8', 'UPCA', 'CODE128', 'CODE39']
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize ZXing worker:', error);
      return false;
    }
  }

  async startScan(
    videoElement: HTMLVideoElement,
    onResult: (result: BarcodeScanResult) => void,
    timeoutMs: number = 30000
  ): Promise<void> {
    if (this.isScanning) {
      await this.stopScan();
    }
    
    this.scanCallback = onResult;
    this.isScanning = true;
    
    // Clear any existing timeout
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    
    // Set timeout
    this.scanTimeout = setTimeout(() => {
      if (this.isScanning && this.scanCallback) {
        this.scanCallback({
          success: false,
          error: {
            type: 'scan_timeout',
            message: 'Scan timed out. Please try again.',
            recovery: 'Ensure good lighting and try again'
          },
          scanned_at: new Date()
        });
      }
    }, timeoutMs);
    
    try {
      // Initialize camera
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      videoElement.srcObject = this.cameraStream;
      
      // Start scanning based on available technology
      if (this.barcodeDetector && (this.barcodeDetector as unknown as { detect: (...args: unknown[]) => Promise<unknown> }).detect) {
          // Native BarcodeDetector is ready to use
        this.scanWithBarcodeDetector(videoElement);
      } else if (this.zxingWorker) {
        this.scanWithZxing(videoElement);
      } else {
        throw new Error('No barcode scanner available');
      }
    } catch (error) {
      this.isScanning = false;
      const err = error as { name?: string };
      if (this.scanCallback) {
        this.scanCallback({
          success: false,
          error: {
            type: err.name === 'NotAllowedError' ? 'permission_denied' :
                  err.name === 'NotFoundError' ? 'camera_unavailable' :
                  'scan_timeout',
            message: error instanceof Error ? error.message : 'Camera access failed',
            recovery: 'Please check camera permissions and try again'
          },
          scanned_at: new Date()
        });
      }
    }
  }

  private async scanWithBarcodeDetector(videoElement: HTMLVideoElement): Promise<void> {
    const detector = this.barcodeDetector;
    if (!detector || !this.cameraStream) return;
    
    const scanFrame = async () => {
      if (!this.isScanning || !this.cameraStream?.active) return;
      
      try {
        const barcodes = await detector.detect(videoElement);
        
        if (barcodes.length > 0 && this.scanCallback) {
          if (this.scanTimeout) clearTimeout(this.scanTimeout);
          this.isScanning = false;
          
          const barcode = barcodes[0];
          const product = await this.lookupProduct(barcode.rawValue);
          
          if (product) {
            this.scanCallback({
              success: true,
              product,
              scanned_at: new Date()
            });
          } else {
            this.scanCallback({
              success: false,
              error: {
                type: 'unrecognized',
                message: `Barcode ${barcode.rawValue} not found in database`,
                recovery: 'You can still add this item manually'
              },
              scanned_at: new Date()
            });
          }
          return;
        }
        
        // Continue scanning
        if (this.isScanning) {
          requestAnimationFrame(() => this.scanWithBarcodeDetector(videoElement));
        }
      } catch (error) {
        console.error('BarcodeDetector scan error:', error);
        if (this.isScanning) {
          requestAnimationFrame(() => this.scanWithBarcodeDetector(videoElement));
        }
      }
    };
    
    scanFrame();
  }

  private async scanWithZxing(videoElement: HTMLVideoElement): Promise<void> {
    const worker = this.zxingWorker;
    if (!worker || !this.cameraStream) return;
    
    // For ZXing worker, we need to send video frame data
    // This is a simplified version - in production you'd use a more advanced approach
    const scanFrame = () => {
      if (!this.isScanning) return;
      
      // Send frame to worker for processing
      worker.postMessage({
        type: 'scan-frame',
        videoElement
      });
      
      // Continue scanning
      if (this.isScanning) {
        this.scanTimeout = setTimeout(() => scanFrame(), 100);
      }
    };
    
    scanFrame();
  }

  async lookupProduct(barcode: string): Promise<ScannedProduct | null> {
    try {
      // First try the local product database (if any)
      // For now, we'll use Open Food Facts API
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}
`,
        {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Product not found
        }
        throw new Error(`Open Food Facts API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.status || data.status !== 1) {
        return null;
      }
      
      return {
        code: data.code,
        name: data.product?.product_name || data.product?.generic_name || barcode,
        brand: data.product?.brands,
        category: data.product?.categories?.split(',').shift()?.trim(),
        packaging: data.product?.packaging,
        quantity: data.product?.quantity ? parseFloat(data.product.quantity) : undefined,
        quantity_unit: data.product?.quantity ? data.product.quantity.match(/[a-zA-Z]+$/)?.[0] : undefined,
        nutrition: data.product?.nutriments ? {
          energy_kcal: data.product.nutriments['energy-kcal_100g'] || data.product.nutriments.energy_kcal_100g,
          proteins: data.product.nutriments.proteins_100g,
          carbohydrates: data.product.nutriments.carbohydrates_100g,
          fats: data.product.nutriments.fats_100g,
          sugars: data.product.nutriments.sugars_100g,
          fiber: data.product.nutriments.fiber_100g,
          sodium: data.product.nutriments.sodium_100g,
        } : undefined,
        ingredients: data.product?.ingredients_text,
        allergens: data.product?.allergens_tags?.map((tag: string) => tag.replace(/^ allergen_/, '')),
        countries: data.product?.countries,
        trace: data.product?.traces,
        serving_size: data.product?.serving_size,
        image_url: data.product?.image_url
      };
    } catch (error) {
      console.error('Product lookup failed:', error);
      return null; // Fail silently and let user add manually
    }
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
    
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = undefined;
    }
    
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = undefined;
    }
    
    if (this.zxingWorker) {
      this.zxingWorker.terminate();
      this.zxingWorker = undefined;
    }
    
    this.scanCallback = undefined;
  }

  isAvailable(): boolean {
    return !!(this.barcodeDetector || this.zxingWorker);
  }

  async getCameraPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'not-available'> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'not-available';
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return 'denied';
      }
      return 'prompt';
    }
  }

  // Utility method to convert scanned product to food item payload
  productToFoodItemPayload(
    product: ScannedProduct,
    categories: Category[],
    unit: FoodUnit = 'pcs'
  ): {
    name: string;
    category_id: string | null;
    quantity: number;
    unit: FoodUnit;
    expires_at: string;
  } {
    // Try to match category from scanned data
    let category_id = null;
    if (product.category) {
      const matchedCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(product.category!.toLowerCase()) ||
        product.category!.toLowerCase().includes(cat.name.toLowerCase())
      );
      if (matchedCategory) {
        category_id = matchedCategory.id;
      }
    }
    
    // Determine quantity and unit from scanned data
    let quantity = 1;
    let finalUnit = unit;
    
    if (product.quantity && product.quantity_unit) {
      quantity = product.quantity;
      
      // Map common units
      const unitMap: Record<string, FoodUnit> = {
        'g': 'kg',
        'kg': 'kg',
        'l': 'liters',
        'ml': 'liters',
        'pcs': 'pcs',
        'pieces': 'pcs',
        'packs': 'packs',
        'bunches': 'bunches'
      };
      
      finalUnit = unitMap[product.quantity_unit.toLowerCase()] || unit;
    }
    
    // Determine shelf life - try to extract from product data or use default
    let shelfLifeDays = 7; // Default
    const productName = product.name.toLowerCase();
    const fruitKeywords = ['fruit', 'vegetable', 'banana', 'apple', 'orange', 'grape', 
      'strawberry', 'tomato', 'spinach', 'carrot', 'potato', 'onion', 'lettuce', 
      'pepper', 'cucumber', 'broccoli', 'mushroom', 'pear', 'melon', 'pineapple'];
    const bakeryKeywords = ['bread', 'bakery', 'loaf', 'bun', 'roll', 'bagel', 'croissant', 'muffin'];
    const meatKeywords = ['meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'salmon', 
      'tuna', 'cod', 'shrimp', 'lobster', 'steak', 'ground', 'bacon', 'sausage'];

    if (productName.includes('milk') || productName.includes('dairy') || productName.includes('cheese') || productName.includes('yogurt')) {
      shelfLifeDays = 7;
    } else if (bakeryKeywords.some(kw => productName.includes(kw))) {
      shelfLifeDays = 5;
    } else if (fruitKeywords.some(kw => productName.includes(kw))) {
      shelfLifeDays = 5;
    } else if (meatKeywords.some(kw => productName.includes(kw))) {
      shelfLifeDays = 3;
    }
    
    return {
      name: product.name,
      category_id,
      quantity,
      unit: finalUnit,
      expires_at: addDaysToDate(shelfLifeDays)
    };
  }
}

export async function initializeBarcodeScanner(): Promise<BarcodeScanner> {
  const scanner = new BarcodeScanner();
  const initialized = await scanner.initialize();
  
  if (!initialized) {
    throw new Error('Failed to initialize barcode scanner');
  }
  
  return scanner;
}

export default BarcodeScanner;