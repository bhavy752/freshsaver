// supabase/functions/generate-invite/index.ts
// Creates a signed, 7-day-expiring invite token for a household.
// Only the household owner may generate invites.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encode } from 'https://deno.land/std@0.224.0/encoding/base64url.ts';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const signingKey = () => {
  const secret = Deno.env.get('INVITE_SIGNING_SECRET');
  if (!secret) {
    throw new Error('INVITE_SIGNING_SECRET environment variable is not set');
  }
  return secret;
};

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return encode(new Uint8Array(sig));
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const householdId = body?.household_id;
    const email = body?.email;
    const role = body?.role === 'owner' ? 'owner' : 'member';

    if (!householdId || !email) {
      return json({ error: 'household_id and email are required' }, 400);
    }

    // Verify the caller is the household owner.
    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('household_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return json({ error: 'Profile not found' }, 404);
    }
    if (callerProfile.household_id !== householdId || callerProfile.role !== 'owner') {
      return json({ error: 'Only the household owner can generate invites' }, 403);
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
    const payload = `${householdId}.${role}.${email.toLowerCase()}.${expiresAt}`;
    const signature = await hmacSha256Hex(payload, signingKey());
    const token = `${payload}.${signature}`;

    const { error: insertError } = await supabase.from('household_invites').insert({
      household_id: householdId,
      token,
      role,
      email: email.toLowerCase(),
      expires_at: expiresAt,
      created_by: user.id,
    });

    if (insertError) return json({ error: insertError.message }, 500);

    return json({ token, expires_at: expiresAt, role, email });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
