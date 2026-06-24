const SEARCH_TERMS = [
  'earbuds','bluetooth speaker','smartwatch','laptop stand',
  'phone case','usb hub','webcam','mechanical keyboard','gaming mouse',
  'portable charger','led desk lamp','smart plug','ring light','tablet stand',
  'qi charger','hdmi cable','monitor light bar','cable organizer',
  'air fryer','coffee maker','robot vacuum','instant pot','blender',
  'mattress topper','throw pillow','scented candle','storage organizer',
  'shower curtain','bath towel','kitchen knife','cast iron pan',
  'ice cube tray','dish rack','silicone spatula','electric kettle',
  'running shoes','gym leggings','baseball cap','sunglasses','leather wallet',
  'tote bag','winter scarf','compression socks','sports bra','hoodie',
  'minimalist watch','canvas sneakers','crossbody bag',
  'skincare lotion','face serum','vitamin c cream','hair mask','electric toothbrush',
  'jade roller','sunscreen','lip gloss','eyelash curler','nail kit',
  'facial cleanser','eye cream','hair growth oil','makeup brush set',
  'resistance bands','yoga mat','water bottle','jump rope','foam roller',
  'gym gloves','protein shaker','ankle weights','pull up bar','knee sleeve',
  'dog collar','cat toy','pet bed','dog harness','cat scratcher',
  'fidget toy','building blocks','art supplies','kids headphones',
  'garden gloves','plant pot','watering can','grow light','pruning shears',
];

const BATCH_SIZE = 3;

function markupPrice(p){
  if(!p || p === 0) return 0;
  return Math.ceil((p + 6) * 1.40);
}

function pickEmoji(term){
  const map = {
    'earbuds':'🎧','bluetooth speaker':'🔊','smartwatch':'⌚',
    'laptop stand':'💻','phone case':'📱','usb hub':'🔌','webcam':'📷',
    'mechanical keyboard':'⌨️','gaming mouse':'🖱️','portable charger':'🔋',
    'led desk lamp':'💡','smart plug':'🔌','ring light':'💡','tablet stand':'📱',
    'qi charger':'🔋','hdmi cable':'📺','monitor light bar':'💡',
    'cable organizer':'🔌','air fryer':'🍳','coffee maker':'☕',
    'robot vacuum':'🤖','instant pot':'🍲','blender':'🥤',
    'mattress topper':'🛏️','throw pillow':'🛋️','scented candle':'🕯️',
    'storage organizer':'📦','shower curtain':'🚿','bath towel':'🛁',
    'kitchen knife':'🔪','cast iron pan':'🍳','ice cube tray':'🧊',
    'dish rack':'🍽️','silicone spatula':'🥄','electric kettle':'☕',
    'running shoes':'👟','gym leggings':'🏃','baseball cap':'🧢',
    'sunglasses':'🕶️','leather wallet':'👜','tote bag':'👜',
    'winter scarf':'🧣','compression socks':'🧦','sports bra':'👙',
    'hoodie':'👕','minimalist watch':'⌚','canvas sneakers':'👟',
    'crossbody bag':'👜','skincare lotion':'🧴','face serum':'💆',
    'vitamin c cream':'🧴','hair mask':'💇','electric toothbrush':'🪥',
    'jade roller':'💆','sunscreen':'🧴','lip gloss':'💄',
    'eyelash curler':'👁️','nail kit':'💅','facial cleanser':'🧴',
    'eye cream':'💆','hair growth oil':'💇','makeup brush set':'💄',
    'resistance bands':'💪','yoga mat':'🧘','water bottle':'🫗',
    'jump rope':'🏃','foam roller':'💪','gym gloves':'🥊',
    'protein shaker':'🥤','ankle weights':'💪','pull up bar':'💪',
    'knee sleeve':'🦵','dog collar':'🐕','cat toy':'🐈',
    'pet bed':'🐾','dog harness':'🐕','cat scratcher':'🐈',
    'fidget toy':'🎯','building blocks':'🧱','art supplies':'🎨',
    'kids headphones':'🎧','garden gloves':'🌱','plant pot':'🪴',
    'watering can':'🌿','grow light':'💡','pruning shears':'✂️',
  };
  return map[term] || '🛍️';
}

function pickCat(term){
  const electronics=['earbuds','bluetooth speaker','smartwatch','laptop stand',
    'phone case','usb hub','webcam','mechanical keyboard','gaming mouse','portable charger',
    'led desk lamp','smart plug','ring light','tablet stand','qi charger',
    'hdmi cable','monitor light bar','cable organizer'];
  const home=['air fryer','coffee maker','robot vacuum','instant pot','blender',
    'mattress topper','throw pillow','scented candle','storage organizer','shower curtain',
    'bath towel','kitchen knife','cast iron pan','ice cube tray','dish rack',
    'silicone spatula','electric kettle'];
  const fashion=['running shoes','gym leggings','baseball cap','sunglasses','leather wallet',
    'tote bag','winter scarf','compression socks','sports bra','hoodie',
    'minimalist watch','canvas sneakers','crossbody bag'];
  const beauty=['skincare lotion','face serum','vitamin c cream','hair mask','electric toothbrush',
    'jade roller','sunscreen','lip gloss','eyelash curler','nail kit',
    'facial cleanser','eye cream','hair growth oil','makeup brush set'];
  const sports=['resistance bands','yoga mat','water bottle','jump rope','foam roller',
    'gym gloves','protein shaker','ankle weights','pull up bar','knee sleeve'];
  const pets=['dog collar','cat toy','pet bed','dog harness','cat scratcher'];
  const kids=['fidget toy','building blocks','art supplies','kids headphones'];
  const garden=['garden gloves','plant pot','watering can','grow light','pruning shears'];
  if(electronics.includes(term)) return 'Electronics';
  if(home.includes(term)) return 'Home';
  if(fashion.includes(term)) return 'Fashion';
  if(beauty.includes(term)) return 'Beauty';
  if(sports.includes(term)) return 'Sports';
  if(pets.includes(term)) return 'Pets';
  if(kids.includes(term)) return 'Kids';
  if(garden.includes(term)) return 'Garden';
  return 'General';
}

async function searchAliExpress(term, apiKey){
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com',
  };
  let allResults = [];
  for(let page = 1; page <= 2; page++){
    const url = 'https://aliexpress-datahub.p.rapidapi.com/item_search_2?q='+encodeURIComponent(term)+'&page='+page+'&sort=salesDesc';
    try{
      const res = await fetch(url, {headers});
      const data = await res.json();
      const list = data?.result?.resultList || [];
      if(!list.length) break;
      allResults = [...allResults, ...list];
    }catch(e){
      break;
    }
  }
  return allResults;
}

export async function onRequest(context){
  const {env} = context;

  if(!env.RAPIDAPI_KEY){
    return new Response(JSON.stringify({error:'Missing RAPIDAPI_KEY'}),{status:500});
  }
  if(!env.DB){
    return new Response(JSON.stringify({error:'Missing DB binding'}),{status:500});
  }

  try{
    // Get current run index
    const meta = await env.DB.prepare(
      'SELECT value FROM catalog_meta WHERE key = ?'
    ).bind('run_index').first();

    let runIndex = parseInt(meta?.value || '0');

    // Process BATCH_SIZE terms
    const terms = [];
    for(let i = 0; i < BATCH_SIZE; i++){
      terms.push(SEARCH_TERMS[(runIndex + i) % SEARCH_TERMS.length]);
    }

    // Update run index
    const newIndex = (runIndex + BATCH_SIZE) % SEARCH_TERMS.length;
    await env.DB.prepare(
      'INSERT OR REPLACE INTO catalog_meta (key, value) VALUES (?, ?)'
    ).bind('run_index', String(newIndex)).run();

    const summary = {};

    for(const term of terms){
      const results = await searchAliExpress(term, env.RAPIDAPI_KEY);
      if(!results.length){ summary[term]=0; continue; }

      let inserted = 0;
      for(let i = 0; i < results.length; i++){
        const entry = results[i];
        const item = entry.item || entry;
        const rawPrice = parseFloat(item.sku?.def?.promotionPrice || item.promotionPrice || item.price || 0);
        const price = markupPrice(rawPrice);
        if(price < 8 || rawPrice === 0) continue;

        const id = 'ae-'+item.itemId+'-'+term.replace(/\s/g,'-');
        const thumbnail = item.image?(item.image.startsWith('http')?item.image:'https:'+item.image):null;
        const aliUrl = item.itemUrl?(item.itemUrl.startsWith('http')?item.itemUrl:'https:'+item.itemUrl):null;

        try{
          await env.DB.prepare(`
            INSERT OR IGNORE INTO products (id, name, cat, icon, price, rating, reviews, hot, desc, thumbnail, stock, source_url, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            item.title||term,
            pickCat(term),
            pickEmoji(term),
            price,
            parseFloat(item.averageStarRate||4.5),
            parseInt(item.sales||0),
            i < 3 ? 1 : 0,
            'Shipped direct to your door.',
            thumbnail,
            Math.floor(Math.random()*40)+5,
            aliUrl,
            'aliexpress'
          ).run();
          inserted++;
        }catch(e){}
      }
      summary[term] = inserted;
    }

    return new Response(JSON.stringify({
      success:true,
      batch:terms,
      summary,
      nextIndex:newIndex,
    }),{headers:{'Content-Type':'application/json'}});

  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}