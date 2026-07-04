async function signToken(secret) {
  const exp = String(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(exp));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${exp}.${sigB64}`;
}

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const { password } = await request.json();
    if (!password || password !== env.BALANCE_PASSWORD) {
      return Response.json({ ok: false }, { status: 401, headers: corsHeaders });
    }

    const token = await signToken(env.TOKEN_SECRET || env.BALANCE_PASSWORD);
    return Response.json({ ok: true, token }, { headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
