// ZXing worker for barcode scanning fallback.
// Pure JavaScript worker module.

import {
  getSupportedBarcodeFormats,
  BarcodeDetectorWrapper
} from './zxing-utils.js';

// Simple ZXing implementation fallback
class ZXingFallback {
  static async initialize() {
    // Check if we can use the built-in BarcodeDetector as fallback
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new BarcodeDetectorWrapper({
          types: ['EAN13', 'EAN8', 'UPCA', 'CODE128', 'CODE39']
        });
        return true;
      } catch (error) {
        console.warn('ZXing fallback failed:', error);
      }
    }
    return false;
  }

  static async scanFrame(video) {
    if (!barcodeDetector) return null;

    try {
      const barcodes = await barcodeDetector.detect(video);
      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
    } catch (error) {
      console.error('ZXing scan error:', error);
    }
    return null;
  }

  static stop() {
    barcodeDetector = undefined;
  }
}

// Global variables for the worker
let barcodeDetector = null;
let videoElement = null;
let scanning = false;

// Worker message handler
self.onmessage = async (event) => {
  const { type, data } = event.data;

  if (type === 'initialize') {
    try {
      const success = await ZXingFallback.initialize();
      self.postMessage({
        type: 'initialized',
        success
      });
    } catch (error) {
      self.postMessage({
        type: 'initialized',
        success: false,
        error: error.message
      });
    }
  }

  else if (type === 'scan-frame' && data) {
    try {
      // Expect data to be a video element or video URL
      if (data instanceof HTMLVideoElement) {
        videoElement = data;
      } else if (typeof data === 'string') {
        // If it's a URL, we'd need to create a video element
        // For simplicity, this worker expects a video element passed
        console.warn('ZXing worker expects video element, got:', typeof data);
        return;
      }

      if (videoElement) {
        const barcode = await ZXingFallback.scanFrame(videoElement);
        if (barcode) {
          self.postMessage({
            type: 'barcode-scanned',
            data: barcode
          });
        }
      }
    } catch (error) {
      // Silent fail - let the main thread handle timeout
    }
  }
};

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}