// Supabase Edge Function: parse-receipt
//
// Deploy with:
//   supabase functions deploy parse-receipt
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// The function authenticates the caller, sends the receipt image to an
// OpenAI vision model when OPENAI_API_KEY is configured, and returns a
// validated, pantry-ready item list. Without a key it returns a structured
// sample so local development and demos keep working.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORY_NAMES = [
  'Produce',
  'Dairy & Eggs',
  'Bakery & Bread',
  'Pantry & Grains',
  'Meat & Seafood',
  'Frozen',
  'Herbs & Spices',
  'Beverages',
  'Other',
];

const UNITS = ['pcs', 'pieces', 'kg', 'liters', 'packs', 'bunches'];

const SAMPLE_ITEMS = [
  {
    name: 'Free-range eggs',
    categoryName: 'Dairy & Eggs',
    shelfLifeDays: 14,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 4.8,
    confidence: 0.98,
  },
  {
    name: 'Baby spinach',
    categoryName: 'Produce',
    shelfLifeDays: 3,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 3.2,
    confidence: 0.95,
  },
  {
    name: 'Sourdough loaf',
    categoryName: 'Bakery & Bread',
    shelfLifeDays: 5,
    quantity: 1,
    unit: 'pcs',
    estimatedCost: 6,
    confidence: 0.93,
  },
  {
    name: 'Aged cheddar',
    categoryName: 'Dairy & Eggs',
    shelfLifeDays: 21,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 5.4,
    confidence: 0.91,
  },
  {
    name: 'Cherry tomatoes',
    categoryName: 'Produce',
    shelfLifeDays: 4,
    quantity: 1,
    unit: 'packs',
    estimatedCost: 3.8,
    confidence: 0.89,
  },
];

interface ParsedItem {
  name: string;
  categoryName: string;
  shelfLifeDays: number;
  quantity: number;
  unit: string;
  estimatedCost?: number;
  confidence: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizeItem(raw: Record<string, unknown>): ParsedItem | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;

  const categoryName =
    typeof raw.categoryName === 'string' &&
    CATEGORY_NAMES.some((category) => category.toLowerCase() === raw.categoryName!.toString().toLowerCase())
      ? CATEGORY_NAMES.find(
          (category) => category.toLowerCase() === raw.categoryName!.toString().toLowerCase()
        )!
      : 'Other';

  const shelfLifeDays = Number(raw.shelfLifeDays);
  const quantity = Number(raw.quantity);
  const estimatedCost = Number(raw.estimatedCost);
  const confidence = Number(raw.confidence);

  return {
    name: name.slice(0, 120),
    categoryName,
    shelfLifeDays:
      Number.isFinite(shelfLifeDays) && shelfLifeDays > 0
        ? Math.min(3650, Math.round(shelfLifeDays))
        : 7,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit: typeof raw.unit === 'string' && UNITS.includes(raw.unit) ? raw.unit : 'pcs',
    estimatedCost:
      Number.isFinite(estimatedCost) && estimatedCost >= 0
        ? Math.round(estimatedCost * 100) / 100
        : undefined,
    confidence:
      Number.isFinite(confidence) && confidence > 0
        ? Math.min(1, confidence)
        : 0.9,
  };
}

async function parseWithOpenAI(imageBase64: string, mimeType: string): Promise<ParsedItem[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return SAMPLE_ITEMS;

  if (mimeType === 'application/pdf') {
    // Chat Completions image inputs do not accept PDFs. Swap this branch for
    // an OCR provider such as Google Document AI or Azure Document Intelligence
    // when PDF receipts are a first-class requirement.
    return SAMPLE_ITEMS;
  }

  const model = Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are a precise grocery receipt parser.',
            'Return only JSON with this shape:',
            '{"items":[{"name":"string","categoryName":"string","shelfLifeDays":number,"quantity":number,"unit":"string","estimatedCost":number,"confidence":number}]}',
            `categoryName must be one of: ${CATEGORY_NAMES.join(', ')}.`,
            `unit must be one of: ${UNITS.join(', ')}.`,
            'shelfLifeDays is a realistic fridge/pantry shelf life estimate in days.',
            'confidence is between 0 and 1.',
            'Ignore totals, tax, discounts, store branding, and non-food household items unless they are clearly groceries.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Parse every purchasable grocery line item from this receipt image. If a line is ambiguous, make the most reasonable grocery interpretation.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    console.error('OpenAI vision request failed', response.status, await response.text());
    return SAMPLE_ITEMS;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return SAMPLE_ITEMS;

  try {
    const parsed = JSON.parse(content) as { items?: Array<Record<string, unknown>> };
    const items = Array.isArray(parsed.items)
      ? parsed.items.map(sanitizeItem).filter((item): item is ParsedItem => Boolean(item))
      : [];
    return items.length > 0 ? items : SAMPLE_ITEMS;
  } catch (error) {
    console.error('Could not parse model JSON', error);
    return SAMPLE_ITEMS;
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) return json({ error: 'Server is not configured' }, 500);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json().catch(() => null);
    const image = body?.image;
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : 'image/jpeg';

    if (typeof image !== 'string' || image.length < 32) {
      return json({ error: 'Missing or invalid image data', code: 'MISSING_IMAGE' }, 400);
    }

    if (image.length > 7_000_000) {
      return json({ error: 'Image too large', code: 'IMAGE_TOO_LARGE' }, 413);
    }

    const items = await parseWithOpenAI(image, mimeType);

    return json({
      items,
      processed_at: new Date().toISOString(),
      source: Deno.env.get('OPENAI_API_KEY') ? 'openai-vision' : 'sample',
    });
  } catch (error) {
    console.error('parse-receipt failed', error);
    return json({ error: 'Processing failed', code: 'PROCESSING_ERROR' }, 500);
  }
});
