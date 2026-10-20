// supabase/functions/parse-receipt/index.ts
// Validates and sanitizes OCR output for receipt items using strict Zod schema.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { receiptParseSchema } from '../../validation';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const image = body?.image as string | undefined;
    
    if (!image || typeof image !== 'string') {
      return json({ 
        error: 'Missing or invalid image data',
        code: 'MISSING_IMAGE',
        suggestions: [
          'Ensure a valid image file was uploaded',
          'Try uploading a clearer receipt with better lighting',
          'Check that the image is not corrupted'
        ]
      }, 400);
    }

    // Validate input size (reasonable limit for base64)
    if (image.length > 5 * 1024 * 1024) {
      return json({
        error: 'Image too large',
        code: 'IMAGE_TOO_LARGE',
        suggestions: [
          'Try uploading a smaller image (max 5MB)',
          'Use compressed image format'
        ]
      }, 400);
    }

    // Extract items from the OCR service (simulated for now)
    const items = await extractItemsFromImage(image);

    // Validate against Zod schema
    const validation = receiptParseSchema.safeParse({ items });

    if (!validation.success) {
      const error = validation.error.issues[0];
      const errorMap = {
        'items': 'Receipt must contain at least one item',
        'items.0': 'Each item must have a name and category',
      };

      const friendlyError = errorMap[error.path.join('.')] || error.message;

      return json({
        error: friendlyError,
        code: 'VALIDATION_FAILED',
        suggestions: [
          "Try manually entering items if the OCR didn't work",
          'Upload a different receipt with clearer text',
          'Ensure the receipt text is horizontal and not angled'
        ]
      }, 422);
    }

    // Sanitize and return validated data
    const validatedData = validation.data;

    // Log successful validation for analytics
    await supabase.from('receipt_processing_logs').insert({
      user_id: user.id,
      items_count: validatedData.items.length,
      validation_passed: true,
      created_at: new Date().toISOString(),
    });

    return json({
      items: validatedData.items,
      processed_at: new Date().toISOString()
    });

  } catch (err) {
    // Log the error for debugging
    console.error('Parse receipt error:', err);

    return json({
      error: 'Processing failed',
      code: 'PROCESSING_ERROR',
      suggestions: [
        'Please try again in a few moments',
        'If the problem persists, please contact support'
      ]
    }, 500);
  }
});

// Simulate OCR extraction - in production, this would call an OCR API
async function extractItemsFromImage(imageBase64: string): Promise<Array<{ name: string; categoryName: string; shelfLifeDays: number }>> {
  // Kept for API compatibility with a future OCR provider.
  void imageBase64;
  // Add retry logic with exponential backoff
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      // Simulate OCR processing time
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      attempts++;
      
      // Simulate occasional failures for retry testing
      if (attempts < maxAttempts && Math.random() < 0.3) {
        throw new Error('Temporary OCR service unavailability');
      }
      
      // Return simulated OCR results
      return [
        { name: 'Organic Bananas', categoryName: 'Fruits', shelfLifeDays: 5 },
        { name: 'Whole Milk', categoryName: 'Dairy & Eggs', shelfLifeDays: 7 },
        { name: 'Sourdough Bread', categoryName: 'Bakery & Bread', shelfLifeDays: 3 },
        { name: 'Mixed Vegetables', categoryName: 'Vegetables', shelfLifeDays: 4 },
        { name: 'Ground Beef', categoryName: 'Meat & Fish', shelfLifeDays: 2 },
      ];
      
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw error;
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts - 1) * 1000));
    }
  }
  
  throw new Error('Max retry attempts reached');
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}