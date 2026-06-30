export async function onRequest(context){
  const {request} = context;
  const url = new URL(request.url).searchParams.get('url');
  if(!url) return new Response(JSON.stringify({error:'No URL'}),{status:400});

  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://htmlpreview.github.io/?${encodeURIComponent(url)}`,
  ];

  const headers = {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language':'en-US,en;q=0.5',
  };

  let html='';

  // Try direct first
  try{
    const res=await fetch(url,{headers});
    if(res.ok) html=await res.text();
  }catch(e){}

  // Try proxies
  if(!html){
    for(const proxy of proxies){
      try{
        const res=await fetch(proxy,{headers});
        if(res.ok){
          const text=await res.text();
          // allorigins wraps in JSON
          if(proxy.includes('allorigins')){
            try{html=JSON.parse(text).contents||'';}catch(e){html=text;}
          }else{
            html=text;
          }
          if(html.length>500) break;
        }
      }catch(e){continue;}
    }
  }

  if(!html) return new Response(JSON.stringify({error:'Could not fetch — this site blocks automated requests. Fill in manually.'}),{status:400});

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