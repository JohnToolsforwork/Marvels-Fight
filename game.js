import * as THREE from './vendor/three.module.js';
import {music} from './music.js?v=20261121215741';
import {startUpdater} from './update.js?v=20261121215741';
import {createCivilians} from './civilians.js?v=20261121215741';
import {ROSTER,SKINS,skinDef,createCharacter,updateCharacter,setQuality as setCharacterQuality} from './characters.js?v=20261121215741';
import {SoftwareRenderer} from './software-renderer.js?v=20261121215741';
import {createWorld} from './world.js?v=20261121215741';
import {blocked,slideMove,clearSight,segmentBox,makeNavigator} from './physics.js?v=20261121215741';
import {createDuel} from './pvp.js?v=20261121215741';
import {createProjectileVisual,createMeleeVisual} from './powers.js?v=20261121215741';
import {updateNPCFlight} from './npc-flight.js?v=20261121215741';
import {resolveThirdPersonCamera,isThirdPersonCameraSafe} from './third-person-camera.js?v=20261121215741';

const $=id=>document.getElementById(id),TAU=Math.PI*2,clamp=THREE.MathUtils.clamp;
const canvas=$('game-canvas'),scene=new THREE.Scene(),clock=new THREE.Clock();
const settings={high:true,sound:true};
let hasSavedQuality=false;
try{const saved=JSON.parse(localStorage.getItem('marvel-city-settings')||'{}');hasSavedQuality=typeof saved.high==='boolean';Object.assign(settings,saved);}catch{}
const saveSettings=()=>{try{localStorage.setItem('marvel-city-settings',JSON.stringify(settings));}catch{}};
let renderer;
try{const context=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});renderer=context?new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:false,logarithmicDepthBuffer:true}):new SoftwareRenderer({canvas});}catch(e){renderer=new SoftwareRenderer({canvas});}
if(renderer.isSoftwareRenderer&&!hasSavedQuality)settings.high=false;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
renderer.shadowMap.type=THREE.PCFShadowMap;
const hemi=new THREE.HemisphereLight(0xd4e9ff,0x7c746a,1.45);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5c8,2.35);sun.position.set(-30,55,24);sun.castShadow=true;
sun.shadow.camera.left=-42;sun.shadow.camera.right=42;sun.shadow.camera.top=42;sun.shadow.camera.bottom=-42;sun.shadow.camera.near=1;sun.shadow.camera.far=150;sun.shadow.bias=-.00016;sun.shadow.normalBias=.025;sun.shadow.radius=2.6;scene.add(sun,sun.target);
const rim=new THREE.DirectionalLight(0xabcfff,1.35);rim.position.set(25,16,-32);scene.add(rim);
const roomLights=new THREE.Group();scene.add(roomLights);
const cameras=[new THREE.PerspectiveCamera(52,1,.25,500),new THREE.PerspectiveCamera(52,1,.25,500)];
const menuCamera=new THREE.PerspectiveCamera(43,1,.15,500);
// Teambalans: de helden waren gemiddeld ~20% zwakker (levens x schade), daarom krijgen zij een kleine bonus.
const BAL={heroes:{hp:1.2,dmg:1.2},villains:{hp:1,dmg:1}};
const LEADERS={heroes:'captain',villains:'thanos'},isLeader=a=>LEADERS[a.def.team]===a.def.id;
let cutUntil=0,cutStart=0,cutLines=[],cutCb=null,cutIdx=-1,storyIndex=0,story=null;
const cameraStates=[{yaw:0,pitch:.38,distance:10.5},{yaw:Math.PI,pitch:.38,distance:10.5}];
let width=innerWidth,height=innerHeight,world,nav,worldId='newyork',team='heroes',selected='deadpool',p2id='sabretooth',mode='explore',koTotal=0,wave=0,waveBreak=0,survKills=0,state='menu',elapsed=0,matchTime=180,frameCount=0;
let actors=[],players=[],shots=[],effects=[],selectedActor=null,dialogueUntil=0,nextDialogue=0,currentTalker=null,lastHud=0,toastUntil=0;
let duel=null,pvpFormat='duel',roundBannerUntil=0;
const FLIERS=new Set(['ironman','thor','strange','wanda','ultron','goblin','mysterio','captainmarvel','vision','magneto','electro','doom']);
let currentInterior='';
const score={heroes:0,villains:0},keys=new Set(),touch=new Set(),portraits=new Map();
const worldNames={newyork:'NEW YORK',wakanda:'WAKANDA',asgard:'ASGARD',avengers:'AVENGERS TOWER',kamartaj:'KAMAR-TAJ',titan:'TITAN',savage:'SAVAGE LAND'};
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),aimPoint=new THREE.Vector3();
let pointerKnown=false,dragging=false,lastPointer={x:0,y:0},audioContext=null,menuOrbit=0;
const actorLayer=document.createElement('div');actorLayer.className='actor-label-layer';document.body.append(actorLayer);
const damageVeil=document.createElement('div');damageVeil.id='damage-vignette';damageVeil.setAttribute('aria-hidden','true');document.body.append(damageVeil);
const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;
const contactContext=contactCanvas.getContext('2d'),contactGradient=contactContext.createRadialGradient(64,64,2,64,64,64);
contactGradient.addColorStop(0,'rgba(7,15,27,.62)');contactGradient.addColorStop(.28,'rgba(7,15,27,.42)');contactGradient.addColorStop(.65,'rgba(7,15,27,.12)');contactGradient.addColorStop(1,'rgba(7,15,27,0)');contactContext.fillStyle=contactGradient;contactContext.fillRect(0,0,128,128);
const contactTexture=new THREE.CanvasTexture(contactCanvas),contactGeometry=new THREE.PlaneGeometry(2.2,1.9);
const atmospheres=new Map();
function setAtmosphere(id){
 const palettes={newyork:['#698ead','#deedf0','#ecd7bb'],wakanda:['#417f96','#cce2db','#e1cb9e'],asgard:['#5c77a9','#d9e2f3','#f2dca5'],avengers:['#557992','#d6e6eb','#a9bbc4'],kamartaj:['#73949f','#e6dfc8','#c4ad82'],titan:['#a86a44','#d9a77b','#e8b97a'],savage:['#5fa38a','#cfe6c9','#d8d29a']};
 const colors=palettes[id];scene.userData.skyColors=colors;scene.fog=new THREE.FogExp2(colors[1],settings.high?.0028:.004);
 sun.color.set(id==='wakanda'?'#ffeed1':id==='asgard'?'#ffe0ad':'#ffe4c4');hemi.groundColor.set(id==='wakanda'?'#607e63':'#8d7b6b');scene.environmentIntensity=.62;
 if(renderer.isSoftwareRenderer){scene.background=new THREE.Color(colors[1]);return;}
 if(!atmospheres.has(id)){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,512);
  g.addColorStop(0,colors[0]);g.addColorStop(.44,colors[1]);g.addColorStop(.53,colors[2]);g.addColorStop(.68,'#817e77');g.addColorStop(1,'#323d4c');x.fillStyle=g;x.fillRect(0,0,1024,512);
  const glow=x.createRadialGradient(250,185,3,250,185,120);glow.addColorStop(0,'rgba(255,244,211,.92)');glow.addColorStop(.3,'rgba(255,239,201,.3)');glow.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=glow;x.fillRect(80,20,340,340);
  const texture=new THREE.CanvasTexture(c);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;
  const generator=new THREE.PMREMGenerator(renderer),environment=generator.fromEquirectangular(texture);generator.dispose();atmospheres.set(id,{texture,environment});
 }
 const sky=atmospheres.get(id);scene.background=sky.texture;scene.environment=sky.environment.texture;scene.backgroundBlurriness=.025;
}
const previewHalo=new THREE.Mesh(new THREE.RingGeometry(1.19,1.22,72),new THREE.MeshBasicMaterial({color:0x72dfff,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));previewHalo.rotation.x=-Math.PI/2;previewHalo.position.set(0,.07,10);scene.add(previewHalo);
const SPECS={
 spiderman:{range:20,rate:.45,speed:29,kind:'web',slow:1.7,special:'web'},
 ironman:{range:25,rate:.36,speed:35,kind:'beam',special:'unibeam'},
 captain:{range:18,rate:.7,speed:23,kind:'shield',special:'shield'},
 thor:{range:4.5,rate:.72,kind:'hammer',special:'storm'},
 hulk:{range:4.2,rate:.75,kind:'melee',special:'slam'},
 widow:{range:3.6,rate:.42,kind:'melee',special:'shock'},
 hawkeye:{range:30,rate:.65,speed:42,kind:'arrow',special:'arrows'},
 strange:{range:22,rate:.58,speed:26,kind:'ring',special:'portal'},
 panther:{range:3.8,rate:.42,kind:'melee',special:'kinetic'},
 wanda:{range:22,rate:.65,speed:24,kind:'orb',special:'chaos'},
 thanos:{range:20,rate:.72,speed:24,kind:'orb',special:'stones'},
 loki:{range:20,rate:.55,speed:29,kind:'dagger',special:'illusion'},
 ultron:{range:26,rate:.36,speed:36,kind:'beam',special:'swarm'},
 goblin:{range:22,rate:.85,speed:19,kind:'bomb',splash:2.8,special:'bombs'},
 octopus:{range:8,rate:.7,speed:29,kind:'tentacle',special:'arms'},
 venom:{range:4.5,rate:.56,kind:'melee',special:'symbiote'},
 redskull:{range:24,rate:.55,speed:32,kind:'bolt',special:'tesseract'},
 hela:{range:24,rate:.5,speed:34,kind:'dagger',special:'blades'},
 killmonger:{range:4,rate:.45,kind:'melee',special:'hunt'},
 mysterio:{range:22,rate:.65,speed:22,kind:'orb',special:'mist'},
 captainmarvel:{range:26,rate:.5,speed:38,kind:'beam',special:'photon'},
 vision:{range:25,rate:.58,speed:40,kind:'beam',special:'density'},
 antman:{range:3.5,rate:.4,kind:'melee',special:'shrink'},
 wolverine:{range:4,rate:.42,kind:'melee',special:'regenerate'},
 magneto:{range:24,rate:.6,speed:28,kind:'dagger',special:'metalstorm'},
 electro:{range:22,rate:.48,speed:38,kind:'lightning',special:'chain'},
 abomination:{range:4.8,rate:.8,kind:'melee',special:'slam'},
 doom:{range:24,rate:.62,speed:30,kind:'ring',special:'runes'},
 deadpool:{range:4.2,rate:.44,kind:'melee',special:'healing'},
 sabretooth:{range:4.4,rate:.5,kind:'melee',special:'hunt'}
};
const effectColors={spiderman:'#c4e9ff',ironman:'#62edff',captain:'#8baeff',thor:'#9bddff',hulk:'#9aff68',widow:'#66c9ff',hawkeye:'#cf97ff',strange:'#ff9c36',panther:'#bc7cff',wanda:'#ff3969',thanos:'#ffcc58',loki:'#6af291',ultron:'#ff4d51',goblin:'#ff9e39',octopus:'#efc17c',venom:'#d0d8f0',redskull:'#69caff',hela:'#5cf4ae',killmonger:'#ffc75b',mysterio:'#55ffc2'};
Object.assign(effectColors,{captainmarvel:'#ffce68',vision:'#ffe98d',antman:'#f37b74',wolverine:'#e7edf5',magneto:'#becbdf',electro:'#8edfff',abomination:'#b7bb75',doom:'#6bffb3',deadpool:'#e85f68',sabretooth:'#eacb8d'});
const bodyHeight=a=>(a.rig.height||2.82)*a.group.scale.y+(a.flying?.25:0);
const baseRadius=id=>id==='hulk'?.87:id==='abomination'?.98:id==='thanos'?.78:.58;
function sound(kind='shot',volume=.04){
 if(!settings.sound||!audioContext)return;
 try{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;o.connect(g);g.connect(audioContext.destination);o.type=kind==='hit'?'triangle':'sine';o.frequency.setValueAtTime(kind==='hit'?130:kind==='special'?320:680,t);o.frequency.exponentialRampToValueAtTime(kind==='special'?60:80,t+.16);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.start(t);o.stop(t+.23);}catch{}
}
function activateAudio(){if(!settings.sound)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});music.start(audioContext);music.setMood(state==='playing'?'battle':'calm');}catch{}}
function toast(message,seconds=3.4){$('toast').textContent=message;$('toast').hidden=false;toastUntil=elapsed+seconds;}
function setupRoomLighting(){
 roomLights.clear();
 for(const room of world.interiors||[]){
  const w=room.maxX-room.minX,d=room.maxZ-room.minZ;if(w>80||d>80)continue;
  const light=new THREE.PointLight(worldId==='kamartaj'?0xffce92:0xc8e6ff,45,Math.min(36,Math.max(w,d)*1.2),2);
  light.position.set((room.minX+room.maxX)/2,Math.max(3,(room.ceiling||6)-.7),(room.minZ+room.maxZ)/2);roomLights.add(light);
 }
 roomLights.visible=settings.high&&!renderer.isSoftwareRenderer;
}
function updateSunShadow(){
 if(!settings.high||renderer.isSoftwareRenderer)return;
 const focus=state==='menu'?selectedActor?.group.position:players[0]?.group.position;if(!focus)return;
 const texel=84/sun.shadow.mapSize.x,x=Math.round(focus.x/texel)*texel,z=Math.round(focus.z/texel)*texel;
 sun.position.set(x-30,55,z+24);sun.target.position.set(x,0,z);
}
function setQuality(){
 renderer.setPixelRatio(Math.min(devicePixelRatio,settings.high?1.7:1));renderer.shadowMap.enabled=settings.high;sun.shadow.mapSize.setScalar(settings.high?2048:512);
 if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
 $('quality-button').textContent='Graphics · '+(settings.high?'Hoog':'Laag');$('quality-button').setAttribute('aria-pressed',String(settings.high));
 roomLights.visible=settings.high&&!renderer.isSoftwareRenderer;world?.setQuality?.(settings.high);actors.forEach(a=>setCharacterQuality(a.rig,settings.high));renderer.setQuality?.(settings.high);if(scene.fog)scene.fog.density=settings.high?.0028:.004;resize();saveSettings();
}
function setSound(){
 $('sound-button').textContent=settings.sound?'Geluid · Aan':'Geluid · Uit';$('sound-button').setAttribute('aria-pressed',String(settings.sound));
 if(!settings.sound){window.speechSynthesis?.cancel();audioContext?.suspend().catch(()=>{});}else if(state==='playing')activateAudio();saveSettings();
}
function resize(){
 width=innerWidth;height=innerHeight;renderer.setSize(width,height,false);
 const split=state!=='menu'&&mode==='pvp';cameras.forEach(c=>{c.aspect=(split?width/2:width)/height;c.updateProjectionMatrix();});menuCamera.aspect=width/height;menuCamera.setViewOffset(width,height,-Math.min(width*.19,265),0,width,height);menuCamera.updateProjectionMatrix();
}
function makeActor(def,index){
 const rig=createCharacter(def),group=rig.group;scene.add(group);
 const marker=new THREE.Mesh(new THREE.RingGeometry(.72,.747,40),new THREE.MeshBasicMaterial({color:def.team==='heroes'?0x55cfff:0xff687e,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.035;group.add(marker);
 const shadow=new THREE.Mesh(contactGeometry,new THREE.MeshBasicMaterial({map:contactTexture,opacity:.48,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.023;if(['hulk','thanos','venom'].includes(def.id))shadow.scale.setScalar(1.2);group.add(shadow);
 const labels=[0,1].map(()=>{const e=document.createElement('div');e.className='actor-label '+def.team;e.innerHTML='<span></span><i><b></b></i>';e.querySelector('span').textContent=def.name+(LEADERS[def.team]===def.id?' ★ Aanvoerder':'');actorLayer.append(e);return e;});
 return {def,rig,group,index,marker,shadow,labels,hp:def.hp,maxHp:def.hp,radius:baseRadius(def.id),vy:0,cooldown:0,specialCooldown:0,attackAnim:0,dead:false,respawn:0,hurt:0,slow:0,stun:0,invulnerable:0,speedBuff:0,moving:false,talking:false,nextTalk:0,nextAI:Math.random(),path:[],pathAge:0,aggro:0,lastAttacker:null,spawn:new THREE.Vector3(),wander:new THREE.Vector3(),nextWander:0,player:-1};
}
function resetActor(a,spawn){
 a.spawn.set(spawn.x,0,spawn.z);a.group.position.copy(a.spawn);a.group.rotation.set(0,spawn.rotation??(a.def.team==='heroes'?Math.PI:0),0);a.group.visible=true;a.maxHp=Math.round(a.def.hp*BAL[a.def.team].hp*(isLeader(a)?1.5:1)*(a.skin?.hp||1));a.hp=a.maxHp;a.dead=false;a.active=true;a.respawn=0;a.vy=0;a.cooldown=0;a.specialCooldown=0;a.attackAnim=0;a.aggro=0;a.path=[];a.pathAge=0;a.invulnerable=0;a.stun=0;a.slow=0;a.player=-1;a.wander.copy(a.spawn);a.nextWander=2+Math.random()*5;a.moveVelocity=new THREE.Vector3();a.dashDirection=new THREE.Vector3();a.dashRemaining=0;a.dashCooldown=0;a.flying=false;a.flightAxis=0;a.flyPulse=0;a.pendingAttack=null;a.speedBuff=0;a.webbedUntil=0;a.shrink=0;a.grow=0;a.nextPym='shrink';a.group.scale.setScalar(1);a.radius=baseRadius(a.def.id);a.target=null;a.lastAttacker=null;a.nextAI=.1+(a.index%5)*.07;a.specialThink=2+(a.index%6)*.45;a.healing=0;a.npcFlightTimer=undefined;a.npcFlightPhase=undefined;a.pistolCooldown=0;a.pistolAnim=0;a.pendingPistol=null;
}
function loadWorld(id){
 civ.clear();clearEffects();world?.dispose?.();worldId=id;world=createWorld(scene,id);nav=makeNavigator(world.colliders,world.bounds);
 if(!actors.length){actors=ROSTER.map(makeActor);for(const a of actors)if(savedSkins[a.def.id])applySkin(a,savedSkins[a.def.id]);}
 const counters={heroes:0,villains:0};for(const a of actors){const s=world.spawns[a.def.team][counters[a.def.team]++];resetActor(a,s);}
 setAtmosphere(id);setupRoomLighting();world.setQuality?.(settings.high);
 document.querySelectorAll('[data-world]').forEach(e=>{e.classList.toggle('active',e.dataset.world===id);e.setAttribute('aria-pressed',String(e.dataset.world===id));});
 if($('scene-caption'))$('scene-caption').textContent=worldNames[id]+' / '+({newyork:'AVENGERS DISTRICT',wakanda:'GOLDEN CITY',asgard:'THE GOLDEN REALM',avengers:'TRAININGSVERDIEPING',kamartaj:'TEMPEL EN BIBLIOTHEEK',titan:'DE VERWOESTE WERELD',savage:'DE VERBORGEN JUNGLE'}[id]);
 previewCharacter();drawMinimap();
}
function previewCharacter(){
 if(selectedActor){selectedActor.group.position.copy(selectedActor.spawn);selectedActor.group.rotation.y=selectedActor.def.team==='heroes'?Math.PI:0;}
 selectedActor=actors.find(a=>a.def.id===selected);selectedActor.group.position.set(0,0,10);selectedActor.group.rotation.y=.16;selectedActor.marker.visible=false;
}
let savedSkins={};try{savedSkins=JSON.parse(localStorage.getItem('mf_skins')||'{}')||{};}catch{savedSkins={};}
function applySkin(a,skinId){
 const list=SKINS[a.def.id]||[],skin=list.find(k=>k.id===skinId)||null;
 if((a.skin?.id||null)===(skin?.id||null))return;
 const old=a.group,pos=old.position.clone(),rot=old.rotation.clone(),vis=old.visible,sc=old.scale.clone();
 const rig=createCharacter(skinDef(a.def,skin?.id));setCharacterQuality(rig,settings.high);
 const group=rig.group;group.position.copy(pos);group.rotation.copy(rot);group.scale.copy(sc);group.visible=vis;
 group.add(a.marker);group.add(a.shadow);scene.add(group);scene.remove(old);
 a.rig=rig;a.group=group;a.skin=skin;
 const ratio=a.hp/a.maxHp;a.maxHp=Math.round(a.def.hp*BAL[a.def.team].hp*(isLeader(a)?1.5:1)*(skin?.hp||1));a.hp=Math.max(1,Math.round(a.maxHp*ratio));
}
function chooseSkin(charId,skinId){
 const a=actors.find(x=>x.def.id===charId);if(!a)return;
 if(skinId)savedSkins[charId]=skinId;else delete savedSkins[charId];
 try{localStorage.setItem('mf_skins',JSON.stringify(savedSkins));}catch{}
 applySkin(a,skinId);if(selected===charId){renderSkins();previewCharacter();}
}
function renderSkins(){
 const box=$('skin-picker');if(!box)return;box.replaceChildren();
 const list=SKINS[selected]||[];box.hidden=!list.length;if(!list.length)return;
 const label=document.createElement('span');label.className='skin-label';label.textContent='UITERLIJK';box.append(label);
 const cur=savedSkins[selected]||'';
 const mk=(id,name,title)=>{const b=document.createElement('button');b.type='button';b.className='skin-chip'+((cur===id)?' active':'');b.textContent=name;b.title=title;b.addEventListener('click',()=>chooseSkin(selected,id));box.append(b);};
 mk('','Standaard','Het normale pak');for(const s of list)mk(s.id,s.name,s.note);
 const d=ROSTER.find(x=>x.id===selected),sk=list.find(k=>k.id===cur);
 $('stat-health').textContent=Math.round(d.hp*BAL[d.team].hp*(sk?.hp||1));$('stat-power').textContent=Math.round(d.damage*BAL[d.team].dmg*(sk?.dmg||1));
}
function chooseCharacter(id){
 selected=id;const d=ROSTER.find(a=>a.id===id);team=d.team;
 $('character-name').textContent=d.name;$('character-role').textContent=d.role;$('character-power').textContent=d.id==='thor'?'Mjölnir · hamerslag':d.id==='widow'?'Elektrische wapenstok':d.power;$('character-description').textContent=d.description+(FLIERS.has(id)?' Druk op F om te vliegen.':'');
 $('stat-health').textContent=Math.round(d.hp*BAL[d.team].hp);$('stat-speed').textContent=d.speed;$('stat-power').textContent=Math.round(d.damage*BAL[d.team].dmg);
 $('stat-health').parentElement.style.setProperty('--stat',clamp(d.hp/270,0,1)*100+'%');$('stat-speed').parentElement.style.setProperty('--stat',clamp(d.speed/10,0,1)*100+'%');$('stat-power').parentElement.style.setProperty('--stat',clamp(d.damage/30,0,1)*100+'%');
 if($('selected-name'))$('selected-name').textContent=d.name;if($('selected-special'))$('selected-special').textContent=d.special;document.body.style.setProperty('--chosen-accent',d.team==='heroes'?'#82dcff':'#ff91a2');previewHalo.material.color.set(d.team==='heroes'?0x72dfff:0xff8297);
 document.querySelectorAll('.roster-card').forEach(e=>{e.classList.toggle('selected',e.dataset.id===id);e.setAttribute('aria-pressed',String(e.dataset.id===id));});
 previewCharacter();fillP2();renderSkins();
}
function fillRoster(){
 $('roster').replaceChildren();
 for(const d of ROSTER.filter(a=>a.team===team)){
  const b=document.createElement('button');b.type='button';b.className='roster-card';b.dataset.id=d.id;b.title=d.name+' · '+d.power;b.style.setProperty('--character-color',d.color);
  const img=document.createElement('img');img.className='portrait';img.alt='';img.src=portraits.get(d.id)||'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="180"><rect width="160" height="180" fill="'+d.color+'"/></svg>');
  const n=document.createElement('span');n.className='name';n.textContent=d.name;b.append(img,n);b.addEventListener('click',()=>chooseCharacter(d.id));$('roster').append(b);
 }
 document.querySelectorAll('[data-team]').forEach(e=>{e.classList.toggle('active',e.dataset.team===team);e.setAttribute('aria-pressed',String(e.dataset.team===team));});
 if(!ROSTER.some(a=>a.id===selected&&a.team===team))selected=ROSTER.find(a=>a.team===team).id;chooseCharacter(selected);
}
function fillP2(){
 const ds=ROSTER.filter(a=>a.team!==team);if(!ds.some(a=>a.id===p2id))p2id=ds[0].id;
 $('p2-select').replaceChildren(...ds.map(d=>{const o=document.createElement('option');o.value=d.id;o.textContent=d.name;o.selected=d.id===p2id;return o;}));
}
function chooseMode(value){mode=value;document.querySelectorAll('[data-mode]').forEach(e=>{e.classList.toggle('active',e.dataset.mode===mode);e.setAttribute('aria-pressed',String(e.dataset.mode===mode));});$('pvp-setup').hidden=mode!=='pvp';}
async function renderPortraits(){
 const r=renderer.isSoftwareRenderer?new SoftwareRenderer({canvas:document.createElement('canvas'),alpha:true}):new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(160,180);r.setPixelRatio(1);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.35;
 const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xddecff,0x8c6e70,3));const l=new THREE.DirectionalLight(0xffead4,4);l.position.set(-3,5,5);s.add(l);const fill=new THREE.DirectionalLight(0x75b8ff,2);fill.position.set(3,2,-2);s.add(fill);
 const c=new THREE.PerspectiveCamera(32,160/180,.1,30);
 for(const d of ROSTER){
  const rig=createCharacter(d);s.add(rig.group);rig.group.rotation.y=-.18;const h=rig.height||2.8;c.position.set(.18,h*.73,5.4*(h/2.8));c.lookAt(0,h*.63,0);updateCharacter(rig,.016,{time:1,moving:false,speed:0,attacking:0,talking:false,dead:false});r.render(s,c);portraits.set(d.id,r.domElement.toDataURL('image/png'));s.remove(rig.group);
  const img=document.querySelector('.roster-card[data-id="'+d.id+'"] img');if(img)img.src=portraits.get(d.id);await new Promise(resolve=>setTimeout(resolve,0));
 }
 r.dispose();r.forceContextLoss();
}
function startGame(){
 if(mode==='story')prepareStory();
 $('rematch-button').textContent='Opnieuw spelen';if($('objective'))$('objective').hidden=true;civ.autoHelp=mode!=='story';
 music.setMood('battle');state='playing';duel=null;currentInterior='';keys.clear();touch.clear();activateAudio();window.speechSynthesis?.cancel();dialogueUntil=0;nextDialogue=elapsed+1.6;score.heroes=score.villains=0;matchTime=180;clearEffects();
 assignSpawns();
 for(const a of actors)resetActor(a,{x:a.spawn.x,z:a.spawn.z,rotation:a.faceRot??(a.def.team==='heroes'?Math.PI:0)});
 players=[actors.find(a=>a.def.id===selected)];if(mode==='pvp')players.push(actors.find(a=>a.def.id===p2id));
 players.forEach((a,i)=>{a.player=i;a.marker.visible=true;a.marker.material.opacity=.9;a.marker.scale.setScalar(1.15);cameraStates[i].yaw=a.def.team==='heroes'?0:Math.PI;});
 $('menu').hidden=true;$('hud').hidden=false;$('result-modal').hidden=true;$('p2-hud').hidden=mode!=='pvp';$('split-divider').hidden=mode!=='pvp';$('dialogue').hidden=true;
 $('player-name').textContent=players[0].def.name;$('player-power').textContent=players[0].def.power;$('p2-name').textContent=players[1]?.def.name||'';
 $('mode-label').textContent=mode==='explore'?'VRIJ VERKENNEN':mode==='survival'?'OVERLEVEN · GOLVEN':mode==='story'?'VERHAAL · HOOFDSTUK '+((storyIndex%CHAPTERS.length)+1):mode==='battle100'?'RACE TOT 100 PUNTEN':mode==='endless'?'EINDELOOS · GEEN WINNAAR':mode==='pvp'?'LOKALE PvP · 15 TEGEN 15':'TEAMGEVECHT · 15 TEGEN 15';
 if($('scene-caption'))$('scene-caption').hidden=true;document.body.classList.add('in-game');document.body.classList.toggle('split-screen',mode==='pvp');resize();
 players.forEach((a,i)=>updateCamera(i,1,true));
 if(mode==='pvp'&&pvpFormat==='duel'){
   for(const a of actors)if(a.player<0){a.active=false;a.dead=true;a.group.visible=false;}
   duel=createDuel({players,onReset:resetDuelRound,onBanner:(text,meta)=>{if($('round-banner')){$('round-banner').textContent=text;$('round-banner').dataset.kind=meta.kind;$('round-banner').hidden=false;roundBannerUntil=elapsed+(meta.kind==='roundWin'?2.8:meta.kind==='suddenDeath'?3:1.05);}},onRoundEnd:(winner,wins)=>{players.forEach((a,i)=>score[a.def.team]=wins[i]);},onSuddenDeath:()=>players.forEach(a=>a.hp=1),onFinish:()=>finishMatch()});
   toast('1 tegen 1 · win twee rondes. Shift om te ontwijken.',4);
 }else if(mode==='survival')startSurvival();
 else if(mode==='story')startStory();
 else toast(mode==='explore'?'De teams zoeken elkaar op. Verken de wereld of doe mee aan het gevecht.':mode==='endless'?'Eindeloos: de punten lopen door en er is geen winnaar. Ga naar het menu om te stoppen.':mode==='battle100'?'Eerste team met 100 punten wint. Shift om te ontwijken.':'Eerste team met 15 punten wint. Shift om te ontwijken.',5);
 if(duel)civ.clear();else civ.spawn(world.bounds.maxX>100?16:6,players.map(p=>({x:p.group.position.x,z:p.group.position.z})));
 if(mode==='story'&&story){civ.forceHelp(story.need);storyProgress(true);}
 updateHud();
}

// ================= VERHAAL =================
const CHAPTERS=[
 {world:'newyork',title:'Overval in de stad',crooks:['electro','sabretooth','octopus'],allies:[],need:2,hp:.85,
  intro:['New York. Het is nacht in het centrum.','Een bende maakt de straten onveilig.','Burgers zitten klem. Jij bent de enige die kan helpen.'],
  start:'Ik hoor alarmen. Tijd om de stad te beschermen!',taunt:'Dit is onze stad nu, held!',allClear:'De boeven liggen er uit. Nu de burgers in nood redden!',
  outro:['De straten zijn weer veilig.','Maar dit was pas het begin…']},
 {world:'wakanda',title:'De bende slaat terug',crooks:['goblin','venom','mysterio','redskull'],allies:[],need:3,hp:1,
  intro:['Wakanda. Een nieuwe bende heeft de stad bezet.','Ze nemen burgers gevangen en eisen losgeld.','Laat zien dat niemand boven de wet staat.'],
  start:'Vier tegelijk. Dat is nog eens een uitdaging!',taunt:'Je komt te laat, held. Wij hebben de stad al!',allClear:'Alle boeven zijn verslagen. Red de laatste burgers!',
  outro:['De bende is opgerold.','Maar iemand trok de touwtjes…']},
 {world:'asgard',title:'De grote baas',crooks:['thanos','loki','hela'],allies:['ironman','thor'],need:2,hp:1,
  intro:['Asgard. Het gouden rijk trilt op zijn grondvesten.','Thanos wil de macht en zijn trawanten houden burgers gevangen.','Je bent niet alleen. Iron Man en Thor vechten aan jouw kant.'],
  start:'Dit is het! Samen stoppen we Thanos!',taunt:'Jullie zijn te laat. De macht is van mij!',allClear:'Thanos is verslagen! Red nu de laatste burgers!',
  outro:['Thanos ligt geslagen op de grond.','De stad is gered. Jij bent een echte held!']},
];
function prepareStory(){
 const d=ROSTER.find(r=>r.id===selected);if(d&&d.team!=='heroes')chooseCharacter('captain');
 const ch=CHAPTERS[storyIndex%CHAPTERS.length];if(worldId!==ch.world)loadWorld(ch.world);
}
function playCinema(lines,cb){
 cutLines=lines;cutCb=cb;cutStart=elapsed;cutIdx=-1;cutUntil=elapsed+3.6*lines.length;
 $('cinema').hidden=false;document.body.classList.add('cinema');keys.clear();
}
function skipCinema(){if(cutsceneActive())cutUntil=elapsed;}
function updateCinema(){
 if(!cutLines.length)return;
 if(elapsed<cutUntil){const i=Math.min(cutLines.length-1,Math.floor((elapsed-cutStart)/3.6));if(i!==cutIdx){cutIdx=i;$('cinema-text').textContent=cutLines[i];}return;}
 $('cinema').hidden=true;document.body.classList.remove('cinema');const cb=cutCb;cutLines=[];cutCb=null;cutIdx=-1;cb?.();
}
function camCinema(dt){
 const s=cameraStates[0];
 if(cutsceneActive()){s.yaw+=dt*.32;s.pitch=.3;s.distance=Math.min(17,s.distance+dt*4);}
 else if(s.distance>10.5)s.distance=Math.max(10.5,s.distance-dt*8);
}
function sayAs(actor,line,secs=4.5){
 if(!actor)return;
 currentTalker=actor;dialogueUntil=elapsed+secs;nextDialogue=dialogueUntil+3;
 $('dialogue-speaker').textContent=actor.def.name;$('dialogue-line').textContent=line;$('dialogue').hidden=false;
 const avatar=$('dialogue-avatar');avatar.replaceChildren();
 if(portraits.has(actor.def.id)){const img=document.createElement('img');img.src=portraits.get(actor.def.id);img.alt='';img.style.cssText='width:60px;height:70px;object-fit:contain';avatar.append(img);}else avatar.textContent='✦';
 if(settings.sound&&window.speechSynthesis){try{
  const synth=window.speechSynthesis,id=actor.def.id,heavy=['hulk','abomination','thanos','venom','sabretooth'].includes(id),quick=['deadpool','spiderman','antman'].includes(id);
  const u=new SpeechSynthesisUtterance(line);u.lang='nl-NL';u.rate=heavy?.87:quick?1.08:.98;u.pitch=heavy?.77:quick?1.12:['wanda','widow','captainmarvel','hela'].includes(id)?1.14:.97;u.volume=.85;
  const voices=synth.getVoices().filter(v=>v.lang.toLowerCase().startsWith('nl'));if(voices[0])u.voice=voices[0];
  synth.cancel();synth.speak(u);
 }catch{}}
}
function startStory(){
 const ch=CHAPTERS[storyIndex%CHAPTERS.length],me=players[0];
 story={ch,total:ch.crooks.length,down:0,resc:0,need:ch.need};
 const crooks=[],allies=[];
 for(const a of actors){
  if(a===me)continue;
  if(a.def.team==='villains'&&ch.crooks.includes(a.def.id))crooks.push(a);
  else if(a.def.team==='heroes'&&ch.allies.includes(a.def.id))allies.push(a);
  else{a.active=false;a.dead=true;a.group.visible=false;a.respawn=0;}
 }
 const place=(a,x,z,face)=>{const p=freeNear(x,z,a.radius);a.group.position.set(p.x,0,p.z);a.spawn.set(p.x,0,p.z);a.group.rotation.y=Math.atan2(face.x-p.x,face.z-p.z);};
 const meSpot={x:0,z:34};place(me,meSpot.x,meSpot.z,{x:0,z:-10});cameraStates[0].yaw=0;
 allies.forEach((a,i)=>place(a,(i?1:-1)*4,38,{x:0,z:-10}));
 crooks.forEach((a,i)=>{const ang=i/Math.max(1,crooks.length)*Math.PI*2,r=crooks.length>1?9:0;place(a,Math.cos(ang)*r,-10+Math.sin(ang)*r,meSpot);a.maxHp=Math.round(a.maxHp*ch.hp);a.hp=a.maxHp;});
 story.crooks=crooks;
 updateCamera(0,1,true);
 playCinema(ch.intro,()=>{
  sayAs(me,ch.start,4);
  setTimeout(()=>{if(state==='playing'&&mode==='story'&&story&&crooks[0])sayAs(crooks[0],ch.taunt,4);},4200);
  toast('Hoofdstuk '+((storyIndex%CHAPTERS.length)+1)+' · '+ch.title,4);
 });
}
function storyProgress(initial=false){
 if(!story)return;
 const o=$('objective');o.hidden=false;
 o.textContent='Boeven: '+story.down+'/'+story.total+'  ·  Burgers gered: '+Math.min(story.resc,story.need)+'/'+story.need;
 if(initial)return;
 if(story.down>=story.total&&story.resc>=story.need){storyWin();return;}
 if(story.down>=story.total&&!story.saidClear){story.saidClear=true;sayAs(players[0],story.ch.allClear,4.5);}
 if(story.resc>=story.need&&story.down<story.total&&!story.saidSaved){story.saidSaved=true;toast('Alle burgers zijn gered. Versla nu de laatste boeven!',3.5);}
}
function showResult(title,detail,btn){
 state='result';keys.clear();window.speechSynthesis?.cancel();
 $('result-title').textContent=title;$('result-detail').textContent=detail;$('rematch-button').textContent=btn;
 $('result-modal').hidden=false;$('dialogue').hidden=true;if($('objective'))$('objective').hidden=true;resize();
}
function storyWin(){
 if(!story||story.won)return;story.won=true;
 const ch=story.ch,last=(storyIndex%CHAPTERS.length)===CHAPTERS.length-1,me=players[0];
 if(me)me.invulnerable=60;
 playCinema(ch.outro,()=>{
  const n=storyIndex%CHAPTERS.length+1;
  if(last){storyIndex=0;showResult('Verhaal voltooid!','Je hebt alle misdaden gestopt. De stad is veilig dankzij jou.','Opnieuw vanaf hoofdstuk 1');}
  else{storyIndex++;showResult('Hoofdstuk '+n+' voltooid!',ch.title+' · volgende: '+CHAPTERS[storyIndex%CHAPTERS.length].title,'Volgende hoofdstuk');}
 });
}
function storyFail(){
 if(!story||story.won||state!=='playing')return;
 const n=storyIndex%CHAPTERS.length+1;
 showResult('Mislukt.','Je werd verslagen in hoofdstuk '+n+'. Probeer het opnieuw.','Opnieuw proberen');
}
window.addEventListener('keydown',e=>{if(cutsceneActive()&&(e.code==='Enter'||e.code==='Space'||e.code==='Escape')){skipCinema();e.preventDefault();}},true);
document.getElementById('cinema')?.addEventListener('click',skipCinema);
function awardCivilian(a,text){
 if(!a||a.player<0||duel)return;
 a.kills=(a.kills||0)+1;koTotal++;score[a.def.team]++;toast(text,2.2);sound('special',.05);
}
const civ=createCivilians({scene,createCharacter,updateCharacter,slideMove,blocked,getWorld:()=>world,
 onRescue:(hero)=>{awardCivilian(hero,'Burger gered! +1 KO');if(mode==='story'&&story&&hero.player>=0){story.resc++;storyProgress();}},onKill:(a)=>awardCivilian(a,'Burger uitgeschakeld +1 KO'),say:(t)=>toast(t,3)});
window.__mf={civilians:()=>civ.count};
function freeNear(x,z,r){
 for(let ring=0;ring<8;ring++)for(let k=0;k<(ring?12:1);k++){
  const ang=k/12*Math.PI*2,px=x+Math.cos(ang)*ring*2.2,pz=z+Math.sin(ang)*ring*2.2;
  if(!blocked(px,pz,r+.3,0,world.colliders,world.bounds))return {x:px,z:pz};
 }
 return {x,z};
}
// Elk potje beginnen de teams op een andere plek: het midden of een van de vier hoeken.
function assignSpawns(){
 const zones=world.spawnZones;for(const a of actors)a.faceRot=undefined;
 if(!zones||zones.length<2)return;
 const hi=Math.floor(Math.random()*zones.length);let vi=Math.floor(Math.random()*(zones.length-1));if(vi>=hi)vi++;
 const place=(team,zone,other)=>{
  const rot=Math.atan2(other.x-zone.x,other.z-zone.z),fx=Math.sin(rot),fz=Math.cos(rot);let i=0;
  for(const a of actors){
   if(a.def.team!==team)continue;
   const col=(i%5)-2,row=Math.floor(i/5)-1,cx=zone.x+col*3.1*fz-row*4*fx,cz=zone.z-col*3.1*fx+row*4*fz;
   const p=freeNear(cx,cz,a.radius);a.spawn.set(p.x,0,p.z);a.faceRot=rot;i++;
  }
 };
 place('heroes',zones[hi],zones[vi]);place('villains',zones[vi],zones[hi]);
}
function startSurvival(){
 wave=0;waveBreak=0;survKills=0;
 for(const a of actors)if(a.player<0){a.active=false;a.dead=true;a.group.visible=false;a.respawn=0;}
 nextWave();
}
function nextWave(){
 const me=players[0];if(!me||state!=='playing')return;wave++;
 const foes=actors.filter(a=>a.player<0&&a.def.team!==me.def.team);
 for(let i=foes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[foes[i],foes[j]]=[foes[j],foes[i]];}
 const count=Math.min(foes.length,2+wave),hpMul=1+.1*(wave-1);
 for(const a of foes.slice(0,count)){resetActor(a,{x:a.spawn.x,z:a.spawn.z,rotation:a.def.team==='heroes'?Math.PI:0});a.maxHp=Math.round(a.def.hp*hpMul);a.hp=a.maxHp;a.invulnerable=1.5;burst(eye(a),effectColors[a.def.id],2.5,'sphere',.8);}
 if(wave>1){me.hp=Math.min(me.maxHp,me.hp+me.maxHp*.3);me.invulnerable=Math.max(me.invulnerable,1.5);}
 toast('Golf '+wave+' · '+count+' tegenstanders',3.5);updateHud();
}
function resetDuelRound({round}){
 clearEffects();keys.clear();touch.clear();currentTalker=null;dialogueUntil=0;$('dialogue').hidden=true;
 for(let i=0;i<players.length;i++){
  const a=players[i],spawn={x:a.spawn.x,z:a.spawn.z};resetActor(a,spawn);a.player=i;a.maxHp=a.def.id==='deadpool'?240:180;a.hp=a.maxHp;
  const side=a.def.team==='heroes'?1:-1;let point={x:-side*6,z:side*11};
  if(blocked(point.x,point.z,a.radius,0,world.colliders,world.bounds))point=spawn;
  a.group.position.set(point.x,0,point.z);a.group.rotation.y=side>0?Math.PI:0;cameraStates[i].yaw=side>0?0:Math.PI;updateCamera(i,1,true);
 }
 $('mode-label').textContent='DUEL · RONDE '+round+' · BESTE VAN 3';
}
function cutsceneActive(){return elapsed<cutUntil;}
function canAct(){return state==='playing'&&(!duel||duel.canAct)&&!cutsceneActive();}
function showMenu(){
 cutUntil=0;cutLines=[];cutCb=null;story=null;if($('cinema'))$('cinema').hidden=true;document.body.classList.remove('cinema');if($('objective'))$('objective').hidden=true;civ.clear();music.setMood('calm');koTotal=0;for(const a of actors)a.kills=0;state='menu';duel=null;keys.clear();touch.clear();window.speechSynthesis?.cancel();$('menu').hidden=false;$('hud').hidden=true;$('result-modal').hidden=true;$('dialogue').hidden=true;$('split-divider').hidden=true;$('toast').hidden=true;if($('round-banner'))$('round-banner').hidden=true;toastUntil=0;document.body.classList.remove('in-game','split-screen');if($('scene-caption'))$('scene-caption').hidden=false;
 players=[];for(const a of actors)resetActor(a,{x:a.spawn.x,z:a.spawn.z});previewCharacter();clearEffects();resize();
}

const fxGeo={sphere:new THREE.SphereGeometry(1,10,8),ring:new THREE.TorusGeometry(1,.035,6,40),beam:new THREE.CylinderGeometry(1,1,1,7),arrow:new THREE.ConeGeometry(.13,.65,7),webRing:new THREE.TorusGeometry(.68,.018,4,16),webCross:new THREE.TorusGeometry(.65,.014,4,16)};
function luminous(color,opacity=1){return new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});}
function burst(position,color,size=2,kind='ring',life=.55){
 const mesh=new THREE.Mesh(kind==='ring'?fxGeo.ring:fxGeo.sphere,luminous(color,.7));mesh.position.copy(position);if(kind==='ring'){mesh.rotation.x=-Math.PI/2;mesh.position.y=Math.max(.12,mesh.position.y);}mesh.scale.setScalar(.15);scene.add(mesh);effects.push({mesh,life,max:life,size,kind});return mesh;
}
function beamBetween(from,to,color,width=.08,life=.2){
 const delta=to.clone().sub(from),m=new THREE.Mesh(fxGeo.beam,luminous(color));m.position.copy(from).add(to).multiplyScalar(.5);m.scale.set(width,delta.length(),width);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());scene.add(m);effects.push({mesh:m,life,max:life,size:1,kind:'beam'});
}
function particles(position,color,count=10){
 if(!settings.high)count=Math.min(count,4);
 for(let i=0;i<count;i++){const m=new THREE.Mesh(fxGeo.sphere,luminous(color,.85));m.position.copy(position);m.scale.setScalar(.06+Math.random()*.09);scene.add(m);const life=.3+Math.random()*.4;effects.push({mesh:m,life,max:life,size:m.scale.x,kind:'particle',velocity:new THREE.Vector3((Math.random()-.5)*7,Math.random()*5,(Math.random()-.5)*7)});}
}
function removeNode(node){node.removeFromParent();node.traverse(o=>{if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
function clearEffects(){for(const s of shots){removeNode(s.mesh);if(s.tether)removeNode(s.tether);}for(const e of effects)removeNode(e.mesh);shots=[];effects=[];}
function eye(a){return a.group.position.clone().add(new THREE.Vector3(0,(a.rig.height||2.8)*a.group.scale.y*.6,0));}
function canTarget(a,b){
 if(!a||!b||a===b||b.dead||b.active===false||a.def.team===b.def.team)return false;
 // Free exploration stays safe until a human player joins the fighting.
 return mode!=='explore'||a.player>=0||b.player<0||b.aggro>0;
}
function nearestEnemy(a,range=Infinity){
 let result=null,best=range*range;
 for(const b of actors){if(!canTarget(a,b))continue;const d=a.group.position.distanceToSquared(b.group.position);if(d<best&&clearSight(eye(a),eye(b),world.colliders)){best=d;result=b;}}
 return result;
}
function face(a,dx,dz,rate=1){if(Math.abs(dx)+Math.abs(dz)<.0001)return;const target=Math.atan2(dx,dz),diff=Math.atan2(Math.sin(target-a.group.rotation.y),Math.cos(target-a.group.rotation.y));a.group.rotation.y+=diff*rate;}
function shoot(a,target=null,damageFactor=1,spread=0,overrideColor=null,overrideSpec=null){
 const spec=overrideSpec||SPECS[a.def.id],color=overrideColor||effectColors[a.def.id];
 a.group.updateMatrixWorld(true);
 const hand=a.rig.hands[a.def.id==='hawkeye'||a.def.id==='captain'||a.def.id==='thanos'?0:1];
 const from=a.def.id==='vision'?(a.rig.accessories.foreheadGem||a.rig.head).getWorldPosition(new THREE.Vector3()):hand?hand.getWorldPosition(new THREE.Vector3()):eye(a);from.y=Math.max(from.y,a.group.position.y+1.05);
 let to;
 if(target)to=eye(target);else if(a.player===0&&pointerKnown)to=aimPoint.clone().setY(from.y);else to=from.clone().add(new THREE.Vector3(Math.sin(a.group.rotation.y),0,Math.cos(a.group.rotation.y)).multiplyScalar(20));
 const dir=to.sub(from).normalize();if(spread)dir.applyAxisAngle(new THREE.Vector3(0,1,0),spread);face(a,dir.x,dir.z);from.addScaledVector(dir,.3);
 const mesh=createProjectileVisual(a.def.id,spec.kind,color);
 mesh.position.copy(from);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);scene.add(mesh);
 let tether=null;if(spec.kind==='web'){tether=new THREE.Mesh(fxGeo.beam,new THREE.MeshBasicMaterial({color:0xeafaff,transparent:true,opacity:.88}));scene.add(tether);}
 shots.push({mesh,tether,from:from.clone(),dir,speed:spec.speed||28,life:(spec.range+4)/(spec.speed||28),a,damage:(spec.damage??a.def.damage)*damageFactor,kind:spec.kind,slow:spec.slow||0,splash:spec.splash||0,color,travel:0});
 if(!['arrow','web','shield','dagger','bullet'].includes(spec.kind))particles(from,color,2);
}
function visualEffect(mesh,position,life=.35,kind='visual',follow=null){
 mesh.position.copy(position);scene.add(mesh);mesh.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.transparent=true;m.userData.originalOpacity=m.opacity;}});
 effects.push({mesh,life,max:life,size:1,kind,follow,baseScale:mesh.scale.clone()});return mesh;
}
function meleeFlash(a,target){
 const direction=new THREE.Vector3(Math.sin(a.group.rotation.y),0,Math.cos(a.group.rotation.y));
 const m=createMeleeVisual(a.def.id,effectColors[a.def.id]);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction);
 visualEffect(m,eye(a).addScaledVector(direction,1),.32);
 if(a.def.id==='thor'&&target){const spark=createProjectileVisual('thor','lightning','#9ce8ff');spark.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),eye(target).sub(eye(a)).normalize());visualEffect(spark,eye(target),.25);}
}
function wrapWeb(target){
 if(target.webbedUntil>elapsed)return;target.webbedUntil=elapsed+1.6;
 const net=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:0xf1fdff,transparent:true,opacity:.85});
 for(let i=0;i<3;i++){const r=new THREE.Mesh(fxGeo.webRing,material);r.rotation.x=Math.PI/2;r.position.y=(i-1)*.35;net.add(r);}
 for(let i=0;i<4;i++){const r=new THREE.Mesh(fxGeo.webCross,material);r.scale.y=1.15;r.rotation.y=i*Math.PI/4;net.add(r);}
 visualEffect(net,eye(target),1.6,'attached',target);
}

const PISTOL={range:26,rate:.28,speed:52,damage:14,kind:'bullet'};
function firePistol(a){
 if(!a||a.def.id!=='deadpool'||a.dead||a.stun>0||a.pistolCooldown>0||!canAct())return;
 if(a.player>=0)a.aggro=18;
 a.pistolCooldown=PISTOL.rate;a.pistolAnim=1;a.attackAnim=0;
 a.pendingPistol={delay:.07,target:nearestEnemy(a,PISTOL.range)};
 if(a.player>=0)sound('shot',.045);
}
function meleeRange(a){return SPECS[a.def.id].range*(a.def.id==='antman'?Math.max(1,a.group.scale.y):1);}
function movementModifier(a){return (a.speedBuff>0?1.35:1)*(a.def.id==='antman'&&a.grow>0?.82:1);}
function attack(a){
 if(!a||a.dead||a.cooldown>0||a.stun>0||!canAct())return;
 if(a.player>=0&&a.def.team==='villains'&&!duel)civ.tryKill(a,['melee','hammer','tentacle'].includes(SPECS[a.def.id].kind)?4.8:9);
 const spec=SPECS[a.def.id];if(a.player>=0)a.aggro=18;a.cooldown=spec.rate;a.pistolAnim=0;a.pendingPistol=null;a.attackAnim=1;const target=nearestEnemy(a,meleeRange(a)+1);
 if(a.player>=0)sound('shot',.035);
 if(spec.kind==='melee'||spec.kind==='hammer'){
   if(target){face(a,target.group.position.x-a.group.position.x,target.group.position.z-a.group.position.z);damage(target,a.def.damage*(a.def.id==='antman'?1+.65*clamp((a.group.scale.y-1)/.6,0,1):1),a);}
   meleeFlash(a,target);
 }else if(spec.kind==='tentacle'){
   if(target){damage(target,a.def.damage,a);face(a,target.group.position.x-a.group.position.x,target.group.position.z-a.group.position.z);}meleeFlash(a,target);
 }else a.pendingAttack={delay:a.def.id==='hawkeye'?.14:.07,target};
}
function damage(target,amount,attacker,slow=0){
 if(!canAct()||!canTarget(attacker,target)||target.invulnerable>0)return;
 if(mode==='survival'&&attacker.player<0)amount*=1+.06*(wave-1);
 if(attacker.skin?.dmg)amount*=attacker.skin.dmg;
 amount*=BAL[attacker.def.team].dmg;
 if(duel){const spec=SPECS[attacker.def.id];amount*=clamp(34*spec.rate/attacker.def.damage,.6,1.4)*(['melee','hammer'].includes(spec.kind)?1.2:1);}
 if(attacker.player>=0)attacker.aggro=18;
 target.hp=Math.max(0,target.hp-amount);target.hurt=.22;target.aggro=12;target.lastAttacker=attacker;target.slow=Math.max(target.slow,slow);particles(eye(target),effectColors[attacker.def.id],5);
 if(target.player>=0)sound('hit',.06);
 if(target.hp<=0){
   target.dead=true;target.healing=0;target.pendingAttack=null;target.pendingPistol=null;target.respawn=5;target.group.visible=false;burst(eye(target),target.def.team==='heroes'?'#5fbfff':'#ff6a86',2.5,'sphere',.7);
   attacker.kills=(attacker.kills||0)+1;if(attacker.player>=0&&target.player<0)koTotal++;
   if(duel){duel.knockout(target.player);return;}
   if(mode==='story'){
     if(target.player>=0){storyFail();return;}
     if(target.def.team==='villains'&&story){
       if(attacker.player>=0)toast('KO · '+target.def.name,2);
       story.down++;
       if(story.down===1&&story.total>1)sayAs(players[0],'Eén is neergegaan. Er zijn er nog meer!',3.5);
       storyProgress();
     }
     return;
   }
   if(mode==='survival'){
     if(target.player>=0){finishMatch();return;}
     survKills++;score[attacker.def.team]=survKills;if(attacker.player>=0)toast('KO · '+target.def.name,2);
     if(!actors.some(a=>a.player<0&&a.active!==false&&!a.dead)&&waveBreak<=0){waveBreak=3;toast('Golf '+wave+' gehaald! Volgende golf komt eraan…',3);}
     return;
   }
   score[attacker.def.team]+=isLeader(target)?3:1;
   if(isLeader(target))toast('De aanvoerder '+target.def.name+' is gevallen! +3 punten',3.5);
   if(attacker.player>=0)toast('KO · '+target.def.name,2);
   if(target.player>=0)toast(target.def.name+' keert over 5 seconden terug.',3);
   const goal=mode==='battle100'?100:15;
   if(mode!=='explore'&&mode!=='endless'&&(score.heroes>=goal||score.villains>=goal))finishMatch();
 }
}
function area(a,radius,amount,slow=0,knockback=0){
 for(const b of actors){if(!canTarget(a,b))continue;const d=b.group.position.clone().sub(a.group.position),len=d.length();if(len<radius&&clearSight(eye(a),eye(b),world.colliders)){damage(b,amount,a,slow);if(knockback&&len>.01)slideMove(b.group.position,d.x/len*knockback,d.z/len*knockback,b.radius,world.colliders,world.bounds,bodyHeight(b));}}
}
function special(a){
 if(!a||a.dead||a.specialCooldown>0||a.stun>0||!canAct())return;
 const s=SPECS[a.def.id].special,color=effectColors[a.def.id];
 if(s==='shrink'&&a.nextPym==='grow'&&blocked(a.group.position.x,a.group.position.z,baseRadius(a.def.id)*1.6,a.group.position.y,world.colliders,world.bounds,a.rig.height*1.6)){if(a.player>=0)toast('Te weinig ruimte om te groeien. Loop naar een open plek.',2.5);return;}
 if(a.player>=0&&s!=='healing')a.aggro=18;a.specialCooldown=s==='healing'?12:8;a.attackAnim=1;const p=a.group.position.clone();p.y+=.15;
 if(a.player>=0){sound('special',.08);toast(a.def.name+' · '+a.def.special,2);}
 switch(s){
 case 'web':
   burst(p,color,12,'ring',.7);area(a,12,a.def.damage*1.4,4);
   for(const b of actors)if(canTarget(a,b)&&b.group.position.distanceTo(a.group.position)<12)beamBetween(eye(a),eye(b),color,.025,.7);break;
 case 'unibeam':case 'photon':{
   const b=nearestEnemy(a,36),from=eye(a),to=b?eye(b):from.clone().add(new THREE.Vector3(Math.sin(a.group.rotation.y),0,Math.cos(a.group.rotation.y)).multiplyScalar(30));beamBetween(from,to,color,.34,.65);
   if(b){damage(b,a.def.damage*4,a);burst(eye(b),color,3,'sphere',.6);}break;}
 case 'shield':
   a.invulnerable=4;a.hp=Math.min(a.maxHp,a.hp+25);burst(eye(a),'#87bfff',3,'sphere',1.1);area(a,6,a.def.damage*1.6,1.5,2);break;
 case 'storm':
   burst(p,color,16,'ring',.8);for(const b of actors)if(canTarget(a,b)&&b.group.position.distanceTo(a.group.position)<17&&clearSight(eye(a),eye(b),world.colliders)){beamBetween(eye(b).add(new THREE.Vector3(.4,24,0)),eye(b),color,.15,.65);damage(b,a.def.damage*1.9,a,1.5);}break;
 case 'slam':case 'shock':case 'kinetic':case 'arms':case 'symbiote':case 'tesseract':{
   const r={slam:10,shock:8,kinetic:9,arms:10,symbiote:8,tesseract:11}[s];burst(p,color,r,'ring',.8);burst(eye(a),color,r*.3,'sphere',.6);area(a,r,a.def.damage*2.2,s==='shock'?2:1,3);
   if(s==='symbiote')a.hp=Math.min(a.maxHp,a.hp+35);if(s==='arms')for(let i=0;i<4;i++){const angle=i*Math.PI/2;beamBetween(eye(a),p.clone().add(new THREE.Vector3(Math.sin(angle)*r,1,Math.cos(angle)*r)),color,.13,.65);}break;}
 case 'metalstorm':case 'arrows':case 'swarm':case 'bombs':case 'blades':case 'stones':{
   const opponents=actors.filter(b=>canTarget(a,b)&&a.group.position.distanceTo(b.group.position)<32&&clearSight(eye(a),eye(b),world.colliders));
   for(let i=0;i<(duel?4:7);i++)shoot(a,opponents[i%Math.max(1,opponents.length)]||null,duel?1.05:1.6,opponents.length?0:(i-3)*.16,s==='stones'?['#a870ff','#54b5ff','#ffce45','#ff4b63','#5fff9e','#ff9b43'][i%6]:null);break;}
 case 'portal':{
   const front=new THREE.Vector3(Math.sin(a.group.rotation.y),0,Math.cos(a.group.rotation.y));burst(eye(a),color,2,'sphere',.7);slideMove(a.group.position,front.x*8,front.z*8,a.radius,world.colliders,world.bounds,bodyHeight(a));burst(eye(a),color,3,'sphere',.7);a.invulnerable=2;area(a,8,a.def.damage*2.1,2);break;}
 case 'chaos':
   burst(p,color,14,'ring',1);area(a,14,a.def.damage*2.1,3);for(const b of actors)if(canTarget(a,b)&&b.group.position.distanceTo(a.group.position)<14)b.stun=1.5;break;
 case 'illusion':case 'mist':
   a.invulnerable=3;a.speedBuff=4;burst(eye(a),color,6,'sphere',1.6);area(a,9,a.def.damage*1.6,3);
   for(let i=0;i<3;i++){const angle=i*TAU/3;burst(eye(a).add(new THREE.Vector3(Math.sin(angle)*3,0,Math.cos(angle)*3)),color,2,'sphere',2);}break;
 case 'shrink':
   if(a.nextPym==='grow'){a.grow=6;a.shrink=0;a.speedBuff=0;a.nextPym='shrink';}else{a.shrink=6;a.grow=0;a.speedBuff=6;a.nextPym='grow';if(a.group.position.y<=groundHeight(a,a.group.position.y)+.05)a.vy=4.5;}a.invulnerable=.65;meleeFlash(a,null);break;
 case 'healing':
   a.healing=3;burst(p,'#e75b6a',1.7,'ring',.8);particles(eye(a),'#ff969a',6);break;
 case 'regenerate':
   a.hp=Math.min(a.maxHp,a.hp+45);a.speedBuff=4;area(a,4.5,a.def.damage*1.4,0,1.5);meleeFlash(a,null);break;
 case 'density':
   a.invulnerable=3;a.hp=Math.min(a.maxHp,a.hp+18);visualEffect(createProjectileVisual('vision','beam',color),eye(a),.8);break;
 case 'runes':
   a.invulnerable=1.5;area(a,11,a.def.damage*1.7,2);for(let i=0;i<4;i++){const m=createProjectileVisual('doom','ring',color);m.scale.setScalar(1.8);visualEffect(m,eye(a).add(new THREE.Vector3(Math.sin(i*Math.PI/2)*3,0,Math.cos(i*Math.PI/2)*3)),.9);}break;
 case 'chain':{
   const victims=actors.filter(b=>canTarget(a,b)&&a.group.position.distanceTo(b.group.position)<22&&clearSight(eye(a),eye(b),world.colliders)).sort((b,c)=>a.group.position.distanceToSquared(b.group.position)-a.group.position.distanceToSquared(c.group.position)).slice(0,4);
   let from=eye(a);for(const b of victims){const to=eye(b),m=createProjectileVisual('electro','lightning',color),delta=to.clone().sub(from);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),delta.clone().normalize());m.scale.z=Math.max(1,delta.length()/2);visualEffect(m,from.clone().add(to).multiplyScalar(.5),.5,'beam');damage(b,a.def.damage*1.8,a,.7);from=to;}break;}
 case 'hunt':{
   const target=nearestEnemy(a,16);a.speedBuff=4;a.invulnerable=1.2;if(a.def.id==='sabretooth'&&a.group.position.y<=groundHeight(a,a.group.position.y)+.05)a.vy=4.5;
   if(target){const d=target.group.position.clone().sub(a.group.position).normalize();slideMove(a.group.position,d.x*9,d.z*9,a.radius,world.colliders,world.bounds,bodyHeight(a));}area(a,5,a.def.damage*3,1,2);burst(p,color,5,'ring',.6);break;}
 }
}
function updateProjectiles(dt){
 for(let i=shots.length-1;i>=0;i--){
   const s=shots[i],before=s.mesh.position.clone();s.mesh.position.addScaledVector(s.dir,s.speed*dt);s.life-=dt;s.travel+=dt*s.speed;
   if(['shield','ring','bomb'].includes(s.kind))s.mesh.rotateZ(dt*12);
   let hit=false;
   if(!clearSight(before,s.mesh.position,world.colliders,.08))hit=true;
   if(!hit)for(const b of actors){
     if(!canTarget(s.a,b))continue;
     const center=eye(b),seg=s.mesh.position.clone().sub(before),t=clamp(center.clone().sub(before).dot(seg)/Math.max(.0001,seg.lengthSq()),0,1),closest=before.clone().addScaledVector(seg,t);
     if(closest.distanceTo(center)<b.radius+.48){damage(b,s.damage,s.a,s.slow);if(s.kind==='web')wrapWeb(b);hit=true;if(s.splash)for(const c of actors)if(c!==b&&canTarget(s.a,c)&&c.group.position.distanceTo(b.group.position)<s.splash&&clearSight(eye(b),eye(c),world.colliders))damage(c,s.damage*.65,s.a);break;}
   }
   if(hit&&s.kind==='bullet')particles(s.mesh.position,'#ffc76f',3);
   else if(hit&&s.kind!=='web'&&s.kind!=='arrow'){const hitVisual=createMeleeVisual(s.a.def.id,s.color);visualEffect(hitVisual,s.mesh.position,.3);if(s.splash)burst(s.mesh.position,s.color,s.splash,'sphere',.3);}
   if(s.tether){const d=s.mesh.position.clone().sub(s.from);s.tether.position.copy(s.from).addScaledVector(d,.5);s.tether.scale.set(.017,Math.max(.01,d.length()),.017);s.tether.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}if(hit||s.life<=0){removeNode(s.mesh);if(s.tether)removeNode(s.tether);shots.splice(i,1);}
 }
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;const f=1-e.life/e.max;
   if(e.kind==='particle'){e.mesh.position.addScaledVector(e.velocity,dt);e.velocity.y-=dt*7;}else if(e.kind==='attached'){if(e.follow&&!e.follow.dead)e.mesh.position.copy(eye(e.follow));else e.life=0;}else if(e.kind==='visual')e.mesh.scale.copy(e.baseScale).multiplyScalar(.85+f*.65);else if(e.kind!=='beam')e.mesh.scale.setScalar(Math.max(.001,e.size*(.1+f)));
   e.mesh.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.opacity=Math.max(0,(1-f)*(m.userData.originalOpacity??.75));});if(e.life<=0){removeNode(e.mesh);effects.splice(i,1);}
 }
}
function finishMatch(){
 state='result';keys.clear();window.speechSynthesis?.cancel();const winner=score.heroes===score.villains?null:score.heroes>score.villains?'heroes':'villains';$('result-title').textContent=winner===null?'Gelijkspel.':winner==='heroes'?'De helden winnen.':'De slechteriken winnen.';$('result-detail').textContent=score.heroes+' – '+score.villains+' · '+worldNames[worldId];$('result-modal').hidden=false;$('dialogue').hidden=true;resize();
 if(mode==='survival'){let best=0;try{best=+localStorage.getItem('mf_best_wave')||0;if(wave>best){best=wave;localStorage.setItem('mf_best_wave',String(best));}}catch(e){}$('result-title').textContent='Gevallen in golf '+wave+'.';$('result-detail').textContent=survKills+' KO · record golf '+best+' · '+worldNames[worldId];}
 if(duel){$('result-title').textContent=players.find(a=>a.def.team===winner)?.def.name+' wint!';$('result-detail').textContent=duel.wins.join(' – ')+' rondes · '+worldNames[worldId];}
}

function groundHeight(a,oldY){
 let floor=0;const p=a.group.position;
 for(const b of world.colliders)if((b.height??99)<oldY+.25&&p.x>b.minX&&p.x<b.maxX&&p.z>b.minZ&&p.z<b.maxZ)floor=Math.max(floor,b.height||0);
 return floor;
}
function toggleFlight(a){
 if(!canAct()||!a||a.dead||a.stun>0||!FLIERS.has(a.def.id))return;
 a.flying=!a.flying;a.flightAxis=0;a.flyPulse=a.flying?.7:0;a.vy=a.flying?3:-1;
 if(a.player>=0)toast(a.def.name+(a.flying?' vliegt · springen = stijgen, '+(a.player===1?'numpad 1':'C')+' = dalen':' landt.'),2.5);
}
function verticalMotion(a,dt){
 const p=a.group.position,oldY=p.y,actorHeight=bodyHeight(a);
 if(a.flying){a.flyPulse=Math.max(0,a.flyPulse-dt);const vertical=(a.flyPulse>0?1:a.flightAxis)*(a.slow>0?2.5:6);a.vy=THREE.MathUtils.lerp(a.vy,vertical,1-Math.exp(-dt*9));p.y=clamp(p.y+a.vy*dt,0,32);if(p.y===32)a.vy=0;}
 else {a.vy-=dt*20;p.y+=a.vy*dt;}
 for(const b of world.colliders){
  const qx=clamp(p.x,b.minX,b.maxX),qz=clamp(p.z,b.minZ,b.maxZ);if((p.x-qx)**2+(p.z-qz)**2>a.radius*a.radius)continue;
  const underside=b.minY||0,top=b.height??99;
  if(p.y>oldY&&underside>0&&oldY+actorHeight<=underside+.06&&p.y+actorHeight>underside){p.y=Math.max(0,underside-actorHeight-.01);a.vy=0;}
  if(p.y<oldY&&oldY>=top-.05&&p.y<top){p.y=top;a.vy=0;}
 }
 const floor=groundHeight(a,oldY);if(p.y<=floor){p.y=floor;a.vy=0;}
}
function jump(a){if(!canAct()||!a||a.dead||a.stun>0)return;if(a.flying){a.flyPulse=.4;return;}if(a.group.position.y<=groundHeight(a,a.group.position.y)+.05){a.vy=8;particles(a.group.position,effectColors[a.def.id],3);}}
function dodge(a){if(!canAct()||!a||a.dead||a.stun>0||a.dashCooldown>0)return;a.dashDirection.copy(a.moveVelocity);if(a.dashDirection.lengthSq()<.1)a.dashDirection.set(Math.sin(a.group.rotation.y),0,Math.cos(a.group.rotation.y));a.dashDirection.normalize();a.dashRemaining=.16;a.dashCooldown=2.4;a.invulnerable=Math.max(a.invulnerable,.22);particles(a.group.position.clone().add(new THREE.Vector3(0,.15,0)),effectColors[a.def.id],8);}
function controlActor(a,index,dt){
 const p2=index===1;let x=0,z=0;
 const turn=(keys.has(p2?'Numpad4':'KeyJ')?1:0)-(keys.has(p2?'Numpad6':'KeyL')?1:0);cameraStates[index].yaw+=turn*dt*2.2;if(!p2)cameraStates[index].pitch=clamp(cameraStates[index].pitch+((keys.has('KeyI')?1:0)-(keys.has('KeyK')?1:0))*dt,.24,.68);
 if(keys.has(p2?'ArrowLeft':'KeyA')||(!p2&&touch.has('left')))x--;
 if(keys.has(p2?'ArrowRight':'KeyD')||(!p2&&touch.has('right')))x++;
 if(keys.has(p2?'ArrowUp':'KeyW')||(!p2&&touch.has('up')))z--;
 if(keys.has(p2?'ArrowDown':'KeyS')||(!p2&&touch.has('down')))z++;
 let sprint=keys.has(p2?'ShiftRight':'ShiftLeft')||(!p2&&touch.has('sprint'));
 a.flightAxis=(keys.has(p2?'ControlRight':'Space')||(!p2&&touch.has('rise'))?1:0)-(keys.has(p2?'Numpad1':'KeyC')||(!p2&&touch.has('descend'))?1:0);
 const pad=navigator.getGamepads?.()[index];
 if(pad){x+=Math.abs(pad.axes[0])>.15?pad.axes[0]:0;z+=Math.abs(pad.axes[1])>.15?pad.axes[1]:0;cameraStates[index].yaw-=Math.abs(pad.axes[2]||0)>.15?pad.axes[2]*dt*2.5:0;if(pad.buttons[0]?.pressed)jump(a);if(pad.buttons[7]?.pressed)attack(a);if(pad.buttons[5]?.pressed)special(a);sprint||=pad.buttons[10]?.pressed;if(pad.buttons[3]?.pressed&&!a.flightButton)toggleFlight(a);a.flightButton=!!pad.buttons[3]?.pressed;if(a.flying){if(pad.buttons[0]?.pressed)a.flightAxis=1;if(pad.buttons[1]?.pressed)a.flightAxis=-1;}}
 if(p2&&keys.has('Enter'))attack(a);if(!p2&&keys.has('Mouse0'))attack(a);if((p2&&keys.has('Numpad2'))||(!p2&&keys.has('Mouse2')))firePistol(a);
 const len=Math.max(1,Math.hypot(x,z));x/=len;z/=len;const yaw=cameraStates[index].yaw,dx=x*Math.cos(yaw)+z*Math.sin(yaw),dz=z*Math.cos(yaw)-x*Math.sin(yaw);
 const speed=a.def.speed*(sprint?1.45:1)*(a.flying?1.2:1)*(a.slow>0?.45:1)*movementModifier(a),response=1-Math.exp(-dt*(x||z?20:25));
 a.moveVelocity.x=THREE.MathUtils.lerp(a.moveVelocity.x,dx*speed,response);a.moveVelocity.z=THREE.MathUtils.lerp(a.moveVelocity.z,dz*speed,response);
 if(a.moveVelocity.lengthSq()<.008)a.moveVelocity.set(0,0,0);
 const vx=a.dashRemaining>0?a.dashDirection.x*25:a.moveVelocity.x,vz=a.dashRemaining>0?a.dashDirection.z*25:a.moveVelocity.z;
 const moved=slideMove(a.group.position,vx*dt,vz*dt,a.radius,world.colliders,world.bounds,bodyHeight(a));a.moving=moved>.001;a.moveSpeed=moved/Math.max(dt,.001);if(a.attackAnim<.4)face(a,vx,vz,1-Math.exp(-dt*18));
}
// Slim lopen: om obstakels heen, om elkaar heen, en vrijkomen als je vastzit.
function steerAround(a,d){
 const p=a.group.position,h=bodyHeight(a);let sx=0,sz=0;
 for(const b of actors){
  if(b===a||b.dead||b.active===false||Math.abs(p.y-b.group.position.y)>2)continue;
  const dx=p.x-b.group.position.x,dz=p.z-b.group.position.z,dist=Math.hypot(dx,dz),min=(a.radius+b.radius)*1.55+.7;
  if(dist>=min||dist<.001)continue;
  const w=(min-dist)/min;sx+=dx/dist*w;sz+=dz/dist*w;
  if((-dx*d.x-dz*d.z)/dist>.55){const side=a.avoidSide||(a.index%2?1:-1);sx+=-d.z*side*w*1.3;sz+=d.x*side*w*1.3;}
 }
 let vx=d.x+sx*1.5,vz=d.z+sz*1.5;const l=Math.hypot(vx,vz)||1;vx/=l;vz/=l;
 const look=1.7,hit=(x,z)=>blocked(p.x+x*look,p.z+z*look,a.radius,p.y,world.colliders,world.bounds,h);
 if(hit(vx,vz)){
  const pref=a.avoidSide||1;
  for(const ang of [.55,-.55,1.05,-1.05,1.6,-1.6,2.2,-2.2]){
   const t=ang*pref,c=Math.cos(t),s2=Math.sin(t),nx=vx*c-vz*s2,nz=vx*s2+vz*c;
   if(!hit(nx,nz)){vx=nx;vz=nz;a.avoidSide=ang>0?pref:-pref;break;}
  }
 }
 return {x:vx,z:vz};
}
function followPath(a,target,speed,dt){
 a.pathAge-=dt;
 if(a.pathAge<=0||!a.path.length){a.path=nav(a.group.position,target);a.pathAge=.9+Math.random()*.5;}
 while(a.path.length&&Math.hypot(a.path[0].x-a.group.position.x,a.path[0].z-a.group.position.z)<1)a.path.shift();
 const next=a.path[0]||target,d=new THREE.Vector3(next.x-a.group.position.x,0,next.z-a.group.position.z);const len=d.length();if(len<.4)return;
 d.divideScalar(len);
 const st=steerAround(a,d);d.x=st.x;d.z=st.z;
 const p=a.group.position;a.stuckT=(a.stuckT||0)+dt;
 if(a.stuckT>.7){
  const moved=Math.hypot(p.x-(a.stuckX??p.x),p.z-(a.stuckZ??p.z));
  if(moved<.4){a.avoidSide=-(a.avoidSide||1);a.pathAge=0;const side=a.avoidSide;a.path=[{x:p.x-d.z*side*6,z:p.z+d.x*side*6}];}
  a.stuckX=p.x;a.stuckZ=p.z;a.stuckT=0;
 }
 const blend=1-Math.exp(-dt*11);a.moveVelocity.x=THREE.MathUtils.lerp(a.moveVelocity.x,d.x*speed,blend);a.moveVelocity.z=THREE.MathUtils.lerp(a.moveVelocity.z,d.z*speed,blend);const movement=speed*dt;let moved=slideMove(a.group.position,a.moveVelocity.x*dt,a.moveVelocity.z*dt,a.radius,world.colliders,world.bounds,bodyHeight(a));
 if(moved<movement*.15){moved+=slideMove(a.group.position,-d.z*movement,d.x*movement,a.radius,world.colliders,world.bounds,bodyHeight(a));a.pathAge=0;}
 a.moving=moved>.001;a.moveSpeed=moved/Math.max(dt,.001);if(a.attackAnim<.4)face(a,d.x,d.z,Math.min(1,dt*8));
}
function npcFlightSpace(a,target){
 const p=a.group.position,floorY=groundHeight(a,p.y);let maxAltitude=32;
 for(const box of world.colliders){
  const underside=box.minY||0;if(underside<=p.y+.1)continue;
  const x=clamp(p.x,box.minX,box.maxX),z=clamp(p.z,box.minZ,box.maxZ);
  if((p.x-x)**2+(p.z-z)**2<=(a.radius+.15)**2)maxAltitude=Math.min(maxAltitude,underside-(a.rig.height||2.82)*a.group.scale.y-.4);
 }
 if(['melee','hammer','tentacle'].includes(SPECS[a.def.id].kind))maxAltitude=Math.min(maxAltitude,target.group.position.y+1.7);
 return {floorY,maxAltitude};
}
function updateAI(a,dt){
 if(a.stun>0){a.flightAxis=0;return;}
 a.nextAI-=dt;a.specialThink=Math.max(0,a.specialThink-dt);
 if(a.nextAI<=0||!canTarget(a,a.target)){
  let chosen=null,best=Infinity;
  for(const b of actors){
   if(!canTarget(a,b))continue;
   const distance=a.group.position.distanceTo(b.group.position);
   const rank=distance*(b===a.target?.78:1)+(clearSight(eye(a),eye(b),world.colliders)?0:7);
   if(rank<best){best=rank;chosen=b;}
  }
  if(chosen!==a.target)a.pathAge=0;
  a.target=chosen;a.nextAI=.35+(a.index%5)*.055;
 }
 const b=a.target;
 if(!b){updateNPCFlight(a,dt,{canFly:FLIERS.has(a.def.id),enabled:false,distance:Infinity,targetY:0,maxAltitude:32,floorY:groundHeight(a,a.group.position.y)});return;}
 const spec=SPECS[a.def.id],distance=a.group.position.distanceTo(b.group.position),canSee=clearSight(eye(a),eye(b),world.colliders);
 const closeThreat=canSee&&distance<=Math.max(spec.range+2,12);
 if(a.talking&&!closeThreat&&a.hurt<=0){updateNPCFlight(a,dt,{canFly:FLIERS.has(a.def.id),enabled:false,distance,targetY:b.group.position.y,...npcFlightSpace(a,b)});return;}
 if(a.talking){a.talking=false;if(currentTalker===a){window.speechSynthesis?.cancel();currentTalker=null;dialogueUntil=elapsed;}}
 updateNPCFlight(a,dt,{canFly:FLIERS.has(a.def.id),enabled:true,distance,targetY:b.group.position.y,...npcFlightSpace(a,b)});
 const melee=['melee','hammer','tentacle'].includes(spec.kind),range=meleeRange(a),desired=melee?range*.72:range*.65;
 if(distance>desired||!canSee)followPath(a,b.group.position,a.def.speed*(mode==='explore'?.78:.88)*(a.slow>0?.5:1)*movementModifier(a),dt);
 else {a.moveVelocity.multiplyScalar(Math.exp(-dt*16));face(a,b.group.position.x-a.group.position.x,b.group.position.z-a.group.position.z,Math.min(1,dt*12));}
 if(a.def.id==='deadpool'&&distance>spec.range&&distance<=PISTOL.range&&canSee)firePistol(a);else if(distance<=range+.15&&canSee)attack(a);
 if(a.specialCooldown<=0&&a.specialThink<=0&&canSee){
  const useful=spec.special==='healing'?a.hp<a.maxHp*.75:spec.special==='regenerate'?a.hp<a.maxHp*.8||distance<5:distance<=Math.max(spec.range,8);
  if(useful)special(a);
  a.specialThink=1.1+(a.index%5)*.2;
 }
}
function updateActors(dt){
 for(const a of actors){
   if(a.active===false){a.group.visible=false;continue;}
   a.moving=false;a.moveSpeed=0;a.talking=currentTalker===a&&elapsed<dialogueUntil;
   for(const k of ['cooldown','specialCooldown','slow','stun','invulnerable','speedBuff','aggro','dashCooldown','dashRemaining','shrink','grow','pistolCooldown'])a[k]=Math.max(0,a[k]-dt);
   if(a.def.id==='antman'){
    if(a.shrink<=0&&a.grow<=0&&a.group.scale.y<.99&&blocked(a.group.position.x,a.group.position.z,baseRadius(a.def.id),a.group.position.y,world.colliders,world.bounds,a.rig.height)){a.shrink=.3;a.speedBuff=Math.max(a.speedBuff,.3);}
    const current=a.group.scale.y,target=a.shrink>0?.5:a.grow>0?1.6:1;
    let scale=THREE.MathUtils.lerp(current,target,1-Math.exp(-dt*14));
    if(Math.abs(scale-target)<.001)scale=target;
    if(scale>current&&blocked(a.group.position.x,a.group.position.z,baseRadius(a.def.id)*scale,a.group.position.y,world.colliders,world.bounds,a.rig.height*scale))scale=current;
    a.group.scale.setScalar(scale);a.radius=baseRadius(a.def.id)*scale;
   }
   a.attackAnim=Math.max(0,a.attackAnim-dt*3);a.pistolAnim=Math.max(0,a.pistolAnim-dt*2.8);a.hurt=Math.max(0,a.hurt-dt);
   if(a.dead){
     if(state==='playing'&&!duel&&mode!=='survival'&&mode!=='story'){a.respawn-=dt;if(a.respawn<=0){const player=a.player;resetActor(a,{x:a.spawn.x,z:a.spawn.z,rotation:a.def.team==='heroes'?Math.PI:0});a.player=player;a.invulnerable=2;burst(eye(a),effectColors[a.def.id],2.5,'sphere',.8);}}
     continue;
   }
   if(canAct()&&a.healing>0){const time=Math.min(dt,a.healing);a.hp=Math.min(a.maxHp,a.hp+time*12);a.healing=Math.max(0,a.healing-time);}
   if(a.stun>0)a.flightAxis=0;
   if(canAct()&&a.stun<=0){if(a.player>=0)controlActor(a,a.player,dt);else updateAI(a,dt);}
   if(state==='playing'){
     verticalMotion(a,dt);
     // Characters also have solid footprints; team mates can be walked around.
     for(const b of actors){if(b.index<=a.index||b.dead)continue;const dx=b.group.position.x-a.group.position.x,dz=b.group.position.z-a.group.position.z,dist=Math.hypot(dx,dz),required=(a.radius+b.radius)*.72;
       if(dist>0.001&&dist<required&&Math.abs(a.group.position.y-b.group.position.y)<2){const push=(required-dist)*.5,px=dx/dist*push,pz=dz/dist*push;slideMove(a.group.position,-px,-pz,a.radius,world.colliders,world.bounds,bodyHeight(a));slideMove(b.group.position,px,pz,b.radius,world.colliders,world.bounds,bodyHeight(b));}}
   }
   const cameraDistance=state==='menu'?a.group.position.distanceTo(menuCamera.position):Math.min(...players.map(p=>p.group.position.distanceTo(a.group.position)));
   a.rig.fingers.forEach(f=>f.base.visible=cameraDistance<(settings.high?30:16));
   updateCharacter(a.rig,dt,{time:elapsed+a.index*.37,moving:a.moving,speed:a.moveSpeed||0,attacking:a.attackAnim,talking:a.talking,dead:false,flying:a.flying,rangedAttack:a.pistolAnim});
   if(a.pendingPistol&&canAct()){a.pendingPistol.delay-=dt;if(a.pendingPistol.delay<=0){shoot(a,canTarget(a,a.pendingPistol.target)?a.pendingPistol.target:null,1,0,'#ffd891',PISTOL);a.pendingPistol=null;}}
   if(a.pendingAttack&&canAct()){a.pendingAttack.delay-=dt;if(a.pendingAttack.delay<=0){shoot(a,a.pendingAttack.target?.dead?null:a.pendingAttack.target);a.pendingAttack=null;}}
   a.marker.visible=state!=='menu'||a!==selectedActor;a.marker.material.opacity=a.player>=0?.6+.12*Math.sin(elapsed*4):.15;a.shadow.position.y=(groundHeight(a,a.group.position.y)+.025-a.group.position.y)/a.group.scale.y;a.marker.position.y=(groundHeight(a,a.group.position.y)+.04-a.group.position.y)/a.group.scale.y;
   const altitude=Math.max(0,a.group.position.y-groundHeight(a,a.group.position.y)),base=baseRadius(a.def.id)>.7?1.25:1;a.shadow.scale.setScalar(base*(.94+Math.min(altitude,12)*.06));a.shadow.material.opacity=(settings.high&&!renderer.isSoftwareRenderer?.25:.49)*Math.exp(-altitude*.16);
   a.marker.scale.setScalar(a.player>=0?1.12:1);
 }
 if(state==='menu'&&selectedActor){selectedActor.group.rotation.y=.15+Math.sin(elapsed*.25)*.22;selectedActor.moving=false;}
}
function dialogue(){
 if(elapsed>=dialogueUntil){$('dialogue').hidden=true;currentTalker=null;}
 if(state!=='playing'||elapsed<nextDialogue||!players[0]||players[0].dead)return;
 const p=players[0];let candidate=null,best=5.8;
 for(const a of actors){if(a===p||a.dead||a.player>=0||a.nextTalk>elapsed||a.attackAnim>.1||a.flying||a.hurt>0||(a.target&&canTarget(a,a.target)&&a.group.position.distanceTo(a.target.group.position)<Math.max(SPECS[a.def.id].range+2,12))||(mode!=='explore'&&a.def.team!==p.def.team))continue;const d=p.group.position.distanceTo(a.group.position);if(d<best&&clearSight(eye(p),eye(a),world.colliders)){candidate=a;best=d;}}
 if(!candidate)return;
 currentTalker=candidate;const line=candidate.def.quotes[Math.floor(Math.random()*candidate.def.quotes.length)];dialogueUntil=elapsed+Math.max(5,line.length*.075);nextDialogue=dialogueUntil+4;candidate.nextTalk=elapsed+35;
 face(candidate,p.group.position.x-candidate.group.position.x,p.group.position.z-candidate.group.position.z);$('dialogue-speaker').textContent=candidate.def.name;$('dialogue-line').textContent=line;$('dialogue').hidden=false;
 const avatar=$('dialogue-avatar');avatar.replaceChildren();if(portraits.has(candidate.def.id)){const img=document.createElement('img');img.src=portraits.get(candidate.def.id);img.alt='';img.style.cssText='width:60px;height:70px;object-fit:contain';avatar.append(img);}else avatar.textContent='✦';
 if(settings.sound&&window.speechSynthesis){try{
  const synth=window.speechSynthesis,id=candidate.def.id,heavy=['hulk','abomination','thanos','venom','sabretooth'].includes(id),quick=['deadpool','spiderman','antman'].includes(id),calm=['vision','strange','magneto','doom'].includes(id);
  const utterance=new SpeechSynthesisUtterance(line);utterance.lang='nl-NL';utterance.rate=heavy?.87:quick?1.08:calm?.93:.98;utterance.pitch=heavy?.77:quick?1.12:['wanda','widow','captainmarvel','hela'].includes(id)?1.14:id==='ultron'?.86:.97;
  utterance.volume=clamp(1-best*.045,.65,.9);
  const voices=synth.getVoices().filter(v=>v.lang.toLowerCase().startsWith('nl')).sort((a,b)=>(b.lang==='nl-NL'?2:0)-(a.lang==='nl-NL'?2:0));if(voices[0])utterance.voice=voices[0];
  utterance.onstart=()=>{if(currentTalker===candidate)dialogueUntil=Math.max(dialogueUntil,elapsed+3);};
  utterance.onend=()=>{if(currentTalker===candidate){dialogueUntil=elapsed+.8;nextDialogue=Math.max(nextDialogue,elapsed+5);}};
  synth.cancel();synth.speak(utterance);
 }catch{}}
}
function updateCamera(index,dt,snap=false){
 const a=players[index];if(!a)return;const s=cameraStates[index],p=a.group.position,characterHeight=(a.rig.height||2.82)*a.group.scale.y;
 const look=new THREE.Vector3(p.x,p.y+Math.max(.75,characterHeight*.58),p.z),desired=look.clone().add(new THREE.Vector3(Math.sin(s.yaw)*s.distance,Math.sin(s.pitch)*s.distance+1.1,Math.cos(s.yaw)*s.distance)),c=cameras[index];
 const pos=resolveThirdPersonCamera({look,desired,yaw:s.yaw,pitch:s.pitch,distance:s.distance,characterHeight,colliders:world.colliders,previous:snap?null:c.position});
 if(snap)c.position.copy(pos);else c.position.lerp(pos,1-Math.exp(-dt*10));
 if(!isThirdPersonCameraSafe(look,c.position,world.colliders,characterHeight))c.position.copy(pos);
 c.lookAt(look);
}
function updateLabels(){
 const split=mode==='pvp'&&state!=='menu',vpWidth=split?width/2:width;
 for(const a of actors)for(let i=0;i<2;i++){
   const label=a.labels[i];if(state==='menu'||a.dead||a.active===false||i>=(split?2:1)||a===players[i]){label.hidden=true;continue;}
   const c=cameras[i],p=a.group.position.clone().add(new THREE.Vector3(0,(a.rig.height||2.8)*a.group.scale.y+.45,0));
   if(c.position.distanceTo(p)>30||!clearSight(c.position,p,world.colliders)){label.hidden=true;continue;}
   p.project(c);if(p.z>1||p.z<0||Math.abs(p.x)>1||Math.abs(p.y)>1){label.hidden=true;continue;}
   label.hidden=false;label.style.left=((p.x*.5+.5)*vpWidth+i*vpWidth)+'px';label.style.top=((-p.y*.5+.5)*height)+'px';label.querySelector('b').style.width=(a.hp/a.maxHp*100)+'%';
 }
}
function drawMinimap(){
 const c=$('minimap'),ctx=c.getContext('2d');if(!world)return;const b=world.bounds,scale=160/(b.maxX-b.minX),map=(x,z)=>[(x-b.minX)*scale,(z-b.minZ)*scale];
 ctx.clearRect(0,0,160,160);ctx.fillStyle='#0b1621';ctx.fillRect(0,0,160,160);ctx.strokeStyle='#1f3443';ctx.lineWidth=1;
 for(let i=0;i<160;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,160);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(160,i);ctx.stroke();}
 ctx.fillStyle='#41515d';for(const box of world.colliders){const [x,z]=map(box.minX,box.minZ);ctx.fillRect(x,z,(box.maxX-box.minX)*scale,(box.maxZ-box.minZ)*scale);}
 for(const room of world.interiors||[]){if(!room.entrance)continue;const [x,z]=map(room.entrance.x,room.entrance.z);ctx.fillStyle='#78efff';ctx.fillRect(x-2.5,z-2.5,5,5);}
 for(const a of actors){if(a.dead)continue;const [x,z]=map(a.group.position.x,a.group.position.z);ctx.fillStyle=a.player>=0?'#d5ff48':a.def.team==='heroes'?'#61c9ff':'#ff687c';ctx.beginPath();ctx.arc(x,z,a.player>=0?3.5:2,0,TAU);ctx.fill();if(a.player>=0){ctx.strokeStyle='#fff';ctx.stroke();}}
}
function updateHud(){
 if($('ko-counter'))$('ko-counter').textContent='KO: '+koTotal;
 if($('top-kills')){const top=actors.filter(a=>a.kills>0).sort((x,y)=>y.kills-x.kills).slice(0,3);$('top-kills').innerHTML='<b>TOP 3 KO</b>'+(top.length?'':'<span>nog niemand</span>');top.forEach((a,i)=>{const s=document.createElement('span');s.className=a.def.team;s.textContent=(i+1)+'. '+a.def.name+' · '+a.kills;$('top-kills').append(s);});}
 if(state==='menu')return;
 players.forEach((a,i)=>{const bar=$(i?'p2-health-fill':'health-fill'),txt=$(i?'p2-health-text':'health-text');bar.style.width=(a.hp/a.maxHp*100)+'%';txt.textContent=a.dead?(duel?'Ronde afgelopen':'Terug in '+Math.ceil(a.respawn)+' s'):Math.ceil(a.hp)+' / '+a.maxHp;});
 $('score-heroes').textContent=score.heroes;$('score-villains').textContent=score.villains;const shownTime=duel?duel.remaining:matchTime;$('match-timer').textContent=duel?.phase==='countdown'?Math.ceil(duel.countdown):mode==='survival'?'G'+wave:mode==='story'||mode==='explore'||mode==='endless'||mode==='battle100'?'∞':Math.floor(Math.max(0,shownTime)/60)+':'+String(Math.floor(Math.max(0,shownTime)%60)).padStart(2,'0');
 const a=players[0];if(a){const span=$('special-button').querySelector('span');span.textContent=a.specialCooldown>0?Math.ceil(a.specialCooldown)+' s':a.def.id==='antman'?(a.nextPym==='grow'?'Groeien':'Krimpen'):a.def.special;$('special-button').disabled=a.dead||a.specialCooldown>0;$('special-button').style.setProperty('--cooldown',Math.min(1,a.specialCooldown/8));}
 const p=players[0];if(p){$('pistol-button').hidden=p.def.id!=='deadpool';$('pistol-button').disabled=p.dead;$('camera-input-hint').textContent=p.def.id==='deadpool'?'Camera: middelste muisknop slepen of J / L':'Camera: rechts of midden slepen, of J / L';$('flight-button').hidden=!FLIERS.has(p.def.id);$('flight-button').querySelector('span').textContent=p.flying?'Landen':'Vliegen';$('descend-button').hidden=!p.flying;const inside=(world.interiors||[]).find(r=>p.group.position.x>r.minX&&p.group.position.x<r.maxX&&p.group.position.z>r.minZ&&p.group.position.z<r.maxZ&&p.group.position.y<(r.ceiling||6));const place=inside?inside.name:worldNames[worldId];$('area-label').textContent=place+(p.flying?' · '+Math.round(p.group.position.y)+' m hoogte':'');if(inside&&currentInterior!==inside.name)toast(inside.name+(worldId==='avengers'?' · verken de ruimtes via de open deuren.':' · loop door de open deur om weer naar buiten te gaan.'),3);currentInterior=inside?.name||'';}
 drawMinimap();
}

document.querySelectorAll('[data-team]').forEach(e=>e.addEventListener('click',()=>{team=e.dataset.team;fillRoster();}));
document.querySelectorAll('[data-world]').forEach(e=>e.addEventListener('click',()=>loadWorld(e.dataset.world)));
document.querySelectorAll('[data-mode]').forEach(e=>e.addEventListener('click',()=>chooseMode(e.dataset.mode)));
document.querySelectorAll('[data-pvp-format]').forEach(e=>e.addEventListener('click',()=>{pvpFormat=e.dataset.pvpFormat;document.querySelectorAll('[data-pvp-format]').forEach(b=>{b.classList.toggle('active',b.dataset.pvpFormat===pvpFormat);b.setAttribute('aria-pressed',String(b.dataset.pvpFormat===pvpFormat));});}));
$('p2-select').addEventListener('change',e=>p2id=e.target.value);
$('start-button').addEventListener('click',startGame);$('tower-shortcut').addEventListener('click',()=>{loadWorld('avengers');chooseMode('explore');startGame();});$('exit-button').addEventListener('click',showMenu);$('rematch-button').addEventListener('click',startGame);$('result-menu-button').addEventListener('click',showMenu);
$('quality-button').addEventListener('click',()=>{settings.high=!settings.high;setQuality();});$('sound-button').addEventListener('click',()=>{settings.sound=!settings.sound;setSound();});
$('help-button').addEventListener('click',()=>{$('help-modal').hidden=false;keys.clear();$('close-help').focus();});$('close-help').addEventListener('click',()=>{$('help-modal').hidden=true;});
$('help-modal').addEventListener('click',e=>{if(e.target===$('help-modal'))$('help-modal').hidden=true;});
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Volledig scherm is hier niet beschikbaar. Gebruik eventueel F11.');}});
$('attack-button').addEventListener('click',()=>attack(players[0]));$('pistol-button').addEventListener('click',()=>firePistol(players[0]));$('special-button').addEventListener('click',()=>special(players[0]));
const controlKeys=new Set(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyF','KeyC','KeyJ','KeyL','KeyI','KeyK','Numpad0','Numpad1','Numpad2','Numpad4','Numpad6','Space','ShiftLeft','ShiftRight','ControlRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Slash']);
window.addEventListener('keydown',e=>{
 if(e.code==='Escape'){
  if(!$('help-modal').hidden){$('help-modal').hidden=true;return;}if(state!=='menu'){showMenu();e.preventDefault();}return;
 }
 if(state!=='playing'||!$('help-modal').hidden)return;if(controlKeys.has(e.code))e.preventDefault();keys.add(e.code);
 if(!e.repeat){if(e.code==='Space')jump(players[0]);if(e.code==='KeyQ')special(players[0]);if(e.code==='ControlRight')jump(players[1]);if(e.code==='Slash')special(players[1]);if(e.code==='ShiftLeft')dodge(players[0]);if(e.code==='ShiftRight')dodge(players[1]);if(e.code==='KeyF')toggleFlight(players[0]);if(e.code==='Numpad0')toggleFlight(players[1]);if(e.code==='Numpad2')firePistol(players[1]);}
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touch.clear();dragging=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('contextmenu',e=>{if(!(e.target instanceof Element&&e.target.closest('select,input,textarea')))e.preventDefault();});
document.addEventListener('selectstart',e=>{if(!(e.target instanceof Element&&e.target.closest('select,input,textarea')))e.preventDefault();});
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('selectionchange',()=>{const s=getSelection();if(s&&s.rangeCount&&!(document.activeElement&&document.activeElement.closest?.('select,input,textarea')))s.removeAllRanges();});
window.addEventListener('mousedown',e=>{if(state!=='menu'&&!(e.target instanceof Element&&e.target.closest('select,input,textarea,button'))){e.preventDefault();getSelection()?.removeAllRanges();}},true);
window.addEventListener('mouseup',()=>{if(state!=='menu')getSelection()?.removeAllRanges();},true);
canvas.addEventListener('pointerdown',e=>{
 const pistolClick=state==='playing'&&players[0]?.def.id==='deadpool'&&e.button===2;
 if(pistolClick){e.preventDefault();keys.add('Mouse2');firePistol(players[0]);canvas.setPointerCapture(e.pointerId);}
 if(e.button===1||(e.button===2&&!pistolClick)||e.pointerType==='touch'||(state==='menu'&&e.button===0)){e.preventDefault();dragging=true;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}
 if(e.button===0&&e.pointerType!=='touch'&&state==='playing'){keys.add('Mouse0');attack(players[0]);}
});
window.addEventListener('pointerup',e=>{if(e.button===0)keys.delete('Mouse0');if(e.button===2)keys.delete('Mouse2');dragging=false;});
canvas.addEventListener('pointercancel',()=>{keys.delete('Mouse0');keys.delete('Mouse2');dragging=false;});
canvas.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
window.addEventListener('pointermove',e=>{
 if(dragging){const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;if(state==='menu')menuOrbit-=dx*.006;else {cameraStates[0].yaw-=dx*.006;cameraStates[0].pitch=clamp(cameraStates[0].pitch+dy*.003,.24,.68);}lastPointer={x:e.clientX,y:e.clientY};}
 if(state==='playing'&&e.target===canvas){const w=mode==='pvp'?width/2:width;pointer.set(e.clientX/w*2-1,-e.clientY/height*2+1);raycaster.setFromCamera(pointer,cameras[0]);if(raycaster.ray.direction.y<-.02&&raycaster.ray.intersectPlane(groundPlane,aimPoint)){const me=players[0];if(me){const dx=aimPoint.x-me.group.position.x,dz=aimPoint.z-me.group.position.z,d=Math.hypot(dx,dz);if(d>45){aimPoint.x=me.group.position.x+dx/d*45;aimPoint.z=me.group.position.z+dz/d*45;}}pointerKnown=true;}}
});
canvas.addEventListener('wheel',e=>{if(state!=='playing')return;e.preventDefault();cameraStates[0].distance=clamp(cameraStates[0].distance+e.deltaY*.008,4.5,18);},{passive:false});
for(const direction of ['up','down','left','right']){
 const b=$('touch-'+direction);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.add(direction);});b.addEventListener('pointerup',()=>touch.delete(direction));b.addEventListener('pointercancel',()=>touch.delete(direction));
}
$('touch-jump').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touch.add('rise');jump(players[0]);});for(const event of ['pointerup','pointercancel'])$('touch-jump').addEventListener(event,()=>touch.delete('rise'));
$('flight-button').addEventListener('click',()=>toggleFlight(players[0]));$('camera-left').addEventListener('click',()=>cameraStates[0].yaw+=Math.PI/6);$('camera-right').addEventListener('click',()=>cameraStates[0].yaw-=Math.PI/6);$('descend-button').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touch.add('descend');});for(const event of ['pointerup','pointercancel'])$('descend-button').addEventListener(event,()=>touch.delete('descend'));
$('dash-button').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touch.add('sprint');dodge(players[0]);});$('dash-button').addEventListener('pointerup',()=>touch.delete('sprint'));$('dash-button').addEventListener('pointercancel',()=>touch.delete('sprint'));
window.addEventListener('resize',resize);
window.addEventListener('error',e=>{console.error('Marvels Fight:',e.error);if(!$('loading').hidden){$('loading').hidden=true;$('fatal').hidden=false;$('fatal').textContent='De 3D-wereld kon niet worden geladen. Vernieuw deze pagina.';}});

let frameHandle;
function frame(){
 frameHandle=requestAnimationFrame(frame);let dt=Math.min(clock.getDelta(),.25);if(document.hidden||!$('help-modal').hidden)dt=0;frameCount++;
 if(!world)return;
 // Keep the game clock and controls responsive on slower devices, with small collision-safe steps.
 const steps=Math.max(1,Math.ceil(dt/.05)),step=dt/steps;
 for(let i=0;i<steps;i++){
  elapsed+=step;
  if(state==='playing'&&duel)duel.update(step);else if(state==='playing'&&mode==='survival'){if(waveBreak>0){waveBreak-=step;if(waveBreak<=0)nextWave();}}else if(state==='playing'&&(mode==='battle'||mode==='pvp')){matchTime-=step;if(matchTime<=0)finishMatch();}
  world.update?.(step,elapsed);if(cutsceneActive())keys.clear();else{if(state==='playing'&&!duel)civ.update(step,{actors,players});updateActors(step);}updateProjectiles(step);dialogue();
 }
 updateCinema();
 if($('round-banner')&&elapsed>roundBannerUntil)$('round-banner').hidden=true;
 if(elapsed>toastUntil)$('toast').hidden=true;
 if(state==='menu'){
   const a=selectedActor.group.position,theta=menuOrbit+.28,distance=7.8*((selectedActor.rig.height||2.8)/2.8);menuCamera.position.set(a.x+Math.sin(theta)*distance,3.05,a.z+Math.cos(theta)*distance);menuCamera.lookAt(a.x,1.55,a.z);
 }else {camCinema(dt);updateCamera(0,dt);if(mode==='pvp')updateCamera(1,dt);}
 updateSunShadow();
 previewHalo.visible=state==='menu';previewHalo.material.opacity=.3+Math.sin(elapsed*.9)*.08;damageVeil.style.opacity=state==='playing'?Math.max(0,(players[0]?.hurt||0))*.75:0;
 if(frameCount%3===0)updateLabels();if(elapsed-lastHud>.12){updateHud();lastHud=elapsed;}
 renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);
 if(state==='menu')renderer.render(scene,menuCamera);
 else if(mode==='pvp'){
   renderer.setScissorTest(true);renderer.setViewport(0,0,width/2,height);renderer.setScissor(0,0,width/2,height);renderer.render(scene,cameras[0]);renderer.setViewport(width/2,0,width/2,height);renderer.setScissor(width/2,0,width/2,height);renderer.render(scene,cameras[1]);renderer.setScissorTest(false);
 }else renderer.render(scene,cameras[0]);
}

function boot(){
 startUpdater(()=>state);loadWorld('newyork');fillRoster();fillP2();chooseMode('explore');setQuality();setSound();resize();$('loading').hidden=true;frame();renderPortraits().catch(e=>console.warn('Portretten:',e));
 if(renderer.isSoftwareRenderer){const status=document.createElement('span');status.id='renderer-status';status.className='compatibility-badge';status.textContent='COMPATIBELE 3D-WEERGAVE';status.title='Deze browser biedt geen WebGL. Dezelfde 3D-wereld wordt met vereenvoudigde belichting weergegeven.';$('menu').append(status);}
}
boot();
