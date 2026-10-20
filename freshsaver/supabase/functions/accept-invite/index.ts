// supabase/functions/accept-invite/index.ts
// Verifies a signed invite token, marks it consumed (non-reusable), and
// joins the caller to the household with the invited role.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encode } from 'https://deno.land/std@0.224.0/encoding/base64url.ts';

const signingKey = () => {
  const secret = Deno.env.get('INVITE_SIGNING_SECRET');
  if (!secret) throw new Error('INVITE_SIGNING_SECRET environment variable is not set');
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
    const token = body?.token;
    if (!token) return json({ error: 'token is required' }, 400);

    // Token format: household_id.role.email.expires_at.signature
    const parts = token.split('.');
    if (parts.length !== 5) return json({ error: 'Invalid invite token' }, 400);

    const [householdId, role, email, expiresAt, signature] = parts;
    const payload = `${householdId}.${role}.${email}.${expiresAt}`;
    const expectedSig = await hmacSha256Hex(payload, signingKey());

    // Constant-time comparison.
    if (expectedSig.length !== signature.length) {
      return json({ error: 'Invalid invite token' }, 400);
    }
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (diff !== 0) return json({ error: 'Invalid invite token' }, 400);

    // Verify the token matches the caller's email.
    if (email !== (user.email ?? '').toLowerCase()) {
      return json({ error: 'This invite was issued for a different email' }, 403);
    }

    // Expiry check.
    if (new Date(expiresAt).getTime() < Date.now()) {
      return json({ error: 'This invite has expired' }, 410);
    }

    // Look up the invite row (service role to bypass RLS for the consumed update).
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: invite, error: lookupError } = await serviceSupabase
      .from('household_invites')
      .select('id, consumed_at, revoked_at')
      .eq('token', token)
      .maybeSingle();

    if (lookupError) return json({ error: lookupError.message }, 500);
    if (!invite) return json({ error: 'Invite not found' }, 404);
    if (invite.consumed_at) return json({ error: 'This invite has already been used' }, 410);
    if (invite.revoked_at) return json({ error: 'This invite has been revoked' }, 410);

    // Mark consumed atomically.
    const { error: consumeError } = await serviceSupabase
      .from('household_invites')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (consumeError) return json({ error: consumeError.message }, 500);

    // Assign the user to the household with the invited role.
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({ household_id: householdId, role })
      .eq('id', user.id);

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ household_id: householdId, role, message: 'Joined household successfully' });
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
