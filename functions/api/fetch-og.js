export async function onRequest(context){
  const {request} = context;
  const url = new URL(request.url).searchParams.get('url');
  if(!url) return new Response(JSON.stringify({error:'No URL'}),{status:400});
  try{
    const res = await fetch(url,{
      headers:{'User-Agent':'Mozilla/5.0 (compatible; Wibilow/1.0)'}
    });
    const html = await res.text();
    const get = (prop)=>{
      const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,'i'));
      return match?.[1]||null;
    };
    const title = get('og:title') || get('twitter:title')
      || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]||null;
    const image = get('og:image') || get('twitter:image')||null;
    const description = get('og:description') || get('twitter:description')||null;
    const priceStr = get('product:price:amount') || get('og:price:amount')||null;
    const price = priceStr?parseFloat(priceStr):null;
    return new Response(JSON.stringify({title,image,description,price}),{
      headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
    });
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}