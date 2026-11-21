// Burgers die door de stad lopen. Slechteriken krijgen een KO als ze er een uitschakelen,
// superhelden krijgen een KO als ze een burger in nood redden (loop erheen).
import * as THREE from './vendor/three.module.js';

const SHIRTS=['#c65b4a','#4a7fc6','#5bab6b','#d9b44a','#8a5bc6','#d9793a','#4ab0b5','#c64a8f','#7a7f88','#3d4f6b'];
const PANTS=['#2d3340','#4a3f35','#38485c','#5a4a3a'];
const HAIR=['#2a1f18','#5a3a22','#b88a4a','#8a8a90','#1a1a1a','#9a4a2a'];
const HAIR_STYLE=['short','short','long','quiff'];

export function createCivilians({scene,createCharacter,updateCharacter,slideMove,blocked,getWorld,onRescue,onKill,say}){
  const list=[];let respawnQueue=[],helpTimer=6,idCounter=0;
  const ringGeo=new THREE.RingGeometry(.75,.95,28),ringMat=new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false});
  const markGeo=new THREE.OctahedronGeometry(.28),markMat=new THREE.MeshBasicMaterial({color:0xffd23a});

  function freeSpot(minDist=0,avoid=[]){
    const w=getWorld();if(!w)return null;const b=w.bounds;
    for(let i=0;i<40;i++){
      const lim=Math.min(b.maxX-12,230),x=(Math.random()*2-1)*lim,z=(Math.random()*2-1)*lim;
      if(blocked(x,z,.6,0,w.colliders,w.bounds))continue;
      if(avoid.some(p=>Math.hypot(p.x-x,p.z-z)<minDist))continue;
      return {x,z};
    }
    return null;
  }
  function make(avoid=[]){
    const spot=freeSpot(avoid.length?22:0,avoid);if(!spot)return;
    const n=idCounter++;
    const def={id:'civilian'+(n%6),name:'Burger',team:'civilians',color:SHIRTS[n%SHIRTS.length],accent:PANTS[n%PANTS.length],hair:HAIR[(n*3)%HAIR.length],hairStyle:HAIR_STYLE[n%HAIR_STYLE.length],hp:50,speed:3,damage:0,projectile:'#ffffff',quotes:[]};
    const rig=createCharacter(def),group=rig.group;group.scale.setScalar(.9+(n%3)*.04);
    group.position.set(spot.x,0,spot.z);group.rotation.y=Math.random()*6.28;scene.add(group);
    const c={rig,group,state:'walk',target:new THREE.Vector3(spot.x,0,spot.z),wait:Math.random()*2,speed:1.8+Math.random()*1.2,needsHelp:false,ring:null,mark:null,timer:0};
    pickTarget(c);list.push(c);
  }
  function pickTarget(c){const s=freeSpot();if(s){c.target.set(s.x,0,s.z);}c.wait=Math.random()*2.5;}
  function setHelp(c,on){
    c.needsHelp=on;
    if(on&&!c.ring){
      c.ring=new THREE.Mesh(ringGeo,ringMat);c.ring.rotation.x=-Math.PI/2;c.ring.position.y=.06;c.group.add(c.ring);
      c.mark=new THREE.Mesh(markGeo,markMat);c.mark.position.y=3.4;c.group.add(c.mark);
    }else if(!on&&c.ring){c.group.remove(c.ring);c.group.remove(c.mark);c.ring=c.mark=null;}
  }
  function remove(c,delay=0){
    c.state='gone';c.timer=delay;
  }
  function dispose(c){scene.remove(c.group);const i=list.indexOf(c);if(i>=0)list.splice(i,1);}

  const api={
    autoHelp:true,
    forceHelp(n){const cand=list.filter(x=>x.state==='walk'&&!x.needsHelp);for(let i=cand.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]];}for(const x of cand.slice(0,n))setHelp(x,true);},
    helpCount(){return list.filter(x=>x.needsHelp).length;},
    spawn(count,avoid=[]){this.clear();for(let i=0;i<count;i++)make(avoid);respawnQueue=[];helpTimer=5;},
    clear(){while(list.length)dispose(list[0]);respawnQueue=[];},
    get count(){return list.length;},
    // Slechterik slaat/schiet: schakel burgers dichtbij uit. Geeft het aantal terug.
    tryKill(attacker,reach=4.6){
      let n=0;const p=attacker.group.position,fx=Math.sin(attacker.group.rotation.y),fz=Math.cos(attacker.group.rotation.y);
      for(const c of list){
        if(c.state==='gone'||c.state==='down')continue;
        const dx=c.group.position.x-p.x,dz=c.group.position.z-p.z,d=Math.hypot(dx,dz);
        if(d>reach)continue;if(d>1.6&&(dx*fx+dz*fz)/d<.2)continue;
        c.state='down';c.timer=1.4;setHelp(c,false);n++;onKill?.(attacker,c);
      }
      return n;
    },
    update(dt,{actors,players}){
      const w=getWorld();if(!w)return;
      const villains=actors.filter(a=>a.def.team==='villains'&&!a.dead&&a.active!==false);
      helpTimer-=dt;
      if(helpTimer<=0&&api.autoHelp!==false){
        helpTimer=10+Math.random()*8;
        const needing=list.filter(c=>c.needsHelp).length;
        if(needing<3){const cand=list.filter(c=>c.state==='walk'&&!c.needsHelp);if(cand.length){const c=cand[Math.floor(Math.random()*cand.length)];setHelp(c,true);say?.('Een burger heeft hulp nodig!');}}
      }
      for(const c of [...list]){
        const g=c.group,pos=g.position;
        if(c.state==='down'||c.state==='gone'){
          c.timer-=dt;updateCharacter(c.rig,dt,{dead:true,time:performance.now()/1000});
          if(c.timer<=0){dispose(c);respawnQueue.push(7+Math.random()*4);}
          continue;
        }
        if(c.mark){c.mark.rotation.y+=dt*3;c.mark.position.y=3.4+Math.sin(performance.now()/300)*.12;}
        // redden: een held in de buurt van iemand in nood
        if(c.needsHelp){
          const hero=players.find(p=>p&&!p.dead&&p.def.team==='heroes'&&Math.hypot(p.group.position.x-pos.x,p.group.position.z-pos.z)<3);
          if(hero){setHelp(c,false);c.state='gone';c.timer=1.2;onRescue?.(hero,c);continue;}
          updateCharacter(c.rig,dt,{moving:false,talking:true,time:performance.now()/1000});continue;
        }
        // wegrennen voor slechteriken
        let flee=null,fd=11;
        for(const v of villains){const d=Math.hypot(v.group.position.x-pos.x,v.group.position.z-pos.z);if(d<fd){fd=d;flee=v;}}
        let tx=c.target.x,tz=c.target.z,speed=c.speed;
        if(flee){tx=pos.x+(pos.x-flee.group.position.x)*2;tz=pos.z+(pos.z-flee.group.position.z)*2;speed=4.6;c.wait=0;}
        let dx=tx-pos.x,dz=tz-pos.z;const d=Math.hypot(dx,dz);
        if(c.wait>0&&!flee){c.wait-=dt;updateCharacter(c.rig,dt,{moving:false,time:performance.now()/1000});continue;}
        if(d<1.2&&!flee){pickTarget(c);updateCharacter(c.rig,dt,{moving:false,time:performance.now()/1000});continue;}
        dx/=d||1;dz/=d||1;
        const moved=slideMove(pos,dx*speed*dt,dz*speed*dt,.5,w.colliders,w.bounds,2.2);
        g.rotation.y=Math.atan2(dx,dz);
        if(moved<speed*dt*.25){pickTarget(c);}
        updateCharacter(c.rig,dt,{moving:moved>.001,speed:speed,time:performance.now()/1000});
      }
      // vervangers
      for(let i=respawnQueue.length-1;i>=0;i--){respawnQueue[i]-=dt;if(respawnQueue[i]<=0){respawnQueue.splice(i,1);make(players.filter(Boolean).map(p=>({x:p.group.position.x,z:p.group.position.z})));}}
    },
  };
  return api;
}
