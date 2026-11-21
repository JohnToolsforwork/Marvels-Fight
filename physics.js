// Swept, sliding capsule-footprint movement and visibility shared by players and AI.
export function intersects(x,z,r,b){
  const qx=Math.max(b.minX,Math.min(b.maxX,x)),qz=Math.max(b.minZ,Math.min(b.maxZ,z));
  return (x-qx)**2+(z-qz)**2<r*r-1e-7;
}
export function blocked(x,z,r,y,boxes,bounds,actorHeight=2.5){
  if(x-r<bounds.minX||x+r>bounds.maxX||z-r<bounds.minZ||z+r>bounds.maxZ)return true;
  return boxes.some(b=>(b.height??99)>y+.22&&(b.minY??0)<y+actorHeight-.05&&intersects(x,z,r,b));
}
export function slideMove(position,dx,dz,r,boxes,bounds,actorHeight=2.5){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.24));
  let travelled=0;
  for(let i=0;i<steps;i++){
    const sx=dx/steps,sz=dz/steps;
    if(!blocked(position.x+sx,position.z,r,position.y,boxes,bounds,actorHeight)){position.x+=sx;travelled+=Math.abs(sx);}
    if(!blocked(position.x,position.z+sz,r,position.y,boxes,bounds,actorHeight)){position.z+=sz;travelled+=Math.abs(sz);}
  }
  return travelled;
}
export function segmentBox(a,b,box,padding=0){
  let low=0,high=1;
  // Intersect the whole 3D interval, including a later entry through the roof.
  // Without endpoint heights this remains a 2D footprint query.
  const axes=Number.isFinite(a.y)&&Number.isFinite(b.y)?['x','z','y']:['x','z'];
  for(const axis of axes){
    const start=a[axis],delta=b[axis]-start;
    const min=axis==='y'?(box.minY??0):box[axis==='x'?'minX':'minZ']-padding;
    const max=axis==='y'?(box.height??99)+.2:box[axis==='x'?'maxX':'maxZ']+padding;
    if(Math.abs(delta)<1e-8){if(start<min||start>max)return false;continue;}
    let near=(min-start)/delta,far=(max-start)/delta;
    if(near>far)[near,far]=[far,near];
    low=Math.max(low,near);high=Math.min(high,far);if(low>high)return false;
  }
  return low;
}
export function clearSight(a,b,boxes,padding=0){return !boxes.some(box=>segmentBox(a,b,box,padding)!==false);}
export function makeNavigator(boxes,bounds,actorHeight=2.5,cell=3,margin=.75){
  const nx=Math.floor((bounds.maxX-bounds.minX)/cell),nz=Math.floor((bounds.maxZ-bounds.minZ)/cell);
  // The direct-route shortcut must obey the same grounded obstacle threshold
  // as movement; eye-level visibility would ignore low but solid barriers.
  const groundBoxes=boxes.filter(b=>(b.height??99)>.22&&(b.minY??0)<actorHeight-.05).map(b=>({...b,minY:0}));
  const point=(i)=>({x:bounds.minX+(i%nx+.5)*cell,z:bounds.minZ+(Math.floor(i/nx)+.5)*cell});
  const grid=new Uint8Array(nx*nz);
  // Markeer geblokkeerde cellen per obstakel (snel, ook voor zeer grote kaarten).
  {
    const R=margin;
    for(let ix=0;ix<nx;ix++)for(const iz of [0,nz-1])grid[iz*nx+ix]=1;
    for(let iz=0;iz<nz;iz++)for(const ix of [0,nx-1])grid[iz*nx+ix]=1;
    for(const b of boxes){
      if(!((b.height??99)>.22&&(b.minY??0)<actorHeight-.05))continue;
      const i0=Math.max(0,Math.floor((b.minX-R-bounds.minX)/cell)),i1=Math.min(nx-1,Math.floor((b.maxX+R-bounds.minX)/cell));
      const j0=Math.max(0,Math.floor((b.minZ-R-bounds.minZ)/cell)),j1=Math.min(nz-1,Math.floor((b.maxZ+R-bounds.minZ)/cell));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
        const x=bounds.minX+(i+.5)*cell,z=bounds.minZ+(j+.5)*cell;
        if(intersects(x,z,R,b))grid[j*nx+i]=1;
      }
    }
  }
  const idx=p=>Math.max(0,Math.min(nz-1,Math.floor((p.z-bounds.minZ)/cell)))*nx+Math.max(0,Math.min(nx-1,Math.floor((p.x-bounds.minX)/cell)));
  const neighbors=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  // Dichtstbijzijnde vrije cel (voor als start of doel tegen een gebouw aan staat).
  function nearestFree(i){
    if(!grid[i])return i;
    const cx=i%nx,cz=Math.floor(i/nx);
    for(let r=1;r<=6;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;
      const x=cx+dx,z=cz+dz;if(x<0||x>=nx||z<0||z>=nz)continue;
      if(!grid[z*nx+x])return z*nx+x;
    }
    return i;
  }
  const n=nx*nz,cost=new Float32Array(n),prev=new Int32Array(n),seen=new Uint32Array(n);let stamp=0;
  const hf=[],hi=[];
  function push(f,i){hf.push(f);hi.push(i);let k=hf.length-1;while(k>0){const q=(k-1)>>1;if(hf[q]<=hf[k])break;[hf[q],hf[k]]=[hf[k],hf[q]];[hi[q],hi[k]]=[hi[k],hi[q]];k=q;}}
  function pop(){
    const top=hi[0],lf=hf.pop(),li=hi.pop();
    if(hf.length){hf[0]=lf;hi[0]=li;let k=0;for(;;){let l=2*k+1,r=l+1,m=k;if(l<hf.length&&hf[l]<hf[m])m=l;if(r<hf.length&&hf[r]<hf[m])m=r;if(m===k)break;[hf[m],hf[k]]=[hf[k],hf[m]];[hi[m],hi[k]]=[hi[k],hi[m]];k=m;}}
    return top;
  }
  return function route(start,end){
    if(clearSight({...start,y:0},{...end,y:0},groundBoxes,.8))return [{x:end.x,z:end.z}];
    const s=nearestFree(idx(start)),goal=nearestFree(idx(end));
    stamp++;hf.length=0;hi.length=0;
    const gx=goal%nx,gz=Math.floor(goal/nx);
    const heuristic=i=>{const dx=Math.abs(i%nx-gx),dz=Math.abs(Math.floor(i/nx)-gz);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
    cost[s]=0;prev[s]=-1;seen[s]=stamp;push(heuristic(s),s);
    const maxIter=Math.max(9000,Math.floor(n*.3));let found=s,best=heuristic(s),iterations=0;const closed=new Set();
    while(hf.length&&iterations++<maxIter){
      const u=pop();if(closed.has(u))continue;closed.add(u);
      if(u===goal){found=u;break;}
      const h=heuristic(u);if(h<best){best=h;found=u;}
      const ux=u%nx,uz=Math.floor(u/nx);
      for(const [dx,dz] of neighbors){
        const x=ux+dx,z=uz+dz;if(x<0||x>=nx||z<0||z>=nz)continue;const v=z*nx+x;
        if(grid[v]||closed.has(v))continue;
        if(dx&&dz&&(grid[uz*nx+x]||grid[z*nx+ux]))continue;
        const c=cost[u]+(dx&&dz?1.414:1);
        if(seen[v]!==stamp||c<cost[v]){seen[v]=stamp;cost[v]=c;prev[v]=u;push(c+heuristic(v),v);}
      }
    }
    const path=[];for(let i=found;i!==s&&i!==-1;i=prev[i])path.unshift(point(i));
    // Trek het pad recht: sla tussenpunten over als je er rechtstreeks heen kunt lopen.
    const out=[];let from={x:start.x,z:start.z},k=0;
    while(k<path.length){
      let far=k;for(let m=Math.min(path.length-1,k+10);m>k;m--){if(clearSight({...from,y:0},{...path[m],y:0},groundBoxes,.9)){far=m;break;}}
      out.push(path[far]);from=path[far];k=far+1;
    }
    return out;
  };
}
