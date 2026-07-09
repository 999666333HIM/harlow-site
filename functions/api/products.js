export async function onRequest(context){
  const {request, env} = context;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page'))||0;
  const limit = Math.min(parseInt(url.searchParams.get('limit'))||50, 500);
  const offset = page * limit;
  const cat = url.searchParams.get('cat')||'';
  const q = url.searchParams.get('q')||'';
  const sort = url.searchParams.get('sort')||'popular';
  const minPrice = parseFloat(url.searchParams.get('minPrice'))||0;
  const maxPrice = parseFloat(url.searchParams.get('maxPrice'))||0;

  let where = 'WHERE 1=1';
  const params = [];

  if(cat){
    where += ' AND cat = ?';
    params.push(cat);
  }

  if(q){
    const words = q.trim().split(/\s+/).filter(w=>w.length>1);
    if(words.length){
      where += ' AND (' + words.map(()=>'name LIKE ?').join(' OR ') + ')';
      words.forEach(w=>params.push('%'+w+'%'));
    }
  }

  if(minPrice > 0){
    where += ' AND price >= ?';
    params.push(minPrice);
  }

  if(maxPrice > 0){
    where += ' AND price <= ?';
    params.push(maxPrice);
  }

  let orderBy = 'ORDER BY hot DESC, reviews DESC';
  if(sort === 'priceLow') orderBy = 'ORDER BY price ASC';
  else if(sort === 'priceHigh') orderBy = 'ORDER BY price DESC';
  else if(sort === 'rating') orderBy = 'ORDER BY rating DESC';

  try{
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM products ' + where
    ).bind(...params).first();

    const total = countResult?.total || 0;

    const products = await env.DB.prepare(
      'SELECT * FROM products ' + where + ' ' + orderBy + ' LIMIT ? OFFSET ?'
    ).bind(...params, limit, offset).all();

    return new Response(JSON.stringify({
      products: products.results || [],
      total,
      page,
      limit,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }catch(err){
    return new Response(JSON.stringify({error: err.message}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }
}
