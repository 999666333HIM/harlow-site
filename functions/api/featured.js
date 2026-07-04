export async function onRequest(context){
  const {request, env} = context;

  if(request.method==='GET'){
    try{
      const meta = await env.DB.prepare(
        'SELECT value FROM catalog_meta WHERE key=?'
      ).bind('featured_ids').first();
      const ids = meta?.value ? JSON.parse(meta.value) : [];
      if(!ids.length) return new Response(JSON.stringify([]),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
      const placeholders = ids.map(()=>'?').join(',');
      const products = await env.DB.prepare(
        `SELECT * FROM products WHERE id IN (${placeholders})`
      ).bind(...ids).all();
      // Return in the order they were saved
      const ordered = ids.map(id=>products.results.find(p=>p.id===id)).filter(Boolean);
      return new Response(JSON.stringify(ordered),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    }catch(err){
      return new Response(JSON.stringify({error:err.message}),{status:500});
    }
  }

  if(request.method==='POST'){
    try{
      const {ids} = await request.json();
      await env.DB.prepare('INSERT OR REPLACE INTO catalog_meta(key,value) VALUES(?,?)')
        .bind('featured_ids', JSON.stringify(ids)).run();
      return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
    }catch(err){
      return new Response(JSON.stringify({error:err.message}),{status:500});
    }
  }

  return new Response('Method not allowed',{status:405});
}
