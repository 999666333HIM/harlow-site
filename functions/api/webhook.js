async function verifyStripeSignature(payload, sigHeader, secret){
  const parts = sigHeader.split(',');
  let timestamp = '';
  let signature = '';
  for(const part of parts){
    if(part.startsWith('t=')) timestamp = part.slice(2);
    if(part.startsWith('v1=')) signature = part.slice(3);
  }
  if(!timestamp||!signature) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
  return expectedSig === signature;
}

export async function onRequest(context){
  const {request, env} = context;
  if(request.method!=='POST') return new Response('Method not allowed',{status:405});

  try{
    const payload = await request.text();
    const sigHeader = request.headers.get('stripe-signature');

    // Verify webhook signature if secret is set
    if(env.STRIPE_WEBHOOK_SECRET && sigHeader){
      const valid = await verifyStripeSignature(payload, sigHeader, env.STRIPE_WEBHOOK_SECRET);
      if(!valid) return new Response('Invalid signature',{status:400});
    }

    const event = JSON.parse(payload);
    if(event.type !== 'checkout.session.completed'){
      return new Response(JSON.stringify({received:true}),{headers:{'Content-Type':'application/json'}});
    }

    const session = event.data.object;

    // Fetch line items from Stripe
    const lineItemsRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items?limit=100`,
      {headers:{'Authorization':'Bearer '+env.STRIPE_SECRET_KEY}}
    );
    const lineItemsData = await lineItemsRes.json();
    const lineItems = lineItemsData.data||[];

    const orderId = 'order-'+session.id.slice(-12)+'-'+Date.now();
    const addr = session.shipping_details?.address||session.customer_details?.address||{};
    const name = session.shipping_details?.name||session.customer_details?.name||'';
    const email = session.customer_details?.email||'';
    const total = (session.amount_total||0)/100;

    // Insert order
    await env.DB.prepare(`
      INSERT OR IGNORE INTO orders(id,stripe_session_id,status,buyer_name,buyer_email,
        address_line1,address_line2,city,state,zip,country,total,currency,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
    `).bind(
      orderId, session.id, 'pending', name, email,
      addr.line1||'', addr.line2||'', addr.city||'',
      addr.state||'', addr.postal_code||'', addr.country||'US',
      total, session.currency||'usd'
    ).run();

    // Insert order items
for(const item of lineItems){
      // Look up source_url from products table
      let sourceUrl='';
      try{
        const prod=await env.DB.prepare(
          'SELECT source_url FROM products WHERE name=? LIMIT 1'
        ).bind(item.description||'').first();
        sourceUrl=prod?.source_url||'';
      }catch(e){}

      await env.DB.prepare(`
        INSERT INTO order_items(order_id,product_name,quantity,price,source_url)
        VALUES(?,?,?,?,?)
      `).bind(
        orderId,
        item.description||'Unknown',
        item.quantity||1,
        (item.amount_total||0)/100,
        sourceUrl
      ).run();
    }

    console.log('Order saved:', orderId, 'Total:', total);
    return new Response(JSON.stringify({received:true}),{headers:{'Content-Type':'application/json'}});
  }catch(err){
    console.error('Webhook error:', err.message);
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}
