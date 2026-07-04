export async function onRequest(context) {
  const { request, env, params } = context;
  const { method } = request;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (method !== 'DELETE') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const { id } = params;
    const { success } = await env.DB.prepare(
      'DELETE FROM transactions WHERE id = ?'
    ).bind(id).run();

    if (!success) {
      return Response.json(
        { error: 'Transaction not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
