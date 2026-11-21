// Controleert elke 10 seconden of er een nieuwe versie online staat en laadt die automatisch.
// Tijdens een gevecht wachten we tot je in het menu of eindscherm bent, zodat je niets kwijtraakt.
export function startUpdater(getState){
  const loaded=document.querySelector('meta[name="build"]')?.content||'';
  if(!loaded)return;
  let newer='',banner=null,applying=false;
  async function check(){
    try{
      const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;const j=await r.json();
      if(j&&typeof j.v==='string'&&j.v&&j.v!==loaded)newer=j.v;
    }catch{}
  }
  function showBanner(text){
    if(!banner){banner=document.createElement('div');banner.id='update-banner';banner.setAttribute('role','status');document.body.append(banner);}
    banner.textContent=text;
  }
  function apply(){
    if(!newer||applying||location.search.includes('u='+encodeURIComponent(newer)))return;
    const s=getState();
    if(s==='playing'){showBanner('Nieuwe versie klaar. Wordt geladen zodra je in het menu bent.');return;}
    applying=true;showBanner('Nieuwe versie gevonden, even laden…');
    setTimeout(()=>{location.replace(location.pathname+'?u='+encodeURIComponent(newer));},1200);
  }
  setInterval(async()=>{await check();apply();},10000);
  setInterval(apply,2000);
}
