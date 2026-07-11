export async function onRequest(context){
  const {request, env} = context;
  if(request.method!=='POST') return new Response('Method not allowed',{status:405});

  try{
    const {cart} = await request.json();
    if(!cart||!cart.length) return new Response(JSON.stringify({error:'Empty cart'}),{status:400});

    const line_items = cart.map(item=>({
      price_data:{
        currency:'usd',
        product_data:{name:item.name},
        unit_amount:Math.round(item.price*100),
      },
      quantity:item.qty||1,
    }));

    const params = new URLSearchParams();
    params.append('mode','payment');
    params.append('success_url', (env.SITE_URL||'https://harlow-site.pages.dev')+'/success?session_id={CHECKOUT_SESSION_ID}');
    params.append('cancel_url', (env.SITE_URL||'https://harlow-site.pages.dev')+'/');
    params.append('shipping_address_collection[allowed_countries][0]','US');
    params.append('shipping_address_collection[allowed_countries][1]','CA');
    params.append('shipping_address_collection[allowed_countries][2]','GB');
    params.append('shipping_address_collection[allowed_countries][3]','AU');
    params.append('payment_method_types[0]','card');
params.append('automatic_tax[enabled]','true');

    line_items.forEach((item,i)=>{
      params.append(`line_items[${i}][price_data][currency]`,item.price_data.currency);
      params.append(`line_items[${i}][price_data][product_data][name]`,item.price_data.product_data.name);
      params.append(`line_items[${i}][price_data][unit_amount]`,item.price_data.unit_amount);
      params.append(`line_items[${i}][quantity]`,item.quantity);
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions',{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+env.STRIPE_SECRET_KEY,
        'Content-Type':'application/x-www-form-urlencoded',
      },
      body:params.toString(),
    });

    const session = await res.json();
    if(!res.ok) throw new Error(session.error?.message||'Stripe error');

    return new Response(JSON.stringify({url:session.url}),{
      headers:{'Content-Type':'application/json'},
    });
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}