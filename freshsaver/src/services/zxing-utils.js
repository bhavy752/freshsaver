// ZXing utilities for cross-browser barcode scanning fallback.
// Pure JavaScript — no TypeScript annotations.

export function getSupportedBarcodeFormats() {
  if (!('BarcodeDetector' in window)) {
    return Promise.resolve([]);
  }

  try {
    const detector = new BarcodeDetector({
      types: ['ean13', 'ean8', 'upc-a', 'upc-e', 'code128', 'code39', 'code93', 'codabar']
    });
    return detector.getSupportedFormats();
  } catch {
    return Promise.resolve([]);
  }
}

export class BarcodeDetectorWrapper {
  constructor(config) {
    this.formats = config.types;
  }

  async getSupportedFormats() {
    if (!('BarcodeDetector' in window)) {
      return [];
    }

    try {
      const detector = new window.BarcodeDetector({ types: this.formats });
      return detector.getSupportedFormats();
    } catch {
      return [];
    }
  }

  async detect(videoElement) {
    if (!('BarcodeDetector' in window)) {
      throw new Error('BarcodeDetector not supported');
    }

    const detector = new window.BarcodeDetector({ types: this.formats });

    try {
      const barcodes = await detector.detect(videoElement);
      return barcodes.map((barcode) => ({ rawValue: barcode.rawValue }));
    } catch (error) {
      console.error('Barcode detection failed:', error);
      return [];
    }
  }
}