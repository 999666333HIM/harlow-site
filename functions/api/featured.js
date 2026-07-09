export async function onRequest(context){
  const {request, env} = context;

  if(request.method==='GET'){
    try{
      const [topMeta, carouselMeta] = await Promise.all([
        env.DB.prepare('SELECT value FROM catalog_meta WHERE key=?').bind('featured_top_ids').first(),
        env.DB.prepare('SELECT value FROM catalog_meta WHERE key=?').bind('featured_carousel_ids').first(),
      ]);
      const topIds = topMeta?.value ? JSON.parse(topMeta.value) : [];
      const carouselIds = carouselMeta?.value ? JSON.parse(carouselMeta.value) : [];
      const allIds = [...new Set([...topIds,...carouselIds])];
      if(!allIds.length) return new Response(JSON.stringify({top:[],carousel:[]}),{
        headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
      const placeholders = allIds.map(()=>'?').join(',');
      const products = await env.DB.prepare(
        `SELECT * FROM products WHERE id IN (${placeholders})`
      ).bind(...allIds).all();
      const byId = {};
      products.results.forEach(p=>byId[p.id]=p);
      return new Response(JSON.stringify({
        top: topIds.map(id=>byId[id]).filter(Boolean),
        carousel: carouselIds.map(id=>byId[id]).filter(Boolean),
      }),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    }catch(err){
      return new Response(JSON.stringify({error:err.message}),{status:500});
    }
  }

  if(request.method==='POST'){
    try{
      const {topIds, carouselIds} = await request.json();
      await Promise.all([
        env.DB.prepare('INSERT OR REPLACE INTO catalog_meta(key,value) VALUES(?,?)').bind('featured_top_ids',JSON.stringify(topIds||[])).run(),
        env.DB.prepare('INSERT OR REPLACE INTO catalog_meta(key,value) VALUES(?,?)').bind('featured_carousel_ids',JSON.stringify(carouselIds||[])).run(),
      ]);
      return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
    }catch(err){
      return new Response(JSON.stringify({error:err.message}),{status:500});
    }
  }

  return new Response('Method not allowed',{status:405});
}
