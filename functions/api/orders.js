export async function onRequest(context){
  const {env} = context;
  try{
    const orders = await env.DB.prepare(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 500'
    ).all();
    const items = await env.DB.prepare(
      'SELECT * FROM order_items'
    ).all();
    const result = orders.results.map(o=>({
      id: o.id,
      stripeSessionId: o.stripe_session_id,
      createdAt: o.created_at,
      total: o.total,
      currency: o.currency,
      buyer:{
        name: o.buyer_name,
        email: o.buyer_email,
        address:{
          line1: o.address_line1,
          line2: o.address_line2,
          city: o.city,
          state: o.state,
          zip: o.zip,
          country: o.country,
        }
      },
      items: items.results.filter(i=>i.order_id===o.id).map(i=>({
        name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        source_url: i.source_url,
      }))
    }));
    return new Response(JSON.stringify(result),{
      headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
    });
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}