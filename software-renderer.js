import * as THREE from './vendor/three.module.js';

// A real perspective renderer for devices which cannot create a WebGL context.
// It draws the same meshes, articulated characters and cameras to Canvas 2D.
// It intentionally uses soft face lighting instead of GPU-only shadow maps.
const WHITE = new THREE.Color('#ffffff');
const geometryCache = new WeakMap();
const materialCache = new WeakMap();
const patternCache = new WeakMap();
const textureColorCache = new WeakMap();
const coarseSphere = new THREE.SphereGeometry(1, 6, 4);
const mediumSphere = new THREE.SphereGeometry(1, 8, 6);
const roundedSphere = new THREE.SphereGeometry(1, 10, 8);
const closeSphere = new THREE.SphereGeometry(1, 16, 12);
const tmpWorld = new THREE.Matrix4();
const tmpInstance = new THREE.Matrix4();
const tmpModelView = new THREE.Matrix4();
const tmpNormal = new THREE.Matrix3();
const light = new THREE.Vector3(-.4, .8, .3).normalize();
const lightView = new THREE.Vector3();
const fillView = new THREE.Vector3();
const lightTarget = new THREE.Vector3();
const upView = new THREE.Vector3();
const center = new THREE.Vector3();
let fillStrength=0;
let renderEpoch=0;
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const srgb = v => Math.round(255 * (v <= .0031308 ? 12.92 * clamp(v,0,1) : 1.055 * Math.pow(clamp(v,0,1),1/2.4)-.055));

function geometryData(geometry) {
  let d=geometryCache.get(geometry);
  if(d)return d;
  const p=geometry.attributes.position,uv=geometry.attributes.uv,normal=geometry.attributes.normal;
  if(!p)return null;
  const positions=new Float64Array(p.count*3),uvs=uv?new Float32Array(p.count*2):null,normals=normal?new Float32Array(p.count*3):null;
  for(let i=0;i<p.count;i++){positions[i*3]=p.getX(i);positions[i*3+1]=p.getY(i);positions[i*3+2]=p.getZ(i);if(uv){uvs[i*2]=uv.getX(i);uvs[i*2+1]=uv.getY(i);}if(normal){normals[i*3]=normal.getX(i);normals[i*3+1]=normal.getY(i);normals[i*3+2]=normal.getZ(i);}}
  const idx=geometry.index?.array??Uint32Array.from({length:p.count},(_,i)=>i);
  if(!geometry.boundingSphere)geometry.computeBoundingSphere();
  const s=geometry.boundingSphere;
  d={positions,uvs,normals,indices:idx,count:p.count,radius:s?.radius??1,center:s?.center??new THREE.Vector3(),groups:geometry.groups,type:geometry.type};geometryCache.set(geometry,d);return d;
}

function surfaceLight(nx,ny,nz,x,y,z,roughness=.7,metalness=0){
  const direct=Math.max(0,nx*lightView.x+ny*lightView.y+nz*lightView.z);
  const hemi=(nx*upView.x+ny*upView.y+nz*upView.z)*.5+.5;
  let value=.43+.44*direct+.15*hemi;
  // A restrained second light opens dark cloth folds and separates silhouettes
  // without extra geometry, gradients or a full environment-lighting pass.
  value+=fillStrength*Math.max(0,nx*fillView.x+ny*fillView.y+nz*fillView.z)*(1-direct*.6);
  // Broad highlights show curved metal without turning fabric into plastic.
  if(metalness>.15||roughness<.55){
    const vl=Math.max(.001,Math.sqrt(x*x+y*y+z*z));
    let hx=lightView.x-x/vl,hy=lightView.y-y/vl,hz=lightView.z-z/vl;
    const hl=Math.max(.001,Math.sqrt(hx*hx+hy*hy+hz*hz));hx/=hl;hy/=hl;hz/=hl;
    value+=Math.pow(Math.max(0,nx*hx+ny*hy+nz*hz),8+(1-roughness)*22)*(.055+metalness*.28);
  }
  return value;
}

function materialData(m,epoch) {
  if(!m)return {r:.4,g:.4,b:.4,er:0,eg:0,eb:0,cache:new Map()};
  let data=materialCache.get(m);
  if(data?.epoch===epoch)return data;
  const hex=m.color?.getHex()??0xffffff,eh=m.emissive?.getHex()??0,ei=m.emissiveIntensity??1;
  if(!data||data.hex!==hex||data.eh!==eh||data.ei!==ei){
    const c=m.color??WHITE,e=m.emissive;
    data={hex,eh,ei,r:c.r,g:c.g,b:c.b,er:(e?.r??0)*ei,eg:(e?.g??0)*ei,eb:(e?.b??0)*ei,cache:new Map()};materialCache.set(m,data);
  }
  data.epoch=epoch;return data;
}

function flatTextureData(material,base){
  const texture=material.map;
  let sample=textureColorCache.get(texture);
  if(!sample||sample.version!==texture.version){
    const image=texture.image,context=image?.getContext?.('2d');
    let r=0,g=0,b=0,weight=0;
    try{
      const pixels=context?.getImageData(0,0,image.width,image.height).data;
      if(pixels){const stride=Math.max(4,Math.floor(pixels.length/4096)*4);for(let i=0;i<pixels.length;i+=stride){const a=pixels[i+3]/255;r+=pixels[i]*a;g+=pixels[i+1]*a;b+=pixels[i+2]*a;weight+=a;}}
    }catch{ /* A protected image keeps its original material colour. */ }
    const color=weight?new THREE.Color().setRGB(r/weight/255,g/weight/255,b/weight/255,THREE.SRGBColorSpace):WHITE;
    sample={version:texture.version,r:color.r,g:color.g,b:color.b};textureColorCache.set(texture,sample);
  }
  if(base.flatSample!==sample){base.flatSample=sample;base.flat={r:base.r*sample.r,g:base.g*sample.g,b:base.b*sample.b,er:base.er,eg:base.eg,eb:base.eb,cache:new Map()};}
  return base.flat;
}

export class SoftwareRenderer {
  constructor({canvas,alpha=false}={}){
    this.domElement=canvas??document.createElement('canvas');
    this.context=this.domElement.getContext('2d',{alpha,desynchronized:true});
    if(!this.context)throw new Error('Deze browser ondersteunt geen Canvas 2D.');
    this.isSoftwareRenderer=true;this.alpha=alpha;this.shadowMap={enabled:false,type:null};
    this.outputColorSpace=THREE.SRGBColorSpace;this.toneMapping=0;this.toneMappingExposure=1;
    this.autoClear=true;this.width=this.domElement.width||300;this.height=this.domElement.height||150;
    this.viewport={x:0,y:0,w:this.width,h:this.height};this.scissor={...this.viewport};this.scissorTest=false;
    this.info={render:{triangles:0,calls:0},memory:{geometries:0,textures:0}};
    this._pool=[];this._faces=[];this._smoothFaces=[];this._transformed=new Float64Array(6000);this._vertexLight=new Float32Array(2000);this._vertexBackLight=new Float32Array(2000);this._vertexFacing=new Float32Array(2000);this._faceIndex=0;
    this.maxTriangles=30000;this._colorCache=new Map();
  }
  setSize(w,h,updateStyle=true){
    this.width=Math.max(1,Math.round(w));this.height=Math.max(1,Math.round(h));
    if(this.domElement.width!==this.width)this.domElement.width=this.width;
    if(this.domElement.height!==this.height)this.domElement.height=this.height;
    if(updateStyle&&this.domElement.style){this.domElement.style.width=w+'px';this.domElement.style.height=h+'px';}
    this.viewport={x:0,y:0,w:this.width,h:this.height};return this;
  }
  setPixelRatio(){return this;}
  setQuality(high){this.maxTriangles=high?30000:20000;this.high=!!high;return this;}
  getPixelRatio(){return 1;}
  setViewport(x,y,w,h){if(typeof x==='object'){const v=x;[x,y,w,h]=[v.x,v.y,v.z,v.w];}this.viewport={x,y,w,h};return this;}
  setScissor(x,y,w,h){if(typeof x==='object'){const v=x;[x,y,w,h]=[v.x,v.y,v.z,v.w];}this.scissor={x,y,w,h};return this;}
  setScissorTest(v){this.scissorTest=!!v;return this;}
  getContext(){return this.context;}
  dispose(){this._pool.length=0;this._faces.length=0;this._smoothFaces.length=0;}
  forceContextLoss(){}

  render(scene,camera){
    const ctx=this.context,v=this.viewport;
    if(!v.w||!v.h)return;
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const vm=camera.matrixWorldInverse.elements,projection=camera.projectionMatrix.elements;
    lightView.copy(light).transformDirection(camera.matrixWorldInverse);upView.set(0,1,0).transformDirection(camera.matrixWorldInverse);
    // The game and portrait scenes keep their key/fill lights at scene level.
    // Reuse those directions so both renderers agree when the camera or sun moves.
    let key=null,fill=null;
    for(const o of scene.children){
      if(!o.visible||!o.isDirectionalLight||o.intensity<=0)continue;
      if(!key||o.intensity>key.intensity){fill=key;key=o;}
      else if(!fill||o.intensity>fill.intensity)fill=o;
    }
    if(key){lightTarget.setFromMatrixPosition(key.target.matrixWorld);lightView.setFromMatrixPosition(key.matrixWorld).sub(lightTarget).normalize().transformDirection(camera.matrixWorldInverse);}
    fillStrength=fill&&key?Math.min(.14,fill.intensity/key.intensity*.24):0;
    if(fill){lightTarget.setFromMatrixPosition(fill.target.matrixWorld);fillView.setFromMatrixPosition(fill.matrixWorld).sub(lightTarget).normalize().transformDirection(camera.matrixWorldInverse);}
    this._camera=camera;this._projection=projection;this._near=Math.max(.04,camera.near??.1);this._far=camera.far??500;
    this._vp={x:v.x,y:this.height-v.y-v.h,w:v.w,h:v.h};
    const bg=scene.background?.isColor?scene.background:new THREE.Color('#a8c9db');
    this._fogColor=scene.fog?.color??bg;this._fog=scene.fog??null;
    this._fogKey=this._fogColor.getHex();
    this._faces.length=0;this._smoothFaces.length=0;this._faceIndex=0;this._colorCache.clear();this._epoch=++renderEpoch;
    ctx.save();
    const clip=this.scissorTest?this.scissor:v;
    ctx.beginPath();ctx.rect(clip.x,this.height-clip.y-clip.h,clip.w,clip.h);ctx.clip();
    if(this.alpha&&!scene.background){ctx.clearRect(v.x,this._vp.y,v.w,v.h);}
    else{
      const css=bg.getStyle(THREE.SRGBColorSpace);
      const gradient=ctx.createLinearGradient(0,this._vp.y,0,this._vp.y+v.h);
      const sky=scene.userData?.skyColors;
      if(Array.isArray(sky)&&sky.length>=3){
        const skyCss=value=>value?.isColor?value.getStyle(THREE.SRGBColorSpace):typeof value==='number'?new THREE.Color(value).getStyle(THREE.SRGBColorSpace):value;
        gradient.addColorStop(0,skyCss(sky[0]));gradient.addColorStop(.65,skyCss(sky[1]));gradient.addColorStop(1,skyCss(sky[2]));
      }else{gradient.addColorStop(0,bg.clone().multiplyScalar(.79).getStyle(THREE.SRGBColorSpace));gradient.addColorStop(.7,css);gradient.addColorStop(1,bg.clone().lerp(WHITE,.18).getStyle(THREE.SRGBColorSpace));}
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=gradient;ctx.fillRect(v.x,this._vp.y,v.w,v.h);
    }
    // Traverse visible objects explicitly; hidden parent groups hide their children.
    const visit=(o,actor=false)=>{
      if(!o.visible)return;
      actor=actor||!!o.userData?.rig||!!o.userData?.bodyProfile;
      if(o.isMesh&&o.geometry&&o.material&&(!o.layers||o.layers.test(camera.layers))){
        if(o.isInstancedMesh){
          const count=Math.min(o.count,o.instanceMatrix?.count??0);
          for(let i=0;i<count;i++){o.getMatrixAt(i,tmpInstance);tmpWorld.multiplyMatrices(o.matrixWorld,tmpInstance);this._mesh(o,tmpWorld,actor);}
        }else this._mesh(o,o.matrixWorld,actor);
      }
      for(let i=0;i<o.children.length;i++)visit(o.children[i],actor);
    };
    visit(scene);
    // Spend the gradient budget on the largest visible surfaces. Tiny distant
    // faces keep averaged smooth-normal lighting without thousands of gradients.
    const gradientBudget=this.high===false?96:2200;
    if(this._smoothFaces.length>gradientBudget){this._smoothFaces.sort((a,b)=>b.area-a.area);for(let i=gradientBudget;i<this._smoothFaces.length;i++)this._smoothFaces[i].smooth=false;}
    this._faces.sort((a,b)=>b.depth-a.depth);
    ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=.48;
    let batchOpen=false,batchColor=null,drawCalls=0;
    const flushBatch=()=>{if(batchOpen){ctx.fill();batchOpen=false;drawCalls++;}};
    for(let i=0;i<this._faces.length;i++){
      const f=this._faces[i],p=f.coverage;
      // LOW combines only consecutive opaque faces of the same colour, keeping
      // painter order intact while avoiding a Canvas fill/state change per face.
      if(this.high===false&&!f.image&&!f.smooth&&f.alpha>=.999&&!f.additive){
        if(!batchOpen||batchColor!==f.color){flushBatch();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle=f.color;ctx.beginPath();batchOpen=true;batchColor=f.color;}
        ctx.moveTo(p[0],p[1]);
        if((p[2]-p[0])*(p[5]-p[1])-(p[3]-p[1])*(p[4]-p[0])>=0){ctx.lineTo(p[2],p[3]);ctx.lineTo(p[4],p[5]);}
        else{ctx.lineTo(p[4],p[5]);ctx.lineTo(p[2],p[3]);}
        ctx.closePath();continue;
      }
      flushBatch();drawCalls++;
      ctx.globalCompositeOperation=f.additive?'lighter':'source-over';ctx.globalAlpha=f.alpha;
      ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[2],p[3]);ctx.lineTo(p[4],p[5]);ctx.closePath();
      if(f.image&&f.uv){this._textureTriangle(f,ctx);}
      else{
        if(f.smooth){
          const g=ctx.createLinearGradient(f.gx0,f.gy0,f.gx1,f.gy1);
          g.addColorStop(0,this._litColor(f.material,f.md,f.lowShade,f.fog));g.addColorStop(.5,this._litColor(f.material,f.md,(f.lowShade+f.highShade)*.5,f.fog));g.addColorStop(1,this._litColor(f.material,f.md,f.highShade,f.fog));ctx.fillStyle=g;
        }else ctx.fillStyle=f.color;
        ctx.fill();
      }
    }
    flushBatch();ctx.restore();this.info.render.triangles=this._faces.length;this.info.render.calls=drawCalls;
  }

  _mesh(object,model,actor=false){
    const raw=geometryData(object.geometry);if(!raw)return;
    tmpModelView.multiplyMatrices(this._camera.matrixWorldInverse,model);
    const me=model.elements,e=tmpModelView.elements;
    center.copy(raw.center).applyMatrix4(tmpModelView);
    const scale=Math.max(Math.hypot(me[0],me[1],me[2]),Math.hypot(me[4],me[5],me[6]),Math.hypot(me[8],me[9],me[10]));
    const radius=raw.radius*scale,depth=-center.z;
    if(depth+radius<this._near||depth-radius>Math.min(this._far,280))return;
    const p=this._projection,edgeDepth=Math.max(this._near,depth+radius);
    if(Math.abs(center.x)-radius>edgeDepth/Math.abs(p[0])*1.1||Math.abs(center.y)-radius>edgeDepth/Math.abs(p[5])*1.1)return;
    const pixels=radius/Math.max(depth,this._near)*this._vp.h*Math.abs(p[5])*.5;
    if(pixels<.5)return;
    if(this._faceIndex>this.maxTriangles&&pixels<4)return;
    const firstMaterial=Array.isArray(object.material)?object.material[0]:object.material;
    // Dense transparent curved decals can require hundreds of save/clip/image
    // operations for a head only a few pixels wide. LOW omits that distant
    // overlay, while retaining the solid mask, eyes and simple chest emblems.
    if(this.high===false&&actor&&pixels<26&&raw.indices.length>180&&firstMaterial?.transparent&&firstMaterial?.map)return;
    let data=raw,geo=object.geometry,unitScale=1;
    if(geo.type==='SphereGeometry'){
      // Heads, hands and close muscles keep their authored silhouette. Only
      // genuinely small distant parts use the six-sided compatibility mesh.
      const threshold=this.high===false?[18,42,80]:object.isInstancedMesh&&!actor?[15,40,85]:[4.5,13.5,24];
      const fullSphere=(geo.parameters?.phiLength??Math.PI*2)>=Math.PI*2-.001&&(geo.parameters?.thetaLength??Math.PI)>=Math.PI-.001;
      const close=this.high!==false&&!object.isInstancedMesh&&pixels>=32&&fullSphere&&raw.indices.length<closeSphere.index.count;
      const lod=close?closeSphere:pixels<threshold[0]?coarseSphere:pixels<threshold[1]?mediumSphere:pixels<threshold[2]?roundedSphere:null;
      if(lod&&(close||lod.index.count<raw.indices.length)){data=geometryData(lod);unitScale=geo.parameters?.radius??1;}
    }else if(geo.type==='CylinderGeometry'&&pixels<7&&Math.abs((geo.parameters?.radiusTop??1)-(geo.parameters?.radiusBottom??1))<.001){
      // Unit cylinders need two independent axis scales; the original low-sided
      // geometries are already cheap, so retain them instead of distorting props.
    }
    const pos=data.positions,n=data.count;
    if(this._transformed.length<n*3)this._transformed=new Float64Array(n*3+300);
    if(this._vertexLight.length<n)this._vertexLight=new Float32Array(n+100);
    if(this._vertexBackLight.length<n)this._vertexBackLight=new Float32Array(n+100);
    if(this._vertexFacing.length<n)this._vertexFacing=new Float32Array(n+100);
    const tv=this._transformed,lights=this._vertexLight,backLights=this._vertexBackLight,facing=this._vertexFacing;
    const smooth=data.normals&&pixels>(this.high===false?18:5)&&geo.type!=='BoxGeometry'&&!firstMaterial?.flatShading&&!firstMaterial?.isMeshBasicMaterial&&!firstMaterial?.map&&(actor||(!object.isInstancedMesh&&pixels>12)||(geo.type==='SphereGeometry'&&pixels>25));
    const nm=smooth?tmpNormal.getNormalMatrix(tmpModelView).elements:null,normals=data.normals;
    const roughness=firstMaterial?.roughness??.7,metalness=firstMaterial?.metalness??0;
    const smoothBack=smooth&&(Array.isArray(object.material)?object.material.some(m=>m.side===THREE.DoubleSide):firstMaterial?.side===THREE.DoubleSide);
    for(let i=0;i<n;i++){
      const k=i*3,x=pos[k]*unitScale,y=pos[k+1]*unitScale,z=pos[k+2]*unitScale;
      tv[k]=e[0]*x+e[4]*y+e[8]*z+e[12];tv[k+1]=e[1]*x+e[5]*y+e[9]*z+e[13];tv[k+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
      if(smooth){
        const ox=normals[k],oy=normals[k+1],oz=normals[k+2];
        let nx=nm[0]*ox+nm[3]*oy+nm[6]*oz,ny=nm[1]*ox+nm[4]*oy+nm[7]*oz,nz=nm[2]*ox+nm[5]*oy+nm[8]*oz;
        const nl=Math.max(1e-8,Math.sqrt(nx*nx+ny*ny+nz*nz));nx/=nl;ny/=nl;nz/=nl;
        lights[i]=surfaceLight(nx,ny,nz,tv[k],tv[k+1],tv[k+2],roughness,metalness);
        if(smoothBack)backLights[i]=surfaceLight(-nx,-ny,-nz,tv[k],tv[k+1],tv[k+2],roughness,metalness);
        facing[i]=-(nx*tv[k]+ny*tv[k+1]+nz*tv[k+2])/Math.max(.001,Math.sqrt(tv[k]*tv[k]+tv[k+1]*tv[k+1]+tv[k+2]*tv[k+2]));
      }
    }
    const indices=data.indices,uv=data.uvs,multi=Array.isArray(object.material),groups=data.groups;
    let groupIndex=0;
    for(let t=0;t<indices.length;t+=3){
      let m=object.material;
      if(multi){while(groupIndex<groups.length-1&&t>=groups[groupIndex].start+groups[groupIndex].count)groupIndex++;m=m[groups[groupIndex]?.materialIndex??0]??m[0];}
      if(!m||m.visible===false||(m.opacity??1)<.012)continue;
      const a=indices[t],b=indices[t+1],c=indices[t+2],a3=a*3,b3=b*3,c3=c*3;
      const ax=tv[a3],ay=tv[a3+1],az=tv[a3+2],bx=tv[b3],by=tv[b3+1],bz=tv[b3+2],cx=tv[c3],cy=tv[c3+1],cz=tv[c3+2];
      if(az>-this._near&&bz>-this._near&&cz>-this._near)continue;
      const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az;
      let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
      const dot=nx*ax+ny*ay+nz*az;
      const front=dot<0;
      if(m.side!==THREE.DoubleSide&&(m.side===THREE.BackSide?front:!front))continue;
      if(!front){nx=-nx;ny=-ny;nz=-nz;}
      const length=Math.sqrt(nx*nx+ny*ny+nz*nz);if(length<1e-10)continue;
      nx/=length;ny/=length;nz/=length;
      const shadedVertices=smooth&&(front||smoothBack)?(front?lights:backLights):null;
      const shade=m.isMeshBasicMaterial?1:shadedVertices?(shadedVertices[a]+shadedVertices[b]+shadedVertices[c])/3:surfaceLight(nx,ny,nz,(ax+bx+cx)/3,(ay+by+cy)/3,(az+bz+cz)/3,m.roughness??.7,m.metalness??0);
      const sa=shadedVertices?shadedVertices[a]:shade,sb=shadedVertices?shadedVertices[b]:shade,sc=shadedVertices?shadedVertices[c]:shade;
      const fa=shadedVertices?facing[a]*(front?1:-1):1,fb=shadedVertices?facing[b]*(front?1:-1):1,fc=shadedVertices?facing[c]*(front?1:-1):1;
      const zavg=-(az+bz+cz)/3;
      // Use the face's real world elevation, not the object's origin: large
      // foundation and water boxes can have their origin several metres below
      // the walkable surface. Their near-clipped triangles still belong beneath
      // players and buildings.
      const cm=this._camera.matrixWorld.elements;
      const faceWorldY=cm[1]*(ax+bx+cx)/3+cm[5]*(ay+by+cy)/3+cm[9]*(az+bz+cz)/3+cm[13];
      const ground=(faceWorldY<=.151&&Math.abs(nx*upView.x+ny*upView.y+nz*upView.z)>.95);
      // Ground layers must sort beneath actors, even when a huge plane crosses
      // the camera's near plane. Rings and contact shadows sit above paving.
      const contactOverlay=m.transparent&&(geo.type==='CircleGeometry'||geo.type==='RingGeometry'||(geo.type==='PlaneGeometry'&&m.map));
      const sortDepth=ground?(contactOverlay?900000-faceWorldY*100:1000000-faceWorldY*10000):zavg;
      // Transparent mapped shells (Spider-Man's web mask) must draw only their
      // texture alpha. A white polygon underneath would cover the actual suit.
      const simpleWorldSurface=this.high===false&&!actor&&geo.type!=='PlaneGeometry';
      const image=!simpleWorldSurface&&(geo.type==='PlaneGeometry'||m.transparent||(this.high!==false&&m.userData?.softwareTexture))&&m.map?.image?m.map.image:null;
      const au=uv?uv[a*2]:0,av=uv?uv[a*2+1]:0,bu=uv?uv[b*2]:0,bv=uv?uv[b*2+1]:0,cu=uv?uv[c*2]:0,cv=uv?uv[c*2+1]:0;
      if(az<=-this._near&&bz<=-this._near&&cz<=-this._near){
        this._triangle(ax,ay,az,bx,by,bz,cx,cy,cz,m,shade,zavg,sortDepth,image,au,av,bu,bv,cu,cv,sa,sb,sc,fa,fb,fc);
      }else{
        const poly=[[ax,ay,az,au,av,sa,fa],[bx,by,bz,bu,bv,sb,fb],[cx,cy,cz,cu,cv,sc,fc]],clipped=[];
        for(let j=0;j<3;j++){
          const q=poly[j],r=poly[(j+1)%3],qin=q[2]<=-this._near,rin=r[2]<=-this._near;
          if(qin)clipped.push(q);
          if(qin!==rin){const f=(-this._near-q[2])/(r[2]-q[2]);clipped.push(q.map((val,k)=>val+(r[k]-val)*f));}
        }
        for(let j=1;j<clipped.length-1;j++){
          const aa=clipped[0],bb=clipped[j],cc=clipped[j+1];
          this._triangle(aa[0],aa[1],aa[2],bb[0],bb[1],bb[2],cc[0],cc[1],cc[2],m,shade,zavg,sortDepth,image,aa[3],aa[4],bb[3],bb[4],cc[3],cc[4],aa[5],bb[5],cc[5],aa[6],bb[6],cc[6]);
        }
      }
    }
  }

  _triangle(ax,ay,az,bx,by,bz,cx,cy,cz,material,shade,depth,sortDepth,image,au,av,bu,bv,cu,cv,sa=shade,sb=shade,sc=shade,facingA=1,facingB=1,facingC=1){
    const p=this._projection,v=this._vp;
    const aw=p[3]*ax+p[7]*ay+p[11]*az+p[15],bw=p[3]*bx+p[7]*by+p[11]*bz+p[15],cw=p[3]*cx+p[7]*cy+p[11]*cz+p[15];
    if(Math.abs(aw)<1e-9||Math.abs(bw)<1e-9||Math.abs(cw)<1e-9)return;
    const x0=v.x+((p[0]*ax+p[4]*ay+p[8]*az+p[12])/aw+1)*v.w*.5,y0=v.y+(1-(p[1]*ax+p[5]*ay+p[9]*az+p[13])/aw)*v.h*.5;
    const x1=v.x+((p[0]*bx+p[4]*by+p[8]*bz+p[12])/bw+1)*v.w*.5,y1=v.y+(1-(p[1]*bx+p[5]*by+p[9]*bz+p[13])/bw)*v.h*.5;
    const x2=v.x+((p[0]*cx+p[4]*cy+p[8]*cz+p[12])/cw+1)*v.w*.5,y2=v.y+(1-(p[1]*cx+p[5]*cy+p[9]*cz+p[13])/cw)*v.h*.5;
    if(Math.max(x0,x1,x2)<v.x||Math.min(x0,x1,x2)>v.x+v.w||Math.max(y0,y1,y2)<v.y||Math.min(y0,y1,y2)>v.y+v.h)return;
    const area=Math.abs((x1-x0)*(y2-y0)-(y1-y0)*(x2-x0));if(area<.09)return;
    if(this._faceIndex>this.maxTriangles&&area<4)return;
    let f=this._pool[this._faceIndex];if(!f){f={xy:new Float64Array(6),coverage:new Float64Array(6),uv:new Float32Array(6)};this._pool[this._faceIndex]=f;}
    this._faceIndex++;f.xy[0]=x0;f.xy[1]=y0;f.xy[2]=x1;f.xy[3]=y1;f.xy[4]=x2;f.xy[5]=y2;
    f.depth=sortDepth+(material.polygonOffset?-.012:0);f.alpha=material.opacity??1;f.additive=material.blending===THREE.AdditiveBlending;
    // Overlap opaque edge coverage by a fraction of a pixel. Unlike strokes,
    // this costs no extra draw call and prevents bright hairline triangle gaps.
    const overlap=(f.alpha>.98&&!material.transparent&&!f.additive) ? .62 : 0;
    const winding=Math.sign((x1-x0)*(y2-y0)-(y1-y0)*(x2-x0));
    const l01=Math.max(.001,Math.sqrt((x1-x0)**2+(y1-y0)**2)),l12=Math.max(.001,Math.sqrt((x2-x1)**2+(y2-y1)**2)),l20=Math.max(.001,Math.sqrt((x0-x2)**2+(y0-y2)**2));
    const e0x=winding*(y1-y0)/l01,e0y=-winding*(x1-x0)/l01,e1x=winding*(y2-y1)/l12,e1y=-winding*(x2-x1)/l12,e2x=winding*(y0-y2)/l20,e2y=-winding*(x0-x2)/l20;
    for(let i=0;i<3;i++){
      const ix=i*2,n0x=i===0?e2x:i===1?e0x:e1x,n0y=i===0?e2y:i===1?e0y:e1y,n1x=i===0?e0x:i===1?e1x:e2x,n1y=i===0?e0y:i===1?e1y:e2y;
      const facing=i===0?facingA:i===1?facingB:facingC;
      const amount=Math.min(1.4,overlap/Math.max(.1,1+n0x*n1x+n0y*n1y))*clamp(facing*4,0,1);
      f.coverage[ix]=f.xy[ix]+(n0x+n1x)*amount;f.coverage[ix+1]=f.xy[ix+1]+(n0y+n1y)*amount;
    }
    f.image=image;f.texture=image?material.map:null;f.textureShade=material.transparent?1:clamp(shade,.4,1);
    if(image){
      const texture=material.map;if(texture.matrixAutoUpdate)texture.updateMatrix();const tm=texture.matrix.elements;
      const put=(index,u,w)=>{f.uv[index]=tm[0]*u+tm[3]*w+tm[6];f.uv[index+1]=tm[1]*u+tm[4]*w+tm[7];};
      put(0,au,av);put(2,bu,bv);put(4,cu,cv);
    }
    const base=materialData(material,this._epoch);
    const md=this.high===false&&!image&&material.map?.image&&material.userData?.softwareTexture&&!material.transparent?flatTextureData(material,base):base;
    let fog=0;if(this._fog){fog=this._fog.isFogExp2?1-Math.exp(-(this._fog.density**2)*(depth**2)):clamp((depth-this._fog.near)/(this._fog.far-this._fog.near),0,1);}
    f.color=this._litColor(material,md,(sa+sb+sc)/3,fog);
    const lo=Math.min(sa,sb,sc),hi=Math.max(sa,sb,sc);
    f.smooth=!image&&area>(this.high===false?110:8)&&hi-lo>.025;
    if(f.smooth){
      // A linear screen-space gradient realizes the three vertex light values
      // continuously across the triangle (Gouraud shading on Canvas 2D).
      const det=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
      const gx=((sb-sa)*(y2-y0)-(sc-sa)*(y1-y0))/det;
      const gy=((x1-x0)*(sc-sa)-(x2-x0)*(sb-sa))/det,gg=gx*gx+gy*gy;
      if(gg>1e-12){
        f.gx0=x0+gx*(lo-sa)/gg;f.gy0=y0+gy*(lo-sa)/gg;
        f.gx1=x0+gx*(hi-sa)/gg;f.gy1=y0+gy*(hi-sa)/gg;
        f.lowShade=lo;f.highShade=hi;f.fog=fog;f.material=material;f.md=md;f.area=area;this._smoothFaces.push(f);
      }else f.smooth=false;
    }
    this._faces.push(f);
  }

  _litColor(material,md,shade,fog){
    const qs=Math.round(shade*100),qf=Math.round(fog*32),key=qs*64+qf;
    // Material palettes and quantized lighting repeat across frames. Cache the
    // sRGB conversion until the material or the world's fog colour changes.
    if(md.fogKey!==this._fogKey){md.cache.clear();md.fogKey=this._fogKey;}
    let color=md.cache.get(key);
    if(!color){const s=qs/100,ff=qf/32,fc=this._fogColor,warm=Math.max(0,s-.76),cool=Math.max(0,.7-s);
      const r=(md.r*s*(1+warm*.09-cool*.04)+md.er*.5)*(1-ff)+fc.r*ff,g=(md.g*s*(1+warm*.025)+md.eg*.5)*(1-ff)+fc.g*ff,b=(md.b*s*(1-warm*.07+cool*.1)+md.eb*.5)*(1-ff)+fc.b*ff;
      color=`rgb(${srgb(r)},${srgb(g)},${srgb(b)})`;if(md.cache.size>4096)md.cache.clear();md.cache.set(key,color);
    }
    return color;
  }

  _textureTriangle(f,ctx){
    const image=f.image,w=image.width||image.videoWidth,h=image.height||image.videoHeight;
    if(!w||!h){ctx.fillStyle=f.color;ctx.fill();return;}
    const p=f.xy,uv=f.uv,u0=uv[0]*w,v0=(1-uv[1])*h,u1=uv[2]*w,v1=(1-uv[3])*h,u2=uv[4]*w,v2=(1-uv[5])*h;
    const den=u0*(v1-v2)+u1*(v2-v0)+u2*(v0-v1);
    if(Math.abs(den)<1e-7)return;
    const a=(p[0]*(v1-v2)+p[2]*(v2-v0)+p[4]*(v0-v1))/den;
    const c=(p[0]*(u2-u1)+p[2]*(u0-u2)+p[4]*(u1-u0))/den;
    const e=(p[0]*(u1*v2-u2*v1)+p[2]*(u2*v0-u0*v2)+p[4]*(u0*v1-u1*v0))/den;
    const b=(p[1]*(v1-v2)+p[3]*(v2-v0)+p[5]*(v0-v1))/den;
    const d=(p[1]*(u2-u1)+p[3]*(u0-u2)+p[5]*(u1-u0))/den;
    const g=(p[1]*(u1*v2-u2*v1)+p[3]*(u2*v0-u0*v2)+p[5]*(u0*v1-u1*v0))/den;
    ctx.save();ctx.clip();ctx.transform(a,b,c,d,e,g);
    try{
      const repeated=f.texture&&(f.texture.wrapS===THREE.RepeatWrapping||f.texture.wrapT===THREE.RepeatWrapping);
      if(repeated){
        let cached=patternCache.get(image);if(!cached||cached.ctx!==ctx){cached={ctx,pattern:ctx.createPattern(image,'repeat')};patternCache.set(image,cached);}
        if(cached.pattern){ctx.fillStyle=cached.pattern;const left=Math.min(u0,u1,u2)-1,top=Math.min(v0,v1,v2)-1;ctx.fillRect(left,top,Math.max(u0,u1,u2)-left+1,Math.max(v0,v1,v2)-top+1);}
        else ctx.drawImage(image,0,0);
      }else ctx.drawImage(image,0,0);
    }catch{ /* An unavailable image never blocks scene drawing. */ }
    ctx.restore();
    // Shade baked-colour facades without painting below transparent decals.
    if(f.textureShade<.985){ctx.save();ctx.globalAlpha*=Math.min(.4,(1-f.textureShade)*.7);ctx.fillStyle='#06101d';ctx.fill();ctx.restore();}
  }
}
