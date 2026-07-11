export async function onRequest(context){
  const {request, env} = context;
  if(request.method!=='POST') return new Response('Method not allowed',{status:405});
  try{
    const {orderId} = await request.json();
    if(!orderId) return new Response(JSON.stringify({error:'No orderId'}),{status:400});
    await env.DB.prepare('DELETE FROM order_items WHERE order_id=?').bind(orderId).run();
    await env.DB.prepare('DELETE FROM orders WHERE id=?').bind(orderId).run();
    return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}
