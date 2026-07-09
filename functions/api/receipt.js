export async function onRequest(context){
  const {request, env} = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if(!sessionId) return new Response(JSON.stringify({error:'No session_id'}),{status:400});

  try{
    const [sessionRes, itemsRes] = await Promise.all([
      fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=shipping_details`,{
        headers:{'Authorization':'Bearer '+env.STRIPE_SECRET_KEY}
      }),
      fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=100`,{
        headers:{'Authorization':'Bearer '+env.STRIPE_SECRET_KEY}
      }),
    ]);
    const session = await sessionRes.json();
    const itemsData = await itemsRes.json();
    if(session.error) throw new Error(session.error.message);
    return new Response(JSON.stringify({session, items: itemsData.data||[]}),{
      headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
    });
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}
