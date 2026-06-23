export async function onRequest(context){
  const {request, env} = context;
  if(request.method!=='POST')
    return new Response('Method not allowed',{status:405});

  try{
    const {cart} = await request.json();
    const Stripe = (await import('stripe')).default;
    const stripe = Stripe(env.STRIPE_SECRET_KEY);

    const line_items = cart.map(item=>({
      price_data:{
        currency:'usd',
        product_data:{
          name:item.name,
          metadata:{
            source_url:item.source_url||'',
          }
        },
        unit_amount:Math.round(item.price*100),
      },
      quantity:1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types:['card'],
      mode:'payment',
      line_items,
      shipping_address_collection:{allowed_countries:['US','CA','GB','AU']},
      automatic_tax:{enabled:env.STRIPE_SECRET_KEY?.startsWith('sk_live_')},
      success_url:env.SITE_URL+'/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:env.SITE_URL+'/',
    });

    return new Response(JSON.stringify({url:session.url}),{
      headers:{'Content-Type':'application/json'}});
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}