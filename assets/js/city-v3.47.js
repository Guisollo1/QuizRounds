import{avatarMarkup,normalizeAvatarKey}from'./avatars-v3.47.js';

const CHAT_LINES=['Oi!','Boa!','Bora!','GG!','Vamos!','Mandou bem!','Tudo bem?','😂','👏','🚀','🎉'];
const PLAY_TOYS=['⚽','🏀','🎈','🪁','⭐','🎲'];
const MEDALS=['👑','🥈','🥉'];
const REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
const DEPTH_SCALE=[.72,.82,.92,1.02,1.1];

function hashString(value){let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function nextRand(actor){actor.seed=(Math.imul(actor.seed,1664525)+1013904223)>>>0;return actor.seed/4294967296;}
function between(actor,min,max){return min+nextRand(actor)*(max-min);}
function phaseIsCompact(phase){return phase&&phase!=='lobby';}

export function createAvatarCity(host,badge,{maxActors=120}={}){
  const actors=new Map();
  let phase='lobby',timer=null,nextPairAt=0,destroyed=false,density='normal';
  const city=host?.closest('.avatar-city');

  function actorScale(seed,lane){const jitter=((seed>>>8)%8)/100-.035;return Math.max(.62,DEPTH_SCALE[lane]+jitter);}
  function makeActor(row,index){
    const id=String(row.participant_id||`actor-${index}`),seed=hashString(id||row.display_name||index)||1,lane=(seed>>>4)%5;
    const el=document.createElement('div');el.className='city-actor is-idle city-entering';el.dataset.participant=id;el.dataset.depth=String(lane);
    el.innerHTML='<span class="city-rank-crown" aria-hidden="true"></span><span class="city-speech" aria-hidden="true"></span><span class="city-name"></span><span class="city-avatar-shell"></span><span class="city-toy" aria-hidden="true"></span>';
    const actor={id,el,seed,x:4+(seed%88),lane,scale:actorScale(seed,lane),nextAt:performance.now()+((seed>>>12)%2800),avatarKey:'',connected:true,ready:false,direction:'down'};
    el.style.setProperty('--city-x',`${actor.x}%`);el.style.setProperty('--city-lane',String(actor.lane));el.style.setProperty('--city-scale',actor.scale.toFixed(2));
    el.classList.add('face-down');el.dataset.direction='down';
    host.append(el);actors.set(id,actor);setTimeout(()=>el.classList.remove('city-entering'),1300);return actor;
  }

  function setAvatar(actor,key){const normalized=normalizeAvatarKey(key);if(actor.avatarKey===normalized)return;actor.avatarKey=normalized;actor.el.querySelector('.city-avatar-shell').innerHTML=avatarMarkup(normalized,{animated:true});}
  const DIRECTIONS=['down','left','right','up'];
  function randomDirection(actor){return DIRECTIONS[Math.floor(nextRand(actor)*DIRECTIONS.length)]||'down';}
  function setActorClass(actor,action,direction='down'){
    const facing=DIRECTIONS.includes(direction)?direction:'down';
    actor.el.classList.remove('is-walking','is-idle','is-jumping','is-chatting','is-playing','is-waving','is-dancing','is-sidestepping','is-cheering','face-down','face-left','face-right','face-up');
    actor.el.classList.add(`is-${action}`,`face-${facing}`);
    actor.el.dataset.direction=facing;
  }
  function clearExtras(actor){actor.el.querySelector('.city-speech').textContent='';actor.el.querySelector('.city-toy').textContent='';}
  function applyDepth(actor,lane){actor.lane=Math.max(0,Math.min(4,lane));actor.scale=actorScale(actor.seed,actor.lane)*(density==='high'?.88:density==='medium'?.95:1);actor.el.dataset.depth=String(actor.lane);actor.el.style.setProperty('--city-lane',String(actor.lane));actor.el.style.setProperty('--city-scale',actor.scale.toFixed(2));}
  function moveTo(actor,x,lane,duration,direction){actor.x=Math.max(2,Math.min(94,x));actor.direction=direction;applyDepth(actor,lane);actor.el.style.setProperty('--city-move-time',`${Math.max(.35,duration).toFixed(2)}s`);actor.el.style.setProperty('--city-x',`${actor.x.toFixed(2)}%`);setActorClass(actor,'walking',direction);}
  function idle(actor,now,duration=between(actor,1.8,4.8)){clearExtras(actor);const direction=randomDirection(actor);actor.direction=direction;setActorClass(actor,'idle',direction);actor.nextAt=now+duration*1000;}
  function jump(actor,now){clearExtras(actor);const direction=randomDirection(actor);actor.direction=direction;setActorClass(actor,'jumping',direction);actor.nextAt=now+1100;}
  function wave(actor,now){clearExtras(actor);actor.el.querySelector('.city-speech').textContent=CHAT_LINES[Math.floor(nextRand(actor)*CHAT_LINES.length)];const direction=randomDirection(actor);actor.direction=direction;setActorClass(actor,'waving',direction);actor.nextAt=now+2400;}
  function play(actor,now){clearExtras(actor);actor.el.querySelector('.city-toy').textContent=PLAY_TOYS[Math.floor(nextRand(actor)*PLAY_TOYS.length)];const direction=randomDirection(actor);actor.direction=direction;setActorClass(actor,'playing',direction);actor.nextAt=now+2600;}
  function dance(actor,now){clearExtras(actor);actor.el.querySelector('.city-speech').textContent='🎵';const direction=randomDirection(actor);actor.direction=direction;setActorClass(actor,'dancing',direction);actor.nextAt=now+2500;}
  function walk(actor,now){
    clearExtras(actor);
    const vertical=nextRand(actor)<.38;
    const duration=between(actor,density==='high'?4.5:2.7,density==='high'?9:6.8);
    if(vertical){
      let targetLane=Math.floor(between(actor,0,5));
      if(targetLane===actor.lane)targetLane=(actor.lane+(nextRand(actor)>.5?1:4))%5;
      const direction=targetLane>actor.lane?'up':'down';
      const targetX=Math.max(3,Math.min(93,actor.x+between(actor,-4,4)));
      moveTo(actor,targetX,targetLane,duration,direction);
    }else{
      const target=between(actor,3,93),delta=target-actor.x;
      moveTo(actor,target,actor.lane,duration,delta<0?'left':'right');
    }
    actor.nextAt=now+duration*1000+between(actor,650,2200);
  }
  function sideStep(actor,now){clearExtras(actor);const delta=(nextRand(actor)>.5?1:-1)*between(actor,3.5,10),target=Math.max(2,Math.min(94,actor.x+delta)),duration=between(actor,.65,1.35);actor.x=target;actor.direction=delta<0?'left':'right';actor.el.style.setProperty('--city-move-time',`${duration.toFixed(2)}s`);actor.el.style.setProperty('--city-x',`${target.toFixed(2)}%`);setActorClass(actor,'sidestepping',actor.direction);actor.nextAt=now+duration*1000+between(actor,500,1500);}
  function cheer(actor,now){clearExtras(actor);actor.el.querySelector('.city-speech').textContent=nextRand(actor)>.45?'🎉':'👏';const direction=randomDirection(actor);actor.direction=direction;setActorClass(actor,'cheering',direction);actor.nextAt=now+1800;}

  function pairInteraction(a,b,now,type){
    if(!a||!b||a===b||density==='high')return;
    const center=18+nextRand(a)*64,lane=Math.floor(nextRand(a)*4),gap=phaseIsCompact(phase)?4.5:3.2,duration=1.1+nextRand(a)*1.2;
    moveTo(a,center-gap,lane,duration,'right');moveTo(b,center+gap,lane,duration,'left');a.nextAt=b.nextAt=now+duration*1000+300;
    setTimeout(()=>{
      if(destroyed||!actors.has(a.id)||!actors.has(b.id))return;clearExtras(a);clearExtras(b);
      if(type==='chat'){a.el.querySelector('.city-speech').textContent=CHAT_LINES[Math.floor(nextRand(a)*CHAT_LINES.length)];b.el.querySelector('.city-speech').textContent=CHAT_LINES[Math.floor(nextRand(b)*CHAT_LINES.length)];setActorClass(a,'chatting','right');setActorClass(b,'chatting','left');}
      else if(type==='highfive'){a.el.querySelector('.city-speech').textContent='🙌';b.el.querySelector('.city-speech').textContent='🙌';setActorClass(a,'cheering','right');setActorClass(b,'cheering','left');}
      else{const toy=PLAY_TOYS[Math.floor(nextRand(a)*PLAY_TOYS.length)];a.el.querySelector('.city-toy').textContent=toy;b.el.querySelector('.city-toy').textContent=toy;setActorClass(a,'playing','right');setActorClass(b,'playing','left');}
      a.nextAt=b.nextAt=performance.now()+2600;
    },Math.max(350,duration*1000));
  }

  function act(actor,now){
    if(REDUCED){idle(actor,now,12);return;}if(!actor.connected){idle(actor,now,7);return;}
    const r=nextRand(actor),compact=phaseIsCompact(phase);
    if(density==='high'){if(r<.55)walk(actor,now);else if(r<.84)idle(actor,now,between(actor,3,7));else sideStep(actor,now);return;}
    if(phase==='result'||phase==='finished'){if(r<.28)cheer(actor,now);else if(r<.48)jump(actor,now);else if(r<.64)dance(actor,now);else if(r<.80)sideStep(actor,now);else idle(actor,now);return;}
    if(r<(.34+(compact?.10:0)))walk(actor,now);else if(r<.48)idle(actor,now);else if(r<.58)sideStep(actor,now);else if(r<.68)jump(actor,now);else if(r<.80)wave(actor,now);else if(r<.92)play(actor,now);else dance(actor,now);
  }

  function tick(){
    if(destroyed)return;const now=performance.now(),live=[...actors.values()].filter(a=>a.connected);
    if(!REDUCED&&density!=='high'&&now>=nextPairAt&&live.length>=2&&!phaseIsCompact(phase)){
      const due=live.filter(a=>a.nextAt<=now);if(due.length>=2){const a=due[Math.floor(Math.random()*due.length)],others=due.filter(x=>x!==a),b=others[Math.floor(Math.random()*others.length)],pairRoll=Math.random();pairInteraction(a,b,now,pairRoll<.52?'chat':pairRoll<.84?'play':'highfive');nextPairAt=now+5200+Math.random()*5200;}
    }
    for(const actor of actors.values())if(actor.nextAt<=now)act(actor,now);
  }
  function ensureTimer(){if(timer||destroyed)return;timer=setInterval(tick,density==='high'?1100:700);}
  function resetTimer(){if(timer){clearInterval(timer);timer=null;}if(actors.size)ensureTimer();}
  function stopTimerIfEmpty(){if(actors.size||!timer)return;clearInterval(timer);timer=null;}

  function setRoster(rows=[]){
    const raw=Array.isArray(rows)?rows:[],nextDensity=raw.length>=80?'high':raw.length>=40?'medium':'normal';
    if(nextDensity!==density){density=nextDensity;if(city)city.dataset.density=density;resetTimer();}
    const cap=density==='high'?Math.min(maxActors,100):maxActors,list=raw.slice(0,cap),wanted=new Set(list.map((r,i)=>String(r.participant_id||`actor-${i}`)));
    for(const [id,actor] of actors)if(!wanted.has(id)){actor.el.remove();actors.delete(id);}
    const ranked=[...list].sort((a,b)=>(Number(b.total_points)||0)-(Number(a.total_points)||0)||String(a.joined_at||'').localeCompare(String(b.joined_at||''))),hasScore=ranked.some(r=>Number(r.total_points)>0),medals=new Map(hasScore?ranked.slice(0,3).map((r,i)=>[String(r.participant_id),MEDALS[i]]):[]);
    list.forEach((row,index)=>{
      const id=String(row.participant_id||`actor-${index}`),actor=actors.get(id)||makeActor(row,index),connected=row.connected!==false,medal=medals.get(id)||'';
      actor.connected=connected;actor.ready=!!row.ready;actor.el.classList.toggle('offline',!connected);actor.el.classList.toggle('is-ready',actor.ready);actor.el.classList.toggle('city-leader',!!medal);actor.el.querySelector('.city-rank-crown').textContent=medal;actor.el.querySelector('.city-name').textContent=String(row.display_name||'Jogador');setAvatar(actor,row.avatar_key||'scientist_m');applyDepth(actor,actor.lane);
      if(!connected&&actor.nextAt<performance.now()+1200)actor.nextAt=performance.now()+1200;
    });
    const ready=list.filter(x=>x.ready).length;badge.textContent=list.length?`${ready}/${list.length} prontos`:'0 jogadores';
    if(list.length)ensureTimer();else stopTimerIfEmpty();
  }
  function setPhase(nextPhase){phase=nextPhase||'lobby';city?.setAttribute('data-city-phase',phase);}
  function destroy(){destroyed=true;if(timer)clearInterval(timer);timer=null;for(const actor of actors.values())actor.el.remove();actors.clear();}
  return{setRoster,setPhase,destroy};
}
