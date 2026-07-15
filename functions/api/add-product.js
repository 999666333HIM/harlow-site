export async function onRequest(context){
  const {request, env} = context;

  if(!['POST','PUT','DELETE'].includes(request.method))
    return new Response('Method not allowed',{status:405});

  try{
    const body = await request.json();

    if(request.method==='DELETE'){
      await env.DB.prepare('DELETE FROM products WHERE id=?')
        .bind(body.productId).run();
      return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
    }

    const p = body.product;
    if(!p) return new Response(JSON.stringify({error:'No product data'}),{status:400});

    if(request.method==='PUT'){
      await env.DB.prepare(`
        UPDATE products SET
          name=?,cat=?,icon=?,price=?,rating=?,reviews=?,hot=?,
          desc=?,thumbnail=?,stock=?,source_url=?,cost=?,updated_at=datetime('now')
        WHERE id=? AND manual=1
      `).bind(
        p.name,p.cat,p.icon||'🛍️',p.price,p.rating||4.5,p.reviews||100,
        p.hot?1:0,p.desc||'',p.thumbnail||null,p.stock||50,
        p.source_url||null,p.cost||null,p.id
      ).run();
      return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
    }

    // POST — insert new
    await env.DB.prepare(`
      INSERT OR IGNORE INTO products
        (id,name,cat,icon,price,rating,reviews,hot,desc,thumbnail,stock,source_url,source,manual,cost)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'manual',1,?)
    `).bind(
      p.id,p.name,p.cat,p.icon||'🛍️',p.price,p.rating||4.5,p.reviews||100,
      p.hot?1:0,p.desc||'',p.thumbnail||null,p.stock||50,
      p.source_url||null,p.cost||null
    ).run();

    return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});

  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}