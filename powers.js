import * as THREE from './vendor/three.module.js';

// Shared immutable geometry; every effect owns its materials, so the game's
// material-only removeNode lifecycle never invalidates another live effect.
const geometry = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 8, 5),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 5),
  thinCylinder: new THREE.CylinderGeometry(1, 1, 1, 3),
  cone: new THREE.ConeGeometry(1, 1, 4),
  ring: new THREE.TorusGeometry(1, .075, 3, 12),
  stone: new THREE.OctahedronGeometry(1, 0),
  disc: new THREE.CylinderGeometry(1, 1, 1, 20),
};
const cached = new Map();
const Y = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;

function shapeGeometry(key, points) {
  if (!cached.has(key)) {
    const s = new THREE.Shape();
    points.forEach(([x,y], i) => i ? s.lineTo(x,y) : s.moveTo(x,y));
    s.closePath(); cached.set(key, new THREE.ShapeGeometry(s));
  }
  return cached.get(key);
}
function starGeometry(key='star', points=5, inner=.43) {
  return shapeGeometry(key, Array.from({length:points*2}, (_,i) => {
    const a=Math.PI/2+i*Math.PI/points, r=i%2?inner:1;
    return [Math.cos(a)*r,Math.sin(a)*r];
  }));
}
function slashGeometry(key,radius=.8,width=.055,start=-1.05,end=1.05) {
  const steps=12,points=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps,a=start+(end-start)*t,r=radius+Math.sin(t*Math.PI)*width;
    points.push([Math.cos(a)*r,Math.sin(a)*r]);
  }
  for(let i=steps;i>=0;i--){
    const t=i/steps,a=start+(end-start)*t,r=radius-Math.sin(t*Math.PI)*width;
    points.push([Math.cos(a)*r,Math.sin(a)*r]);
  }
  return shapeGeometry(key,points);
}
function curvedGeometry(key, points, radius=.02, segments=6) {
  if (!cached.has(key)) cached.set(key, new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,radius,3,false));
  return cached.get(key);
}
function kit(id, kind) {
  const group=new THREE.Group(), materials=new Map();
  group.name=`${id} · ${kind}`;
  group.userData.powerId=id; group.userData.kind=kind; group.userData.forward='+Z';
  const mat=(color,opacity=1,double=false)=>{
    const key=`${color}|${opacity}|${double}`;
    if(!materials.has(key)) materials.set(key,new THREE.MeshBasicMaterial({
      color,opacity,transparent:true,depthWrite:false,side:double?THREE.DoubleSide:THREE.FrontSide,
    }));
    return materials.get(key);
  };
  const mesh=(geo,color,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,opacity=1,double=false)=>{
    const m=new THREE.Mesh(geo,mat(color,opacity,double));m.position.set(x,y,z);m.scale.set(sx,sy,sz);group.add(m);return m;
  };
  const beam=(a,b,width,color,opacity=1)=>{
    const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),d=bb.clone().sub(aa);
    const m=mesh(geometry.thinCylinder,color,0,0,0,width,d.length(),width,opacity);
    m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(Y,d.normalize());return m;
  };
  const ring=(color,r=.3,z=0,opacity=1)=>mesh(geometry.ring,color,0,0,z,r,r,r,opacity);
  const path=(name,points,width,color,opacity=1,segments=6)=>mesh(curvedGeometry(name,points,width,segments),color,0,0,0,1,1,1,opacity);
  const finish=(life)=>{
    // Centering the actual silhouette keeps impacts and projectile collision
    // centered even for long arrows, wisps and asymmetric lightning branches.
    const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3());
    for(const child of group.children) child.position.sub(center);
    if(life)group.userData.effectLife=life;
    return group;
  };
  return {group,mat,mesh,beam,ring,path,finish};
}

function lightning(k, color, small=false) {
  const points=small?[[0,0,-.4],[.1,.035,-.15],[-.09,-.02,.07],[.03,0,.38]]:
    [[0,0,-.85],[.15,.08,-.49],[-.14,-.045,-.24],[.13,.04,.08],[-.08,-.02,.4],[0,0,.86]];
  for(let i=1;i<points.length;i++){
    k.beam(points[i-1],points[i],small?.035:.052,color);
    if(!small)k.beam(points[i-1],points[i],.021,'#f7feff');
  }
  if(!small){
    k.beam(points[2],[-.35,.14,-.08],.026,color);k.beam([-.35,.14,-.08],[-.44,.1,.12],.018,'#e9fbff');
    k.beam(points[3],[.35,-.13,.28],.026,color);k.beam([.35,-.13,.28],[.42,-.07,.48],.017,'#e9fbff');
  }
}

function dagger(k, id) {
  const hela=id==='hela', blade=shapeGeometry(hela?'night-sword':'loki-dagger',hela?
    [[-.035,-.1],[-.12,.22],[-.085,.55],[-.17,.69],[0,1.05],[.12,.59],[.065,.34],[.1,.09],[.035,-.1]]:
    [[-.035,-.05],[-.1,.12],[-.075,.47],[0,.77],[.075,.47],[.1,.12],[.035,-.05]]);
  const m=k.mesh(blade,hela?'#15392d':'#c9eee0',0,0,.1,1,1,1,1,true);m.rotation.x=Math.PI/2;
  const edge=k.mesh(blade,hela?'#78d9a0':'#f5fff7',0,.008,.12,.27,.94,1,.95,true);edge.rotation.x=Math.PI/2;
  k.beam([-.16,0,.08],[.16,0,.08],.03,hela?'#25483a':'#dfb961');
  k.beam([0,0,-.3],[0,0,.06],.052,hela?'#1c2425':'#1b6347');
  k.mesh(geometry.stone,hela?'#79bc88':'#d6b15b',0,0,-.3,.075,.075,.065);
}

export function createProjectileVisual(id,kind='bolt',color='#a9eaff') {
  const k=kit(id,kind);
  if(id==='deadpool'&&kind==='bullet') {
    k.beam([0,0,-.91],[0,0,.12],.025,'#ffc563',.86);
    k.beam([0,0,-.53],[0,0,.2],.011,'#ffe1a2');
    k.beam([0,0,.08],[0,0,.31],.047,'#aab5be');
    const tip=k.mesh(geometry.cone,'#d9b27a',0,0,.36,.047,.14,.047);tip.rotation.x=Math.PI/2;
    k.group.userData.effectLabel='Gouden kogelspoor met metalen kogel';
  } else if(id==='captainmarvel') {
    k.beam([0,0,-.85],[0,0,.63],.073,'#fff6be');
    const flame=k.mesh(geometry.cone,'#ff9a37',0,0,-.2,.19,1.12,.19,.9);flame.rotation.x=-Math.PI/2;
    for(const side of [-1,1])k.beam([side*.14,.04,-.72],[side*.065,0,.28],.027,'#ffc855',.95);
    k.mesh(starGeometry('photon-burst',6,.36),'#fff8d2',0,0,.56,.22,.22,1,.95,true);
    k.group.userData.effectLabel='Goud-oranje fotonenstraal';
  } else if(id==='vision') {
    k.beam([0,0,-.92],[0,0,.6],.034,'#ffe16c');
    k.beam([0,0,-.65],[0,0,.53],.014,'#fffde5');
    const gem=k.mesh(geometry.stone,'#ffcc4e',0,0,.55,.105,.105,.19);gem.rotation.z=Math.PI/4;
    k.ring('#fff2ab',.11,.34,.9);
    k.group.userData.effectLabel='Gouden straal uit de voorhoofdsteen';
  } else if(id==='magneto') {
    const shard=shapeGeometry('magnetic-shard',[[-.13,-.28],[.1,-.22],[.055,.24],[0,.56],[-.08,.1]]);
    for(let i=0;i<3;i++){
      const m=k.mesh(shard,i===1?'#e0e8ed':'#8297a4',(i-1)*.19,(i%2)*.1,(i-1)*.1,.75+i*.12,1,1,1,true);
      m.rotation.set(Math.PI/2,(i-1)*.34,(i-1)*.16);
    }
    for(const side of [-1,1])k.path(`magnetic-field-${side}`,[[side*.14,-.1,-.56],[side*.34,.07,-.24],[side*.27,.17,.18],[side*.1,.03,.44]],.019,'#bd78ed',.76,5);
    k.group.userData.effectLabel='Drie zwevende metalen scherven';
  } else if(id==='electro') {
    lightning(k,'#ffe75f');
    k.beam([-.14,-.045,-.24],[.1,.23,-.1],.025,'#79d5ff');
    k.beam([.1,.23,-.1],[.27,.15,.26],.021,'#ffe76c');
    k.group.userData.effectLabel='Gele elektrische bliksem met blauwe zijtakken';
  } else if(id==='doom') {
    k.ring('#6be790',.31,0,.95);const inner=k.ring('#badb7e',.2,.035,.9);inner.rotation.z=.35;
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2+.35;
      const rune=k.mesh(geometry.box,'#b5f1ad',Math.cos(a)*.255,Math.sin(a)*.255,.045,.045,.105,.025);rune.rotation.z=a+.3;
    }
    const sigil=k.mesh(starGeometry('doom-sigil',4,.48),'#8bbfa4',0,0,.05,.13,.17,1,.92,true);sigil.rotation.z=Math.PI/4;
    k.beam([0,0,-.5],[0,0,-.04],.032,'#3d9f62',.85);
    k.group.userData.effectLabel='Groene tovercirkel met metalen runen';
  } else if(['antman','wolverine','abomination','deadpool','sabretooth'].includes(id)) {
    return createMeleeVisual(id,color);
  } else if(id==='hawkeye'||kind==='arrow') {
    k.beam([0,0,-.82],[0,0,.61],.028,'#292c3b');
    k.beam([0,0,-.79],[0,0,.55],.009,'#b9c9d1');
    const tip=k.mesh(geometry.cone,'#e7edf2',0,0,.7,.095,.29,.055);tip.rotation.x=Math.PI/2;
    const fin=shapeGeometry('arrow-fletching',[[0,-.83],[.16,-.78],[.13,-.49],[0,-.56]]);
    for(let i=0;i<3;i++){
      const f=k.mesh(fin,i===1?'#eef1f9':'#a377e4',0,0,0,1,1,1,1,true);
      f.rotation.x=Math.PI/2;f.rotateOnWorldAxis(new THREE.Vector3(0,0,1),i*TAU/3);
    }
    k.group.userData.effectLabel='Pijl met pijlpunt en veren';
  } else if(id==='spiderman'||kind==='web') {
    const a=k.ring('#f2fcff',.17,.14);a.scale.y*=.67;a.rotation.y=.5;
    const b=k.ring('#d7e9f1',.15,.12);b.rotation.x=1.1;b.rotation.z=.8;
    k.beam([-.13,.06,.08],[.14,-.06,.19],.025,'#ffffff');
    k.beam([-.06,-.13,.15],[.08,.12,.15],.022,'#edf8ff');
    for(let i=0;i<3;i++){
      const sign=i-1;
      k.path(`web-tail-${i}`,[[sign*.11,.04,.07],[sign*.12,.07,-.2],[sign*.2,-.04,-.5],[sign*.12,.02,-.88]],i===1?.019:.012,i===1?'#f6fdff':'#d5e7ef',i===1?1:.82,5);
    }
    k.group.userData.effectLabel='Witte webknoop met losse webdraden';
  } else if(id==='captain'||kind==='shield') {
    const disc=k.mesh(geometry.disc,'#c92b3e',0,0,0,.46,.09,.46);disc.rotation.x=Math.PI/2;
    for(const side of [-1,1]){
      k.ring('#f3f2e9',.35,side*.052);
      const blue=k.mesh(geometry.disc,'#23568f',0,0,side*.057,.21,.01,.21);blue.rotation.x=Math.PI/2;
      k.mesh(starGeometry(),'#fffdf2',0,0,side*.066,.171,.171,1,1,true);
    }
    k.group.userData.effectLabel='Rood-wit-blauw schild met ster';
  } else if(id==='thor') {
    lightning(k,'#65ceff');k.group.userData.effectLabel='Vertakte bliksemschicht';
  } else if(id==='ironman'||id==='ultron') {
    const tint=id==='ultron'?'#ff4d66':'#6cddff';
    k.beam([0,0,-.77],[0,0,.62],.062,'#f4feff');
    const cone=k.mesh(geometry.cone,tint,0,0,-.15,.16,1.1,.16,.82);cone.rotation.x=-Math.PI/2;
    k.ring(tint,.19,.43,.86);
    for(const side of [-1,1])k.beam([side*.11,0,-.65],[side*.055,0,.28],.018,tint,.8);
    k.group.userData.effectLabel=id==='ultron'?'Rode plasmastraal':'Witte repulsorstraal met blauwe gloed';
  } else if(id==='hela'||id==='loki'||kind==='dagger') {
    dagger(k,id);k.group.userData.effectLabel=id==='hela'?'Scherp Asgards nachtzwaard':'Groen-gouden dolk';
  } else if(id==='goblin'||kind==='bomb') {
    k.mesh(geometry.sphere,'#ef8b26',0,0,0,.235,.215,.235);
    for(let i=0;i<3;i++){
      const rib=k.ring('#7c4828',.217,0,.9);rib.scale.x=.73;rib.rotation.y=i*Math.PI/3;rib.rotation.z=.15;
    }
    k.beam([0,.18,0],[.035,.3,-.025],.035,'#3a7b43');
    const eye=shapeGeometry('pumpkin-eye',[[-1,-.5],[1,-.5],[0,.8]]);
    for(const side of [-1,1]){const e=k.mesh(eye,'#e3ff5f',side*.077,.035,.211,.048,.043,1,1,true);e.rotation.z=-side*.18;}
    k.mesh(shapeGeometry('pumpkin-mouth',[[-1,.25],[-.55,-.5],[0,-.2],[.55,-.5],[1,.25]]),'#d7ff51',0,-.09,.216,.105,.05,1,1,true);
    k.group.userData.effectLabel='Oranje pompoenbom met gloeiend gezicht';
  } else if(id==='strange'||id==='wanda'||kind==='ring') {
    const chaos=id==='wanda',tint=chaos?'#ff3e75':'#ffad42';
    const outer=k.ring(tint,.33,0);outer.rotation.z=.15;
    const inner=k.ring(chaos?'#ffc1dc':'#ffe5a6',.23,.035,.95);inner.rotation.x=chaos?.62:0;
    if(chaos){
      for(let i=0;i<5;i++){
        const a=i*TAU/5,b=(i+2)*TAU/5;
        k.beam([Math.cos(a)*.24,Math.sin(a)*.24,.04],[Math.cos(b)*.24,Math.sin(b)*.24,.04],.013,'#ff6f9e');
      }
      k.path('chaos-swirl',[[-.1,-.22,-.34],[-.29,.02,-.2],[.02,.24,-.1],[.2,0,.04]],.019,'#b6245a',.8,6);
    } else {
      for(let i=0;i<6;i++){
        const a=i*TAU/6;
        const rune=k.mesh(geometry.box,i%2?'#ffe6a4':tint,Math.cos(a)*.277,Math.sin(a)*.277,.034,.045,.095,.017);rune.rotation.z=a+.4;
      }
      const glyph=k.mesh(starGeometry('six-point-rune',6,.56),'#ffd17b',0,0,.04,.14,.14,1,.92,true);glyph.rotation.z=.26;
    }
    k.group.userData.effectLabel=chaos?'Scharlaken hex met magische spiraal':'Oranje tovercirkel met runen';
  } else if(id==='thanos') {
    const colors=['#a76dff','#4eafff','#ffe365','#fb526b','#69ef92','#ff9b45'];
    k.mesh(geometry.stone,'#dbb664',0,0,0,.14,.14,.23);
    colors.forEach((c,i)=>{const a=i*TAU/6;const stone=k.mesh(geometry.stone,c,Math.cos(a)*.17,Math.sin(a)*.17,(i%2)*.12,.085,.105,.09);stone.rotation.z=a;});
    for(let i=0;i<3;i++){const a=i*TAU/3;k.beam([Math.cos(a)*.13,Math.sin(a)*.13,-.08],[Math.cos(a)*.07,Math.sin(a)*.07,-.5],.018,colors[i*2],.75);}
    k.group.userData.effectLabel='Cluster van zes gekleurde stenen';
  } else if(id==='mysterio') {
    const a=k.ring('#68e6bf',.25,.15,.8);a.rotation.y=.25;
    const b=k.ring('#bdf8e9',.32,-.12,.62);b.rotation.x=.35;b.scale.x=.83;
    for(let i=0;i<2;i++){
      const side=i?1:-1;
      k.path(`illusion-smoke-${i}`,[[side*.12,0,.15],[side*.27,.14,-.04],[side*.12,-.12,-.3],[side*.2,.04,-.58]],.045,i?'#647c87':'#68baa2',.54,6);
    }
    k.group.userData.effectLabel='Groene illusieringen met krullende mist';
  } else if(id==='redskull') {
    k.beam([0,0,-.36],[0,0,.36],.05,'#8bd4ff');
    k.beam([0,0,-.2],[0,0,.3],.022,'#f4fdff');
    k.mesh(geometry.box,'#4f93d4',0,0,.16,.13,.13,.18,.83);
    k.group.userData.effectLabel='Compacte blauwe energiepuls';
  } else if(id==='widow') {
    lightning(k,'#6ce7ff',true);k.group.userData.effectLabel='Elektrische beet';
  } else {
    k.beam([0,0,-.35],[0,0,.35],.055,color);
    const tip=k.mesh(geometry.cone,'#f2faff',0,0,.3,.08,.24,.08);tip.rotation.x=Math.PI/2;
  }
  return k.finish();
}

export function createMeleeVisual(id,color='#d9f2ff') {
  const k=kit(id,'melee');
  if(id==='deadpool') {
    // Two crossed steel crescents read as katana sweeps, even in the CPU path.
    // The narrow bright edge is a streak, never a spherical impact marker.
    const arc=slashGeometry('katana-sweep'),edge=slashGeometry('katana-edge',.82,.012);
    for(let i=0;i<2;i++){
      const angle=i?2.18:-.25;
      const blade=k.mesh(arc,i?'#9fb5c5':'#d5e3eb',i?-.1:.02,0,i?.035:0,1,1,1,.97,true);blade.rotation.z=angle;
      const shine=k.mesh(edge,'#f3fbff',i?-.1:.02,0,i?.045:.01,1,1,1,.94,true);shine.rotation.z=angle;
    }
    const trail=k.mesh(slashGeometry('katana-red-trail',.76,.025),'#bd3449',-.02,0,-.045,1,1,1,.6,true);trail.rotation.z=-.18;
    k.group.userData.effectLabel='Dubbele metalen katanaslag';
  } else if(id==='sabretooth') {
    for(let i=0;i<5;i++){
      const x=(i-2)*.145,bend=(i-2)*.035;
      k.path(`sabretooth-claw-${i}`,[[x-.16,-.38,-.13],[x-.04,-.05,.2],[x+.09,.28,.35],[x+.15+bend,.52,.22]],.032,i%2?'#c7b38f':'#f0dfbc',.96,5);
      const tip=k.mesh(geometry.cone,'#f6e8cd',x+.15+bend,.51,.22,.04,.17,.035);tip.rotation.x=-.45;tip.rotation.z=-.18;
    }
    k.group.userData.effectLabel='Vijf felle roofdierklauwstrepen';
  } else if(id==='wolverine') {
    k.mesh(geometry.box,'#b6934d',0,-.23,-.1,.42,.14,.17);
    for(let i=0;i<3;i++){
      const x=(i-1)*.14;
      k.path(`adamantium-claw-${i}`,[[x,-.22,-.08],[x,.12,.22],[x,.51,.34],[x,.75,.22]],.026,i===1?'#fbffff':'#b9cbd5',1,6);
      const tip=k.mesh(geometry.cone,'#f0fafc',x,.75,.22,.036,.19,.035);tip.rotation.x=-.4;
    }
    k.group.userData.effectLabel='Drie lange adamantiumklauwen';
  } else if(id==='antman') {
    const outer=k.ring('#99d6ef',.33,-.16,.55);outer.rotation.y=.25;
    const inner=k.ring('#d9f5ff',.13,.15,.82);inner.rotation.y=.25;
    k.mesh(geometry.box,'#b5434b',0,0,.24,.19,.13,.17);
    for(let i=0;i<3;i++)k.mesh(geometry.sphere,'#c8d5dd',(i-1)*.057,.05,.32,.039,.05,.044);
    for(let i=0;i<3;i++)k.mesh(geometry.stone,'#e94b59',(i-1)*.12,.13-i*.09,-.3-i*.08,.025,.025,.025,.8);
    k.group.userData.effectLabel='Verkleinende vuistslag met Pym-deeltjes';
  } else if(id==='panther'||id==='killmonger'||id==='venom') {
    const venom=id==='venom',tint=id==='killmonger'?'#edc063':venom?'#c2d0d7':'#bca0fa';
    const count=venom?4:3;
    for(let i=0;i<count;i++){
      const x=(i-(count-1)/2)*.17;
      k.path(`claw-${id}-${i}`,[[x-.12,-.32,-.12],[x,.03,.23],[x+.12,.32,.36],[x+.13,.46,.23]],venom?.034:.027,tint,.95,5);
      if(venom){const tip=k.mesh(geometry.cone,'#f1f6ec',x+.13,.46,.23,.04,.16,.04);tip.rotation.x=-.45;}
    }
    k.group.userData.effectLabel='Zichtbare klauwstrepen';
  } else if(id==='octopus') {
    const points=[[-.23,-.2,-.65],[-.08,-.04,-.3],[.17,.08,.08],[.04,.06,.42]];
    for(let i=1;i<points.length;i++){
      const a=new THREE.Vector3(...points[i-1]),b=new THREE.Vector3(...points[i]),d=b.clone().sub(a);
      const segment=k.mesh(geometry.cylinder,i%2?'#c4cdd0':'#65747b',0,0,0,.095,d.length(),.095);
      segment.position.copy(a.add(b).multiplyScalar(.5));segment.quaternion.setFromUnitVectors(Y,d.normalize());
      k.mesh(geometry.stone,'#c9a85d',...points[i],.12,.12,.12);
    }
    for(let i=0;i<3;i++){const a=i*TAU/3;k.beam([.04,.06,.42],[.04+Math.cos(a)*.2,.06+Math.sin(a)*.2,.68],.042,'#c4d0d5');}
    k.group.userData.effectLabel='Mechanische grijper met scharnieren';
  } else if(id==='hulk'||id==='abomination'||id==='ironman'||id==='thanos') {
    const tint=id==='hulk'?'#87c76b':id==='abomination'?'#8d9f67':id==='ironman'?'#d7ad62':'#c7a0d5';
    k.mesh(geometry.box,tint,0,0,.12,.42,.28,.34);
    for(let i=0;i<4;i++)k.mesh(geometry.sphere,tint,(i-1.5)*.11,.09,.28,.075,.095,.09);
    k.mesh(starGeometry('punch-impact',7,.37),id==='hulk'?'#ddf5b2':'#fff0ca',0,0,.36,.47,.47,1,.78,true);
    if(id==='abomination')for(let i=0;i<3;i++){const spike=k.mesh(geometry.cone,'#ddd1a4',(i-1)*.13,.18,.2,.055,.23,.055);spike.rotation.x=.3;}
    k.group.userData.effectLabel=id==='abomination'?'Zware vuistslag met benige stekels':'Vuist met krachtige inslag';
  } else if(id==='thor'||id==='widow') {
    lightning(k,id==='thor'?'#84dfff':'#8eeeff',true);
    const impact=k.mesh(starGeometry('electric-impact',6,.26),'#effcff',0,0,.35,.32,.32,1,.92,true);impact.rotation.z=.3;
  } else {
    k.mesh(starGeometry('strike-impact',7,.3),color,0,0,.15,.48,.48,1,.93,true);
    k.ring('#edf7ff',.21,.16,.8);
  }
  return k.finish(id==='octopus'?.32:.24);
}
