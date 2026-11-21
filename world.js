import * as THREE from './vendor/three.module.js';

export const WORLDS = [
  { id: 'newyork', name: 'New York', subtitle: 'MANHATTAN', description: 'Avengers Tower, het Sanctum en de straten van Manhattan.', sky: '#a8c9db', fog: '#aec7d3' },
  { id: 'wakanda', name: 'Wakanda', subtitle: 'BIRNIN ZANA', description: 'Vibranium, watervallen en een futuristische stad in de groene vallei.', sky: '#95cdd8', fog: '#8ebbc0' },
  { id: 'asgard', name: 'Asgard', subtitle: 'HET GOUDEN RIJK', description: 'De gouden paleizen, bergen en de regenboogbrug van Asgard.', sky: '#b8c3e4', fog: '#b8c0d5' },
  { id: 'avengers', name: 'Avengers Tower', subtitle: 'TRAININGSVERDIEPING', description: 'Een echte binnenkaart met trainingshal, laboratorium en lounge.', sky: '#98b3cd', fog: '#bed1de' },
  { id: 'titan', name: 'Titan', subtitle: 'DE VERWOESTE WERELD', description: 'De puinhopen van de thuiswereld van Thanos: oranje rotsen, gebroken zuilen en eindeloze ruimte.', sky: '#b98a63', fog: '#c79a73' },
  { id: 'savage', name: 'Savage Land', subtitle: 'DE VERBORGEN JUNGLE', description: 'Een warme jungle vol enorme bomen, rotsen en oude ruines.', sky: '#8fc7a0', fog: '#a6cfae' },
  { id: 'kamartaj', name: 'Kamar-Taj', subtitle: 'TEMPEL EN BIBLIOTHEEK', description: 'Een bergklooster met een open binnenplaats en toegankelijke tempel en bibliotheek.', sky: '#a7c7d6', fog: '#d3dedc' }
];

export function createWorld(scene, id = 'newyork') {
  const info = WORLDS.find(w => w.id === id) || WORLDS[0];
  id = info.id;
  const group = new THREE.Group();
  group.name = `World:${id}`;
  const colliders = [], landmarks = [], interiors = [], dynamics = [], detailMeshes = [];
  const geos = new Map(), materials = new Map(), textures = new Set(), batches = new Map();
  const dummy = new THREE.Object3D();
  const seed = {v:117};
  function rnd() { seed.v = (seed.v * 1664525 + 1013904223) >>> 0; return seed.v / 4294967296; }
  function geo(name) {
    if (!geos.has(name)) {
      const g = name === 'box' ? new THREE.BoxGeometry(1,1,1) : name === 'cyl' ? new THREE.CylinderGeometry(.5,.5,1,12) : name === 'cyl6' ? new THREE.CylinderGeometry(.5,.5,1,6) : name === 'cone' ? new THREE.ConeGeometry(.5,1,12) : name === 'cone4' ? new THREE.ConeGeometry(.5,1,4) : name === 'sphere' ? new THREE.SphereGeometry(.5,10,8) : name === 'rock' ? new THREE.IcosahedronGeometry(.5,0) : name === 'torus' ? new THREE.TorusGeometry(.5,.055,6,32) : new THREE.PlaneGeometry(1,1);
      geos.set(name,g);
    }
    return geos.get(name);
  }
  function mat(name, color, extra={}) {
    if (!materials.has(name)) materials.set(name, new THREE.MeshStandardMaterial({color,roughness:.78,...extra}));
    return materials.get(name);
  }
  function add(shape, material, x,y,z, sx=1,sy=1,sz=1, ry=0, rx=0, rz=0, detail=false) {
    const key = `${shape}:${material.uuid}:${detail}`;
    if (!batches.has(key)) batches.set(key,{shape,material,transforms:[],detail});
    dummy.position.set(x,y,z); dummy.rotation.set(rx,ry,rz); dummy.scale.set(sx,sy,sz); dummy.updateMatrix();
    batches.get(key).transforms.push(dummy.matrix.clone());
  }
  const outside = (x,z) => Math.abs(x)>60||Math.abs(z)>60;
  const box = (m,x,y,z,w,h,d,ry=0,detail=false) => {add('box',m,x,y,z,w,h,d,ry,0,0,detail);if(BIG&&!detail&&h>2.5&&outside(x,z)&&y-h/2<2&&w<80&&d<80)collision(x,z,w,d,y+h/2);};
  const cyl = (m,x,y,z,r,h,detail=false) => {add('cyl',m,x,y,z,2*r,h,2*r,0,0,0,detail);if(BIG&&!detail&&h>2.5&&r>.3&&outside(x,z)&&y-h/2<2)collision(x,z,2*r,2*r,y+h/2);};
  const sphere = (m,x,y,z,rx,ry=rx,rz=rx,detail=false) => add('sphere',m,x,y,z,2*rx,2*ry,2*rz,0,0,0,detail);
  const collision = (x,z,w,d,height=4,minY=0) => colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,height,minY});
  function beam(m,a,b,r=.12,detail=false) {
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);
    dummy.position.copy(av.add(bv).multiplyScalar(.5)); dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()); dummy.scale.set(r*2,d.length(),r*2); dummy.updateMatrix();
    const key=`cyl:${m.uuid}:${detail}`; if(!batches.has(key)) batches.set(key,{shape:'cyl',material:m,transforms:[],detail}); batches.get(key).transforms.push(dummy.matrix.clone());
  }
  function surfaceTexture(kind, base, line) {
    const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;const c=canvas.getContext('2d');
    c.fillStyle=base;c.fillRect(0,0,256,256);
    if(kind==='stone') { c.strokeStyle=line;c.lineWidth=2;for(let n=0;n<256;n+=64) { c.beginPath();c.moveTo(n,0);c.lineTo(n,256);c.stroke();c.beginPath();c.moveTo(0,n);c.lineTo(256,n);c.stroke(); } }
    if(kind==='brick'||kind==='limestone') {
      const bh=kind==='brick'?16:32,bw=kind==='brick'?48:64;
      for(let row=0,y=0;y<256;y+=bh,row++)for(let x=-(row%2)*bw/2;x<256;x+=bw){
        c.fillStyle=rnd()>.5?'#ffffff12':'#0000000d';c.fillRect(x+1,y+1,bw-2,bh-2);
        c.strokeStyle=line;c.lineWidth=kind==='brick'?1.25:1.6;c.strokeRect(x,y,bw,bh);
        c.fillStyle='#ffffff15';c.fillRect(x+2,y+2,bw-4,1);
      }
    }
    if(kind==='road') {for(let n=0;n<1600;n++){c.fillStyle=n%3?'#ffffff12':'#00000018';c.fillRect(rnd()*256,rnd()*256,1+rnd()*1.5,1+rnd()*1.5);}}
    if(kind==='water') { for(let n=0;n<65;n++) {c.strokeStyle=n%2?line:'#b4e9ea50';c.lineWidth=1+rnd()*2;c.beginPath();let x=rnd()*256,y=rnd()*256;c.moveTo(x,y);c.bezierCurveTo(x+15,y-3,x+25,y+4,x+45,y);c.stroke();} }
    for(let n=0;n<650;n++) { c.fillStyle=n%2?'#ffffff0c':'#0000000d';c.fillRect(rnd()*256,rnd()*256,1+rnd()*2,1+rnd()*2); }
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;const repeats=kind==='water'?6:kind==='brick'?3:kind==='limestone'?2:12;t.repeat.set(repeats,repeats);t.anisotropy=4;textures.add(t);return t;
  }
  function label(text,x,y,z,w,h,opts={}) {
    const canvas=document.createElement('canvas');canvas.width=opts.large?1024:512;canvas.height=256;const c=canvas.getContext('2d');
    c.fillStyle=opts.bg||'#101b2d';c.fillRect(0,0,canvas.width,256);
    if(opts.border!==false) {c.strokeStyle=opts.accent||'#ddb576';c.lineWidth=7;c.strokeRect(9,9,canvas.width-18,238);}
    c.fillStyle=opts.color||'#faf7ef';c.textAlign='center';c.textBaseline='middle';c.font=`900 ${opts.font||64}px Arial, sans-serif`;c.fillText(text,canvas.width/2,132,canvas.width-40);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);
    const m=new THREE.MeshStandardMaterial({map:t,roughness:.65,emissive:opts.emissive||'#111821',emissiveIntensity:.3,side:THREE.DoubleSide});materials.set(`label${materials.size}`,m);
    const mesh=new THREE.Mesh(geo('plane'),m);mesh.position.set(x,y,z);mesh.rotation.y=opts.rotation||0;mesh.scale.set(w,h,1);mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  const concrete=mat('concrete','#adb2b5'), trim=mat('trim','#d9ddd9'), dark=mat('dark','#24313e'), metal=mat('metal','#52616b',{metalness:.65,roughness:.35});
  const gold=mat('gold','#c19a45',{metalness:.6,roughness:.34}), lightgold=mat('lightgold','#ead290',{metalness:.5,roughness:.32}), stone=mat('stone','#899195');
  const glass=mat('glass','#275870',{metalness:.7,roughness:.18}), lit=mat('lit','#ffdf9b',{emissive:'#ffbc52',emissiveIntensity:.45,roughness:.3});
  const blueGlow=mat('blueGlow','#75ddff',{emissive:'#26a7ed',emissiveIntensity:.65});
  const bark=mat('bark','#684d3e'), leaf=mat('leaf','#3c7653'), leaf2=mat('leaf2','#74965a'), green=mat('grass','#4d8964');
  function tree(x,z,s=1,variant=0) {
    cyl(bark,x,1.8*s,z,.25*s,3.6*s);collision(x,z,.65*s,.65*s,4.5*s);
    const foliage=variant?leaf2:leaf,spread=variant?1.16:.95;
    beam(bark,[x,2.2*s,z],[x-1.1*s,3.5*s,z+.25*s],.12*s);beam(bark,[x,2.7*s,z],[x+1.25*s,4*s,z-.3*s],.1*s);
    sphere(foliage,x,4.6*s,z,1.35*s,1.55*s,1.3*s);sphere(foliage,x-1.15*s*spread,3.95*s,z+.4*s,1.25*s,1.3*s,1.15*s);
    sphere(variant?leaf:leaf2,x+1.13*s*spread,4.35*s,z-.35*s,1.3*s,1.45*s,1.2*s);
    sphere(foliage,x-.15*s,3.8*s,z-1.0*s,1.25*s,1.2*s,1.25*s);sphere(leaf2,x+.1*s,4.05*s,z+1.0*s,1.1*s,1.2*s,1.2*s);
  }
  function bench(x,z,rot=0) {
    for(let i=0;i<4;i++)box(bark,x,.72,z-.25+i*.17,2.8,.11,.12,rot);
    for(let i=0;i<3;i++)box(bark,x,.96+i*.18,z-.35,2.8,.12,.1,rot);
    for(const side of [-1,1]){box(metal,x+side*.95,.38,z,.13,.7,.6,rot);box(metal,x+side*1.2,.94,z,.1,.1,.8,rot);box(metal,x+side*1.2,.76,z+.3,.08,.42,.08,rot);}
    collision(x,z,3,.95,1.5);
  }
  function planter(x,z,w,d,height=.65,flowers=false) {
    box(stone,x,height/2,z,w,height,d);box(trim,x,height+.025,z,w+.08,.1,d+.08);box(bark,x,height+.085,z,w-.22,.09,d-.22);collision(x,z,w+.1,d+.1,height+.15);
    for(let i=0;i<3;i++){const px=x+(i-1)*w*.27;sphere(i%2?leaf:leaf2,px,height+.42,z,w*.18,.42,d*.32);if(flowers)sphere(gold,px-.16,height+.75,z+.1,.11,.12,.11);}
  }
  function streetlamp(x,z,rot=0) {
    cyl(metal,x,3,z,.09,6);cyl(metal,x,.2,z,.24,.4);
    const ex=x+Math.sin(rot)*1.15,ez=z+Math.cos(rot)*1.15;
    beam(metal,[x,5.8,z],[ex,6.25,ez],.08);box(metal,ex,6.25,ez,.55,.16,.8,rot);box(lit,ex,6.14,ez,.4,.08,.65,rot);cyl(gold,x,1.4,z,.105,.25);
    collision(x,z,.45,.45,6);
  }
  function mountain(x,z,w,h,d,color) {add('cone',color,x,h*.43-2,z,w,h,d, rnd()*3);if(BIG&&outside(x,z))collision(x,z,w*.55,d*.55,h*.9);}
  function ring(m,x,y,z,r,rx=Math.PI/2) {add('torus',m,x,y,z,r*2,r*2,rx===Math.PI/2?.2:r*2,0,rx);}
  function openRoom(name,x,z,w,d,ceiling,wallMat,roofMat,entranceSide='z+',gap=8) {
    const t=.55,x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;
    function wallZ(zz,open){
      if(!open){box(wallMat,x,ceiling/2,zz,w,ceiling,t);collision(x,zz,w,t,ceiling);return;}
      const sw=(w-gap)/2;for(const s of [-1,1]){box(wallMat,x+s*(gap/2+sw/2),ceiling/2,zz,sw,ceiling,t);collision(x+s*(gap/2+sw/2),zz,sw,t,ceiling);box(trim,x+s*(gap/2+.13),ceiling/2,zz,.26,ceiling,t+.12);}
      box(roofMat,x,ceiling-.25,zz,gap+.7,.5,.8);
    }
    function wallX(xx,open){
      if(!open){box(wallMat,xx,ceiling/2,z,t,ceiling,d);collision(xx,z,t,d,ceiling);return;}
      const sw=(d-gap)/2;for(const s of [-1,1]){box(wallMat,xx,ceiling/2,z+s*(gap/2+sw/2),t,ceiling,sw);collision(xx,z+s*(gap/2+sw/2),t,sw,ceiling);box(trim,xx,ceiling/2,z+s*(gap/2+.13),t+.12,ceiling,.26);}
      box(roofMat,xx,ceiling-.25,z,.8,.5,gap+.7);
    }
    wallZ(z0+t/2,entranceSide==='z-');wallZ(z1-t/2,entranceSide==='z+');wallX(x0+t/2,entranceSide==='x-');wallX(x1-t/2,entranceSide==='x+');
    box(roofMat,x,ceiling+.2,z,w,.4,d);collision(x,z,w,d,ceiling+.4,ceiling);
    const entrance=entranceSide==='x+'?{x:x1+1.3,z}:entranceSide==='x-'?{x:x0-1.3,z}:entranceSide==='z-'?{x,z:z0-1.3}:{x,z:z1+1.3};
    interiors.push({name,minX:x0+t,maxX:x1-t,minZ:z0+t,maxZ:z1-t,ceiling,floor:0,entrance});
    landmarks.push({name,x:entrance.x,z:entrance.z});
    return {x,z,w,d,ceiling,entrance};
  }
  function bookcase(x,z,w=10) {
    box(bark,x,1.9,z,w,3.8,.7);collision(x,z,w+.1,.85,3.95);
    for(let row=0;row<4;row++){box(gold,x,.55+row*.86,z+.4,w+.1,.11,.23);for(let k=0;k<Math.floor(w/.65);k++)box(k%3===0?dark:k%3===1?glass:gold,x-w/2+.5+k*.65,.89+row*.86,z+.42,.42,.55,.24);}
  }
  function consoleDesk(x,z,w=7) {
    box(metal,x,.8,z,w,1.6,2);box(trim,x,1.65,z,w+.3,.15,2.15);collision(x,z,w+.4,2.3,2.5);
    for(const s of [-1,1]){box(dark,x+s*w*.25,2.15,z,2,.95,.18);box(blueGlow,x+s*w*.25,2.17,z+.105,1.8,.74,.04);}
  }


  // Buiten het oorspronkelijke speelveld (58) bouwen we de rest van de 2,5x grotere kaart:
  // blokken met straten ertussen, zodat je er altijd omheen kunt lopen.
  const spawnZones = id!=='avengers' ? [{x:0,z:0},{x:-100,z:-100},{x:100,z:-100},{x:-100,z:100},{x:100,z:100}] : null;
  // Een echt gebouw: sokkel, kroonlijst, ramen op alle vier de zijden en een deur met afdak.
  function building(x,z,w,h,d,wall,trim,windowMat,doorMat) {
    box(wall,x,h/2,z,w,h,d);
    box(trim,x,.5,z,w+.5,1,d+.5);
    box(trim,x,h+.3,z,w+.4,.6,d+.4);
    box(dark,x+w*.2,h+1.1,z-d*.15,Math.min(3,w*.35),1.2,Math.min(3,d*.35),0,true);
    const nx=Math.max(1,Math.floor(w/3.4)),nz=Math.max(1,Math.floor(d/3.4));
    for(let y=2.9;y<h-1.4;y+=3.3) {
      for(let i=0;i<nx;i++) {
        const ox=(i-(nx-1)/2)*3.2;
        box(windowMat,x+ox,y,z+d/2+.07,1.5,1.8,.14,0,true);box(windowMat,x+ox,y,z-d/2-.07,1.5,1.8,.14,0,true);
      }
      for(let i=0;i<nz;i++) {
        const oz=(i-(nz-1)/2)*3.2;
        box(windowMat,x+w/2+.07,y,z+oz,.14,1.8,1.5,0,true);box(windowMat,x-w/2-.07,y,z+oz,.14,1.8,1.5,0,true);
      }
    }
    box(doorMat,x,1.55,z+d/2+.09,2.3,3.1,.16,0,true);
    box(trim,x,3.35,z+d/2+.55,3.4,.25,1.2,0,true);
  }
  function fillRing(kind) {
    const groundCol={newyork:'#6b7078',wakanda:'#4e8a5c',asgard:'#a9915a',kamartaj:'#8b7d62',titan:'#a8653a',savage:'#3f7a46'}[kind]||'#777';
    // Alleen buiten het oude speelveld, en iets lager dan bestaande vloeren: voorkomt knipperende (z-fighting) vlakken.
    if(kind!=='titan'&&kind!=='savage'){const fg=mat('fillground'+kind,groundCol);
      box(fg,111,-.13,0,108,.1,330);box(fg,-111,-.13,0,108,.1,330);box(fg,0,-.13,111,114,.1,108);box(fg,0,-.13,-111,114,.1,108);}
    const wall1=mat('fw1'+kind,{newyork:'#8c93a0',wakanda:'#b8a37a',asgard:'#d2b46a',kamartaj:'#a66a4a',titan:'#7e4a30',savage:'#6e6a5a'}[kind]||'#888');
    const wall2=mat('fw2'+kind,{newyork:'#5d7a92',wakanda:'#7a5bb8',asgard:'#e8d28f',kamartaj:'#8e7a56',titan:'#a8653a',savage:'#8c8a78'}[kind]||'#666');
    for(let gx=-132;gx<=132;gx+=22)for(let gz=-132;gz<=132;gz+=22) {
      if(Math.abs(gx)<66&&Math.abs(gz)<66)continue;
      if(Math.abs(gx)%66<1||Math.abs(gz)%66<1)continue;
      if(spawnZones&&spawnZones.some(q=>Math.abs(gx-q.x)<28&&Math.abs(gz-q.z)<28))continue;
      const x=gx+(rnd()-.5)*5,z=gz+(rnd()-.5)*5,w=8+rnd()*8,d=8+rnd()*8,r=rnd();
      if(kind==='newyork') {const h=9+rnd()*34;building(x,z,w,h,d,r>.5?wall1:wall2,trim,glass,dark);}
      else if(kind==='wakanda') {if(r>.6){const h=14+rnd()*22;building(x,z,6,h,6,wall2,metal,blueGlow,blueGlow);box(blueGlow,x,h+1.6,z,2,1.4,2,0,true);}else{const h=5+rnd()*8;cyl(wall1,x,h/2,z,w/2.4,h);sphere(wall2,x,h,z,w/2.4,2.2,w/2.4);box(dark,x,1.4,z+w/2.4+.05,1.6,2.8,.12,0,true);}}
      else if(kind==='asgard') {const h=8+rnd()*22;building(x,z,w,h,d,wall1,gold,lit,gold);box(wall2,x,h+1.6,z,w*.7,2,d*.7,0,true);if(r>.5)cyl(wall2,x+w/2+1.6,(h+6)/2,z,1.2,h+6);}
      else if(kind==='kamartaj') {const h=5+rnd()*8;building(x,z,w,h,d,wall1,wall2,dark,bark);box(wall2,x,h+1.4,z,w+2,1.2,d+2,0,true);if(r>.6)tree(x+w,z+d,1.1,1);}
      else if(kind==='titan') {if(r>.5){const h=6+rnd()*16;mountain(x,z,w*1.6,h*1.6,d*1.6,wall1);}else{const h=5+rnd()*9;cyl(wall2,x,h/2,z,1.6,h);box(wall2,x,h+.5,z,4.2,1,4.2);}}
      else if(kind==='savage') {if(r>.35)tree(x,z,1.5+rnd()*1.4,r>.7?1:0);else {const h=3+rnd()*7;mountain(x,z,w*1.4,h*1.8,d*1.4,wall1);}}
    }
  }

  // Every environment has continuous ground. The limits are invisible solid boundaries,
  // not the edge of a platform.
  const BIG=id!=='avengers',boundary=BIG?145:58;
  colliders.push({minX:-1000,maxX:-boundary,minZ:-1000,maxZ:1000,height:1000},{minX:boundary,maxX:1000,minZ:-1000,maxZ:1000,height:1000},{minX:-1000,maxX:1000,minZ:-1000,maxZ:-boundary,height:1000},{minX:-1000,maxX:1000,minZ:boundary,maxZ:1000,height:1000});

  if(id==='newyork') {
    const road=mat('asphalt','#48525f',{map:surfaceTexture('road','#92999e','#414950')});
    const paving=mat('paving','#b7b9b3',{map:surfaceTexture('stone','#d9d8d0','#b3b6ae')});
    const redbrick=mat('redbrick','#ffffff',{map:surfaceTexture('brick','#a7715d','#71584c')}),brownbrick=mat('brownbrick','#ffffff',{map:surfaceTexture('brick','#8a6d5b','#62584c')}),limestone=mat('limestone','#ffffff',{map:surfaceTexture('limestone','#b8b5a6','#9c9e93')}),towerBlue=mat('towerBlue','#446e82',{metalness:.62,roughness:.24});
    for(const m of [redbrick,brownbrick,limestone])m.userData.softwareTexture=true;
    const white=mat('white','#eee9df'),yellow=mat('taxi','#edb735',{metalness:.18,roughness:.35}),red=mat('redcar','#9d3a46',{metalness:.32,roughness:.35});
    const rubber=mat('rubber','#151c24'), lawn=mat('lawn','#487d5b'),shopglass=mat('shopglass','#54828d',{metalness:.48,roughness:.22}),terracotta=mat('terracotta','#aa7156');
    function roomShell(name,x,z,w,d,ceiling,wallMaterial,kind='modern') {
      const thick=.55,door=5.8,sideWidth=(w-door)/2,front=z+d/2,back=z-d/2;
      box(kind==='mystic'?bark:paving,x,.025,z,w,.05,d);
      for(const side of [-1,1]){
        box(wallMaterial,x+side*(w/2-thick/2),ceiling/2,z,thick,ceiling,d);collision(x+side*(w/2-thick/2),z,thick,d,ceiling);
        box(wallMaterial,x+side*(door/2+sideWidth/2),ceiling/2,front-thick/2,sideWidth,ceiling,thick);collision(x+side*(door/2+sideWidth/2),front-thick/2,sideWidth,thick,ceiling);
        box(trim,x+side*(door/2+.12),ceiling/2,front+.06,.24,ceiling,.2);
        box(lit,x+side*w*.28,ceiling-.13,z,w*.3,.08,.3);
      }
      box(wallMaterial,x,ceiling/2,back+thick/2,w,ceiling,thick);collision(x,back+thick/2,w,thick,ceiling);
      box(trim,x,ceiling+.05,front+.05,door+.55,.18,.28);
      box(kind==='mystic'?red:dark,x,.065,z+1,5.2,.035,5.3);ring(gold,x,.095,z+1,1.8);
      // Side furniture leaves a broad straight entrance route down the centre.
      const deskX=x-w*.26,deskZ=z-1.8;
      box(kind==='mystic'?bark:metal,deskX,.65,deskZ,3.2,1.3,1.5);box(trim,deskX,1.34,deskZ,3.4,.12,1.65);collision(deskX,deskZ,3.5,1.75,2.15);
      if(kind!=='mystic'){box(dark,deskX,1.8,deskZ,1.4,.75,.14);box(blueGlow,deskX,1.82,deskZ+.08,1.22,.56,.05);box(white,deskX+.9,1.44,deskZ+.2,.55,.025,.45);}
      else {cyl(gold,deskX,1.6,deskZ,.24,.45);sphere(blueGlow,deskX,1.98,deskZ,.28,.32,.28);}
      const sofaX=x+w*.26;
      box(kind==='mystic'?red:dark,sofaX,.54,z+1.5,2.6,1.08,1.35);box(kind==='mystic'?red:dark,sofaX,.98,z+1,2.6,1,.3);collision(sofaX,z+1.45,2.8,1.65,1.55);
      box(bark,x,1.55,back+1.1,w*.58,3.1,.72);collision(x,back+1.1,w*.6,.85,3.25);
      for(let shelf=0;shelf<3;shelf++){
        box(trim,x,.6+shelf*.9,back+1.5,w*.6,.1,.22);
        for(let book=-3;book<=3;book++)box(book%3===0?red:book%2?glass:gold,x+book*.75,.95+shelf*.9,back+1.52,.42,.57,.23);
      }
      label(kind==='mystic'?'SANCTUM ARCHIEF':name==='Daily Bugle'?'THE DAILY BUGLE':'AVENGERS HQ',x,3.9,back+.57,w*.58,.85,{font:58,bg:kind==='mystic'?'#4c3039':'#183747',accent:'#c4a66c'});
      interiors.push({name,minX:x-w/2+thick,maxX:x+w/2-thick,minZ:back+thick,maxZ:front,ceiling,floor:0,entrance:{x,z:front+.92}});
    }
    box(road,0,-.2,0,300,.38,300);
    box(paving,0,.015,0,51,.05,52);
    // Warm paving borders and a subtle avenue grid keep the playable plaza readable.
    box(trim,0,.045,-26,51,.09,.3);box(trim,0,.045,26,51,.09,.3);box(trim,-25.5,.045,0,.3,.09,52);box(trim,25.5,.045,0,.3,.09,52);
    for(let q=-22;q<=22;q+=5.5){box(concrete,q,.052,0,.09,.025,51);box(concrete,0,.052,q,50,.025,.09);}
    // Contrasting paver bands, diamond inlays and tactile crossing edges keep the
    // plaza detailed even when expensive GPU textures are unavailable.
    for(const x of [-12,12])box(stone,x,.057,0,1.1,.025,51);
    for(const z of [-12,12])box(stone,0,.058,z,50,.025,1.1);
    for(const x of [-11,0,11])for(const z of [-11,0,11])box(trim,x,.071,z,1.2,.025,1.2,Math.PI/4);
    ring(stone,0,.075,0,4.2);ring(gold,0,.078,0,3.8);
    for(const x of [-24.3,24.3])for(let z=-20;z<=20;z+=4)box(gold,x,.074,z,.6,.025,.16);
    for(let z=-100;z<=100;z+=7) {box(yellow,-31,.017,z,.12,.025,3.5);box(yellow,31,.017,z,.12,.025,3.5);}
    for(let x=-100;x<=100;x+=7) {box(yellow,x,.017,-31,3.5,.025,.12);box(yellow,x,.017,31,3.5,.025,.12);}
    for(let a=-22;a<=22;a+=3)for(const s of [-1,1]){box(white,a,.03,s*30,1.4,.025,7);box(white,s*30,.03,a,7,.025,1.4);}
    function building(x,z,w,d,h,material,seedValue=0) {
      const walkIn=seedValue===0,ceiling=5.2;
      box(paving,x,walkIn?-.04:.09,z,w+2,walkIn?.08:.18,d+2);
      if(walkIn){box(material,x,(h+ceiling)/2+.18,z,w,h-ceiling,d);collision(x,z,w,d,h+1,ceiling);roomShell('Daily Bugle',x,z,w,d,ceiling,material);}
      else{box(material,x,h/2+.18,z,w,h,d);collision(x,z,w+1,d+1,h+1);box(stone,x,1.5,z,w+.08,3,d+.08);box(dark,x,3.04,z,w+.14,.32,d+.14);}
      box(trim,x,h+.15,z,w+.65,.35,d+.65);box(stone,x,h+.48,z,w+.3,.3,d+.3);box(dark,x,h+.76,z,w-.5,.3,d-.5);
      // Windows and sills are essential architecture at both quality levels.
      // Only their fine mullions and rooftop mechanical trim are optional.
      const floors=Math.floor((h-3.5)/3.15),cols=Math.floor((w-1)/2.7),sidecols=Math.floor((d-1)/2.7);
      for(let floor=0;floor<floors;floor++) {
        const yy=4.65+floor*3.15;
        for(let c=0;c<cols;c++)for(const side of [-1,1]) {
          const xx=x+(c-(cols-1)/2)*2.7,zz=z+side*(d/2+.065),wm=((floor*7+c*3+seedValue)%7===0)?lit:glass;
          if(walkIn&&floor===0&&side===1&&Math.abs(xx-x)<3)continue;
          box(wm,xx,yy,zz,1.38,1.85,.09);box(trim,xx,yy-.98,zz+side*.08,1.62,.13,.2);
          if(floor<3){box(metal,xx,yy,zz+side*.065,.06,1.8,.06,0,true);box(metal,xx,yy+.25,zz+side*.065,1.35,.06,.06,0,true);}
        }
        for(let c=0;c<sidecols;c++)for(const side of [-1,1]){
          const zz=z+(c-(sidecols-1)/2)*2.7,xx=x+side*(w/2+.065);box((floor+c+seedValue)%8===0?lit:glass,xx,yy,zz,.09,1.85,1.38);box(trim,xx+side*.08,yy-.98,zz,.2,.13,1.62);
        }
      }
      // Generous shopfront glass, inset entrances, transom frames and masonry piers.
      for(const side of [-1,1]) {
        const fz=z+side*(d/2+.11),fx=x+side*(w/2+.11);
        for(const c of [-1,1]){
          box(shopglass,x+c*w*.29,1.5,fz,w*.27,2.35,.08);box(lit,x+c*w*.29,2.61,fz+side*.05,w*.26,.07,.07);
          box(shopglass,fx,1.5,z+c*d*.29,.08,2.35,d*.27);box(lit,fx+side*.05,2.61,z+c*d*.29,.07,.07,d*.26);
          box(trim,x+c*w*.45,1.5,fz,.32,2.7,.22);box(trim,fx,1.5,z+c*d*.45,.22,2.7,.32);
        }
        if(!walkIn||side===-1){box(dark,x,1.4,fz,2.05,2.6,.14);box(shopglass,x,1.55,fz+side*.1,1.6,2.15,.08);box(gold,x+.5,1.2,fz+side*.17,.06,.52,.05);box(trim,x,2.9,fz+side*.08,2.8,.18,.32);}
        box(trim,x-w*.47,h/2,fz,.32,h,.16);box(trim,x+w*.47,h/2,fz,.32,h,.16);
      }
      // HVAC housings, aerials and iconic water tanks give roofs a real silhouette.
      box(metal,x-w*.18,h+1.35,z,3,1.3,3);box(dark,x-w*.18,h+2.02,z,3.1,.12,3.1);
      for(let k=-1;k<=1;k++)box(stone,x-w*.18+k*.68,h+2.1,z,.35,.08,2.7,0,true);
      cyl(metal,x+w*.28,h+3.2,z-d*.23,.08,5);beam(metal,[x+w*.28-1.3,h+4.6,z-d*.23],[x+w*.28+1.3,h+4.6,z-d*.23],.045,true);
      if(seedValue%3===0){
        const wx=x+w*.2,wz=z-d*.13;
        for(const a of [-1,1])for(const b of [-1,1])box(metal,wx+a*1.1,h+1.3,wz+b*1.1,.16,2.4,.16);
        cyl(bark,wx,h+3.2,wz,1.65,2.6);cyl(metal,wx,h+2.3,wz,1.69,.16);cyl(metal,wx,h+4.1,wz,1.69,.16);add('cone',dark,wx,h+4.95,wz,3.7,1.1,3.7);
      }
    }
    const defs=[[-46,-39,18,20,25,redbrick],[-47,-16,17,17,18,brownbrick],[-46,22,18,19,23,limestone],[-45,45,20,17,32,redbrick],[47,-15,17,19,27,limestone],[45,12,20,20,22,brownbrick],[46,40,18,21,36,towerBlue],[-19,-47,20,18,24,brownbrick],[6,-48,20,17,32,limestone],[-20,48,21,18,20,redbrick],[6,48,21,18,26,brownbrick],[27,49,15,16,31,limestone]];
    defs.forEach((b,i)=>building(...b,i));
    // Avengers Tower: stepped blue-glass skyline, steel ribs and illuminated A insignia.
    const tx=36,tz=-46;
    box(paving,tx,-.025,tz,22,.05,22);box(towerBlue,tx,23.8,tz,17,36.4,18);box(towerBlue,tx+2,46,tz,13,10,15);box(glass,tx+3,53,tz,10,5,13);
    collision(tx,tz,17,18,58,5.6);roomShell('Avengers Tower',tx,tz,17,18,5.6,towerBlue);
    for(let y=7.5;y<52;y+=2.5){box(trim,tx+.2,y,tz+9.08,y<42?17:12,.12,.15);if(y<42)box(glass,tx-8.57,y+1.05,tz,.14,1.8,17);}
    for(const x of [-7,-3,3,7])box(metal,tx+x,23,tz+9.18,.3,42,.25);
    box(glass,tx+3,56,tz,5,1,9);cyl(metal,tx+3,60,tz,.15,8);
    label('A',tx+1,44,tz+9.3,6,6,{font:190,bg:'#1b3c50',accent:'#74dafc',color:'#d4f8ff',emissive:'#39a7d8'});
    label('INGANG · AVENGERS TOWER',tx,6.35,tz+9.25,16,1.2,{font:42,bg:'#18293a',accent:'#88e2ed'});
    for(const side of [-1,1]){box(glass,tx+side*5.5,2.2,tz+9.1,4.3,3.8,.1);box(blueGlow,tx+side*3.15,2.6,tz+9.2,.18,5.2,.16);}box(blueGlow,tx,5.5,tz+9.25,16,.12,.14);
    for(let z=tz+10;z<=-28;z+=1.6){box(blueGlow,tx-.95,.075,z,.18,.025,.65);box(blueGlow,tx+.95,.075,z,.18,.025,.65);}
    for(let x=18;x<36;x+=2)box(trim,x,.054,-28,1,.018,.16);
    landmarks.push({name:'Avengers Tower',x:tx,z:tz});
    // Greenwich-inspired Sanctum, placed in this compact playable Manhattan district.
    const sx=-46,sz=2;
    box(redbrick,sx,8.55,sz,17,6.9,16);collision(sx,sz,17,16,15,5.1);roomShell('Sanctum Sanctorum',sx,sz,17,16,5.1,redbrick,'mystic');
    for(const side of [-1,1])box(limestone,sx+side*5.7,1.2,sz+8.25,5.3,2.4,.6);
    add('cone4',dark,sx,14,sz,24,5,23,Math.PI/4);
    box(limestone,sx,10.4,sz+8.3,17,.5,.4);
    add('cyl',glass,sx,8.2,sz+8.45,4.3,.12,4.3,0,Math.PI/2);
    ring(gold,sx,8.2,sz+8.58,2.3,0);ring(gold,sx,8.2,sz+8.62,1.75,0);
    beam(gold,[sx-1.65,6.5,sz+8.65],[sx+1.65,9.9,sz+8.65],.065);beam(gold,[sx+1.65,6.5,sz+8.65],[sx-1.65,9.9,sz+8.65],.065);
    box(gold,sx,8.2,sz+8.68,.1,4.2,.1);box(gold,sx,8.2,sz+8.68,4.2,.1,.1);
    for(const side of [-1,1])for(let floor=0;floor<2;floor++)box(glass,sx+side*5,3.5+floor*4,sz+8.35,2,2.4,.1);
    label('SANCTUM',sx,5.75,sz+8.65,6,.8,{font:65,bg:'#6a4039',accent:'#c59f60'});
    for(const side of [-1,1]){box(limestone,sx+side*3.1,2.5,sz+8.45,.38,5,.45);box(gold,sx+side*3.6,3.05,sz+8.5,.28,.55,.2);box(lit,sx+side*3.6,3.05,sz+8.65,.2,.4,.15);}
    box(limestone,sx,5.2,sz+8.45,6.8,.35,.5);
    landmarks.push({name:'Sanctum Sanctorum',x:sx,z:sz});
    // Storefronts and awnings make the streets feel inhabited.
    [['DAILY BUGLE',-46,-28,18],['COFFEE',-46,32,13],['MIDTOWN',6,-38,18],['PIZZA',-20,38,17],['OSCORP',46,51,11]].forEach(([s,x,z,w],i)=>{
      const lift=i===0?2.4:0;
      label(s,x,3.95+lift,z,w*.64,1.15,{bg:i%2?'#244b43':'#702e3c',accent:'#d5bf9a',font:54});
      box(i%2?leaf:red,x,3.17+lift,z-.3,w*.65,.22,1.9);
      for(let stripe=-3;stripe<=3;stripe++)box(white,x+stripe*w*.08,3.29+lift,z-.3,w*.035,.035,1.85);
      for(const side of [-1,1]){box(metal,x+side*w*.31,3.2+lift,z,.1,.15,2.3);box(lit,x+side*w*.31,3.02+lift,z+.4,.3,.1,.35);}
    });
    function car(x,z,material,rot=0,taxi=false) {
      // Cars are rigid props with whole-volume collision.
      function cb(m,lx,y,lz,w,h,d){const ox=x+Math.cos(rot)*lx+Math.sin(rot)*lz,oz=z-Math.sin(rot)*lx+Math.cos(rot)*lz;box(m,ox,y,oz,w,h,d,rot);}
      cb(material,0,.65,0,2.1,.65,4.1);cb(material,0,1.2,-.25,1.85,.7,2.1);cb(glass,0,1.25,.85,1.65,.5,.08);cb(glass,0,1.25,-1.32,1.65,.5,.08);
      for(const s of [-1,1]) {cb(glass,s*.94,1.26,-.2,.06,.45,1.5);cb(lit,s*.68,.72,2.08,.45,.23,.06);cb(red,s*.72,.72,-2.08,.35,.2,.06);}
      for(const s of [-1,1])for(const a of [-1.25,1.25]){const ox=x+Math.cos(rot)*s*1.03+Math.sin(rot)*a,oz=z-Math.sin(rot)*s*1.03+Math.cos(rot)*a;add('cyl',rubber,ox,.43,oz,.8,.18,.8,rot,0,Math.PI/2);}
      if(taxi)cb(lit,0,1.72,-.15,.8,.22,.45);
      collision(x,z,Math.abs(Math.cos(rot))*2.2+Math.abs(Math.sin(rot))*4.2,Math.abs(Math.cos(rot))*4.2+Math.abs(Math.sin(rot))*2.2,1.9);
    }
    car(-33,-14,yellow,0,true);car(34,12,red,Math.PI);car(-12,-34,dark,Math.PI/2);car(15,34,yellow,Math.PI/2,true);car(-34,38,dark,0);car(45,-32,yellow,Math.PI/2,true);
    // Flush road furniture and storm drains add scale without invisible obstacles.
    for(const [x,z] of [[-30,8],[30,-14],[-5,31],[12,-31]]){
      cyl(metal,x,.025,z,.74,.035);ring(dark,x,.045,z,.67);
      for(let k=-2;k<=2;k++)box(dark,x+k*.18,.05,z,.065,.018,1.1);
    }
    for(const x of [-25.9,25.9])for(const z of [-15,15]){box(dark,x,.025,z,.65,.035,1.3);for(let k=-3;k<=3;k++)box(metal,x,.049,z+k*.16,.6,.018,.045);}
    // Two planting islands frame the arena while the centre and spawn lanes stay open.
    for(const x of [-19.2,19.2]){planter(x,3.5,3.2,6.6,.65,true);bench(x,8.3);}
    // Solid street kiosks provide fair, readable cover on both sides of PvP.
    for(const side of [-1,1]){
      const x=side*11.8,z=side*3;
      box(metal,x,1.28,z,2.6,2.56,1.8);box(dark,x,2.65,z,2.85,.18,2);box(shopglass,x,1.42,z+.93,2.14,1.8,.09);
      box(blueGlow,x,2.32,z+.99,2.12,.07,.1);box(trim,x,.38,z+.95,2.25,.2,.13);collision(x,z,2.9,2.05,2.8);
      label('MIDTOWN',x,1.6,z+1.01,1.9,.7,{font:55,bg:'#234454',accent:'#81b1b9',color:'#e5f1e9'});
    }
    for(const x of [-24,24])for(const z of [-23,0,23]) {
      box(concrete,x,.35,z,3.4,.7,3.4);box(trim,x,.74,z,3.5,.12,3.5);box(lawn,x,.82,z,3.1,.05,3.1);collision(x,z,3.5,3.5,.85);tree(x,z,.87+(z===0?.08:0),(x+z+1)%2);
    }
    for(const x of [-21,21])for(const z of [-25,25])bench(x,z);
    for(const x of [-22.4,22.4])for(const z of [-10,12]){cyl(terracotta,x,.45,z,.62,.9);cyl(trim,x,.92,z,.67,.12);sphere(leaf,x,1.2,z,.7,.55,.7);collision(x,z,1.4,1.4,1.3);}
    for(const x of [-27,27])for(const z of [-22,0,22])streetlamp(x,z,x<0?Math.PI/2:-Math.PI/2);
    for(const [x,z,rot] of [[-27,-28,0],[27,28,Math.PI]]){
      cyl(metal,x,2.5,z,.12,5);box(dark,x,4.3,z,.42,1.2,.36,rot);for(let i=0;i<3;i++)sphere(i===0?red:i===1?yellow:leaf2,x,4.67-i*.37,z+(rot?-.21:.21),.12,.12,.04);collision(x,z,.55,.55,5.1);
    }
    const district=label('AVENGERS DISTRICT',0,.094,-8,13,1.5,{font:60,bg:'#aeb6b7',color:'#4c6171',accent:'#87989f',border:false});district.rotation.x=-Math.PI/2;
    // Outlying blocks extend to the horizon and keep the city grounded.
    for(let i=0;i<26;i++) {
      const angle=(i/26)*Math.PI*2,r=89+rnd()*45,x=Math.sin(angle)*r,z=Math.cos(angle)*r,h=18+rnd()*48,w=11+rnd()*14;
      box(i%3?stone:towerBlue,x,h/2,z,w,h,12+rnd()*15);box(dark,x,h+.7,z,w*.5,1.4,8);
      if(i%3===0)cyl(metal,x,h+5,z,.16,10);
      for(let y=5;y<h-2;y+=4)box(glass,x,y,z+9,w*.85,.7,.1);
    }
    // Skyline billboard and pavement wayfinding.
    label('NEW YORK',-5,8,-57,14,3,{bg:'#133247',accent:'#4db9d0',font:75});
    landmarks.push({name:'Manhattan Plaza',x:0,z:0});
  } else if(id==='wakanda') {
    const earth=mat('earth','#a78360'),sandstone=mat('sandstone','#bea578'),vibranium=mat('vibranium','#645991',{metalness:.65,roughness:.3}),purple=mat('purpleglow','#9d76f6',{emissive:'#7746db',emissiveIntensity:.65});
    const jungle=mat('jungle','#28684d'),palegrass=mat('palegrass','#78a268'),rock=mat('cliff','#62776e');
    const plaza=mat('wakandaplaza','#bea982',{map:surfaceTexture('stone','#d4c39a','#b2a47f')});
    const water=mat('water','#3f9eaf',{map:surfaceTexture('water','#559fae','#9bdfdd'),roughness:.15,metalness:.3,transparent:true,opacity:.88});
    box(green,0,-.23,0,360,.44,360);box(plaza,0,.015,0,50,.04,54);box(plaza,0,.025,40,12,.06,65);box(plaza,0,.025,-38,12,.06,60);box(plaza,41,.025,0,65,.06,12);box(plaza,-41,.025,0,65,.06,12);
    // Warm stonework, fine tile joints and geometric brass borders are built
    // into the ground, so the open fighting surface stays completely walkable.
    for(let x=-24;x<=24;x+=4)box(sandstone,x,.044,0,.06,.018,54);
    for(let z=-26;z<=26;z+=4)box(sandstone,0,.045,z,50,.018,.06);
    for(const x of [-23,23])for(let z=-24;z<=24;z+=3.2){box(gold,x,.061,z,1,.026,1,Math.PI/4);box(vibranium,x,.075,z,.45,.025,.45,Math.PI/4);}
    box(vibranium,0,.052,0,3.5,.025,3.5,Math.PI/4);box(gold,0,.07,0,1.8,.025,1.8,Math.PI/4);
    // Radial inlaid brass lines and vibranium center seal.
    ring(gold,0,.065,0,11);ring(vibranium,0,.067,0,10.4);ring(gold,0,.064,0,3.6);
    for(let i=0;i<8;i++) {const a=i*Math.PI/4;box(gold,Math.sin(a)*17,.06,Math.cos(a)*17,.12,.035,12,a);}
    // The river lies beyond the walkable west embankment; its bank is solid.
    box(water,-69,-.04,0,19,.18,200);dynamics.push({type:'water',material:water});
    for(let z=-65;z<=65;z+=13) {
      add('rock',rock,-56.5,1.4,z,8,4,10,rnd()*4);collision(-56,z,8,10,3.5);
      add('rock',rock,52,1.7,z,8,5,10,rnd()*4);collision(52,z,8,10,4);
    }
    // Stepped palace and spherical vibranium crowns at the far end of the plaza.
    function domeTower(x,z,r,h,variant=0) {
      cyl(sandstone,x,h/2,z,r,h);cyl(dark,x,h*.7,z,r*1.04,.7);cyl(gold,x,h*.88,z,r*1.09,.6);
      sphere(variant?vibranium:gold,x,h+.1,z,r*1.07,r*.82,r*1.07);cyl(purple,x,h*.35,z,r*1.015,.22);cyl(purple,x,h*.6,z,r*1.015,.22);
      cyl(stone,x,.5,z,r*1.12,1);cyl(gold,x,1.1,z,r*1.13,.2);
      for(let i=0;i<12;i++){const a=i*Math.PI/6;box(gold,x+Math.sin(a)*(r+.04),h/2,z+Math.cos(a)*(r+.04),.16,h,.16);box(glass,x+Math.sin(a)*(r+.09),h*.48,z+Math.cos(a)*(r+.09),1,h*.18,.13,a);}
      for(let j=1;j<5;j++)cyl(sandstone,x,j*h/5,z,r*1.014,.09);
      cyl(lightgold,x,h+r*.74,z,.32,r*.7);sphere(purple,x,h+r*1.13,z,.36,.5,.36);
      collision(x,z,r*2+1,r*2+1,h+r);
    }
    domeTower(0,-47,8,24,1);domeTower(-15,-45,4.2,18);domeTower(15,-45,4.2,18);
    box(sandstone,0,2,-38,24,4,8);collision(0,-39,24,10,5);box(dark,0,4,-33.91,4,6,.2);box(gold,0,7.2,-33.8,7,.45,.4);
    for(const x of [-10,-6,6,10]){box(stone,x,2.1,-33.85,.65,4.2,.5);box(gold,x,4.3,-33.78,1.1,.25,.65);box(purple,x,2.4,-33.54,.15,2.7,.1);}
    box(gold,0,.55,-33.7,24,.18,.4);box(gold,0,3.8,-33.7,24,.18,.4);
    label('WAKANDA',0,10.2,-38.7,11,2.2,{font:68,bg:'#2e3346',accent:'#c8ad5f'});landmarks.push({name:'Koninklijk paleis',x:0,z:-46});
    // A crouching panther sculpture; angular stone shapes, amber eyes and silver claws.
    const px=35,pz=-10;
    box(dark,px,1,pz,12,2,11);collision(px,pz,12,11,12);
    sphere(dark,px,5.2,pz,4,3,3.9);sphere(dark,px,7.6,pz+2.6,2.7,2.35,2.3);sphere(dark,px,6.65,pz+4.1,2.1,1,1.1);
    for(const s of [-1,1]) {add('cone',dark,px+s*1.9,9.8,pz+2.1,1.7,2.6,1.6,s*.2);box(gold,px+s*1.13,7.9,pz+4.63,.78,.22,.15);sphere(dark,px+s*2.65,3.1,pz+2.1,1.1,2,1.25);sphere(dark,px+s*2.7,1.9,pz+3.4,1.3,.65,2);for(let c=0;c<3;c++)box(metal,px+s*2.7+(c-1)*.55,1.7,pz+5.1,.15,.14,1.1);}
    beam(dark,[px,4.7,pz-2],[px+4,4,pz-6],.55);landmarks.push({name:'Pantermonument',x:px,z:pz});
    // Marketplace dwellings with futuristic roofs.
    const huts=[[-38,-28,5,9],[-41,-10,5,10],[-38,18,6,11],[36,23,6,10],[38,43,4.8,12],[-35,42,6,10]];
    huts.forEach(([x,z,r,h],i)=>{cyl(earth,x,h/2,z,r,h);add('cone',i%2?gold:vibranium,x,h+1.6,z,r*2.5,4,r*2.5);cyl(gold,x,h*.82,z,r*1.04,.45);cyl(stone,x,.4,z,r*1.08,.8);box(dark,x,1.6,z+r+.05,2.2,3.2,.15);box(gold,x,3.35,z+r+.16,3,.25,.3);for(const s of [-1,1])box(sandstone,x+s*1.3,1.7,z+r+.12,.24,3.4,.25);collision(x,z,r*2+1,r*2+1,h+4);for(let n=0;n<6;n++){let a=n*Math.PI/3;box(purple,x+Math.sin(a)*(r+.03),h*.55,z+Math.cos(a)*(r+.03),.25,h*.3,.25);box(gold,x+Math.sin(a)*(r+.05),h*.35,z+Math.cos(a)*(r+.05),.8,.12,.18,a);}});
    // Low stone garden beds and broad-leaved plants soften the urban edge.
    for(const x of [-27,27])for(const z of [-15,14]){
      planter(x,z,3.2,4.8,.6,true);
      for(let k=0;k<4;k++){const a=k*Math.PI/2;add('sphere',palegrass,x+Math.sin(a)*.55,1.35,z+Math.cos(a)*.65,1.3,.16,2.0,a,-.25);}
    }
    for(const side of [-1,1]){
      const x=side*11.8,z=side*3;
      box(stone,x,.35,z,2.7,.7,2.7);add('cyl6',vibranium,x,1.75,z,2.1,2.8,2.1,Math.PI/6);cyl(gold,x,3.16,z,1.12,.22);
      box(purple,x,1.85,z+1.065,.15,1.85,.1);box(gold,x,1.85,z+1.13,.5,.15,.11);collision(x,z,2.8,2.8,3.35);
    }
    for(const [x,z] of [[-30,30],[29,37]]){
      for(const s of [-1,1])cyl(bark,x+s*1.7,1.8,z,.13,3.6);
      box(vibranium,x,3.55,z,4.2,.15,3.1);box(gold,x,3.68,z,4.4,.12,3.25);box(sandstone,x,.7,z,3.8,1.4,1.7);collision(x,z,4.4,3.3,3.9);
      for(const s of [-1,0,1])sphere(s===0?purple:gold,x+s*.95,1.55,z,.3,.3,.3);
    }
    // Mountains and the waterfall form the backdrop, outside the collision boundary.
    for(let i=0;i<17;i++){const a=(i/17)*Math.PI*2,r=103+rnd()*18;mountain(Math.sin(a)*r,Math.cos(a)*r,47+rnd()*35,28+rnd()*47,42+rnd()*35,i%2?rock:jungle);}
    box(rock,-68,14,-58,30,30,18);box(rock,-63,29,-62,20,12,15);
    const waterfallMat=mat('waterfall','#a7e8ed',{emissive:'#6bb5bd',emissiveIntensity:.17,roughness:.2,transparent:true,opacity:.85});
    const waterfall=new THREE.Mesh(geo('box'),waterfallMat);waterfall.position.set(-62,15,-47.8);waterfall.scale.set(8,30,.8);group.add(waterfall);dynamics.push({type:'fall',mesh:waterfall,baseY:15});
    for(let i=0;i<8;i++)box(trim,-65+i*.9,15,-47.2,.2,30,.07,0,true);
    sphere(waterfallMat,-62,1,-46,6,1.1,3.4);landmarks.push({name:'Watervallen',x:-52,z:-46});
    for(const [x,z,s] of [[-27,-25,1.1],[-27,25,1.1],[27,28,1],[27,-27,1.2],[-46,2,1.3],[43,-33,1.2],[-46,47,1.5],[46,4,1.2],[18,43,1],[-18,43,1]])tree(x,z,s,1);
    for(let i=0;i<14;i++){let a=i/14*Math.PI*2;const x=Math.sin(a)*78,z=Math.cos(a)*78;tree(x,z,1.7+rnd(),i%2);}
    for(const x of [-21,21])for(const z of [-26,26]) {cyl(gold,x,1.8,z,.16,3.6);sphere(purple,x,3.7,z,.42,.5,.42);collision(x,z,.6,.6,4.5);}
    landmarks.push({name:'Vibraniumplein',x:0,z:0});
  } else if(id==='asgard') {
    const marble=mat('marble','#d9d3bd',{map:surfaceTexture('stone','#e2ddcb','#c6bea4')});
    const palace=mat('palace','#d7b872',{metalness:.25,roughness:.42}),blue=mat('asgardblue','#3f678a',{metalness:.25,roughness:.4}),rock=mat('asgardrock','#7c8598');
    const water=mat('asgardwater','#517da0',{map:surfaceTexture('water','#4b769b','#82bbd5'),metalness:.4,roughness:.15});
    box(water,0,-3,0,500,1,500);dynamics.push({type:'water',material:water});
    // Broad terraced land under the city, with distant mountains, not a floating island.
    box(stone,0,-2.6,0,150,5,190);box(marble,0,-.15,0,116,.3,116);
    for(let x=-52;x<=52;x+=4)box(stone,x,.012,0,.045,.018,112);
    for(let z=-52;z<=52;z+=4)box(stone,0,.013,z,112,.018,.045);
    box(gold,0,.04,0,1.5,.07,112);box(gold,0,.04,0,110,.07,1.5);
    for(const x of [-26,26])box(gold,x,.04,0,.3,.07,112);for(const z of [-28,28])box(gold,0,.04,z,112,.07,.3);
    ring(gold,0,.08,0,13);ring(gold,0,.08,0,12);ring(blue,0,.08,0,6);
    for(let a=0;a<8;a++) {const t=a*Math.PI/4;box(lightgold,Math.sin(t)*20,.06,Math.cos(t)*20,.18,.05,12,t);}
    function spire(x,z,r,h) {
      cyl(palace,x,h*.43,z,r,h*.86);cyl(gold,x,.5,z,r*1.25,1);cyl(gold,x,h*.4,z,r*1.12,.6);cyl(lightgold,x,h*.78,z,r*1.08,.8);add('cone',lightgold,x,h,z,r*2.3,h*.32,r*2.3);
      cyl(stone,x,.22,z,r*1.28,.44);cyl(lightgold,x,1.25,z,r*1.16,.2);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;box(gold,x+Math.sin(a)*r,h*.43,z+Math.cos(a)*r,.2,h*.8,.2);box(blue,x+Math.sin(a)*(r+.05),h*.47,z+Math.cos(a)*(r+.05),.6,h*.35,.08,a);box(lightgold,x+Math.sin(a)*(r+.08),h*.67,z+Math.cos(a)*(r+.08),.9,.25,.16,a);}
      collision(x,z,r*2.7,r*2.7,h*1.2);
    }
    // Golden palace, a dense symmetrical crown of towers on solid foundations.
    box(palace,0,6,-45,38,12,24);collision(0,-45,39,25,16);box(gold,0,12.4,-45,40,.8,26);
    spire(0,-48,6.2,45);spire(-11,-46,4.3,32);spire(11,-46,4.3,32);spire(-22,-49,3,24);spire(22,-49,3,24);
    box(dark,0,5,-32.85,6.5,10,.2);box(gold,0,10.3,-32.65,8,.8,.7);for(const x of [-5,5])cyl(lightgold,x,5,-32.7,.7,10);
    for(const x of [-14,-9,9,14]){box(blue,x,5.4,-32.8,2.8,7.5,.2);box(gold,x,9.5,-32.5,3.7,.6,.4);}
    for(const x of [-17,-11.5,-6,6,11.5,17]){box(lightgold,x,6,-32.6,.25,11,.35);box(gold,x,1,-32.45,.65,.8,.6);}
    for(const y of [1.8,10.7,11.5])box(gold,0,y,-32.55,38,.16,.4);
    for(const x of [-14,-9,9,14]){box(gold,x,5.4,-32.52,.12,7.5,.18);box(lightgold,x,7.1,-32.45,2.6,.11,.18);}
    label('ASGARD',0,15,-31.8,12,2.6,{bg:'#8c6929',accent:'#ffdf85',color:'#fff0bc',font:80});landmarks.push({name:'Gouden paleis',x:0,z:-45});
    for(const x of [-43,43])for(const z of [-24,6,37]) {spire(x,z,4.3,16+((z+30)%3)*3);box(marble,x,.35,z,12,.7,12);}
    // Royal garden beds and polished reflecting bowls frame the courtyard.
    for(const x of [-20,20]){
      cyl(stone,x,.3,3,2.35,.6);cyl(gold,x,.68,3,2.15,.18);cyl(palace,x,1,3,2,.65);cyl(blue,x,1.34,3,1.74,.06);cyl(lightgold,x,1.38,3,2.08,.12);cyl(blue,x,1.45,3,1.85,.04);collision(x,3,4.8,4.8,1.55);
      cyl(gold,x,1.7,3,.16,.7);sphere(blueGlow,x,2.1,3,.16,.21,.16);
    }
    for(const x of [-49,49]){planter(x,20,5.5,6.5,.7,true);tree(x,20,.85,1);}
    for(const x of [-24,24])for(let z=-24;z<=24;z+=4){box(blue,x,.078,z,.7,.025,.7,Math.PI/4);box(gold,x,.092,z,.32,.025,.32,Math.PI/4);}
    for(const side of [-1,1]){
      const x=side*11.8,z=side*3;
      box(stone,x,.3,z,2.7,.6,2.7);box(palace,x,1.8,z,2.15,3,1.9);box(gold,x,3.4,z,2.5,.3,2.2);box(blue,x,1.9,z+1,1.4,2.3,.12);
      box(lightgold,x,1.9,z+1.09,.15,2.1,.1);box(lightgold,x,2.25,z+1.12,1.12,.15,.1);box(lightgold,x,1.55,z+1.12,.82,.15,.1);collision(x,z,2.8,2.8,3.6);
    }
    // Decorative arches along the perimeter, keeping a broad open combat lane.
    for(const x of [-34,34])for(const z of [-15,10,35]) {
      for(const dz of [-4,4])cyl(palace,x,5,z+dz,.65,10);
      box(gold,x,10,z,1.8,1,10);add('torus',lightgold,x,8.7,z,9,9,9,Math.PI/2);collision(x,z-4,1.6,1.6,11);collision(x,z+4,1.6,1.6,11);
    }
    // The Bifrost is inset into the ground from the central courtyard to the gate.
    const rainbow=['#bb586b','#d48b57','#d0b05f','#5a9e83','#5998ba','#777eb5','#a076a9'];
    rainbow.forEach((color,i)=>{const rm=mat(`rainbow${i}`,color,{metalness:.25,roughness:.27,emissive:color,emissiveIntensity:.12});box(rm,(i-3)*1.05,.08,42,1.03,.1,28);});
    for(const x of [-4.2,4.2])box(gold,x,.15,42,.2,.25,28);
    // Gate structure is beyond the play boundary: the bridge remains walkable to its end.
    for(const x of [-8,8]){cyl(gold,x,7,61,1.4,14);add('cone',lightgold,x,16,61,4,5,4);}
    box(gold,0,14,61,18,1.6,3);ring(blueGlow,0,8,61,6.5,0);landmarks.push({name:'Bifrost',x:0,z:48});
    // Solid railings guard terrace edges.
    for(const x of [-57,57]) {box(gold,x,.9,0,.4,.2,115);box(gold,x,1.7,0,.4,.2,115);collision(x,0,.7,116,2.1);for(let z=-54;z<57;z+=6)cyl(palace,x,.9,z,.25,1.8);}
    for(const z of [-57,57])for(const s of [-1,1]){box(gold,s*31,.9,z,50,.2,.4);box(gold,s*31,1.7,z,50,.2,.4);collision(s*31,z,50,.7,2.1);for(let x=8;x<57;x+=6)cyl(palace,s*x,.9,z,.25,1.8);}
    for(const [x,z] of [[-26,-25],[26,-25],[-26,25],[26,25]]) {cyl(gold,x,1,z,.6,2);sphere(blueGlow,x,2.4,z,.5,.8,.5);collision(x,z,1.3,1.3,3.5);}
    for(let i=0;i<19;i++){const a=i/19*Math.PI*2;mountain(Math.sin(a)*130,Math.cos(a)*130,45+rnd()*35,40+rnd()*65,40+rnd()*35,rock);}
    for(const x of [-78,78])for(let z=-70;z<=70;z+=24){cyl(blue,x,10,z,7,22);add('cone',gold,x,26,z,17,12,17);}
    landmarks.push({name:'Koninklijk voorplein',x:0,z:0});
  } else if(id==='avengers') {
    const floor=mat('towerFloor','#8293a4',{metalness:.18,roughness:.46}),wall=mat('towerWall','#b6c4cd',{metalness:.12,roughness:.6}),roof=mat('towerRoof','#4b5d73'),soft=mat('towerSofa','#284b68'),cyan=mat('towerCyan','#65d7ed',{emissive:'#28a8c1',emissiveIntensity:.38});
    const windows=mat('towerWindows','#81c9e1',{transparent:true,opacity:.18,metalness:.25,roughness:.12,side:THREE.DoubleSide,depthWrite:false});
    // This is a continuous tower floor with a foundation reaching the city below.
    box(stone,0,-10,0,116,20,116);box(concrete,0,-20.15,0,360,.3,360);box(floor,0,-.04,0,114,.08,114);
    for(let q=-52;q<=52;q+=4){box(metal,q,.012,0,.045,.018,112);box(metal,0,.013,q,112,.018,.045);}
    for(const x of [-27,27])box(cyan,x,.045,0,.12,.035,110);for(const z of [-30,30])box(cyan,0,.046,z,54,.035,.12);
    for(const side of [-1,1]){
      const edge=side*57;
      box(wall,edge,.7,0,1,1.4,114);box(wall,edge,11,0,1,2,114);box(windows,edge,5.7,0,.12,8.6,112);collision(edge,0,1,114,12);
      box(wall,0,.7,edge,114,1.4,1);box(wall,0,11,edge,114,2,1);box(windows,0,5.7,edge,112,8.6,.12);collision(0,edge,114,1,12);
      for(let q=-52;q<=52;q+=8){box(metal,edge,6,q,.3,12,.28);box(metal,q,6,edge,.28,12,.3);}
    }
    box(roof,0,12.2,0,114,.4,114);collision(0,0,114,114,12.4,12);
    for(const x of [-20,-10,0,10,20])box(lit,x,11.84,0,.35,.08,65);
    for(const z of [-29,29]){box(metal,0,10.7,z,54,.5,.5);box(cyan,0,10.42,z,52,.07,.12);}
    // Side wings have wide physical openings. The central hall remains open for 14v14.
    const lab=openRoom('Avengers Tower · laboratorium',-43,-10,24,42,9.5,wall,roof,'x+',9);
    const lounge=openRoom('Avengers Tower · lounge',43,10,24,42,9.5,wall,roof,'x-',9);
    const training=openRoom('Avengers Tower · trainingsruimte',0,-46,44,18,10,wall,roof,'z+',12);
    label('LABORATORIUM',-30.68,6.7,-10,10,1.1,{font:52,bg:'#203d54',accent:'#69d9e9',rotation:Math.PI/2});
    label('LOUNGE',30.68,6.7,10,9,1.1,{font:68,bg:'#203d54',accent:'#69d9e9',rotation:-Math.PI/2});
    label('AVENGERS · TRAINING',0,7.4,-36.67,18,1.3,{font:54,bg:'#203d54',accent:'#69d9e9'});
    for(const [x,z] of [[-30.94,-25],[-30.94,5],[30.94,-5],[30.94,25]]){box(glass,x,4,z,.1,4.5,6.5);box(cyan,x,6.35,z,.12,.09,6.5);box(metal,x,1.6,z,.16,.3,6.8);}
    for(const x of [-22,22])for(const z of [-12,12]){cyl(metal,x,.45,z,1,.9);cyl(glass,x,2.5,z,.75,3.3);cyl(cyan,x,4.25,z,.84,.18);sphere(cyan,x,2.5,z,.3,.75,.3);collision(x,z,2.1,2.1,4.5);}
    consoleDesk(-43,-23,13);consoleDesk(-43,3,13);consoleDesk(0,-51,16);
    for(const [x,z] of [[-51,-10],[-35,-25],[-51,6]]){cyl(metal,x,.5,z,.9,1);cyl(cyan,x,1.7,z,.65,1.45);collision(x,z,2,2,2.6);}
    for(const x of [38,48]){box(soft,x,.65,24,5.4,1.3,2.1);box(soft,x,1.25,24.75,5.4,1.2,.45);collision(x,24,5.6,2.4,1.9);}
    box(soft,43,.65,-5,10,1.3,2.2);box(soft,43,1.25,-5.75,10,1.2,.45);collision(43,-5,10.2,2.5,1.9);
    cyl(gold,43,.65,21,1.2,1.3);cyl(glass,43,1.35,21,2,.12);collision(43,21,4.1,4.1,1.5);
    planter(51,17,3.5,5,.7);planter(35,17,3.5,5,.7);
    for(const x of [-17,-10,10,17]){box(dark,x,2.8,-53.8,3.4,4.7,.6);ring(cyan,x,3,-53.42,1.1,0);collision(x,-53.8,3.6,.8,5.3);}
    for(const side of [-1,1]){const x=side*11.8,z=side*3;box(metal,x,1.5,z,3.1,3,2);box(cyan,x,2.9,z+1.04,2.6,.1,.08);box(wall,x,1.4,z+1.04,2.6,2.5,.08);collision(x,z,3.25,2.2,3.1);}
    const badge=label('A',0,.078,0,9,9,{font:200,bg:'#68859b',color:'#d4eff7',accent:'#9cbacb'});badge.rotation.x=-Math.PI/2;ring(cyan,0,.096,0,7);
    label('AVENGERS TOWER',0,7,56.34,23,1.5,{font:60,bg:'#203d54',accent:'#69d9e9',rotation:Math.PI});
    // The surrounding Manhattan skyline is visible beyond the glass, below this floor.
    for(let i=0;i<20;i++){
      const a=i/20*Math.PI*2,r=91+rnd()*25,x=Math.sin(a)*r,z=Math.cos(a)*r,h=15+rnd()*40,w=12+rnd()*10;
      box(i%2?stone:glass,x,-20+h/2,z,w,h,14);box(dark,x,-20+h+.5,z,w+.3,1,14.3);
      for(let y=-16;y<-20+h-1;y+=4){box(lit,x,y,z+7.06,w*.7,.45,.08,0,true);box(glass,x+w/2+.05,y,z,.08,.7,11,0,true);}
    }
    interiors.push({name:'Avengers Tower · centrale hal',minX:-56.4,maxX:56.4,minZ:-56.4,maxZ:56.4,ceiling:12,floor:0,entrance:{x:0,z:52}});
    landmarks.push({name:'Trainingshal',x:0,z:0});
  } else if(id==='titan') {
    const rock=mat('titanrock','#8a5232'),dust=mat('titandust','#c98d5a');
    box(mat('titanplain','#b8764a'),0,-.04,0,330,.08,330);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2,x=Math.sin(a)*26,z=Math.cos(a)*26,h=5+rnd()*6;cyl(dust,x,h/2,z,1.3,h);box(dust,x,h+.4,z,3.4,.8,3.4);collision(x,z,2.6,2.6,h);}
    for(let i=0;i<14;i++){const x=(rnd()-.5)*100,z=(rnd()-.5)*100;if(Math.hypot(x,z)<14||Math.abs(z)>36&&Math.abs(x)<22)continue;box(rock,x,.9,z,3+rnd()*3,1.8,3+rnd()*3,rnd()*3);collision(x,z,4,4,1.8);}
    box(lightgold,0,.03,0,16,.06,16);label('TITAN',0,.1,0,12,3,{font:90,bg:'#8a5232',accent:'#ffcf8f',border:false}).rotation.x=-Math.PI/2;
    landmarks.push({name:'Titan',x:0,z:0});
    fillRing('titan');
  } else if(id==='savage') {
    const ruin=mat('ruin','#8d8f78');
    box(mat('savagefloor','#3f7a46'),0,-.04,0,330,.08,330);box(mat('savagepath','#a89066'),0,.01,0,16,.04,110);box(mat('savagepath2','#a89066'),0,.012,0,110,.04,16);
    for(const [x,z] of [[-24,-24],[24,24],[-24,24],[24,-24]]){box(ruin,x,2.4,z,5,4.8,5);box(stone,x,5,z,6,.6,6);collision(x,z,5.2,5.2,5);}
    for(let i=0;i<30;i++){const x=(rnd()-.5)*110,z=(rnd()-.5)*110;if(Math.hypot(x,z)<16)continue;tree(x,z,1.2+rnd()*1.2,i%2);}
    landmarks.push({name:'Savage Land',x:0,z:0});
    fillRing('savage');
  } else if(id==='kamartaj') {
    const paving=mat('kamarPaving','#c8bfae',{map:surfaceTexture('stone','#d6cebd','#b3aa95')}),plaster=mat('kamarPlaster','#c8b79b'),wood=mat('kamarWood','#754a39'),tile=mat('kamarTile','#3f6866'),ochre=mat('kamarOchre','#b77a43'),mountainStone=mat('kamarMountain','#8c9c9c');
    const orange=mat('kamarMagic','#ffb54e',{emissive:'#da7523',emissiveIntensity:.4}),water=mat('kamarWater','#4e9397',{metalness:.25,roughness:.2});
    box(stone,0,-.25,0,330,.5,330);box(paving,0,-.02,0,114,.04,114);box(green,-46,.015,39,24,.03,32);box(green,44,.015,35,26,.03,36);
    for(let q=-52;q<=52;q+=4){box(stone,q,.014,0,.055,.02,112);box(stone,0,.015,q,112,.02,.055);}
    for(const x of [-28,28])box(wood,x,.04,0,.4,.055,110);for(const z of [-29,29])box(wood,0,.04,z,56,.055,.4);
    for(const x of [-25,25])for(let z=-25;z<=25;z+=5)box(gold,x,.075,z,.9,.03,.9,Math.PI/4);
    ring(gold,0,.07,0,10);ring(wood,0,.075,0,8.8);ring(orange,0,.078,0,3.2);
    // Accessible rooms are made from wall pieces, not solid building blocks.
    const temple=openRoom('Kamar-Taj · tempel',0,-44,38,24,8.8,plaster,wood,'z+',12);
    const library=openRoom('Kamar-Taj · bibliotheek',-43,0,24,38,8.2,plaster,wood,'x+',10);
    box(tile,0,9.35,-44,44,.6,30);box(ochre,0,9.85,-44,39,.45,26);add('cone4',tile,0,12.5,-44,50,6,39,Math.PI/4);collision(0,-44,42,28,15.5,8.8);
    box(tile,-43,8.75,0,29,.6,43);add('cone4',tile,-43,11.3,0,39,5.1,57,Math.PI/4);collision(-43,0,28,42,14,8.2);
    for(const x of [-16,-6.5,6.5,16]){cyl(wood,x,4.3,-31.6,.35,8.6);cyl(gold,x,.4,-31.6,.5,.8);}
    label('TEMPEL · OPEN INGANG',0,7.1,-31.34,17,1.2,{font:48,bg:'#5e4436',accent:'#deb87c'});
    label('BIBLIOTHEEK · OPEN',-30.65,6.4,0,12,1.1,{font:49,bg:'#5e4436',accent:'#deb87c',rotation:Math.PI/2});
    for(const z of [-5.2,5.2]){cyl(wood,-30.7,4,z,.28,8);cyl(gold,-30.7,.4,z,.4,.8);}
    bookcase(-43,-17,18);bookcase(-43,16.8,18);bookcase(-9,-54,13);bookcase(9,-54,13);
    box(wood,-43,1,10,11,2,3.2);box(gold,-43,2.05,10,11.3,.12,3.4);collision(-43,10,11.5,3.6,2.2);
    for(const x of [-46,-43,-40])box(trim,x,2.16,10,1.4,.06,1.5);
    box(wood,0,.7,-50,11,1.4,3.4);box(gold,0,1.45,-50,11.3,.13,3.6);collision(0,-50,11.5,3.8,1.6);sphere(orange,0,2.3,-50,.7,.7,.7);
    box(ochre,0,.055,-42,11,.04,10);box(ochre,-43,.055,0,11,.04,9);
    for(const [x,z,ceiling] of [[-43,0,8.2],[0,-44,8.8]])for(const side of [-1,1]){cyl(gold,x+side*7,ceiling-.9,z,.25,1);sphere(lit,x+side*7,ceiling-1.55,z,.5,.6,.5);}
    // Roofed outer buildings, warm lanterns and mountains frame the courtyard.
    box(plaster,45,6,-12,20,12,27);collision(45,-12,21,28,15);box(tile,45,12.4,-12,25,.8,32);add('cone4',tile,45,15,-12,35,5,44,Math.PI/4);
    for(const z of [-21,-12,-3]){box(wood,34.9,4.2,z,.15,5,3.2);box(lit,34.8,4.5,z,.12,.18,2.6);}
    for(const x of [-57,57]){box(plaster,x,2,0,1.2,4,114);box(tile,x,4.2,0,1.8,.4,114);collision(x,0,1.3,114,4.5);}
    box(plaster,0,2,57,114,4,1.2);box(tile,0,4.2,57,114,.4,1.8);collision(0,57,114,1.3,4.5);
    for(const side of [-1,1]){const x=side*11.8,z=side*3;box(wood,x,1.7,z,2.4,3.4,1.8);box(ochre,x,1.8,z+.94,1.9,2.9,.08);ring(gold,x,1.9,z+1.02,.65,0);collision(x,z,2.6,2.1,3.6);}
    for(const x of [-25,25]){box(stone,x,.65,0,2.5,1.3,8);box(water,x,1.33,0,2.1,.06,7.6);collision(x,0,2.7,8.2,1.5);}
    for(const [x,z,s] of [[-25,35,.9],[25,35,.9],[-46,40,1.3],[44,39,1.3],[28,-28,.9],[-28,-28,.85]])tree(x,z,s,1);
    for(const x of [-23,23])for(const z of [-25,25]){cyl(wood,x,2.2,z,.14,4.4);sphere(lit,x,4.3,z,.55,.7,.55);collision(x,z,.45,.45,5.1);}
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;mountain(Math.sin(a)*125,Math.cos(a)*125,55+rnd()*35,38+rnd()*53,50+rnd()*45,mountainStone);}
    label('KAMAR-TAJ',0,6.4,55.85,16,1.5,{font:66,bg:'#5e4436',accent:'#deb87c',rotation:Math.PI});
    landmarks.push({name:'Oefenplaats',x:0,z:0});
  }
  if(BIG&&['newyork','wakanda','asgard','kamartaj'].includes(id))fillRing(id);
  // Build one GPU-instanced mesh per shape/material. Even a city full of windows
  // keeps draw calls modest, and distant detail can be disabled without losing solids.
  for(const batch of batches.values()) {
    const m = new THREE.InstancedMesh(geo(batch.shape),batch.material,batch.transforms.length);
    batch.transforms.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.instanceMatrix.needsUpdate=true;
    m.castShadow=!batch.detail && batch.shape!=='plane';m.receiveShadow=true;m.frustumCulled=true;group.add(m);
    if(batch.detail)detailMeshes.push(m);
  }
  const spawns = {heroes:[],villains:[]};
  for(let i=0;i<15;i++) {
    spawns.heroes.push({x:-16+(i%5)*3.1,z:17+Math.floor(i/5)*4,rotation:Math.PI});
    spawns.villains.push({x:16-(i%5)*3.1,z:-17-Math.floor(i/5)*4,rotation:0});
  }
  scene.add(group);
  let high=true;
  function setQuality(value) {high=!!value;detailMeshes.forEach(m=>m.visible=high);}
  function update(dt,time) {
    for(const d of dynamics) {
      if(d.type==='water' && d.material.map) {d.material.map.offset.x=time*.008;d.material.map.offset.y=time*.014;}
      if(d.type==='fall') {d.mesh.material.opacity=.78+Math.sin(time*4)*.06;d.mesh.scale.x=8+Math.sin(time*3)*.12;}
    }
  }
  function dispose() {
    scene.remove(group);group.traverse(obj=>{if(obj.isInstancedMesh && obj.dispose)obj.dispose();});for(const g of geos.values())g.dispose();for(const m of materials.values())m.dispose();for(const t of textures)t.dispose();
    group.clear();batches.clear();
  }
  return {id,info,group,colliders,spawns,center:{x:0,z:0},bounds:{minX:-boundary,maxX:boundary,minZ:-boundary,maxZ:boundary},spawnZones,landmarks,interiors,update,setQuality,dispose,groundHeight:()=>0};
}
