async function hashPassword(password) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const { method } = request;

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const expected = await hashPassword(env.BALANCE_PASSWORD || "");
  if (token !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM transactions ORDER BY date DESC'
      ).all();
      return Response.json({ transactions: results }, { headers: corsHeaders });
    }

    if (method === 'POST') {
      const body = await request.json();
      const { type, source, amount } = body;

      if (!type || !source || !amount || amount <= 0) {
        return Response.json(
          { error: 'Invalid input' },
          { status: 400, headers: corsHeaders }
        );
      }

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const date = new Date().toISOString();

      await env.DB.prepare(
        'INSERT INTO transactions (id, type, source, amount, date) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, type, source, amount, date).run();

      return Response.json(
        { id, type, source, amount, date },
        { status: 201, headers: corsHeaders }
      );
    }

    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM transactions').run();
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders }
    );
  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
