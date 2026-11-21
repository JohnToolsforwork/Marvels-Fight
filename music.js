// Zelfgemaakte achtergrondmuziek met WebAudio: geen bestanden, geen internet nodig.
// Menu = rustig heroïsch thema, gevecht = sneller met drums.
const CHORDS=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; // Am F C G
const hz=n=>440*Math.pow(2,(n-69)/12);
let ctx=null,master=null,timer=null,step=0,nextTime=0,mood='calm',noiseBuf=null;

function noise(){
  if(noiseBuf)return noiseBuf;
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate);
  const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return noiseBuf;
}
function tone(freq,t,dur,type,vol,dest=master){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05);
}
function drum(t,kind){
  if(kind==='kick'){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);
    g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(master);o.start(t);o.stop(t+.25);return;
  }
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=noise();f.type=kind==='hat'?'highpass':'bandpass';f.frequency.value=kind==='hat'?7000:1800;
  g.gain.setValueAtTime(kind==='hat'?.18:.45,t);g.gain.exponentialRampToValueAtTime(.001,t+(kind==='hat'?.05:.16));
  s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.2);
}
function schedule(){
  const battle=mood==='battle',bpm=battle?132:88,sixteenth=60/bpm/4;
  while(nextTime<ctx.currentTime+.35){
    const bar=Math.floor(step/16)%4,pos=step%16,chord=CHORDS[bar],t=nextTime;
    if(pos===0){chord.forEach((n,i)=>tone(hz(n),t,sixteenth*15,'triangle',battle?.05:.07));}
    if(pos%4===0)tone(hz(chord[0]-24),t,sixteenth*3.6,'sine',battle?.28:.2);
    if(battle){
      if(pos%8===0||pos===10)drum(t,'kick');
      if(pos===4||pos===12)drum(t,'snare');
      if(pos%2===0)drum(t,'hat');
      const arp=chord[(pos>>1)%3]+12;if(pos%2===0)tone(hz(arp),t,sixteenth*1.6,'square',.045);
      if(pos===0||pos===8)tone(hz(chord[2]+12),t,sixteenth*6,'sawtooth',.04);
    }else if(pos%4===2){tone(hz(chord[(pos>>2)%3]+12),t,sixteenth*3,'sine',.06);}
    nextTime+=sixteenth;step++;
  }
}
export const music={
  start(audioContext){
    if(timer||!audioContext)return;ctx=audioContext;
    master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination);
    nextTime=ctx.currentTime+.1;step=0;timer=setInterval(()=>{try{if(ctx.state==='running')schedule();else nextTime=ctx.currentTime+.1;}catch{}},90);
  },
  setMood(m){mood=m;},
  setVolume(v){if(master)master.gain.value=v;},
};
