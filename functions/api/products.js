export async function onRequest(context){
  const {request, env} = context;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')||'0');
  const limit = parseInt(url.searchParams.get('limit')||'50');
  const cat = url.searchParams.get('cat')||'';
  const q = url.searchParams.get('q')||'';
  const sort = url.searchParams.get('sort')||'popular';
  const minPrice = parseFloat(url.searchParams.get('minPrice')||'0');
  const maxPrice = parseFloat(url.searchParams.get('maxPrice')||'999999');
  const offset = page * limit;

  let where = 'WHERE price >= ? AND price <= ?';
  const params = [minPrice, maxPrice];

  if(cat){ where += ' AND cat = ?'; params.push(cat); }
  if(q){ where += ' AND name LIKE ?'; params.push('%'+q+'%'); }

  let orderBy = 'ORDER BY reviews DESC';
  if(sort==='priceLow') orderBy='ORDER BY price ASC';
  else if(sort==='priceHigh') orderBy='ORDER BY price DESC';
  else if(sort==='rating') orderBy='ORDER BY rating DESC';

  try{
    if(!env.DB) return new Response(JSON.stringify({error:'DB not bound',env:Object.keys(env)}),{status:500});
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM products '+where
    ).bind(...params).first();

    const products = await env.DB.prepare(
      'SELECT * FROM products '+where+' '+orderBy+' LIMIT ? OFFSET ?'
    ).bind(...params, limit, offset).all();

    return new Response(JSON.stringify({
      products: products.results,
      total: countResult.total,
      page,
      limit,
    }),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}