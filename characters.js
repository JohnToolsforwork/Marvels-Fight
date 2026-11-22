import * as THREE from './vendor/three.module.js';

// Combat values are deliberately balanced for this fan game, not a canon ranking.
const hero = (id,name,role,power,special,hp,speed,damage,color,accent,projectile,description,quotes) => ({id,name,team:'heroes',role,power,special,hp,speed,damage,color,accent,projectile,description,quotes});
const villain = (...args) => ({...hero(...args),team:'villains'});
// Skins: andere kleuren, soms sterker en soms zwakker dan het standaardpak (hp/dmg = vermenigvuldiger).
export const SKINS = {
  doom:[{id:'doombot',name:'Doom-bot',color:'#6b7480',accent:'#9aa5b1',hp:.75,dmg:1.1,note:'Minder levens, iets meer schade'},{id:'goddoom',name:'God Doom',color:'#f1f1ee',accent:'#e6c157',hp:1.25,dmg:1.15,note:'Sterker dan de standaard Doom'}],
  spiderman:[{id:'ironspider',name:'Iron Spider',color:'#a8222f',accent:'#e0b24a',hp:1.15,dmg:1.05,note:'Gepantserd, iets sterker'},{id:'symbiote',name:'Zwart pak',color:'#16181d',accent:'#e8f1ff',hp:1.1,dmg:1.1,note:'Sterker, maar vraagt om aandacht'}],
  ironman:[{id:'silver',name:'Silver Centurion',color:'#c9d0d8',accent:'#c43a3a',hp:1.1,dmg:1,note:'Extra pantser'},{id:'stealth',name:'Stealth',color:'#26282e',accent:'#4fb6ff',hp:.9,dmg:1.12,note:'Minder pantser, meer schade'}],
  captain:[{id:'winter',name:'Winterpak',color:'#2d3a4f',accent:'#bcd1e6',hp:.95,dmg:1.1,note:'Iets meer schade'},{id:'classic',name:'Comic-klassiek',color:'#1f4d99',accent:'#d8262f',hp:1.05,dmg:1,note:'Het oude stripboekpak'}],
  thor:[{id:'comic',name:'Comic-Thor',color:'#b03038',accent:'#e0c060',hp:1.05,dmg:.97,note:'Stripboekuitvoering'}],
  hulk:[{id:'gray',name:'Grijze Hulk',color:'#8b8f95',accent:'#4a4d5a',hp:.9,dmg:1.15,note:'Minder levens, meer schade'},{id:'red',name:'Rode Hulk',color:'#b5352d',accent:'#5a2a3a',hp:.85,dmg:1.22,note:'Veel schade, minder levens'}],
  wolverine:[{id:'brown',name:'Bruin pak',color:'#8a5a2b',accent:'#d9a21b',hp:1,dmg:1,note:'Het stripboekpak'},{id:'xforce',name:'X-Force',color:'#1a1d22',accent:'#c53030',hp:.95,dmg:1.1,note:'Zwart pak, meer schade'}],
  venom:[{id:'carnage',name:'Carnage',color:'#b3202a',accent:'#2a0d12',hp:.9,dmg:1.18,note:'Veel schade, minder levens'}],
  deadpool:[{id:'comic',name:'Comic-Deadpool',color:'#8a1c24',accent:'#15171c',hp:1,dmg:1,note:'Donkerder pak'}],
};
export function skinDef(def,skinId){const s=(SKINS[def.id]||[]).find(k=>k.id===skinId);return s?{...def,color:s.color,accent:s.accent}:def;}

export const ROSTER = [
  hero('spiderman','Spider-Man','BEWEEGLIJK','Webschot','Webstorm',120,9.2,16,'#cf263d','#174a9d','#e9f5ff','Lenig, snel en altijd klaar met een web.', ['Hé! Zullen we de buurt een beetje veiliger maken?','Een plan? Ik dacht: eerst webslingeren, dan het plan.','Kijk uit voor die auto. Die staat er niet voor niets.']),
  hero('ironman','Iron Man','ENERGIE','Repulsor','Unibeam',150,7.7,21,'#b82b35','#e9b85d','#81e9ff','Gepantserde precisie met heldere repulsorstralen.', ['Pak en systemen: klaar voor actie.','Ik heb de stad gescand. Blijf bij het team.','Mooi pak, hè? Het kostte ook wel wat werk.']),
  hero('captain','Captain America','VERDEDIGING','Schildworp','Schildstorm',180,7.2,19,'#264e88','#e0e9e6','#86beff','Een stevige verdediger met een onverwoestbaar schild.', ['We doen dit samen. Iedereen telt mee.','Blijf in beweging en houd het team in de gaten.','Ik blijf hier tot iedereen veilig is.']),
  hero('thor','Thor','DONDER','Bliksem','Donderslag',185,7.1,25,'#415665','#d43739','#8bdfff','Mjölnir, bliksem en de kracht van Asgard.', ['De donder staat aan onze kant!','Een waardige tegenstander verdient een goed gevecht.','Asgard is meer dan een plek. Vergeet dat niet.']),
  hero('hulk','Hulk','KRACHT','Vuistslag','Grondbeving',250,6.2,29,'#5c9d4a','#644f87','#97ec75','Een grote, sterke verdediger met een verwoestende klap.', ['Hulk helpt team!','Hulk sterk. Jij ook helpen.',"Geen kleine auto's gooien. Hulk probeert."]),
  hero('widow','Black Widow','TACTIEK','Elektrische wapenstok','Schokgolf',125,8.7,18,'#24313f','#db594c','#70d7ff','Behendige spion met elektrische polsbanden.', ['Rustig blijven. Eerst kijken, dan handelen.','Ik dek je. Houd de andere kant in de gaten.','De beste aanval begint met een goed plan.']),
  hero('hawkeye','Hawkeye','PRECISIE','Pijl en boog','Pijlenregen',120,8.0,23,'#3b314f','#a98cc7','#c09aff','Een scherpschutter met zijn vertrouwde boog.', ['Ik zie een opening. Jij ook?','Zo lang ik zicht heb, zit je goed.','Eén goede pijl kan een hoop gedoe voorkomen.']),
  hero('strange','Doctor Strange','MAGIE','Magische schijf','Portaalpuls',135,7.4,23,'#234966','#b53232','#ffb34f','Een tovenaar met vurige runen en de Mantel der Levitatie.', ['Blijf dicht bij het portaal. De stad is onrustig.','Magie vereist focus. En soms een beetje geduld.','Ik heb een paar mogelijkheden bekeken. Deze is interessant.']),
  hero('panther','Black Panther','BEWEEGLIJK','Vibraniumklauw','Kinetische golf',160,9.0,20,'#17232d','#a294d5','#b18fff','Een snelle strijder met een vibraniumpak.', ['Wakanda staat naast je.','Bescherm de mensen, dan volgen wij vanzelf.','Kracht is pas nuttig als je weet waarvoor je vecht.']),
  hero('wanda','Scarlet Witch','CHAOSMAGIE','Hexbol','Chaosgolf',130,7.8,25,'#882c40','#ef5964','#ff4872','Scharlaken magie met een groot bereik.', ['Ik voel de energie van deze plek.','Blijf achter mij. Ik houd ze op afstand.','Een klein beetje focus kan heel veel veranderen.']),
  hero('captainmarvel','Captain Marvel','KOSMISCH','Fotonstoot','Fotonstorm',180,8.4,24,'#263e64','#c13c42','#ffd978','Een vliegende heldin met kosmische energie en krachtige fotonstoten.', ['Ik neem de lucht voor mijn rekening.','We beschermen deze stad samen.','Tijd om de energie een beetje op te voeren.']),
  hero('vision','Vision','SYNTHEZOÏDE','Voorhoofdstraal','Dichtheidsveld',160,7.8,23,'#408978','#e1c964','#ffe889','Een vliegende synthezoïde met een voorhoofdsstraal en dichtheidscontrole.', ['Ik heb de mogelijkheden berekend. We kunnen dit.','Rust en precisie zijn soms sterker dan haast.','Er is altijd een manier om iemand te helpen.']),
  hero('antman','Ant-Man','QUANTUM','Mierslag','Pym-wissel',135,8.8,18,'#9a3540','#b8c5ce','#ff7381','Word klein en snel, of groot en sterk. Q wisselt tussen beide vormen.', ['Een klein plan kan een groot verschil maken.','Maak je geen zorgen. Ik pas er vast tussendoor.','Zag je dat? Zelfs klein blijf ik in de strijd.']),
  hero('wolverine','Wolverine','KLAUWEN','Adamantiumklauw','Berserkherstel',185,8.3,25,'#dcae34','#244a78','#cbdde8','Een taaie vechter met zes metalen klauwen en sterk herstel.', ['Blijf bij het team. Ik neem de voorste linie.','Ik ben nog lang niet klaar.','Drie klauwen per hand. Dat is meestal genoeg.']),
  hero('deadpool','Deadpool','HERSTEL','Katanaslag','Herstelfactor',240,8.4,23,'#a93642','#20252b','#ec7880','Extra levenspunten en tijdelijk herstel. Deadpool kan nog steeds worden verslagen.', ['Plan A? Ik dacht dat jij het plan had.','Rood pak. Handig voor een opvallende entree.','Ook ik kan verliezen. Liefst niet deze ronde.']),
  villain('thanos','Thanos','TITAAN','Infinity Gauntlet','Kosmische golf',260,5.8,29,'#626092','#d8b76a','#b89aff','Een machtige titaan met een kosmische handschoen.', ['Deze strijd verdient mijn aandacht.','Zelfs de sterksten moeten hun moment kiezen.','Je hebt moed. Laten we zien wat je ermee doet.']),
  villain('loki','Loki','ILLUSIES','Dolkworp','Illusiepuls',130,8.6,21,'#1b5a48','#d6b662','#92e7ad','Sluwe magie en een herkenbare gouden hoornhelm.', ['Een eerlijk gevecht? Wat een merkwaardig idee.','Vertrouw je mij? Dat zou ik nog even overwegen.','Thor maakt altijd zo veel lawaai. Ik pak het slimmer aan.']),
  villain('ultron','Ultron','ROBOT','Plasmastraal','Overbelasting',200,7.0,23,'#82949c','#be3b48','#ff6572','Een metalen gevechtslichaam vol rode energie.', ['Omgeving geanalyseerd. Doel gevonden.','Aanpassing voltooid. De volgende zet is aan jou.','Jullie bewegen verrassend onvoorspelbaar.']),
  villain('goblin','Green Goblin','CHAOS','Pompoenbom','Bommenregen',140,8.8,22,'#4d8650','#6c437f','#c5ff65','Een groene schurk met glider en gloeiende pompoenbommen.', ['Hahaha! Wie houdt er van een verrassing?','Kijk omhoog. Het beste komt vaak van boven.','Een rustige dag? Niet zolang ik hier ben.']),
  villain('octopus','Doctor Octopus','CONTROLE','Tentakelslag','Tentakelstorm',185,6.8,24,'#5d6354','#b39c70','#f2c778','Vier beweegbare mechanische armen helpen hem vechten.', ['Vier extra handen. Dat scheelt heel wat werk.','Blijf uit de buurt van mijn experiment.','Ik had de berekening al gemaakt voordat jij begon.']),
  villain('venom','Venom','SYMBIOOT','Symbiootslag','Symbiootgolf',220,8.1,26,'#19222b','#eef4ec','#d9d5ff','Een grote symbioot met lange klauwen. Hier in het schurkenteam.', ['Wij zijn klaar voor deze strijd.','Wij blijven samen. Dat is onze kracht.','Een web? Wij hebben iets veel sterkers.']),
  villain('redskull','Red Skull','COMMANDO','Energieschot','Hydrapuls',150,7.0,22,'#263b39','#c63e3e','#87bdff','Een dreigende commandant met krachtige energiewapens.', ['Geen stap terug. Houd je positie.','Controle begint met een goed plan.','Deze stad is een interessant strijdtoneel.']),
  villain('hela','Hela','ASGARD','Nachtzwaard','Zwaardenstorm',195,7.4,26,'#193b34','#6fcb9c','#a3ffb1','Asgardse kracht, scherpe zwaarden en een hoge kroon.', ['Asgard herinnert zich mijn naam.','Een sterke verdediging. Ik zoek de zwakke plek.','Denk goed na voor je dichterbij komt.']),
  villain('killmonger','Killmonger','VIBRANIUM','Gouden klauw','Vibraniumgolf',165,9.0,21,'#292725','#d5a85b','#ffcc78','Een snelle tegenstander met gouden vibraniumdetails.', ['Snelheid en timing. Dat is alles wat ik nodig heb.','Kijk me aan. Ik ben er klaar voor.','Ik geef mijn plek niet zomaar op.']),
  villain('mysterio','Mysterio','ILLUSIES','Illusieringen','Mistgolf',135,7.9,22,'#33847c','#a77aad','#90ffe4','Een geheimzinnige figuur met een glazen helm en illusies.', ['Is wat je ziet ook werkelijk wat er is?','Een beetje mist maakt alles interessanter.','Let op het licht. Daar begint iedere illusie.']),
  villain('magneto','Magneto','MAGNETISME','Metaalscherf','Magnetische storm',165,7.5,24,'#9d3546','#684d91','#c3b8ff','Een meester van magnetisme met een rode helm en een paarse cape.', ['Metaal volgt mijn wil. Kijk goed om je heen.','Zelfs een kleine scherf kan het verschil maken.','De lucht geeft een uitstekend uitzicht op de strijd.']),
  villain('electro','Electro','ELEKTRICITEIT','Bliksemboog','Overlading',145,8.4,24,'#244b3c','#e4c752','#ffe47a','Een geladen tegenstander met groene kleding en felle elektrische vonken.', ['Voel je de spanning al?','Deze hele stad zit vol energie.','Ik heb nog genoeg stroom over.']),
  villain('abomination','Abomination','MONSTERKRACHT','Botvuist','Verplettering',270,5.9,30,'#7c8758','#545c43','#c5d693','Een massieve olijfgroene vechter met benige uitsteeksels.', ['Ik sta nog overeind. En ik blijf staan.','Die grond trilt niet vanzelf.','Groot, sterk en klaar voor de volgende ronde.']),
  villain('doom','Doctor Doom','TECHNOMAGIE','Pantserstraal','Doomveld',185,7.2,23,'#386249','#aebcc3','#85f1bb','Een gepantserde heerser met een groene kap, metalen masker en magische energie.', ['Doom heeft de volgende zet al voorbereid.','Techniek en magie vormen een uitstekende combinatie.','Een sterke verdediging vereist een sterkere wil.']),
  villain('sabretooth','Sabretooth','ROOFDIER','Klauwslag','Roofdiersprong',215,8.6,26,'#a58a58','#433a31','#e1c995','Een grote, snelle vechter met blonde manen, hoektanden en scherpe klauwen.', ['Ik ruik een uitdaging.','Die klauwen zijn niet alleen voor de show.','Blijf maar rennen. Ik houd het wel bij.'])
];

const materialCache = new Map();
// Zachte schaduwtextuur: donkerder aan de uiteinden van elk lichaamsdeel (gewrichten) en fijne stof-ruis, zodat alles meer volume krijgt.
let shadeTex=null;
function shadeTexture(){
  if(shadeTex)return shadeTex;
  const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');
  const grad=g.createLinearGradient(0,0,0,128);
  grad.addColorStop(0,'#b4b4b4');grad.addColorStop(.2,'#e6e6e6');grad.addColorStop(.5,'#ffffff');grad.addColorStop(.8,'#e6e6e6');grad.addColorStop(1,'#a8a8a8');
  g.fillStyle=grad;g.fillRect(0,0,64,128);
  const img=g.getImageData(0,0,64,128);for(let i=0;i<img.data.length;i+=4){const n=(Math.random()-.5)*14;img.data[i]=Math.max(0,Math.min(255,img.data[i]+n));img.data[i+1]=Math.max(0,Math.min(255,img.data[i+1]+n));img.data[i+2]=Math.max(0,Math.min(255,img.data[i+2]+n));}
  g.putImageData(img,0,0);
  shadeTex=new THREE.CanvasTexture(c);shadeTex.colorSpace=THREE.SRGBColorSpace;shadeTex.wrapS=THREE.RepeatWrapping;
  return shadeTex;
}
function mat(color, metalness=0.06, roughness=.67, emissive=null) {
  const key=[color,metalness,roughness,emissive].join('|');
  if(!materialCache.has(key)) materialCache.set(key,new THREE.MeshStandardMaterial({color,metalness,roughness,...(emissive?{emissiveIntensity:.85,emissive}:{map:shadeTexture()})}));
  return materialCache.get(key);
}
const geo={
  ball:new THREE.SphereGeometry(1,14,10),
  fineball:new THREE.SphereGeometry(1,20,14),
  box:new THREE.BoxGeometry(1,1,1),
  tube:new THREE.CylinderGeometry(1,1,1,10),
  cone:new THREE.ConeGeometry(1,1,10),
  disc:new THREE.CylinderGeometry(1,1,1,32),
  plane:new THREE.PlaneGeometry(1,1)
};
// Continuous ring-built surfaces give a chest, waist and jaw one coherent
// silhouette. There are deliberately no separate spherical pectoral meshes.
function profileGeometry(rings,segments=16,roundness=.72){
  const positions=[],uvs=[],indices=[];
  for(let j=0;j<rings.length;j++){
    const [y,w,d,front=0]=rings[j];
    for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a);
      positions.push(Math.sign(cs)*Math.pow(Math.abs(cs),roundness)*w,y,Math.sign(sn)*Math.pow(Math.abs(sn),roundness)*d+front);
      uvs.push(i/segments,j/(rings.length-1));
    }
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
    const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  // Close both ends without visible holes at the collar or belt.
  for(const j of [0,rings.length-1]){
    const index=positions.length/3;positions.push(0,rings[j][0],rings[j][3]||0);uvs.push(.5,.5);
    for(let i=0;i<segments;i++){const a=j*(segments+1)+i;j===0?indices.push(index,a,a+1):indices.push(index,a+1,a);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();g.type='SculptedProfileGeometry';return g;
}
const BODY_PROFILES={
  spider:[[1.17,.227,.168],[1.36,.225,.174],[1.59,.282,.198],[1.86,.340,.226],[2.02,.328,.198],[2.12,.230,.150]],
  athletic:[[1.17,.285,.19],[1.34,.29,.20],[1.59,.35,.24],[1.86,.425,.275],[2.02,.405,.23],[2.12,.27,.17]],
  agile:[[1.17,.265,.18],[1.36,.26,.19],[1.59,.31,.22],[1.86,.375,.255],[2.02,.36,.22],[2.12,.25,.16]],
  powerful:[[1.17,.32,.22],[1.36,.34,.23],[1.6,.41,.27],[1.87,.47,.29],[2.02,.45,.25],[2.13,.3,.18]],
  tailored:[[1.17,.33,.21],[1.38,.33,.23],[1.65,.37,.25],[1.88,.39,.255],[2.02,.37,.22],[2.12,.25,.16]],
  feminine:[[1.17,.277,.19],[1.35,.235,.17],[1.59,.285,.205],[1.84,.345,.235],[2.01,.33,.205],[2.12,.225,.145]]
};
const bodyGeometries=Object.fromEntries(Object.entries(BODY_PROFILES).map(([key,rings])=>[key,profileGeometry(rings)]));
geo.hips=profileGeometry([[1.04,.26,.195],[1.14,.30,.22],[1.25,.28,.19]],14);
geo.neck=new THREE.CylinderGeometry(.115,.13,.18,12);
geo.maleFace=profileGeometry([[-.31,.105,.11],[-.25,.205,.175],[-.11,.265,.23],[.08,.282,.25],[.235,.24,.208],[.315,.11,.11],[.328,.025,.025]],16,.92);
geo.femaleFace=profileGeometry([[-.3,.065,.08],[-.24,.17,.16],[-.1,.245,.225],[.085,.265,.245],[.23,.23,.21],[.305,.10,.10],[.32,.02,.02]],16,.96);
geo.titanFace=profileGeometry([[-.35,.18,.16],[-.28,.255,.215],[-.1,.292,.255],[.09,.302,.27],[.255,.27,.24],[.34,.16,.16],[.37,.035,.035]],16,.68);
geo.boot=profileGeometry([[-1,.72,.87,.12],[-.78,1,1,.10],[.1,.95,.96,.05],[.85,.65,.65,-.14],[1,.5,.50,-.2]],12,.62);
geo.gauntlet=profileGeometry([[-1,.85,.82],[.4,1,1],[1,.85,.85]],12,.8);
// Shared tapered limbs keep shoulders, elbows and knees connected without the
// alternating ball-like bulges of scaled spheres. Their original bounds stay.
geo.upperLimb=profileGeometry([[-1,.63,.64],[-.83,.83,.82],[-.35,1,1],[.3,.97,.96],[.8,.85,.84],[1,.65,.65]],10,.96);
geo.lowerLimb=profileGeometry([[-1,.62,.65],[-.78,.74,.78],[-.2,.92,.95],[.42,1,1],[.83,.88,.88],[1,.65,.65]],10,.96);
geo.nose=new THREE.BufferGeometry();geo.nose.setAttribute('position',new THREE.Float32BufferAttribute([-.025,.04,0,.025,.04,0,0,-.035,.052,-.025,-.048,.01,.025,-.048,.01],3));geo.nose.setIndex([0,2,1,0,3,2,1,2,4,3,4,2]);geo.nose.computeVertexNormals();
const capGeo=new THREE.SphereGeometry(1,14,9,0,Math.PI*2,0,Math.PI*.55);capGeo.type='SculptedHairGeometry';
const lensGeometries=[-1,1].map(side=>{const s=new THREE.Shape();s.moveTo(-.095*side,.035);s.bezierCurveTo(-.035*side,.072,.072*side,.065,.105*side,.048);s.bezierCurveTo(.09*side,-.025,.06*side,-.064,.015*side,-.062);s.bezierCurveTo(-.025*side,-.055,-.065*side,-.018,-.095*side,.035);return new THREE.ShapeGeometry(s,7);});
function mesh(g,m,parent,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function oval(p,m,x,y,z,sx,sy,sz){return mesh(geo.ball,m,p,x,y,z,sx,sy,sz);}
function box(p,m,x,y,z,sx,sy,sz){return mesh(geo.box,m,p,x,y,z,sx,sy,sz);}
function group(p,x=0,y=0,z=0){const o=new THREE.Group();o.position.set(x,y,z);p.add(o);return o;}
function tube(p,m,a,b,r=.025){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const o=mesh(geo.tube,m,p,...av.clone().add(bv).multiplyScalar(.5).toArray(),r,d.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function disc(p,m,x,y,z,r,depth=.025){const o=mesh(geo.disc,m,p,x,y,z,r,depth,r);o.rotation.x=Math.PI/2;return o;}
function curve(p,m,pts,r=.02){const c=new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(...v)));const o=new THREE.Mesh(new THREE.TubeGeometry(c,16,r,6,false),m);o.castShadow=true;p.add(o);return o;}
function panel(p,m,points,z=.28){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const o=new THREE.Mesh(new THREE.ShapeGeometry(shape),m);o.position.z=z;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function mergeStaticChildren(parent){
  const bins=new Map();for(const child of [...parent.children])if(child.isMesh&&!Array.isArray(child.material)){const key=child.material.uuid;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(child);}
  for(const parts of bins.values())if(parts.length>1){
    const ps=[],ns=[];for(const child of parts){child.updateMatrix();const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);ps.push(...g.attributes.position.array);ns.push(...g.attributes.normal.array);parent.remove(child);g.dispose();}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(ns,3));const o=new THREE.Mesh(g,parts[0].material);o.castShadow=true;o.receiveShadow=true;parent.add(o);
  }
}
const skin=mat('#d8a180',0,.84);const lightSkin=mat('#e1b494',0,.84);const white=mat('#e5eced',.05,.4);const black=mat('#151c23',.1,.6);const steel=mat('#aebfc6',.8,.25);const gold=mat('#d8b668',.8,.28);const red=mat('#b92f41');

const emblemCache=new Map();
function emblemTexture(id,color='#ffffff') {
  const key=id+color;
  if(emblemCache.has(key))return emblemCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.translate(128,128);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=12;
  if(id==='spider'){
    ctx.beginPath();ctx.ellipse(0,10,16,40,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,-34,13,0,Math.PI*2);ctx.fill();
    [-1,1].forEach(s=>[-1,0,1,2].forEach((n,i)=>{ctx.beginPath();ctx.moveTo(s*10,-20+i*16);ctx.lineTo(s*(45+i*5),-55+i*39);ctx.lineTo(s*(66+i*3),-92+i*59);ctx.stroke();}));
  }else if(id==='star'){
    ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?36:90;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
  }else if(id==='cosmicstar'){
    ctx.beginPath();for(let i=0;i<16;i++){const a=-Math.PI/2+i*Math.PI/8,r=i%2?28:i%4===0?96:66;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
  }else if(id==='widow'){
    ctx.beginPath();ctx.moveTo(-55,-75);ctx.lineTo(55,-75);ctx.lineTo(-55,75);ctx.lineTo(55,75);ctx.closePath();ctx.fill();
  }else if(id==='A'){
    ctx.font='bold 180px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('A',0,10);
  }else if(id==='panther'){
    ctx.lineWidth=7;for(let i=-3;i<=3;i++){let x=i*27,y=32-Math.abs(i)*13;ctx.beginPath();ctx.moveTo(x-8,y-30);ctx.lineTo(x,y+18);ctx.lineTo(x+8,y-30);ctx.fill();}
  }else if(id==='hex'){
    ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-70,35);ctx.lineTo(-33,-72);ctx.lineTo(0,-25);ctx.lineTo(33,-72);ctx.lineTo(70,35);ctx.stroke();
  }else{
    ctx.beginPath();ctx.arc(0,0,60,0,Math.PI*2);ctx.lineWidth=15;ctx.stroke();
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;emblemCache.set(key,t);return t;
}
function badge(p,id,color,x,y,z,w,h=w){const m=new THREE.MeshStandardMaterial({map:emblemTexture(id,color),transparent:true,depthWrite:false,roughness:.6,polygonOffset:true,polygonOffsetFactor:-1});const o=mesh(geo.plane,m,p,x,y,z,w,h,1);o.castShadow=false;return o;}
function cape(p,color,width=1.0,length=1.5){
  const g=new THREE.BufferGeometry(),verts=[],indices=[],columns=10,rows=7;
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
    const t=j/rows,u=i/columns*2-1,w=.66+(width-.66)*Math.pow(t,.65);
    const hem=(j===rows?.035*Math.cos(u*Math.PI*3):0),fold=Math.sin(i/columns*Math.PI*6)*(.018+.055*t);
    verts.push(u*w*.5,-length*t+hem,-.08*t-.17*t*t+fold);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);}
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({color,roughness:.86,side:THREE.DoubleSide});const o=new THREE.Mesh(g,m);o.name='Folded fabric cape';o.position.set(0,2.09,-.29);o.rotation.x=.11;o.castShadow=true;p.add(o);return o;
}
function horn(p,m,side,x,y,z,long=1){return curve(p,m,[[x,y,z],[x+side*.1,y+.27*long,z],[x+side*.26,y+.47*long,z-.03],[x+side*.24,y+.69*long,z+.02]],.045);}
function humanHair(head,color,style='short'){
  const h=mat(color,.015,.81),long=['long','bob','sleek'].includes(style);
  mesh(capGeo,h,head,0,.145,-.025,.289,.19,.262).name='Hair cap';
  const fringe=oval(head,h,-.075,.245,.145,.185,.062,.09);fringe.rotation.z=.16;
  if(long){
    const length=style==='bob'?.29:style==='sleek'?.37:.46;
    for(const side of [-1,1])curve(head,h,[[side*.24,.13,-.015],[side*.285,-.04,-.04],[side*.27,-length*.66,-.04],[side*(style==='sleek'?.22:.29),-length,-.12]],style==='sleek'?.045:.058);
    oval(head,h,0,-.1,-.18,.252,length*.72,.11);
  }else if(style==='quiff'){
    const tuft=oval(head,h,.025,.31,.06,.2,.09,.14);tuft.rotation.z=-.18;
  }else if(style==='temples'){
    for(const side of [-1,1])oval(head,mat('#b6b4b0'),side*.251,.035,-.005,.026,.12,.125);
  }
}
function makePistol(parent){
  const gun=group(parent);gun.name='Deadpool pistol';
  box(gun,mat('#4a535b',.7,.34),0,.024,.11,.105,.076,.28);
  box(gun,black,0,-.045,.075,.097,.085,.225);
  const grip=box(gun,black,0,-.135,-.012,.085,.18,.09);grip.rotation.x=-.18;
  const muzzle=mesh(geo.tube,black,gun,0,.024,.268,.024,.035,.024);muzzle.rotation.x=Math.PI/2;
  return gun;
}

export function createCharacter(idOrDef){
  const def=typeof idOrDef==='string'?ROSTER.find(d=>d.id===idOrDef):idOrDef;
  if(!def)throw new Error('Onbekend personage: '+idOrDef);
  const id=def.id,root=new THREE.Group(),body=group(root);root.name=def.name;
  const slenderSpider=id==='spiderman';
  const bareMassive=['hulk','abomination'].includes(id);
  const chunky=['hulk','thanos','venom','abomination','sabretooth'].includes(id);
  const feminine=['widow','wanda','hela','captainmarvel'].includes(id);
  const bodyProfile=slenderSpider?'spider':feminine?'feminine':chunky?'powerful':id==='octopus'?'tailored':['loki','hawkeye','strange'].includes(id)?'agile':'athletic';
  const hasFacialHair=['thor','strange','sabretooth'].includes(id);
  root.userData.bodyProfile=bodyProfile;root.userData.hasFacialHair=hasFacialHair;body.userData.bodyProfile=bodyProfile;
  const sx=id==='hulk'?1.35:id==='thanos'?1.24:id==='venom'?1.18:id==='abomination'?1.43:id==='wolverine'?1.04:id==='sabretooth'?1.15:1;
  const sy=id==='hulk'?1.22:id==='thanos'?1.19:id==='venom'?1.12:id==='abomination'?1.27:id==='wolverine'?.94:id==='sabretooth'?1.1:1;
  body.scale.set(sx,sy,sx);
  const armored=['ironman','ultron','panther','killmonger','antman','vision','doom'].includes(id);
  const suit=mat(id==='thanos'?'#29354d':def.color,armored?.62:bareMassive?0:.015,armored?.31:.85),accent=mat(def.accent,armored?.62:.12,.42);
  const exposed=['thor','hulk','widow','hawkeye','strange','wanda','thanos','loki','octopus','redskull','hela','captainmarvel','vision','magneto','electro','abomination','sabretooth'].includes(id)||id.startsWith('civilian');
  const face=bareMassive?suit:id==='thanos'?mat('#956eaa',0,.82):id==='redskull'?mat('#c34444',0,.86):id==='vision'?mat('#a74759',.38,.4):id==='electro'?mat('#9b6e50',0,.84):['wanda','hela','loki','captainmarvel'].includes(id)?lightSkin:skin;
  const darkGear=mat('#20272e',.12,.64);
  const bootMat=bareMassive?face:['captain','spiderman','captainmarvel'].includes(id)?red:id==='ironman'?suit:['ultron','doom'].includes(id)?steel:id==='vision'?gold:['goblin','mysterio','magneto','wolverine'].includes(id)?accent:darkGear;
  const gloveMat=['captain','spiderman','captainmarvel'].includes(id)?red:['widow','hawkeye','redskull','octopus','antman','deadpool'].includes(id)?darkGear:['magneto','wolverine'].includes(id)?accent:id==='doom'?steel:suit;
  const handMat=exposed && !['widow','hawkeye','redskull','octopus','captainmarvel','magneto'].includes(id)?face:gloveMat;
  const legMat=bareMassive||id==='spiderman'?accent:suit;
  const torso=mesh(bodyGeometries[bodyProfile],suit,body);torso.name='Unified sculpted ribcage';torso.userData.anatomy='continuous-torso';
  const hips=mesh(geo.hips,bareMassive?accent:suit,body);if(feminine)hips.scale.x=.94;if(slenderSpider)hips.scale.set(.85,1,.865);
  const beltMat=bareMassive?accent:['ironman','ultron','venom','spiderman','panther','killmonger'].includes(id)?suit:darkGear;
  const belt=box(body,beltMat,0,1.235,.02,slenderSpider?.47:feminine?.49:.57,.062,slenderSpider?.335:.39);belt.name='Waist belt';
  if(!['hulk','abomination','venom','spiderman','ironman','ultron'].includes(id))box(body,['loki','thanos','killmonger','mysterio','captainmarvel','vision','doom'].includes(id)?gold:steel,0,1.235,.222,.095,.073,.024);
  mesh(geo.neck,exposed?face:suit,body,0,2.17,0,(slenderSpider?.89:1)*1.12,1.05,(slenderSpider?.89:1)*1.12);
  oval(body,suit,0,1.3,0,(slenderSpider?.2:feminine?.2:chunky?.34:.27),.14,(slenderSpider?.15:chunky?.24:.19));
  oval(body,exposed?face:suit,0,2.12,0,(slenderSpider?.16:.19)*(chunky?1.3:1),.1,(slenderSpider?.15:.17)*(chunky?1.3:1));
  const chestZ=slenderSpider?.231:feminine?.242:bodyProfile==='agile'?.262:.284;
  const legs=[],arms=[],hands=[],fingers=[],knees=[];
  const K0=(slenderSpider?.86:feminine?.92:chunky?1.3:1);
  for(const side of [-1,1]){
    const leg=group(body,side*(slenderSpider?.157:feminine?.175:.19),1.22,0);legs.push(leg);
    oval(leg,legMat,0,.02,0,.168*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.15*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.168*(slenderSpider?.86:feminine?.92:chunky?1.3:1));
    mesh(geo.upperLimb,legMat,leg,0,-.275,0,slenderSpider?.138:feminine?.143:chunky?.185:.16,.325,slenderSpider?.144:feminine?.15:.17);
    const knee=group(leg,0,-.56,0);knees.push(knee);
    oval(knee,bareMassive?face:legMat,0,0,0,.128*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.128*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.13*(slenderSpider?.86:feminine?.92:chunky?1.3:1));
    mesh(geo.lowerLimb,bareMassive?face:legMat,knee,0,-.225,-.008,slenderSpider?.117:feminine?.117:chunky?.152:.133,.285,slenderSpider?.127:.137);
    oval(knee,bootMat,0,-.5,.02,.125*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.1*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.14*(slenderSpider?.86:feminine?.92:chunky?1.3:1));
    const foot=mesh(geo.boot,bootMat,knee,0,-.52,.06,slenderSpider?.14:feminine?.137:chunky?.18:.155,.14,slenderSpider?.23:chunky?.26:.235);foot.name='Shaped boot';
    if(!bareMassive){
      const sole=box(knee,darkGear,0,-.64,.079,slenderSpider?.26:feminine?.245:.285,.032,slenderSpider?.4:.42);sole.name='Boot sole';
      const shin=mesh(geo.gauntlet,bootMat,knee,0,-.32,.008,slenderSpider?.124:feminine?.122:.14,.18,slenderSpider?.132:.145);shin.name='Boot upper';
    }
    const shoulderX=(slenderSpider?.38:feminine?.385:bodyProfile==='agile'?.425:chunky?.505:.46)*.92;
    const arm=group(body,side*shoulderX,2.005,0);arms.push(arm);
    oval(body,suit,side*shoulderX*.74,2.0,0,.2*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.15*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.17*(slenderSpider?.86:feminine?.92:chunky?1.3:1));
    oval(arm,suit,0,-.055,0,slenderSpider?.131:feminine?.132:chunky?.185:.153,slenderSpider?.15:.165,slenderSpider?.129:feminine?.13:.155);
    mesh(geo.upperLimb,bareMassive?face:suit,arm,0,-.26,-.008,slenderSpider?.102:feminine?.108:chunky?.15:.12,.232,slenderSpider?.107:feminine?.105:.125);
    const elbow=group(arm,0,-.45,0);arm.userData.elbow=elbow;
    oval(elbow,bareMassive?face:suit,0,.005,.005,.1*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.1*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.1*(slenderSpider?.86:feminine?.92:chunky?1.3:1));
    mesh(geo.lowerLimb,bareMassive?face:suit,elbow,0,-.16,.01,slenderSpider?.093:feminine?.095:chunky?.13:.107,.205,slenderSpider?.097:feminine?.095:.11);
    mesh(geo.gauntlet,bareMassive?face:gloveMat,elbow,0,-.3,.015,slenderSpider?.099:feminine?.10:chunky?.133:.112,.075,slenderSpider?.102:.115);
    if(!['hulk','abomination','venom','ironman','ultron','doom','thanos','antman','vision','wanda','spiderman','deadpool'].includes(id)&&!id.startsWith('civilian'))mesh(geo.gauntlet,accent,elbow,0,-.31,.015,.106*K0,.045,.114*K0).name='Wrist band';
    const hand=group(elbow,0,-.41,.025);hands.push(hand);
    oval(elbow,bareMassive?face:gloveMat,0,-.385,.02,.088*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.075*(slenderSpider?.86:feminine?.92:chunky?1.3:1),.088*(slenderSpider?.86:feminine?.92:chunky?1.3:1));
    if(slenderSpider)hand.scale.set(.91,.95,.94);
    oval(hand,handMat,0,-.01,0,feminine?.085:chunky?.115:.096,.108,.056);
    // Four separate fingers plus an opposing thumb, each with a distal joint.
    for(let j=0;j<5;j++){
      const thumb=j===4;
      const finger=group(hand,thumb?side*-.093:(j-1.5)*.043,thumb?-.01:-.087,thumb?.008:.005);
      finger.rotation.z=thumb?-side*.78:0;
      const len=thumb?.066:[.073,.091,.086,.067][j];
      oval(finger,handMat,0,-len*.45,0,.019,len*.58,.021);
      const tip=group(finger,0,-len*.88,0);oval(tip,handMat,0,-.027,0,.0175,.036,.020);
      fingers.push({base:finger,tip,thumb,side,restZ:finger.rotation.z});
    }
  }
  const head=group(body,0,2.435,0);
  if(slenderSpider){head.position.y=2.4;head.scale.set(.87,.88,.87);}
  const headMat=['antman','doom'].includes(id)?steel:exposed?face:suit;
  const headGeometry=['thanos','abomination'].includes(id)?geo.titanFace:feminine?geo.femaleFace:geo.maleFace;
  const headMesh=mesh(headGeometry,headMat,head);headMesh.name='Sculpted face';
  const eyes=[],lids=[];
  const maskedFace=['spiderman','ironman','panther','killmonger','venom','ultron','goblin','antman','wolverine','doom','electro','deadpool','vision','mysterio'].includes(id);
  if(!maskedFace){
    const noseMat=headMat;
    oval(head,noseMat,0,-.03,.285,.036,.05,.044).name='Nose';
    const mouthMat=mat('#7a3b3b',0,.8);
    box(head,mouthMat,0,-.125,.262,.1,.011,.02).name='Mouth line';
    if(id==='thanos'){oval(head,headMat,0,-.215,.215,.13,.085,.1);box(head,mat('#6d4a82',0,.8),0,-.1,.275,.16,.008,.015);}
  }
  const lens=['spiderman','ironman','panther','killmonger','venom','ultron','goblin','antman','wolverine','doom','electro','deadpool'].includes(id);
  const eyeMat=mat(['ultron','antman'].includes(id)?'#ff4453':['goblin','electro'].includes(id)?'#fee381':'#edf5f6',.06,.23,lens?(['ultron','antman'].includes(id)?'#ff2233':id==='ironman'?'#7ce8ff':id==='doom'?'#5bcf91':id==='electro'?'#f3d568':null):null);
  for(const side of [-1,1]){
    const e=group(head,side*.108,.055,.222);eyes.push(e);
    const wide=id==='venom'?1.3:id==='spiderman'?1.1:1;
    if(lens&&['spiderman','venom','panther','killmonger','goblin','wolverine','deadpool'].includes(id)){
      const lensGeo=lensGeometries[side===-1?0:1];
      mesh(lensGeo,black,e,0,0,.012,wide*1.12,1.12,1);
      mesh(lensGeo,eyeMat,e,0,0,.018,wide,1,1);
    }else if(lens){
      const eye=box(e,eyeMat,0,0,.02,.15,id==='ultron'?.023:.027,.018);eye.rotation.z=side*.12;
    }else{
      oval(e,eyeMat,0,0,.012,.063,.035,.018);
      oval(e,mat(id==='sabretooth'?'#9b8545':['wanda','loki'].includes(id)?'#4b756e':'#334d69'),-side*.004,0,.029,.022,.027,.008);
      oval(e,black,-side*.004,0,.034,.010,.018,.004);
      oval(e,white,-side*.004+.009,.011,.039,.0065,.0065,.003);                              // lichtpuntje in het oog
      const lash=oval(e,mat(feminine?'#1d1417':'#2a211f'),0,.036,.026,.07,.011,.012);lash.rotation.z=side*.09;   // bovenste ooglid
      if(feminine){const l2=oval(e,mat('#1d1417'),side*.062,.03,.024,.018,.007,.008);l2.rotation.z=side*.5;}
      oval(head,mat(feminine?'#e8a9a6':'#dc9f94',0,.9),side*.15,-.06,.215,.036,.02,.012);  // wang
    }
    const lid=oval(head,headMat,side*.108,.055,.281,.095*wide,.048,.01);lid.visible=false;lids.push(lid);
    if(!lens){const eyebrow=oval(head,mat(id==='thanos'?'#654675':id==='sabretooth'?'#8b7449':id==='thor'?'#8f774d':['wanda','widow'].includes(id)?'#704233':'#403632'),side*.108,id==='thanos'?.133:.121,id==='thanos'?.247:.223,id==='thanos'?.082:.061,id==='thanos'?.019:.009,.009);eyebrow.rotation.z=-side*(id==='thanos'?.12:.06);}
  }
  let jaw=null;
  if(exposed || ['captain','wolverine'].includes(id)){
    const nose=mesh(geo.nose,face,head,0,-.018,.241);nose.name='Nose';
    const lipColor=id==='redskull'?'#79383f':id==='hulk'?'#3c693c':id==='abomination'?'#46553a':id==='thanos'?'#806882':id==='vision'?'#7d3242':feminine?'#b46b72':'#ac7168';
    jaw=oval(head,mat(lipColor,.015,.78),0,-.148,.242,.059,.0085,.006);jaw.name='Animated mouth';
    oval(head,face,-.274,-.005,-.005,.031,.073,.046);oval(head,face,.274,-.005,-.005,.031,.073,.046);
  }
  const accessories={};
  if(['thor','strange','wanda','widow','loki','hela','octopus','hawkeye'].includes(id))humanHair(head,({thor:'#bca06a',strange:'#373235',wanda:'#874c3b',widow:'#974833',loki:'#1a2024',hela:'#151b1d',octopus:'#64503c',hawkeye:'#5d4a38'})[id],({thor:'long',strange:'temples',wanda:'long',widow:'bob',loki:'sleek',hela:'long',octopus:'short',hawkeye:'quiff'})[id]);
  if(id.startsWith('civilian'))humanHair(head,def.hair||'#4a3a2a',def.hairStyle||'short');
  if(id==='hulk'){humanHair(head,'#263c2a','quiff');box(head,white,0,-.145,.251,.16,.024,.01);}
  if(id==='spiderman'){
    badge(body,'spider','#151d27',0,1.8,chestZ+.008,.37,.46);
    // The mask web is one textured shell, preserving performance with twenty actors.
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.strokeStyle='#3c1927';c.lineWidth=3;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(128,128);c.lineTo(128+170*Math.cos(a),128+170*Math.sin(a));c.stroke();}
    for(let r=35;r<170;r+=36){c.beginPath();c.arc(128,128,r,0,Math.PI*2);c.stroke();}
    const t=new THREE.CanvasTexture(canvas);const m=new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false});mesh(headGeometry,m,head,0,0,.002,1.009,1.009,1.009);
    for(const s of [-1,1])panel(body,accent,[[s*.229,1.28],[s*.305,1.58],[s*.319,1.79],[s*.242,1.68]],.168);
    arms.forEach(a=>{const seam=box(a,suit,0,-.3,.104,.046,.26,.012);seam.name='Suit web cuff';});
  }else if(id==='ironman'){
    panel(head,gold,[[-.19,.22],[.19,.22],[.22,.06],[.17,-.2],[.09,-.255],[-.09,-.255],[-.17,-.2],[-.22,.06]],.26);
    // Eyes sit just in front of the golden face plate.
    eyes.forEach(e=>e.position.z=.275);lids.forEach(l=>l.position.z=.31);
    box(head,suit,0,.245,.25,.10,.08,.035);
    panel(body,mat('#c6433b',.7,.29),[[-.35,1.98],[.35,1.98],[.3,1.78],[0,1.68],[-.3,1.78]],.287);
    disc(body,gold,0,1.87,.304,.111,.019);disc(body,mat('#c9faff',.25,.15,'#7bddff'),0,1.87,.319,.08,.022);
    hands.forEach(h=>disc(h,mat('#a7ecff',.2,.18,'#58bfff'),0,0,.07,.045,.015));
    legs.forEach(l=>oval(l,gold,0,-.25,.13,.11,.23,.055));
    for(const s of [-1,1])panel(body,black,[[s*.27,1.65],[s*.13,1.5],[s*.13,1.39],[s*.24,1.5]],.248);
  }else if(id==='captain'){
    const faceOpening=mesh(geo.femaleFace,skin,head,0,-.12,.12,.79,.42,.65);faceOpening.name='Uncovered lower face';
    if(jaw)jaw.position.z=.275;
    badge(head,'A','#e8eef1',0,.208,.236,.13,.13);badge(body,'star','#e5edf0',0,1.85,chestZ+.009,.31);
    for(let i=-2;i<=2;i++)box(body,i%2?white:red,i*.095,1.48,.247,.072,.22,.035);
    const shield=group(arms[0].userData.elbow,-.12,-.08,.17);shield.rotation.y=-.22;
    disc(shield,red,0,0,0,.46,.075);disc(shield,white,0,0,.045,.35);disc(shield,red,0,0,.064,.27);disc(shield,mat('#315b92'),0,0,.084,.19);badge(shield,'star','#edf2f1',0,0,.101,.29);accessories.shield=shield;
    for(const s of [-1,1])tube(body,mat('#6b5a49'),[s*.27,2.05,.16],[s*.2,1.46,.244],.018);
  }else if(id==='thor'){
    accessories.cape=cape(body,'#ab2c39',1.1,1.65);
    panel(body,mat('#4b6474',.6,.35),[[-.32,2.02],[.32,2.02],[.28,1.56],[0,1.43],[-.28,1.56]],.28);
    for(const x of [-.24,.24])for(const y of [1.61,1.97])disc(body,steel,x,y,.29,.09,.032);
    // Mjölnir hangs below the hand and outside the hip. Placing the head above
    // the grip hid it inside Thor's forearm in the original resting pose.
    const hammer=group(hands[1],.02,-.03,.05);hammer.name='Mjölnir';
    tube(hammer,mat('#815b3d'),[0,.055,0],[0,-.435,0],.039);
    for(const yy of [-.08,-.20,-.32]){const band=mesh(geo.tube,mat('#493529'),hammer,0,yy,0,.041,.018,.041);band.name='Leather grip band';}
    const hammerHead=box(hammer,mat('#adbfc9',.78,.3),0,-.49,0,.57,.29,.32);hammerHead.name='Mjölnir metal head';
    for(const side of [-1,1])box(hammer,mat('#d5e0e4',.8,.25),side*.278,-.49,0,.018,.24,.275);
    const loop=new THREE.Mesh(new THREE.TorusGeometry(.075,.012,5,18),mat('#6b4934'));loop.position.set(0,.115,0);loop.castShadow=true;hammer.add(loop);
    accessories.weapon=hammer;accessories.hammer=hammer;
    const beard=panel(head,mat('#94774d'),[[-.19,-.12],[-.14,-.205],[-.06,-.275],[.06,-.275],[.14,-.205],[.19,-.12],[.12,-.15],[0,-.18],[-.12,-.15]],.233);beard.name='Facial hair';beard.userData.facialHair=true;
    if(jaw)jaw.position.z=.255;
    tube(head,mat('#94774d'),[-.08,-.118,.251],[-.015,-.12,.257],.010);tube(head,mat('#94774d'),[.08,-.118,.251],[.015,-.12,.257],.010);
  }else if(id==='widow'){
    badge(body,'widow','#df4b4f',0,1.44,.197,.12,.16);tube(body,mat('#6d7b86'),[0,2.035,.168],[0,1.52,.222],.009);
    for(const s of [-1,1])panel(body,mat('#33424f'),[[s*.29,1.93],[s*.23,1.6],[s*.18,1.36],[s*.245,1.61]],.224);
    legs.forEach((l,i)=>{const holster=box(l,darkGear,(i?1:-1)*.115,-.16,.09,.10,.27,.09);holster.rotation.z=(i?1:-1)*.05;});
    arms.forEach(a=>box(a.userData.elbow,mat('#76dcf1',.4,.3,'#3d95d2'),0,-.29,.125,.13,.07,.025));
    const stick=group(hands[1],0,-.02,0);tube(stick,steel,[0,-.3,0],[0,.27,0],.025);accessories.weapon=stick;
  }else if(id==='hawkeye'){
    panel(body,accent,[[-.32,2.0],[-.07,1.71],[.16,1.98],[.22,1.98],[-.06,1.61],[-.36,1.98]],.271);
    const bow=group(hands[0],0,-.03,.04);curve(bow,accent,[[0,-.6,0],[-.2,-.32,.02],[-.25,0,.04],[-.2,.32,.02],[0,.6,0]],.028);accessories.weapon=bow;
    accessories.bowStrings=[tube(bow,white,[0,-.6,0],[0,0,0],.011),tube(bow,white,[0,0,0],[0,.6,0],.011)];
    const arrow=group(bow,0,0,.05);tube(arrow,steel,[0,0,-.34],[0,0,.42],.012);
    const arrowhead=mesh(geo.cone,steel,arrow,0,0,.47,.035,.12,.035);arrowhead.rotation.x=Math.PI/2;
    box(arrow,accent,0,0,-.26,.08,.012,.11);box(arrow,accent,0,0,-.26,.012,.08,.11);arrow.name='Nocked arrow';accessories.nockedArrow=arrow;
    const q=box(body,black,.14,1.84,-.28,.16,.66,.12);q.rotation.z=-.2;
    for(let i=0;i<3;i++)tube(body,steel,[.06+i*.07,2.09,-.28],[.06+i*.07,2.39,-.28],.013);
  }else if(id==='strange'){
    accessories.cape=cape(body,'#a9343b',1.15,1.65);
    box(body,accent,-.33,2.12,-.1,.12,.32,.23).rotation.z=-.4;box(body,accent,.33,2.12,-.1,.12,.32,.23).rotation.z=.4;
    tube(body,gold,[-.2,2.1,.22],[0,1.8,.34],.015);tube(body,gold,[.2,2.1,.22],[0,1.8,.34],.015);disc(body,gold,0,1.8,.35,.07);disc(body,mat('#5bcd80',.2,.25,'#3a8c5e'),0,1.8,.371,.035);
    const goatee=panel(head,mat('#423834'),[[-.057,-.18],[.057,-.18],[.043,-.255],[0,-.275],[-.043,-.255]],.221);goatee.name='Facial hair';goatee.userData.facialHair=true;
    tube(head,mat('#423834'),[-.065,-.117,.248],[-.01,-.123,.256],.008);tube(head,mat('#423834'),[.065,-.117,.248],[.01,-.123,.256],.008);
    panel(body,mat('#355a70'),[[-.28,2.0],[.1,1.4],[.22,1.4],[-.18,2.04]],.263);
    accessories.magic=hands.map(h=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.21,.014,6,24),mat('#ffbc65',.1,.3,'#ee792a'));r.position.set(0,-.02,.1);h.add(r);return r;});
  }else if(id==='panther'||id==='killmonger'){
    for(const s of [-1,1]){const ear=mesh(geo.cone,id==='killmonger'?gold:suit,head,s*.235,.31,-.01,.08,.18,.07);ear.rotation.z=-s*.14;}
    badge(body,'panther',id==='killmonger'?'#d6ad69':'#cbc5d7',0,1.97,.259,.58,.33);
    tube(head,accent,[-.22,.13,.22],[-.12,-.2,.25],.015);tube(head,accent,[.22,.13,.22],[.12,-.2,.25],.015);
    hands.forEach(h=>{for(let i=0;i<3;i++)box(h,id==='killmonger'?gold:steel,(i-1)*.045,-.23,.035,.012,.1,.015);});
    for(const s of [-1,1])panel(body,mat(id==='killmonger'?'#4c4132':'#293642',.4,.4),[[s*.31,1.88],[s*.13,1.68],[s*.21,1.42],[s*.25,1.65]],.274);
  }else if(id==='wanda'){
    badge(body,'hex','#ba5464',0,1.87,chestZ+.008,.29,.26);
    curve(head,accent,[[-.27,.12,.2],[-.22,.34,.18],[0,.2,.29],[.22,.34,.18],[.27,.12,.2]],.035);
    accessories.cape=cape(body,'#642339',.78,1.15);
    for(const s of [-1,1])panel(body,mat('#a73c50'),[[s*.30,1.91],[s*.12,1.57],[s*.17,1.31],[s*.22,1.55]],.226);
    accessories.magic=hands.map(h=>oval(h,mat('#ff6479',.05,.35,'#b22d57'),0,-.04,.14,.075,.075,.075));
    // Mooier: tiara, kraag, jaspanden, gouden armbanden, vollere golvende haren en een gloeiende riemgesp.
    {
      const ruby=mat('#ff3f63',.2,.25,'#d01c45'),leather=mat('#6f1a30',.12,.5),tiaraM=mat('#e2b35a',.8,.3);
      const coatMat=new THREE.MeshStandardMaterial({color:'#7b2038',roughness:.62,metalness:.06,side:THREE.DoubleSide});
      const tail=new THREE.MeshStandardMaterial({color:'#5a1628',roughness:.65,side:THREE.DoubleSide});
      curve(head,tiaraM,[[-.24,.2,.17],[-.13,.31,.225],[0,.28,.255],[.13,.31,.225],[.24,.2,.17]],.028);
      for(const [x,h2] of [[-.13,.11],[0,.16],[.13,.11]]){const sp=mesh(geo.cone,tiaraM,head,x,.31+h2*.4,.245,.032,h2,.032);sp.rotation.x=.22;}
      oval(head,ruby,0,.255,.268,.036,.04,.026);
      for(const s of [-1,1])panel(body,leather,[[s*.07,2.17],[s*.25,2.13],[s*.30,1.97],[s*.12,1.94]],.262);
      panel(body,coatMat,[[-.3,1.3],[.3,1.3],[.27,.66],[0,.5],[-.27,.66]],-.2);
      for(const s of [-1,1]){panel(body,tail,[[s*.34,1.3],[s*.16,1.3],[s*.2,.72],[s*.38,.8]],.2);}
      box(body,tiaraM,0,1.235,.232,.13,.085,.028);oval(body,ruby,0,1.235,.252,.03,.03,.012);
      for(const el of arms.map(a2=>a2.userData.elbow))mesh(geo.gauntlet,tiaraM,el,0,-.31,.015,.118,.05,.128);
      const hr=mat('#9c3b2e',.015,.8);
      for(const side of [-1,1]){
        curve(head,hr,[[side*.25,.1,.0],[side*.32,-.14,.03],[side*.31,-.4,.02],[side*.27,-.64,-.05]],.052);
        curve(head,hr,[[side*.27,.02,-.1],[side*.34,-.24,-.1],[side*.31,-.54,-.14],[side*.24,-.72,-.16]],.046);
      }
      oval(head,hr,0,-.32,-.2,.27,.46,.13);
    }
  }else if(id==='thanos'){
    // Bald purple crown, broad ridged chin, navy armour and large gold guards.
    panel(body,gold,[[-.43,2.035],[.43,2.035],[.33,1.82],[.14,1.73],[0,1.84],[-.14,1.73],[-.33,1.82]],.30);
    for(const side of [-1,1])panel(body,gold,[[side*.32,1.76],[side*.18,1.38],[side*.115,1.30],[side*.20,1.73]],.27);
    arms.forEach(a=>mesh(geo.gauntlet,gold,a,0,-.035,.015,.202,.105,.195));
    const forearm=mesh(geo.gauntlet,gold,arms[0].userData.elbow,0,-.22,.025,.155,.24,.15);forearm.name='Infinity Gauntlet forearm';
    hands[0].traverse(o=>{if(o.isMesh)o.material=gold;});
    const gauntlet=box(hands[0],gold,0,-.005,.055,.255,.26,.10);gauntlet.name='Infinity Gauntlet';
    const stones=['#a77eff','#61b6ff','#f14f5f','#ff9f42','#56d899','#f7ec62'];
    stones.forEach((c,i)=>{const gem=oval(hands[0],mat(c,.28,.2,c),(i%3-1)*.078,Math.floor(i/3)*.09-.04,.122,.033,.039,.022);gem.name='Infinity Stone '+(i+1);});
    for(let i=-2;i<=2;i++){const groove=box(head,mat('#674575'),i*.048,-.266,.233,.011,.101,.012);groove.name='Chin groove';}
  }else if(id==='loki'){
    accessories.cape=cape(body,'#184c3d',.92,1.6);
    box(head,gold,0,.2,.2,.49,.07,.09);horn(head,gold,-1,-.2,.19,0,1.1);horn(head,gold,1,.2,.19,0,1.1);
    panel(body,mat('#244f43'),[[-.26,2.04],[.04,1.43],[.17,1.35],[.06,1.76]],.265);
    tube(body,gold,[-.29,2.04,.19],[.1,1.4,.21],.019);
    const staff=group(hands[1],0,-.01,0);tube(staff,gold,[0,-.45,0],[0,.82,0],.028);oval(staff,mat('#6baef4',.3,.2,'#4c94df'),0,.88,0,.055,.09,.05);accessories.weapon=staff;
  }else if(id==='ultron'){
    panel(head,steel,[[-.19,.24],[.19,.24],[.235,.04],[.16,-.21],[.07,-.265],[-.07,-.265],[-.16,-.21],[-.235,.04]],.256);eyes.forEach(e=>e.position.z=.274);lids.forEach(l=>l.position.z=.31);
    box(head,black,0,-.18,.271,.14,.075,.015);box(head,mat('#ee5166',.3,.25,'#c8253c'),0,-.19,.286,.105,.01,.008);
    for(const x of [-.2,0,.2])box(body,steel,x,1.85,.28,.13,.34,.08);
    disc(body,mat('#ff5969',.4,.2,'#ca1d38'),0,1.69,.297,.065);
  }else if(id==='goblin'){
    const purple=mat('#704a8b');oval(head,purple,0,.25,-.06,.31,.2,.28);mesh(geo.cone,purple,head,.12,.45,-.02,.17,.35,.16).rotation.z=-.5;
    for(const s of [-1,1]){const ear=mesh(geo.cone,suit,head,s*.35,.04,-.01,.08,.22,.07);ear.rotation.z=-s*1.1;}
    box(head,white,0,-.16,.25,.21,.04,.016);
    const glider=group(body,0,.1,-.24);box(glider,steel,0,0,0,1.55,.06,.36);for(const s of [-1,1]){const wing=box(glider,accent,s*.67,.01,-.14,.65,.06,.32);wing.rotation.y=s*.35;}
    accessories.glider=glider;oval(hands[1],mat('#f7a548',.1,.5,'#bc6325'),0,-.05,.07,.1,.1,.1);
  }else if(id==='octopus'){
    // A coat and four jointed tentacles. Segments rotate gently while idle.
    accessories.cape=cape(body,'#615d43',.8,1.18);eyes.forEach(e=>e.scale.y=.7);
    for(const s of [-1,1])disc(head,black,s*.11,.055,.309,.071,.025);
    tube(head,steel,[-.04,.063,.316],[.04,.063,.316],.008);
    for(const s of [-1,1])panel(body,mat('#8d8268'),[[s*.27,2.06],[s*.08,1.67],[s*.21,1.39],[s*.32,1.98]],.267);
    accessories.tentacles=[];
    for(let i=0;i<4;i++){
      const side=i%2?1:-1,up=i<2;const tent=group(body,side*.25,up?1.9:1.4,-.26);
      const pts=[[0,0,0],[side*.4,up?.35:-.25,-.25],[side*.8,up?.45:-.3,-.06],[side*.98,up?.16:-.05,.38]];
      for(let j=0;j<3;j++){tube(tent,steel,pts[j],pts[j+1],.065);oval(tent,gold,...pts[j+1],.084,.084,.084);}
      const claw=group(tent,...pts[3]);for(const s of [-1,1])tube(claw,black,[s*.045,0,0],[s*.13,0,.17],.028);mergeStaticChildren(claw);mergeStaticChildren(tent);accessories.tentacles.push(tent);
    }
  }else if(id==='venom'){
    badge(body,'spider','#ecf0ec',0,1.77,chestZ+.012,.59,.68);
    oval(head,black,0,-.17,.17,.25,.13,.15);
    for(let i=0;i<8;i++){
      const tooth=mesh(geo.cone,white,head,(i-3.5)*.052,-.107+Math.abs(i-3.5)*.006,.292,.023,.077,.018);tooth.rotation.z=Math.PI;
    }
    curve(head,mat('#c35466'),[[.04,-.2,.29],[.12,-.28,.37],[.23,-.31,.38]],.025);
  }else if(id==='redskull'){
    oval(head,mat('#d04a47'),0,.17,-.03,.31,.2,.26);
    box(body,black,0,1.66,.29,.05,.81,.035);box(body,steel,0,1.23,.3,.12,.075,.025);
    const gun=group(hands[1],0,-.04,.05);box(gun,black,0,0,.12,.1,.12,.32);box(gun,mat('#81c2f2',.3,.2,'#4b91ca'),0,.02,.29,.055,.055,.06);accessories.weapon=gun;
  }else if(id==='hela'){
    accessories.cape=cape(body,'#183a32',1.12,1.75);
    for(const s of [-1,1])for(let i=0;i<3;i++)curve(head,mat('#243b34',.55,.35),[[s*.16,.21,.0],[s*(.35+i*.09),.39-i*.035,-.05],[s*(.45+i*.15),.55+i*.1,-.1],[s*(.3+i*.14),.69+i*.13,-.06]],.031);
    const blade=group(hands[1],0,-.07,0);tube(blade,black,[0,-.18,0],[0,.18,0],.035);const b=mesh(geo.cone,steel,blade,0,.58,0,.07,.9,.025);accessories.weapon=blade;
    for(const s of [-1,1])curve(body,mat('#608876',.35,.45),[[s*.28,2.02,.18],[s*.13,1.77,.241],[s*.18,1.42,.20]],.008);
  }else if(id==='mysterio'){
    accessories.cape=cape(body,'#6d477e',1.1,1.6);
    head.children.forEach(o=>o.visible=false);
    const globeMat=new THREE.MeshStandardMaterial({color:'#91d6d7',metalness:.35,roughness:.17,transparent:true,opacity:.74,emissive:'#326978',emissiveIntensity:.24});
    oval(head,globeMat,0,.035,0,.4,.43,.4);oval(head,mat('#658f9e',.2,.6),0,.02,0,.27,.27,.27);
    const reflection=oval(head,mat('#e2fbfb',.05,.2),-.14,.15,.325,.055,.125,.01);reflection.rotation.z=-.3;
    const collar=mesh(geo.disc,gold,body,0,2.08,0,.28,.1,.28);
    for(let i=-1;i<=1;i++)box(body,gold,i*.17,1.78,.282,.04,.55,.04);
    accessories.noBlink=true;
  }else if(id==='captainmarvel'){
    humanHair(head,'#c8a85e','quiff');
    panel(body,red,[[-.30,2.005],[.30,2.005],[.23,1.74],[0,1.63],[-.23,1.74]],.245);
    badge(body,'cosmicstar','#f5d177',0,1.86,.256,.31,.36);
    for(const side of [-1,1]){
      panel(body,gold,[[side*.30,1.95],[side*.12,1.77],[side*.085,1.73],[side*.28,1.91]],.253);
      mesh(geo.gauntlet,red,arms[side===-1?0:1],0,-.035,0,.142,.105,.145);
    }
    accessories.photonGlow=hands.map(h=>{const glow=oval(h,mat('#ffda7c',.18,.22,'#d39b2c'),0,-.03,.10,.075,.075,.075);glow.name='Photon energy';glow.visible=false;return glow;});
  }else if(id==='vision'){
    accessories.cape=cape(body,'#d8c361',1.04,1.7);
    panel(body,gold,[[0,2.035],[.19,1.78],[0,1.53],[-.19,1.78]],.286);
    panel(body,mat('#5eaaa0',.5,.38),[[0,1.96],[.11,1.78],[0,1.62],[-.11,1.78]],.291);
    for(const side of [-1,1])tube(head,mat('#659b8d',.4,.4),[side*.23,.19,.16],[side*.24,-.15,.15],.018);
    const socket=disc(head,gold,0,.205,.229,.057,.018);socket.name='Forehead stone socket';
    const gem=oval(head,mat('#ffe98e',.2,.2,'#d3b838'),0,.205,.249,.035,.048,.02);gem.name='Vision forehead gem';accessories.foreheadGem=gem;
  }else if(id==='antman'){
    panel(head,black,[[-.22,.13],[.22,.13],[.22,-.04],[-.22,-.04]],.267);
    eyes.forEach(e=>e.position.z=.279);lids.forEach(l=>l.position.z=.31);
    panel(head,red,[[-.048,.31],[.048,.31],[.064,.14],[-.064,.14]],.241);
    panel(head,steel,[[-.16,-.06],[.16,-.06],[.12,-.245],[-.12,-.245]],.258);
    for(const side of [-1,1]){disc(head,darkGear,side*.16,-.155,.263,.054,.024);disc(head,steel,side*.16,-.155,.28,.029,.012);}
    accessories.antennae=[];
    for(const side of [-1,1]){const antenna=group(head,side*.22,.15,-.015);tube(antenna,steel,[0,0,0],[side*.06,.39,-.04],.013);oval(antenna,accent,side*.06,.405,-.04,.027,.035,.027);antenna.name='Helmet antenna';accessories.antennae.push(antenna);}
    panel(body,darkGear,[[-.24,2.02],[.24,2.02],[.2,1.39],[-.2,1.39]],.29);
    for(const side of [-1,1])panel(body,red,[[side*.20,1.98],[side*.07,1.78],[side*.095,1.43],[side*.22,1.72]],.296);
    tube(body,steel,[-.26,1.98,.29],[0,1.7,.305],.012);tube(body,steel,[.26,1.98,.29],[0,1.7,.305],.012);
    disc(body,mat('#9ee7ff',.35,.2,'#538fc4'),0,1.235,.248,.034,.017);
  }else if(id==='wolverine'){
    const lowerFace=mesh(geo.femaleFace,skin,head,0,-.135,.115,.79,.44,.68);lowerFace.name='Uncovered lower face';if(jaw)jaw.position.z=.275;
    for(const side of [-1,1]){
      panel(head,black,[[side*.06,.04],[side*.12,.23],[side*.31,.43],[side*.255,.055],[side*.17,-.04]],.257);
      mesh(geo.gauntlet,accent,arms[side===-1?0:1],0,-.02,0,.18,.12,.175);
      for(let j=0;j<3;j++)panel(body,black,[[side*.39,1.97-j*.13],[side*.15,1.83-j*.13],[side*.37,1.9-j*.13]],.284);
    }
    accessories.claws=[];
    hands.forEach((h,handIndex)=>{for(let j=0;j<3;j++){const claw=mesh(geo.cone,steel,h,(j-1)*.052,-.31,.085,.018,.43,.032);claw.rotation.z=Math.PI;claw.name='Wolverine claw '+(handIndex*3+j+1);accessories.claws.push(claw);}});
  }else if(id==='magneto'){
    const helmet=mat('#a83b4e',.5,.35);
    mesh(capGeo,helmet,head,0,.145,-.035,.329,.223,.295).name='Magneto helmet crown';
    for(const side of [-1,1])box(head,helmet,side*.265,-.04,.125,.07,.36,.15);
    panel(head,helmet,[[-.29,.205],[0,.278],[.29,.205],[.275,.125],[.20,.16],[0,.205],[-.20,.16],[-.275,.125]],.25);
    curve(head,accent,[[-.26,-.19,.21],[-.26,.13,.24],[0,.24,.25],[.26,.13,.24],[.26,-.19,.21]],.018);
    accessories.cape=cape(body,'#65417e',1.14,1.7);
    panel(body,accent,[[-.30,2.035],[.30,2.035],[.21,1.88],[-.21,1.88]],.285);
    accessories.metalShards=[];
    for(let i=0;i<4;i++){const shard=box(body,steel,0,1.6,0,.055,.2,.045);shard.name='Orbiting metal shard';shard.visible=false;accessories.metalShards.push(shard);}
  }else if(id==='electro'){
    panel(body,mat('#151f21'),[[-.32,1.99],[.32,1.99],[.23,1.35],[-.23,1.35]],.285);
    const charge=mat('#f2d764',.12,.3,'#bda23a');
    panel(body,charge,[[.025,2.04],[-.13,1.73],[-.01,1.73],[-.08,1.4],[.145,1.8],[.03,1.8]],.292);
    accessories.electricSpikes=[];
    for(let i=0;i<5;i++){const angle=Math.PI/2+i*Math.PI*2/5,dir=new THREE.Vector3(Math.cos(angle),Math.sin(angle),0);const spike=mesh(geo.cone,charge,head,dir.x*.35,dir.y*.35+.035,.15,.03,.24,.022);spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);spike.name='Electric face spark';accessories.electricSpikes.push(spike);}
    for(const side of [-1,1])curve(arms[side===-1?0:1],charge,[[0,-.12,.15],[side*.05,-.24,.13],[-side*.03,-.34,.12],[side*.04,-.43,.10]],.009);
    accessories.electricGlow=hands.map(h=>{const glow=oval(h,charge,0,-.02,.1,.065,.065,.065);glow.visible=false;return glow;});
  }else if(id==='abomination'){
    const bone=mat('#c5c5a0',.04,.85);accessories.bones=[];
    for(const side of [-1,1]){
      const ear=mesh(geo.cone,suit,head,side*.34,.035,-.015,.065,.23,.065);ear.rotation.z=-side*1.2;
      for(let j=0;j<2;j++){const spike=mesh(geo.cone,bone,arms[side===-1?0:1],side*(.10+j*.07),.025-j*.10,-.02,.064,.25-j*.04,.065);spike.rotation.z=-side*.55;accessories.bones.push(spike);}
      const h=hands[side===-1?0:1];for(let j=0;j<3;j++){const knuckle=oval(h,bone,(j-1)*.06,-.075,.065,.036,.052,.038);knuckle.name='Bone knuckle';accessories.bones.push(knuckle);}
      tube(head,bone,[side*.06,.15,.265],[side*.22,.16,.22],.025);
    }
    for(let j=0;j<3;j++){const ridge=mesh(geo.cone,bone,body,0,1.57+j*.19,-.29,.06,.19,.06);ridge.rotation.x=-Math.PI/2;accessories.bones.push(ridge);}
    box(head,white,0,-.155,.262,.22,.035,.018);
  }else if(id==='doom'){
    const hood=mat('#315c41',.015,.92);accessories.hood=group(head);
    mesh(capGeo,hood,accessories.hood,0,.12,-.055,.37,.30,.33).name='Green hood crown';
    oval(accessories.hood,hood,0,-.075,-.24,.31,.33,.13);
    curve(accessories.hood,hood,[[-.29,-.28,.12],[-.335,.08,.16],[-.25,.29,.18],[0,.40,.09],[.25,.29,.18],[.335,.08,.16],[.29,-.28,.12]],.051);
    panel(head,steel,[[-.20,.22],[.20,.22],[.23,.05],[.16,-.245],[-.16,-.245],[-.23,.05]],.264);
    eyes.forEach(e=>e.position.z=.279);lids.forEach(l=>l.position.z=.312);
    box(head,darkGear,0,-.18,.274,.155,.07,.012);for(let i=-2;i<=2;i++)box(head,steel,i*.029,-.18,.285,.012,.059,.01);
    panel(head,mat('#d0dadf',.8,.27),[[-.024,.105],[.024,.105],[.04,-.09],[-.04,-.09]],.29);
    accessories.cape=cape(body,'#284e39',1.21,1.8);
    for(const side of [-1,1])disc(body,gold,side*.245,2.02,.22,.075,.025);
    curve(body,gold,[[-.245,2.02,.24],[0,1.89,.29],[.245,2.02,.24]],.012);
    arms.forEach(arm=>mesh(geo.gauntlet,steel,arm.userData.elbow,0,-.19,.016,.13,.21,.132));
    accessories.doomGlow=hands.map(h=>{const orb=oval(h,mat('#a6efb7',.2,.25,'#479b64'),0,-.02,.1,.065,.065,.065);orb.visible=false;return orb;});
  }else if(id==='deadpool'){
    for(const side of [-1,1]){
      panel(head,black,[[side*.045,.12],[side*.15,.225],[side*.25,.15],[side*.245,-.12],[side*.145,-.17],[side*.055,-.01]],.255);
      panel(body,accent,[[side*.39,2.01],[side*.26,1.8],[side*.21,1.35],[side*.30,1.48]],.279);
    }
    eyes.forEach(e=>e.position.z=.26);
    const strap=box(body,darkGear,0,1.72,.29,.065,.85,.018);strap.rotation.z=-.47;
    box(body,steel,-.07,1.84,.307,.075,.085,.022).rotation.z=-.47;
    accessories.crossedScabbards=[];
    for(const side of [-1,1]){
      const sheath=group(body,side*.015,1.68,-.31);sheath.rotation.z=side*.55;
      const casing=box(sheath,darkGear,0,0,0,.075,1.24,.085);casing.name='Back katana scabbard';
      box(sheath,steel,0,.6,0,.10,.045,.105);
      // One blade is drawn; the other remains in its crossed back scabbard.
      if(side===-1){tube(sheath,darkGear,[0,.63,0],[0,.92,0],.03);box(sheath,steel,0,.65,0,.15,.025,.065);}
      accessories.crossedScabbards.push(sheath);
    }
    const katana=group(hands[1],.015,-.025,.05);katana.name='Deadpool katana';
    tube(katana,darkGear,[0,.07,0],[0,-.13,0],.032);
    for(const y of [.015,-.065])mesh(geo.tube,red,katana,0,y,0,.035,.022,.035);
    box(katana,steel,0,-.14,0,.17,.026,.073);
    const blade=box(katana,steel,0,-.56,0,.047,.79,.024);blade.name='Visible katana blade';
    const tip=mesh(geo.cone,steel,katana,0,-.99,0,.024,.16,.013);tip.rotation.z=Math.PI;
    box(katana,white,.019,-.56,.014,.008,.78,.006);
    accessories.katana=katana;accessories.weapon=katana;
    const pouchMat=mat('#6a5142',.03,.86);
    for(const x of [-.25,-.14,.14,.25])box(body,pouchMat,x,1.23,.218,.095,.13,.07);
    disc(body,red,0,1.235,.264,.071,.024);disc(body,black,0,1.235,.28,.054,.012);
    for(const side of [-1,1])box(body,white,side*.022,1.24,.29,.025,.025,.007).rotation.z=side*.22;
    accessories.holsteredPistols=[];
    for(const side of [-1,1]){
      box(body,pouchMat,side*.325,1.105,.055,.14,.25,.14);
      const gun=makePistol(body);gun.position.set(side*.325,1.245,.055);gun.rotation.x=Math.PI/2;accessories.holsteredPistols.push(gun);
    }
    const pistol=makePistol(hands[1]);pistol.position.set(.01,-.025,.06);pistol.visible=false;accessories.pistol=pistol;
    const flash=mesh(geo.cone,new THREE.MeshBasicMaterial({color:'#ffd277',transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending}),pistol,0,.024,.35,.052,.14,.052);
    flash.rotation.x=Math.PI/2;flash.castShadow=false;flash.visible=false;accessories.muzzleFlash=flash;
  }else if(id==='sabretooth'){
    head.scale.x=1.08;
    const mane=mat('#b69c68',.015,.88);humanHair(head,'#b69c68','long');
    for(const side of [-1,1]){
      for(let j=0;j<2;j++){const tuft=mesh(geo.cone,mane,head,side*(.29+j*.055),-.11-j*.18,-.085,.09,.29,.08);tuft.rotation.z=Math.PI-side*.38;tuft.name='Blond mane tuft';}
      const sideburn=oval(head,mane,side*.19,-.165,.15,.065,.12,.055);sideburn.name='Blond sideburn';sideburn.userData.facialHair=true;
      const fang=mesh(geo.cone,white,head,side*.072,-.178,.262,.017,.091,.016);fang.rotation.z=Math.PI;fang.name='Sabretooth fang';
      panel(body,accent,[[side*.43,2.035],[side*.16,1.68],[side*.12,1.47],[side*.31,1.83]],.295);
    }
    const backTuft=mesh(geo.cone,mane,head,0,-.28,-.27,.13,.38,.09);backTuft.rotation.z=Math.PI;
    if(jaw){jaw.scale.x=.091;jaw.material=mat('#71443b');}
    accessories.claws=[];
    fingers.forEach((finger,i)=>{const claw=mesh(geo.cone,mat('#d5c8a5',.16,.43),finger.tip,0,-.063,.014,.012,.09,.015);claw.rotation.z=Math.PI;claw.name='Sabretooth claw '+(i+1);accessories.claws.push(claw);});
  }
  // Exposed fingers have their own small joint groups, so animation never scales
  // the model into a mitten. All draw geometry and palettes are reused.
  if(['ironman','ultron','captainmarvel','doom'].includes(id)){
    const flameColor=id==='ultron'?'#ff6473':id==='captainmarvel'?'#ffd675':id==='doom'?'#89e8a8':'#68dfff';
    const outer=new THREE.MeshBasicMaterial({color:flameColor,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending});
    const core=new THREE.MeshBasicMaterial({color:'#eaffff',transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});
    accessories.thrusters=knees.map(k=>{const jet=group(k,0,-.67,.035);jet.name='Boot thruster';const plume=mesh(geo.cone,outer,jet,0,-.23,0,.13,.53,.13);const center=mesh(geo.cone,core,jet,0,-.14,0,.06,.33,.06);plume.castShadow=center.castShadow=false;jet.visible=false;return jet;});
  }
  if(['strange','wanda','mysterio','vision','magneto','electro'].includes(id)){
    const color=id==='strange'?'#ffb25b':id==='wanda'?'#e9557e':id==='vision'?'#f0d881':id==='magneto'?'#bc9df0':id==='electro'?'#ffe089':'#79e6c4';
    const aura=new THREE.Mesh(new THREE.TorusGeometry(.55,.021,5,26),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending}));
    aura.rotation.x=-Math.PI/2;aura.position.y=.08;aura.visible=false;aura.name='Flight aura';body.add(aura);accessories.flightAura=aura;
  }
  if(id==='goblin'&&accessories.glider){
    const jet=mesh(geo.cone,new THREE.MeshBasicMaterial({color:'#a5ed91',transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false}),accessories.glider,0,-.18,-.12,.11,.37,.11);jet.visible=false;jet.castShadow=false;accessories.gliderJet=jet;
  }
  accessories.magic?.forEach(m=>{m.userData.baseScale=m.scale.clone();});
  for(const key of ['photonGlow','electricGlow','doomGlow'])accessories[key]?.forEach(m=>{m.userData.baseScale=m.scale.clone();});
  if(accessories.foreheadGem)accessories.foreheadGem.userData.baseScale=accessories.foreheadGem.scale.clone();
  // Extra details per personage
  if(id==='hulk'){
    const dk=mat('#3b7733',0,.9);
    for(const y of [1.46,1.64,1.82])for(const sd of [-1,1])oval(body,dk,sd*.12,y,.31,.105,.068,.034);
    box(body,dk,0,1.64,.325,.014,.5,.014);
    oval(head,mat('#38752f',0,.9),0,.17,.235,.25,.045,.06);
    for(const lg of legs)for(let k=0;k<7;k++){const ang=k/7*Math.PI*2;const sp=mesh(geo.cone,mat('#5a4388',0,.85),lg,Math.cos(ang)*.27,-.52,Math.sin(ang)*.25,.07,.13,.07);sp.rotation.x=Math.PI;}
  }
  if(id==='panther'){
    const sv=mat('#b9c2d3',.8,.3);
    for(const sd of [-1,1]){curve(body,sv,[[sd*.1,2.02,.3],[sd*.2,1.7,.3],[sd*.16,1.4,.29]],.012);curve(body,sv,[[sd*.28,2.0,.27],[sd*.34,1.76,.26]],.01);}
    for(const el of arms.map(a2=>a2.userData.elbow)){curve(el,sv,[[0,-.05,.11],[0,-.2,.12],[0,-.34,.115]],.012);}
  }
  if(id==='spiderman'){
    const wb=mat('#5c1520',0,.8);
    for(let k=0;k<7;k++){const ang=-Math.PI*.9+k*(Math.PI*1.8/6);curve(head,wb,[[0,.03,.26],[Math.sin(ang)*.12,.03+Math.cos(ang)*.12,.27],[Math.sin(ang)*.24,.03+Math.cos(ang)*.24,.22]],.0055);}
    for(const rr of [.1,.18])curve(head,wb,[[-rr*1.2,.03,.255],[-rr*.6,.03+rr*.9,.265],[rr*.6,.03+rr*.9,.265],[rr*1.2,.03,.255]],.005);
  }
  // ---- Extra verfraaiing voor iedereen: spiergroepen, banden, kniebeschermers en per personage een eigen detail.
  if(!bareMassive&&!id.startsWith('civilian')){
    const tint=(hex,f)=>{const c=new THREE.Color(hex);if(f>0)c.lerp(new THREE.Color('#ffffff'),f);else c.lerp(new THREE.Color('#000000'),-f);return '#'+c.getHexString();};
    const hi=mat(tint(def.color,.07),armored?.5:.02,armored?.34:.8),lo=mat(tint(def.color,-.25),armored?.5:.02,armored?.34:.8);
    const cz=chestZ-.012,sc=slenderSpider?.82:feminine?.9:chunky?1.25:1;
    if(!['ironman','ultron','doom','vision','antman'].includes(id)){
      for(const sd of [-1,1]){oval(body,hi,sd*.125*sc,1.8,cz-.004,.13*sc,.085,.02);oval(body,lo,sd*.1*sc,1.62,cz-.012,.085*sc,.03,.014);}
      box(body,lo,0,1.66,cz-.018,.012,.36,.012);
    }
    for(const a of arms)mesh(geo.gauntlet,accent,a,0,-.34,0,.128*K0,.034,.133*K0).name='Arm band';
    for(const k of knees){oval(k,accent,0,.0,.115*K0,.085*K0,.085*K0,.05);mesh(geo.gauntlet,accent,k,0,-.43,.01,.138*K0,.03,.15*K0).name='Boot cuff';}
    if(['widow','hawkeye','deadpool','wolverine','redskull','killmonger','captain'].includes(id))for(const lg of legs)mesh(geo.gauntlet,darkGear,lg,0,-.3,0,.172*K0,.05,.182*K0).name='Thigh strap';
    // ---- per personage
    const zz=cz+.012,yel=mat('#ffe56a',0,.4,'#ffcc33');
    if(id==='thor'){for(const a of arms)mesh(geo.gauntlet,steel,a,0,-.38,0,.135,.06,.14);}
    if(id==='captain'){for(let k=0;k<5;k++)box(body,k%2?white:red,0,1.4+k*.055,cz-.03,.38,.028,.012);}
    if(id==='strange'){oval(body,gold,0,1.96,zz,.065,.065,.02);oval(body,mat('#6ff0a8',0,.3,'#3be08a'),0,1.96,zz+.012,.032,.032,.012);}
    if(id==='venom'){badge(body,'spider','#f2f2f2',0,1.74,chestZ+.04,.46,.56);}
    if(id==='killmonger')for(let r=0;r<2;r++)for(let k=0;k<6;k++)oval(body,gold,(k-2.5)*.075,1.72-r*.09,zz,.02,.02,.012);
    if(id==='electro')curve(body,yel,[[-.2,1.98,zz],[-.04,1.82,zz+.01],[-.15,1.7,zz+.01],[.06,1.56,zz+.01],[-.02,1.44,zz+.01]],.012);
    if(['thanos','magneto','hela','doom','loki'].includes(id))for(const sd of [-1,1]){oval(body,id==='thanos'||id==='doom'||id==='loki'?gold:accent,sd*.5,2.08,0,.17,.1,.17);}
    if(id==='sabretooth')for(let k=0;k<10;k++){const ang=k/10*Math.PI*2,fur=mesh(geo.cone,mat('#8a6a3a',0,.95),body,Math.cos(ang)*.26,2.13,Math.sin(ang)*.2,.09,.22,.09);fur.rotation.z=-Math.cos(ang)*.7;fur.rotation.x=Math.sin(ang)*.7;}
    if(id==='abomination')for(const a of arms)for(let k=0;k<3;k++){const sp=mesh(geo.cone,mat('#5c6b45',0,.9),a.userData.elbow,0,-.1-k*.1,-.1,.05,.14,.05);sp.rotation.x=-Math.PI/2.6;}
    if(id==='captainmarvel'){curve(body,gold,[[-.3,1.95,zz],[0,1.75,zz+.02],[.3,1.95,zz]],.02);}
    if(id==='goblin')for(const sd of [-1,1])oval(body,mat('#1d4d2c',0,.8),sd*.27,2.0,0,.17,.1,.15);
  }
  const INK=inkMaterial();
  const inkGeos=new Set([...Object.values(bodyGeometries),geo.hips,geo.upperLimb,geo.lowerLimb,geo.boot,geo.maleFace,geo.femaleFace,geo.titanFace,geo.gauntlet,geo.neck].filter(Boolean));
  const inkTargets=[];root.traverse(o=>{if(o.isMesh&&inkGeos.has(o.geometry)&&!o.userData.ink)inkTargets.push(o);});
  for(const o of inkTargets){const ink=new THREE.Mesh(o.geometry,INK);ink.scale.setScalar(1.045);ink.userData.ink=true;ink.castShadow=false;ink.receiveShadow=false;o.add(ink);}
  const rig={group:root,body,head,eyes,lids,arms,legs,knees,hands,fingers,accessories,def,height:(slenderSpider?2.72:2.82)*sy,jaw,bodyProfile,hasFacialHair,agilePosture:slenderSpider,phase:ROSTER.indexOf(def)*1.37,walk:0,high:true};
  rig.motion={move:0,flight:0,talk:0,speed:0,mouth:.0085};
  const poseNodes=[body,head,...arms,...arms.map(a=>a.userData.elbow),...hands,...legs,...knees,...fingers.flatMap(f=>[f.base,f.tip]),...(accessories.cape?[accessories.cape]:[])];
  rig.poseBlend=poseNodes.map(node=>({node,position:node.position.clone(),quaternion:node.quaternion.clone()}));
  root.userData.rig=rig;return rig;
}

let inkMat=null;function inkMaterial(){return inkMat??=new THREE.MeshBasicMaterial({color:'#0a0e16',side:THREE.BackSide});}
export function setQuality(rig,high){rig.high=!!high;rig.group.traverse(o=>{if(o.isMesh){if(o.userData.ink)o.visible=!!high;else o.castShadow=!!high;}});}

export function updateCharacter(rig,dt,opts={}){
  const t=opts.time??performance.now()/1000;
  const moving=!!opts.moving,flight=!!opts.flying;
  const attack=opts.attacking===true?1:Math.max(0,Math.min(1,Number(opts.attacking)||0));
  const rangedAttack=Math.max(0,Math.min(1,Number(opts.rangedAttack)||0));
  const talking=!!opts.talking,dead=!!opts.dead;
  const step=Math.max(0,Math.min(dt,.08)),motion=rig.motion,ease=1-Math.exp(-step*11);
  motion.move+=((moving?1:0)-motion.move)*ease;motion.flight+=((flight?1:0)-motion.flight)*(1-Math.exp(-step*9));
  motion.talk+=((talking?1:0)-motion.talk)*(1-Math.exp(-step*14));motion.speed+=((moving?(Number(opts.speed)||4):0)-motion.speed)*ease;
  const walkWeight=motion.move*(1-motion.flight),rate=1.6+Math.min(11.4,motion.speed*1.2);
  rig.walk+=step*rate;
  const stride=Math.sin(rig.walk)*.46*walkWeight+Math.sin(t*1.4+rig.phase)*.009*(1-walkWeight);
  rig.body.position.y=dead?-.1:motion.flight*(.2+Math.sin(t*2)*.055)+Math.abs(Math.sin(rig.walk))*.04*walkWeight+Math.sin(t*1.8+rig.phase)*.008*(1-motion.move);
  rig.body.rotation.x=dead?-1.45:.045*walkWeight+(rig.agilePosture?.025:0)*(1-walkWeight);
  rig.body.rotation.y=0;
  rig.body.rotation.z=dead?0:Math.sin(t*1.1+rig.phase)*.006+Math.sin(rig.walk)*.014*walkWeight;
  rig.legs[0].rotation.x=stride-(rig.agilePosture?.02:0)*(1-walkWeight);rig.legs[1].rotation.x=-stride-(rig.agilePosture?.02:0)*(1-walkWeight);
  rig.knees.forEach((k,i)=>k.rotation.x=Math.max(0,Math.sin(rig.walk+i*Math.PI))*.32*walkWeight+.15*motion.flight+(rig.agilePosture?.045:0)*(1-walkWeight)*(1-motion.flight));
  rig.arms.forEach((arm,i)=>{
    const side=i===0?-1:1;
    arm.rotation.x=(i===0?-stride:stride)*.8-attack*(i===1?1.5:.7)-(i===1?.25*motion.talk:0);
    arm.rotation.z=side*(.065+.33*motion.flight+.05*Math.sin(t*4)*motion.talk);
    arm.rotation.y=0;
    arm.userData.elbow.rotation.x=-.11-Math.abs(stride)*.23-attack*.38-(i===1?(.35+Math.sin(t*3)*.1)*motion.talk:0);
  });
  // ---- extra bewegingen: rennen, draaien, springen, ademen ----
  {
    const yawNow=rig.group.rotation.y;let dyaw=yawNow-(rig.prevYaw??yawNow);dyaw=Math.atan2(Math.sin(dyaw),Math.cos(dyaw));rig.prevYaw=yawNow;
    const turnRate=THREE.MathUtils.clamp(dyaw/Math.max(step,.001),-6,6);
    motion.turn=(motion.turn||0)+(turnRate-(motion.turn||0))*(1-Math.exp(-step*10));
    const dashing=opts.dash?1:0;
    const run=Math.max(THREE.MathUtils.clamp((motion.speed-6)/7,0,1)*walkWeight,dashing*.9);
    motion.air=(motion.air||0)+(((opts.air?1:0)-(motion.air||0))*(1-Math.exp(-step*14)));
    const air=motion.air*(1-motion.flight);
    rig.userData_run=run;rig.userData_air=air;
    if(!dead){
      rig.body.rotation.x+=run*.2+attack*.1+air*.1+dashing*.12;
      rig.body.rotation.y=Math.sin(rig.walk)*(.06+.05*run)*walkWeight-attack*.3*(1-air);
      rig.body.rotation.z+=-motion.turn*.02*walkWeight;
      rig.body.position.y+=Math.sin(t*1.9+rig.phase)*.006*(1-motion.move)+run*Math.abs(Math.sin(rig.walk))*.03;
      rig.legs.forEach((lg,i)=>{lg.rotation.x*=(1+.4*run);lg.rotation.x=lg.rotation.x*(1-air)+(i?.25:-.6)*air;});
      rig.knees.forEach(k=>{k.rotation.x+=run*.3+air*.75;});
      rig.arms.forEach((arm,i)=>{
        const side=i===0?-1:1;
        arm.rotation.x=arm.rotation.x*(1+.35*run)*(1-air)-air*.55;
        arm.rotation.z+=side*air*.7;
        arm.userData.elbow.rotation.x-=run*.75;
      });
    }
  }
  rig.hands.forEach(hand=>hand.rotation.set(0,0,0));
  rig.legs.forEach(leg=>leg.rotation.z=0);
  rig.fingers.forEach((f,i)=>{f.base.rotation.set(attack*(f.thumb?.55:1.03)+(talking?.13*Math.sin(t*4+i):.05),0,f.restZ);f.tip.rotation.set(attack*.9+.08,0,0);});
  rig.head.rotation.y=Math.sin(t*1.7)*.11*motion.talk+Math.sin(t*.8+rig.phase)*.035*(1-motion.talk);
  rig.head.rotation.x=Math.sin(t*4)*.025*motion.talk+stride*.03-(rig.userData_run||0)*.12;rig.head.rotation.z=-rig.body.rotation.z*.35;rig.head.rotation.y-=rig.body.rotation.y*.7;
  const blinkTime=(t+rig.phase)%4.7;
  const blink=blinkTime<.16?Math.sin(blinkTime/.16*Math.PI):0;
  if(!rig.accessories.noBlink){
    rig.eyes.forEach(e=>e.scale.y=Math.max(.055,1-blink));
    rig.lids.forEach(l=>{l.visible=blink>.08;l.scale.y=.048*blink;});
  }
  if(rig.jaw){const syllable=Math.max(0,.55+.30*Math.sin(t*10)+.15*Math.sin(t*18+.4));motion.mouth+=(.0085+.018*motion.talk*syllable-motion.mouth)*(1-Math.exp(-step*25));rig.jaw.scale.y=motion.mouth;}
  // The cloth extends downward (-Y) behind the body (-Z): positive X pitch
  // sends its hem backward. Negative pitch pulled it through the torso/legs.
  if(rig.accessories.cape){rig.accessories.cape.rotation.x=THREE.MathUtils.clamp(.11+(moving?.23:0)+Math.sin(t*2+rig.phase)*.025,.08,.38);rig.accessories.cape.rotation.z=Math.sin(t*1.4)*.025;}
  if(rig.accessories.tentacles)rig.accessories.tentacles.forEach((a,i)=>{a.rotation.y=Math.sin(t*1.7+i)*.08+attack*(i%2?-.2:.2);a.rotation.x=Math.sin(t*1.3+i)*.06;});
  if(rig.accessories.magic)rig.accessories.magic.forEach((m,i)=>{m.rotation.z=t*(i?1:-1);m.scale.copy(m.userData.baseScale).multiplyScalar(1+attack*.75+Math.sin(t*4)*.04);});
  if(rig.accessories.glider){const gl=rig.accessories.glider,f=motion.flight;gl.rotation.z=Math.sin(t*2)*.025;gl.rotation.x=(1-f)*(Math.PI/2-.15);gl.position.y=.1+(1-f)*1.55;gl.position.z=-.24-(1-f)*.08;gl.scale.setScalar(1-(1-f)*.35);}
  animateSignature(rig,t,attack,flight,moving,dead,rangedAttack);
  const poseEase=1-Math.exp(-step*((attack||rangedAttack)?38:18));
  for(const entry of rig.poseBlend){entry.position.lerp(entry.node.position,poseEase);entry.quaternion.slerp(entry.node.quaternion,poseEase);entry.node.position.copy(entry.position);entry.node.quaternion.copy(entry.quaternion);}
  if(rig.accessories.cape){rig.accessories.cape.rotation.x=THREE.MathUtils.clamp(rig.accessories.cape.rotation.x,.08,.58);const entry=rig.poseBlend.at(-1);entry.quaternion.copy(rig.accessories.cape.quaternion);}
}

function placeRod(rod,a,b,radius=.011){
  const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);
  rod.position.copy(av).add(bv).multiplyScalar(.5);rod.scale.set(radius,d.length(),radius);rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
}

function animateSignature(rig,t,attack,flight,moving,dead,rangedAttack=0){
  const id=rig.def.id,a=rig.accessories,L=rig.arms[0],R=rig.arms[1],LH=rig.hands[0],RH=rig.hands[1];
  const blend=attack>0?Math.min(1,attack*5):0,p=1-attack,hit=Math.sin(Math.min(1,p/.66)*Math.PI)*blend;
  if(attack>(rig.lastAttack||0)+.15)rig.attackSequence=(rig.attackSequence||0)+1;
  rig.lastAttack=attack;
  a.thrusters?.forEach((jet,i)=>{jet.visible=flight&&!dead;jet.scale.y=1+.17*Math.sin(t*35+i);});
  if(a.flightAura){a.flightAura.visible=flight&&!dead;a.flightAura.scale.setScalar(1+.06*Math.sin(t*4));a.flightAura.rotation.z=t*.7;}
  if(a.gliderJet){a.gliderJet.visible=flight&&!dead;a.gliderJet.scale.y=.37*(1+.14*Math.sin(t*28));}
  for(const key of ['photonGlow','electricGlow','doomGlow'])a[key]?.forEach((m,i)=>{m.visible=!dead&&(flight||attack>0);m.scale.copy(m.userData.baseScale).multiplyScalar(1+attack*.45+Math.sin(t*7+i)*.035);});
  if(a.foreheadGem)a.foreheadGem.scale.copy(a.foreheadGem.userData.baseScale).multiplyScalar(1+attack*.28);
  a.antennae?.forEach((antenna,i)=>{antenna.rotation.z=Math.sin(t*3+i)*.025;});
  a.metalShards?.forEach((shard,i)=>{shard.visible=!dead&&(flight||attack>0);const angle=t*(attack?3:1.2)+i*Math.PI*.5;shard.position.set(Math.cos(angle)*(.72+attack*.1),1.62+Math.sin(angle*2)*.18,.12+Math.sin(angle)*.45);shard.rotation.set(angle*.7,angle,angle*.3);});
  a.electricSpikes?.forEach((spike,i)=>{spike.scale.y=.24*(1+.09*Math.sin(t*10+i));});
  if(id==='deadpool'){const aiming=rangedAttack>.001&&!dead;a.pistol.visible=aiming;a.katana.visible=!aiming;a.holsteredPistols[1].visible=!aiming;a.muzzleFlash.visible=aiming&&rangedAttack>.72;}
  if(dead)return;

  // Flight has its own lower-body stance; an attack can still override the arms.
  if(flight){
    rig.body.rotation.x=moving?.16:.02;
    rig.legs.forEach((leg,i)=>{leg.rotation.x=moving?.22:.08;leg.rotation.z=(i?1:-1)*.075;rig.knees[i].rotation.x=.24;});
    if(a.cape){a.cape.rotation.x=THREE.MathUtils.clamp(.48+(moving?.10:0),.42,.58);a.cape.rotation.z=Math.sin(t*3)*.04;}
    if(['ironman','ultron','doom'].includes(id)){
      L.rotation.x=R.rotation.x=-.15;L.rotation.z=id==='ultron'?-.43:-.18;R.rotation.z=id==='ultron'?.43:.18;
      LH.rotation.x=RH.rotation.x=.32;
    }else if(['strange','wanda','mysterio','magneto','electro'].includes(id)){
      L.rotation.x=R.rotation.x=-.4;L.rotation.z=-.55;R.rotation.z=.55;LH.rotation.x=RH.rotation.x=.45;
    }else if(id==='captainmarvel'){
      rig.body.rotation.x=moving?.24:.06;R.rotation.x=moving?-2.5:-.45;L.rotation.x=-.35;R.rotation.z=.14;L.rotation.z=-.16;
    }else if(id==='vision'){
      rig.body.rotation.x=-.035;L.rotation.x=R.rotation.x=-.18;L.rotation.z=-.28;R.rotation.z=.28;
    }else if(id==='thor'){
      R.rotation.x=-2.85;R.rotation.z=.15;R.userData.elbow.rotation.x=-.1;L.rotation.x=-.3;
    }else if(id==='goblin'){
      rig.body.position.y-=.12;rig.body.rotation.x=.11;rig.legs.forEach((l,i)=>{l.rotation.x=-.18;rig.knees[i].rotation.x=.5;});
      L.rotation.z=-.48;R.rotation.z=.48;a.glider.rotation.z=Math.sin(t*2)*.07;
    }
  }

  if(id==='deadpool'){
    R.rotation.z=.15;
    if(rangedAttack){const aim=Math.min(1,rangedAttack*6);R.rotation.x=-1.45*aim;R.rotation.y=0;R.rotation.z=.06;R.userData.elbow.rotation.x=-.08;RH.rotation.x=1.53*aim;L.rotation.x=-1.15*aim;L.rotation.z=.50*aim;L.userData.elbow.rotation.x=-.47;LH.rotation.x=.3*aim;rig.body.rotation.y=-.065*aim;}
    else if(attack){R.rotation.x=(-1.8+hit*.9)*blend;R.rotation.y=.9*blend-hit*1.7;R.userData.elbow.rotation.x=-.17;RH.rotation.x=-.2*blend;L.rotation.x=-.55*blend;rig.body.rotation.y=.2*blend-hit*.35;}
    a.katana.rotation.z=-.10+hit*.2;
    rig.fingers.filter(f=>f.side===1).forEach(f=>{f.base.rotation.x=f.thumb?.45:.86;f.tip.rotation.x=.69;});
  }else if(id==='thor'){
    R.rotation.z=.14;
    if(attack){R.rotation.x=(-2.8+2.95*THREE.MathUtils.clamp((p-.12)/.58,0,1))*blend;R.userData.elbow.rotation.x=-.11;RH.rotation.x=-.15*blend;rig.body.rotation.x+=hit*.12;}
    if(a.hammer)a.hammer.rotation.z=-.12+hit*.18;
    rig.fingers.filter(f=>f.side===1).forEach(f=>{f.base.rotation.x=f.thumb?.45:.82;f.tip.rotation.x=.65;});
  }else if(id==='hawkeye'){
    const draw=blend*Math.max(0,1-p/.3)*.32;
    placeRod(a.bowStrings[0],[0,-.6,0],[0,0,-draw]);placeRod(a.bowStrings[1],[0,0,-draw],[0,.6,0]);
    a.nockedArrow.visible=!attack||p<.25;a.nockedArrow.position.z=.05-draw;
    if(attack){
      L.rotation.x=-1.52*blend;L.rotation.z=-.12;L.userData.elbow.rotation.x=-.06;LH.rotation.x=1.58*blend;
      R.rotation.x=-1.2*blend;R.rotation.z=-.63*blend;R.rotation.y=-.35*blend;R.userData.elbow.rotation.x=-(.45+draw*3.7)*blend;
      rig.body.rotation.y=-.12*blend;rig.head.rotation.y=.1*blend;
    }
    rig.fingers.filter(f=>f.side===-1).forEach(f=>{f.base.rotation.x=f.thumb?.35:.7;f.tip.rotation.x=.55;});
  }else if(id==='spiderman'&&attack){
    R.rotation.x=-1.4*blend;R.rotation.y=-.06;R.userData.elbow.rotation.x=-.12;RH.rotation.x=1.5*blend;L.rotation.x=-.35*blend;rig.body.rotation.x+=.06*blend;
    rig.fingers.forEach((f,i)=>{if(f.side!==1)return;const j=i%5,curled=j===1||j===2;f.base.rotation.x=curled?1.75:.04;f.tip.rotation.x=curled?1.3:.04;});
  }else if(['ironman','ultron'].includes(id)&&attack){
    R.rotation.x=-1.47*blend+hit*.12;R.userData.elbow.rotation.x=-.05;RH.rotation.x=1.52*blend;L.rotation.x=-.35*blend;
    rig.fingers.filter(f=>f.side===1).forEach(f=>{f.base.rotation.x=.035;f.tip.rotation.x=.035;});
    rig.body.rotation.x-=hit*.04;
  }else if(id==='captain'){
    a.shield.rotation.set(0,-.22,0);
    if(attack){L.rotation.x=-1.4*blend;L.rotation.y=-1.0*blend+hit*1.8;L.rotation.z=-.2*blend;L.userData.elbow.rotation.x=-.15;LH.rotation.x=.5*blend;a.shield.rotation.z=hit*5;rig.body.rotation.y=-.2*blend+hit*.4;}
  }else if(['hulk','abomination'].includes(id)&&attack){
    const slam=(rig.attackSequence||1)%2===0;
    if(slam){L.rotation.x=R.rotation.x=(-2.5+hit*2)*blend;L.userData.elbow.rotation.x=R.userData.elbow.rotation.x=-.12;rig.body.rotation.x+=hit*.2;}
    else{R.rotation.x=-(.8+hit*1.0)*blend;L.rotation.x=-.7*blend;R.userData.elbow.rotation.x=-.1;rig.body.rotation.y=-.18*blend+hit*.38;}
  }else if(['panther','killmonger','venom','wolverine','sabretooth'].includes(id)&&attack){
    const chosen=(rig.attackSequence||1)%2,arm=chosen?R:L,other=chosen?L:R,side=chosen?1:-1;
    arm.rotation.x=-1.35*blend;arm.rotation.y=side*(.85*blend-hit*1.65);arm.rotation.z=side*.25*blend;other.rotation.x=-.55*blend;
    rig.body.rotation.y=side*(.14*blend-hit*.28);rig.fingers.forEach(f=>{f.base.rotation.x=id==='wolverine'?.83:.33;f.tip.rotation.x=id==='wolverine'?.72:.48;});
  }else if(id==='octopus'){
    a.tentacles.forEach((tent,i)=>{const reach=hit*(i%2?.9:1);tent.scale.set(1-reach*.14,1,1+reach*.9);tent.rotation.y+=reach*(i%2?-.38:.38);tent.rotation.x-=reach*.28;});
    if(attack){L.rotation.x=R.rotation.x=-.4*blend;}
  }else if(['strange','wanda','mysterio','magneto','electro','doom'].includes(id)&&attack){
    L.rotation.x=-1.08*blend;R.rotation.x=-1.28*blend;L.rotation.z=-.36*blend;R.rotation.z=.36*blend;
    L.rotation.y=-.22*blend+hit*.2;R.rotation.y=.22*blend-hit*.2;LH.rotation.x=1.25*blend;RH.rotation.x=1.45*blend;
    rig.fingers.forEach((f,i)=>{f.base.rotation.x=.12+Math.sin(t*8+i)*.08;f.tip.rotation.x=.13;});
  }else if(id==='thanos'&&attack){
    L.rotation.x=-1.4*blend;L.userData.elbow.rotation.x=-.25;LH.rotation.x=1.55*blend;R.rotation.x=-.35*blend;
    rig.fingers.filter(f=>f.side===-1).forEach(f=>{f.base.rotation.x=.1+hit*.95;f.tip.rotation.x=.1+hit*.75;});
  }else if(id==='captainmarvel'&&attack){
    R.rotation.x=-1.52*blend+hit*.1;L.rotation.x=-1.07*blend;R.userData.elbow.rotation.x=-.1;L.userData.elbow.rotation.x=-.12;
    rig.fingers.forEach(f=>{f.base.rotation.x=.85;f.tip.rotation.x=.72;});rig.body.rotation.y=-.08*blend+hit*.16;
  }else if(id==='vision'&&attack){
    rig.head.rotation.x=-.065*blend;L.rotation.x=-.35*blend;R.rotation.x=-.28*blend;L.rotation.z=-.26;R.rotation.z=.26;
    rig.body.rotation.x-=.035*blend;
  }else if(id==='antman'&&attack){
    const chosen=(rig.attackSequence||1)%2,arm=chosen?R:L,other=chosen?L:R;
    arm.rotation.x=-(.8+hit*.9)*blend;arm.userData.elbow.rotation.x=-.12;other.rotation.x=-.68*blend;rig.body.rotation.y=(chosen?1:-1)*hit*.18;
    rig.fingers.forEach(f=>{f.base.rotation.x=.85;f.tip.rotation.x=.7;});
  }else if(['loki','hela'].includes(id)&&attack){
    R.rotation.x=-1.2*blend;R.rotation.y=.8*blend-hit*1.5;R.rotation.z=.3*blend;rig.body.rotation.y=.15*blend-hit*.3;RH.rotation.x=.25*blend;
  }else if(id==='goblin'&&attack){
    R.rotation.x=(-2.5+hit*1.6)*blend;R.userData.elbow.rotation.x=-.5+hit*.4;L.rotation.z=-.35*blend;
  }else if(['widow','redskull'].includes(id)&&attack){
    R.rotation.x=-1.42*blend+hit*.1;R.userData.elbow.rotation.x=-.06;RH.rotation.x=.1*blend;
    L.rotation.x=-1.1*blend;L.rotation.z=.38*blend;L.userData.elbow.rotation.x=-.6*blend;
  }
}
