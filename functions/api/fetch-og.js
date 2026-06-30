export async function onRequest(context){
  const {request} = context;
  const url = new URL(request.url).searchParams.get('url');
  if(!url) return new Response(JSON.stringify({error:'No URL'}),{status:400});

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

  // Try allorigins
  if(!html||html.length<500){
    try{
      const res=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(url));
      if(res.ok){
        const data=await res.json();
        if(data.contents&&data.contents.length>500) html=data.contents;
      }
    }catch(e){}
  }

  // Try corsproxy
  if(!html||html.length<500){
    try{
      const res=await fetch('https://corsproxy.io/?'+encodeURIComponent(url),{headers});
      if(res.ok){
        const text=await res.text();
        if(text.length>500) html=text;
      }
    }catch(e){}
  }

  if(!html||html.length<500){
    return new Response(JSON.stringify({
      error:'This site blocks automated requests. Try AliExpress, eBay, or Etsy URLs instead.'
    }),{status:400});
  }

  const get=(prop)=>{
    const patterns=[
      new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`,'i'),
      new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`,'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`,'i'),
    ];
    for(const p of patterns){const m=html.match(p);if(m?.[1]) return m[1].trim();}
    return null;
  };

  const title=get('og:title')||get('twitter:title')
    ||html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/&amp;/g,'&').replace(/&#039;/g,"'").trim()||null;
  const image=get('og:image')||get('twitter:image')||null;
  const description=(get('og:description')||get('twitter:description')||'')
    .replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"')||null;
  const priceStr=get('product:price:amount')||get('og:price:amount')||null;
  const price=priceStr?parseFloat(priceStr):null;

  return new Response(JSON.stringify({title,image,description,price}),{
    headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
  });
}