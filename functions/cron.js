export default {
  async scheduled(event, env, ctx){
    // Hit refresh 16 times to cover all 80 terms
    for(let i = 0; i < 16; i++){
      await fetch('https://harlow-site.pages.dev/api/refresh');
      // Small delay between calls
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}