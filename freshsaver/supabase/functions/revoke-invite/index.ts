// supabase/functions/revoke-invite/index.ts
// Revokes a pending household invite. Only the household owner can revoke.

import { createClient } from 'jsr:@supabase/supabase-js@2';

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

    // Verify the caller is a household owner.
    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('household_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return json({ error: 'Profile not found' }, 404);
    }
    if (callerProfile.role !== 'owner') {
      return json({ error: 'Only household owners can revoke invites' }, 403);
    }

    // Verify the invite belongs to the caller's household.
    const { data: invite, error: lookupError } = await supabase
      .from('household_invites')
      .select('id, household_id')
      .eq('token', token)
      .maybeSingle();

    if (lookupError) return json({ error: lookupError.message }, 500);
    if (!invite) return json({ error: 'Invite not found' }, 404);
    if (invite.household_id !== callerProfile.household_id) {
      return json({ error: 'This invite does not belong to your household' }, 403);
    }

    // Only allow revocation of pending (not consumed/revoked) invites.
    if (invite.consumed_at || invite.revoked_at) {
      return json({ error: 'This invite has already been used or revoked' }, 410);
    }

    // Mark revoked with current timestamp.
    const { error: updateError } = await supabase
      .from('household_invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ message: 'Invite revoked successfully' });
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