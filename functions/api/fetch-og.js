export async function onRequest(context){
  const {request} = context;
  const url = new URL(request.url).searchParams.get('url');
  if(!url) return new Response(JSON.stringify({error:'No URL'}),{status:400});

  // Try multiple approaches
  const attempts = [
    // Direct fetch
    ()=>fetch(url,{headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept':'text/html,application/xhtml+xml',
      'Accept-Language':'en-US,en;q=0.9',
    }}),
    // AllOrigins proxy
    ()=>fetch('https://api.allorigins.win/get?url='+encodeURIComponent(url))
      .then(r=>r.json()).then(d=>new Response(d.contents,{status:200})),
  ];

  let html='';
  for(const attempt of attempts){
    try{
      const res=await attempt();
      if(res.ok){html=await res.text();break;}
    }catch(e){continue;}
  }

  if(!html) return new Response(JSON.stringify({error:'Could not fetch page'}),{status:400});

  const get=(prop)=>{
    const m=html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,'i'))
      ||html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,'i'));
    return m?.[1]?.trim()||null;
  };

  const title=get('og:title')||get('twitter:title')
    ||html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()||null;
  const image=get('og:image')||get('twitter:image')||null;
  const description=get('og:description')||get('twitter:description')||null;
  const priceStr=get('product:price:amount')||get('og:price:amount')||null;
  const price=priceStr?parseFloat(priceStr):null;

  return new Response(JSON.stringify({title,image,description,price}),{
    headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
  });
}