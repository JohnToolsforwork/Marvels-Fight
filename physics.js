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
export function makeNavigator(boxes,bounds,actorHeight=2.5){
  const cell=3,nx=Math.floor((bounds.maxX-bounds.minX)/cell),nz=Math.floor((bounds.maxZ-bounds.minZ)/cell);
  // The direct-route shortcut must obey the same grounded obstacle threshold
  // as movement; eye-level visibility would ignore low but solid barriers.
  const groundBoxes=boxes.filter(b=>(b.height??99)>.22&&(b.minY??0)<actorHeight-.05).map(b=>({...b,minY:0}));
  const point=(i)=>({x:bounds.minX+(i%nx+.5)*cell,z:bounds.minZ+(Math.floor(i/nx)+.5)*cell});
  const grid=new Uint8Array(nx*nz);
  for(let i=0;i<grid.length;i++){const p=point(i);grid[i]=blocked(p.x,p.z,.75,0,boxes,bounds,actorHeight)?1:0;}
  const idx=p=>Math.max(0,Math.min(nz-1,Math.floor((p.z-bounds.minZ)/cell)))*nx+Math.max(0,Math.min(nx-1,Math.floor((p.x-bounds.minX)/cell)));
  return function route(start,end){
    if(clearSight({...start,y:0},{...end,y:0},groundBoxes,.8))return [{x:end.x,z:end.z}];
    const s=idx(start),goal=idx(end),cost=new Float32Array(grid.length).fill(Infinity),prev=new Int32Array(grid.length).fill(-1),open=[s],closed=new Set();cost[s]=0;
    const heuristic=i=>Math.hypot(i%nx-goal%nx,Math.floor(i/nx)-Math.floor(goal/nx));
    let found=s,best=heuristic(s),iterations=0;
    while(open.length&&iterations++<1400){
      let k=0;for(let j=1;j<open.length;j++)if(cost[open[j]]+heuristic(open[j])<cost[open[k]]+heuristic(open[k]))k=j;
      const u=open.splice(k,1)[0];if(u===goal){found=u;break;}closed.add(u);
      if(heuristic(u)<best){best=heuristic(u);found=u;}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const x=u%nx+dx,z=Math.floor(u/nx)+dz;if(x<0||x>=nx||z<0||z>=nz)continue;const v=z*nx+x;
        if(grid[v]||closed.has(v))continue;
        if(dx&&dz&&(grid[Math.floor(u/nx)*nx+x]||grid[z*nx+u%nx]))continue;
        const c=cost[u]+Math.hypot(dx,dz);if(c<cost[v]){cost[v]=c;prev[v]=u;if(!open.includes(v))open.push(v);}
      }
    }
    const path=[];for(let i=found;i!==s&&i!==-1;i=prev[i])path.unshift(point(i));
    return path;
  };
}
