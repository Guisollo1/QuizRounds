import{avatarMarkup,normalizeAvatarKey}from'./avatars-v3.50-r5.js';

const CHAT_LINES=['Oi!','Boa!','Bora!','GG!','Vamos!','Mandou bem!','Tudo bem?','😂','👏','🚀','🎉'];
const PLAY_TOYS=['⚽','🏀','🎈','🪁','⭐','🎲'];
const MEDALS=['👑','🥈','🥉'];
const REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;

/*
  r4: navegação por grafo. Cada aresta foi posicionada somente em corredores,
  passarelas e áreas abertas dos quatro mapas. O personagem nunca salta entre
  faixas arbitrárias nem recalcula escala por profundidade.
*/
const NAV={
  office:{
    nodes:{v0:[42,28],v1:[42,34],v2:[42,40],v3:[42,46],v4:[42,52],h1:[50,52],h2:[58,52],h3:[66,52],h4:[74,52],h5:[82,52],h6:[88,52]},
    edges:[['v0','v1'],['v1','v2'],['v2','v3'],['v3','v4'],['v4','h1'],['h1','h2'],['h2','h3'],['h3','h4'],['h4','h5'],['h5','h6']],
    spawn:['v1','v2','v3','v4','h1','h2','h3','h4','h5']
  },
  laboratory:{
    nodes:{v0:[45,28],v1:[45,34],v2:[45,40],v3:[45,46],v4:[45,52],h1:[53,52],h2:[61,52],h3:[69,52],h4:[77,52],h5:[84,52],h6:[89,52]},
    edges:[['v0','v1'],['v1','v2'],['v2','v3'],['v3','v4'],['v4','h1'],['h1','h2'],['h2','h3'],['h3','h4'],['h4','h5'],['h5','h6']],
    spawn:['v1','v2','v3','v4','h1','h2','h3','h4','h5']
  },
  industry:{
    nodes:{v0:[39,27],v1:[39,34],v2:[39,42],v3:[39,50],v4:[39,58],l1:[31,58],l2:[23,58],l3:[15,58],r1:[48,58],r2:[58,58],r3:[68,58],r4:[78,58],r5:[88,58]},
    edges:[['v0','v1'],['v1','v2'],['v2','v3'],['v3','v4'],['v4','l1'],['l1','l2'],['l2','l3'],['v4','r1'],['r1','r2'],['r2','r3'],['r3','r4'],['r4','r5']],
    spawn:['v1','v2','v3','v4','l1','l2','r1','r2','r3','r4']
  },
  platform:{
    nodes:{b0:[14,68],b1:[24,68],b2:[34,68],b3:[44,68],b4:[54,68],b5:[64,68],b6:[74,68],b7:[84,68],h0:[20,22],h1:[28,22],h2:[36,22],h3:[36,30],h4:[28,30],h5:[20,30]},
    edges:[['b0','b1'],['b1','b2'],['b2','b3'],['b3','b4'],['b4','b5'],['b5','b6'],['b6','b7'],['h0','h1'],['h1','h2'],['h2','h3'],['h3','h4'],['h4','h5'],['h5','h0']],
    spawn:['b1','b2','b3','b4','b5','b6','h0','h1','h2','h3','h4','h5']
  }
};

for(const graph of Object.values(NAV)){
  graph.adj={};
  for(const key of Object.keys(graph.nodes))graph.adj[key]=[];
  for(const[a,b]of graph.edges){graph.adj[a].push(b);graph.adj[b].push(a);}
}

function hashString(value){let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function nextRand(actor){actor.seed=(Math.imul(actor.seed,1664525)+1013904223)>>>0;return actor.seed/4294967296;}
function between(actor,min,max){return min+nextRand(actor)*(max-min);}
function currentScene(city){const scene=String(city?.dataset?.scene||'office').toLowerCase();return NAV[scene]?scene:'office';}
function graphFor(city){return NAV[currentScene(city)];}
function directionFrom(a,b){const dx=(b?.[0]||0)-(a?.[0]||0),dy=(b?.[1]||0)-(a?.[1]||0);return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
function distance(a,b){return Math.hypot((a?.[0]||0)-(b?.[0]||0),(a?.[1]||0)-(b?.[1]||0));}
function shortest(graph,start,end){
  if(!graph?.nodes?.[start]||!graph?.nodes?.[end])return[start];
  if(start===end)return[start];
  const queue=[start],prev=new Map([[start,null]]);
  for(const node of queue){
    for(const next of graph.adj[node]||[]){
      if(prev.has(next))continue;
      prev.set(next,node);
      if(next===end){const path=[next];let cur=node;while(cur){path.push(cur);cur=prev.get(cur);}return path.reverse();}
      queue.push(next);
    }
  }
  return[start];
}
function reachable(graph,start){
  if(!graph?.nodes?.[start])return[];
  const out=[],seen=new Set([start]),queue=[start];
  for(const node of queue){out.push(node);for(const next of graph.adj[node]||[]){if(!seen.has(next)){seen.add(next);queue.push(next);}}}
  return out;
}

export function createAvatarCity(host,badge,{maxActors=120}={}){
  const actors=new Map();
  let phase='lobby',timer=null,nextPairAt=0,destroyed=false,density='normal';
  const city=host?.closest('.avatar-city');
  const DIRECTIONS=['down','left','right','up'];

  function setActorClass(actor,action,direction='down'){
    const facing=DIRECTIONS.includes(direction)?direction:'down';
    actor.el.classList.remove('is-walking','is-idle','is-jumping','is-chatting','is-playing','is-waving','is-dancing','is-sidestepping','is-cheering','face-down','face-left','face-right','face-up');
    actor.el.classList.add(`is-${action}`,`face-${facing}`);
    actor.el.dataset.direction=facing;
  }
  function randomDirection(actor){return DIRECTIONS[Math.floor(nextRand(actor)*DIRECTIONS.length)]||'down';}
  function clearExtras(actor){actor.el.querySelector('.city-speech').textContent='';actor.el.querySelector('.city-toy').textContent='';}
  function setPosition(actor,nodeKey,{instant=false}={}){
    const graph=graphFor(city),point=graph.nodes[nodeKey];if(!point)return;
    actor.node=nodeKey;actor.x=point[0];actor.y=point[1];
    if(instant)actor.el.classList.add('city-teleport');
    actor.el.style.setProperty('--city-x',`${actor.x.toFixed(2)}%`);
    actor.el.style.setProperty('--city-y',`${actor.y.toFixed(2)}%`);
    actor.el.style.zIndex=String(30+Math.round(actor.y));
    if(instant)requestAnimationFrame(()=>requestAnimationFrame(()=>actor.el.classList.remove('city-teleport')));
  }
  function ensureScene(actor){
    const scene=currentScene(city);if(actor.scene===scene&&NAV[scene]?.nodes?.[actor.node])return;
    const graph=NAV[scene],spawns=graph.spawn?.length?graph.spawn:Object.keys(graph.nodes),index=(actor.seed>>>5)%Math.max(1,spawns.length);
    actor.scene=scene;actor.route=[];setPosition(actor,spawns[index]||Object.keys(graph.nodes)[0],{instant:true});setActorClass(actor,'idle','down');actor.nextAt=performance.now()+700+((actor.seed>>>12)%1400);
  }
  function makeActor(row,index){
    const id=String(row.participant_id||`actor-${index}`),seed=hashString(id||row.display_name||index)||1;
    const el=document.createElement('div');el.className='city-actor is-idle city-entering';el.dataset.participant=id;
    el.innerHTML='<span class="city-rank-crown" aria-hidden="true"></span><span class="city-speech" aria-hidden="true"></span><span class="city-name"></span><span class="city-avatar-shell"></span><span class="city-toy" aria-hidden="true"></span>';
    const actor={id,el,seed,node:'',x:50,y:50,nextAt:performance.now()+500,avatarKey:'',connected:true,ready:false,direction:'down',route:[],scene:''};
    host.append(el);actors.set(id,actor);ensureScene(actor);setTimeout(()=>el.classList.remove('city-entering'),900);return actor;
  }
  function setAvatar(actor,key){const normalized=normalizeAvatarKey(key);if(actor.avatarKey===normalized)return;actor.avatarKey=normalized;actor.el.querySelector('.city-avatar-shell').innerHTML=avatarMarkup(normalized,{animated:true});}
  function moveNext(actor,now){
    ensureScene(actor);const graph=graphFor(city);if(!actor.route.length)return false;
    const next=actor.route.shift(),from=graph.nodes[actor.node],to=graph.nodes[next];if(!from||!to){actor.route=[];return false;}
    const dir=directionFrom(from,to),d=distance(from,to),duration=Math.max(.85,Math.min(2.35,d*.14));
    clearExtras(actor);actor.direction=dir;actor.el.style.setProperty('--city-move-time',`${duration.toFixed(2)}s`);setActorClass(actor,'walking',dir);setPosition(actor,next);actor.nextAt=now+duration*1000+120;return true;
  }
  function wander(actor,now){
    ensureScene(actor);const graph=graphFor(city),pool=reachable(graph,actor.node).filter(k=>k!==actor.node);if(!pool.length){idle(actor,now);return;}
    const preferred=pool.filter(k=>distance(graph.nodes[actor.node],graph.nodes[k])>=12),choice=(preferred.length?preferred:pool)[Math.floor(nextRand(actor)*(preferred.length?preferred.length:pool.length))];
    actor.route=shortest(graph,actor.node,choice).slice(1);if(!moveNext(actor,now))idle(actor,now);
  }
  function idle(actor,now,duration=between(actor,2.2,5.2)){clearExtras(actor);setActorClass(actor,'idle',randomDirection(actor));actor.nextAt=now+duration*1000;}
  function jump(actor,now){clearExtras(actor);setActorClass(actor,'jumping',randomDirection(actor));actor.nextAt=now+1150;}
  function wave(actor,now){clearExtras(actor);actor.el.querySelector('.city-speech').textContent=CHAT_LINES[Math.floor(nextRand(actor)*CHAT_LINES.length)];setActorClass(actor,'waving',randomDirection(actor));actor.nextAt=now+2400;}
  function play(actor,now){clearExtras(actor);actor.el.querySelector('.city-toy').textContent=PLAY_TOYS[Math.floor(nextRand(actor)*PLAY_TOYS.length)];setActorClass(actor,'playing',randomDirection(actor));actor.nextAt=now+2500;}
  function dance(actor,now){clearExtras(actor);actor.el.querySelector('.city-speech').textContent='🎵';setActorClass(actor,'dancing',randomDirection(actor));actor.nextAt=now+2350;}
  function cheer(actor,now){clearExtras(actor);actor.el.querySelector('.city-speech').textContent=nextRand(actor)>.45?'🎉':'👏';setActorClass(actor,'cheering',randomDirection(actor));actor.nextAt=now+1900;}
  function pairInteraction(a,b,now,type){
    if(!a||!b||a===b||density==='high')return;clearExtras(a);clearExtras(b);
    if(type==='chat'){a.el.querySelector('.city-speech').textContent=CHAT_LINES[Math.floor(nextRand(a)*CHAT_LINES.length)];b.el.querySelector('.city-speech').textContent=CHAT_LINES[Math.floor(nextRand(b)*CHAT_LINES.length)];setActorClass(a,'chatting',randomDirection(a));setActorClass(b,'chatting',randomDirection(b));}
    else if(type==='highfive'){a.el.querySelector('.city-speech').textContent='🙌';b.el.querySelector('.city-speech').textContent='🙌';setActorClass(a,'cheering',randomDirection(a));setActorClass(b,'cheering',randomDirection(b));}
    else{const toy=PLAY_TOYS[Math.floor(nextRand(a)*PLAY_TOYS.length)];a.el.querySelector('.city-toy').textContent=toy;b.el.querySelector('.city-toy').textContent=toy;setActorClass(a,'playing',randomDirection(a));setActorClass(b,'playing',randomDirection(b));}
    a.route=[];b.route=[];a.nextAt=b.nextAt=now+2500;
  }
  function act(actor,now){
    ensureScene(actor);if(actor.route.length){moveNext(actor,now);return;}if(REDUCED){idle(actor,now,12);return;}if(!actor.connected){idle(actor,now,7);return;}
    const r=nextRand(actor),compact=phase&&phase!=='lobby';
    if(density==='high'){if(r<.42)wander(actor,now);else idle(actor,now,between(actor,3,7));return;}
    if(phase==='result'||phase==='finished'){if(r<.34)cheer(actor,now);else if(r<.52)jump(actor,now);else if(r<.68)dance(actor,now);else if(r<.82)wave(actor,now);else idle(actor,now);return;}
    if(r<(compact?.34:.28))wander(actor,now);else if(r<.52)idle(actor,now);else if(r<.64)jump(actor,now);else if(r<.78)wave(actor,now);else if(r<.91)play(actor,now);else dance(actor,now);
  }
  function tick(){
    if(destroyed)return;const now=performance.now(),live=[...actors.values()].filter(a=>a.connected);
    if(!REDUCED&&density!=='high'&&now>=nextPairAt&&live.length>=2&&phase==='lobby'){
      const due=live.filter(a=>a.nextAt<=now&&!a.route.length);if(due.length>=2){const a=due[Math.floor(Math.random()*due.length)],others=due.filter(x=>x!==a),b=others[Math.floor(Math.random()*others.length)],roll=Math.random();pairInteraction(a,b,now,roll<.52?'chat':roll<.84?'play':'highfive');nextPairAt=now+6000+Math.random()*5500;}
    }
    for(const actor of actors.values())if(actor.nextAt<=now)act(actor,now);
  }
  function ensureTimer(){if(timer||destroyed)return;timer=setInterval(tick,density==='high'?1050:700);}
  function resetTimer(){if(timer){clearInterval(timer);timer=null;}if(actors.size)ensureTimer();}
  function stopTimerIfEmpty(){if(actors.size||!timer)return;clearInterval(timer);timer=null;}

  function setRoster(rows=[]){
    const raw=Array.isArray(rows)?rows:[],nextDensity=raw.length>=80?'high':raw.length>=40?'medium':'normal';
    if(nextDensity!==density){density=nextDensity;if(city)city.dataset.density=density;resetTimer();}
    const cap=density==='high'?Math.min(maxActors,100):maxActors,list=raw.slice(0,cap),wanted=new Set(list.map((r,i)=>String(r.participant_id||`actor-${i}`)));
    for(const[id,actor]of actors)if(!wanted.has(id)){actor.el.remove();actors.delete(id);}
    const ranked=[...list].sort((a,b)=>(Number(b.total_points)||0)-(Number(a.total_points)||0)||String(a.joined_at||'').localeCompare(String(b.joined_at||''))),hasScore=ranked.some(r=>Number(r.total_points)>0),medals=new Map(hasScore?ranked.slice(0,3).map((r,i)=>[String(r.participant_id),MEDALS[i]]):[]);
    list.forEach((row,index)=>{
      const id=String(row.participant_id||`actor-${index}`),actor=actors.get(id)||makeActor(row,index),connected=row.connected!==false,medal=medals.get(id)||'';ensureScene(actor);
      actor.connected=connected;actor.ready=!!row.ready;actor.el.classList.toggle('offline',!connected);actor.el.classList.toggle('is-ready',actor.ready);actor.el.classList.toggle('city-leader',!!medal);actor.el.querySelector('.city-rank-crown').textContent=medal;actor.el.querySelector('.city-name').textContent=String(row.display_name||'Jogador');setAvatar(actor,row.avatar_key||'scientist_m');
      if(!connected&&actor.nextAt<performance.now()+1200)actor.nextAt=performance.now()+1200;
    });
    const ready=list.filter(x=>x.ready).length;badge.textContent=list.length?`${ready}/${list.length} prontos`:'0 jogadores';if(list.length)ensureTimer();else stopTimerIfEmpty();
  }
  function setPhase(nextPhase){phase=nextPhase||'lobby';city?.setAttribute('data-city-phase',phase);for(const actor of actors.values())ensureScene(actor);}
  function destroy(){destroyed=true;if(timer)clearInterval(timer);timer=null;for(const actor of actors.values())actor.el.remove();actors.clear();}
  return{setRoster,setPhase,destroy};
}
