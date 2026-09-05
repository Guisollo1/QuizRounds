import{avatarMarkup,normalizeAvatarKey}from'./avatars-v3.50-r7.js';

const CHAT_LINES=['Oi!','Boa!','Bora!','GG!','Vamos!','Mandou bem!','Tudo bem?','😂','👏','🚀','🎉'];
const PLAY_TOYS=['⚽','🏀','🎈','🪁','⭐','🎲'];
const MEDALS=['👑','🥈','🥉'];
const REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;

/*
  r7: navegação por zonas seguras. Cada componente representa somente piso
  caminhável (corredores, áreas abertas e passarelas). Salas/decks separados
  permanecem desconectados para impedir travessias de paredes e equipamentos.
*/
const NAV={
  office:{
    nodes:{
      c0:[44.5,30],c1:[44.5,36],c2:[44.5,42],c3:[44.5,48],c4:[44.5,54],c5:[50,56],c6:[58,56],c7:[66,56],c8:[74,56],c9:[82,56],c10:[88,56],
      r0:[16,66],r1:[19,69],r2:[24,70],r3:[30,70],r4:[35,69],r5:[38,66],
      m0:[47,66],m1:[47,74],m2:[47,82],m3:[54,82],m4:[62,82],m5:[63,75],m6:[63,68],m7:[57,68],m8:[51,68],
      o0:[70,66],o1:[70,82],o2:[77,82],o3:[85,82],o4:[86,74],o5:[86,66],o6:[81,66],o7:[75,66]
    },
    edges:[
      ['c0','c1'],['c1','c2'],['c2','c3'],['c3','c4'],['c4','c5'],['c5','c6'],['c6','c7'],['c7','c8'],['c8','c9'],['c9','c10'],
      ['r0','r1'],['r1','r2'],['r2','r3'],['r3','r4'],['r4','r5'],
      ['m0','m1'],['m1','m2'],['m2','m3'],['m3','m4'],['m4','m5'],['m5','m6'],['m6','m7'],['m7','m8'],['m8','m0'],
      ['o0','o1'],['o1','o2'],['o2','o3'],['o3','o4'],['o4','o5'],['o5','o6'],['o6','o7'],['o7','o0']
    ],
    spawn:['c1','c2','c3','c5','c6','c7','c8','c9','r1','r3','r5','m0','m3','m5','m7','o0','o2','o4','o6']
  },
  laboratory:{
    nodes:{
      c0:[45,29],c1:[45,35],c2:[45,42],c3:[45,49],c4:[45,55],c5:[52,55],c6:[60,55],c7:[68,55],c8:[76,55],c9:[84,55],c10:[88,55],
      r0:[16,66],r1:[19,69],r2:[24,70],r3:[31,70],r4:[36,68],r5:[37,64],
      l0:[47,67],l1:[47,75],l2:[47,82],l3:[54,82],l4:[63,82],l5:[64,75],l6:[64,68],l7:[58,68],l8:[52,68],
      o0:[70,66],o1:[70,82],o2:[77,82],o3:[86,82],o4:[87,74],o5:[87,66],o6:[82,66],o7:[76,66]
    },
    edges:[
      ['c0','c1'],['c1','c2'],['c2','c3'],['c3','c4'],['c4','c5'],['c5','c6'],['c6','c7'],['c7','c8'],['c8','c9'],['c9','c10'],
      ['r0','r1'],['r1','r2'],['r2','r3'],['r3','r4'],['r4','r5'],
      ['l0','l1'],['l1','l2'],['l2','l3'],['l3','l4'],['l4','l5'],['l5','l6'],['l6','l7'],['l7','l8'],['l8','l0'],
      ['o0','o1'],['o1','o2'],['o2','o3'],['o3','o4'],['o4','o5'],['o5','o6'],['o6','o7'],['o7','o0']
    ],
    spawn:['c1','c2','c3','c5','c6','c7','c8','c9','r1','r3','r5','l0','l3','l5','l7','o0','o2','o4','o6']
  },
  industry:{
    nodes:{
      a0:[39,28],a1:[39,34],a2:[39,41],a3:[39,48],a4:[39,56],a5:[39,63],a6:[39,68],
      b0:[14,42],b1:[21,42],b2:[28,42],b3:[35,42],b4:[14,49],b5:[14,57],b6:[21,57],b7:[28,57],b8:[35,57],
      h0:[46,68],h1:[54,68],h2:[62,68],h3:[70,68],h4:[78,68],h5:[87,68]
    },
    edges:[
      ['a0','a1'],['a1','a2'],['a2','a3'],['a3','a4'],['a4','a5'],['a5','a6'],
      ['a2','b3'],['b3','b2'],['b2','b1'],['b1','b0'],['b0','b4'],['b4','b5'],['b5','b6'],['b6','b7'],['b7','b8'],['b8','a4'],
      ['h0','h1'],['h1','h2'],['h2','h3'],['h3','h4'],['h4','h5']
    ],
    spawn:['a0','a1','a2','a3','a4','a5','b0','b1','b2','b4','b5','b6','b7','h0','h1','h2','h3','h4','h5']
  },
  platform:{
    nodes:{
      p0:[19,18],p1:[27,18],p2:[35,18],p3:[37,23],p4:[35,29],p5:[27,30],p6:[19,29],p7:[17,24],
      v0:[40,31],v1:[40,38],v2:[40,46],v3:[40,54],v4:[40,62],v5:[44,70],
      d0:[15,70],d1:[24,70],d2:[34,70],d3:[44,70],d4:[54,70],d5:[64,70],d6:[74,70],d7:[84,70]
    },
    edges:[
      ['p0','p1'],['p1','p2'],['p2','p3'],['p3','p4'],['p4','p5'],['p5','p6'],['p6','p7'],['p7','p0'],
      ['v0','v1'],['v1','v2'],['v2','v3'],['v3','v4'],
      ['d0','d1'],['d1','d2'],['d2','d3'],['d3','d4'],['d4','d5'],['d5','d6'],['d6','d7']
    ],
    spawn:['p0','p1','p2','p3','p4','p5','p6','p7','v0','v1','v2','v3','v4','d0','d1','d2','d3','d4','d5','d6','d7']
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
      const due=live.filter(a=>a.nextAt<=now&&!a.route.length);if(due.length>=2){const a=due[Math.floor(Math.random()*due.length)],graph=graphFor(city),sameZone=new Set(reachable(graph,a.node)),others=due.filter(x=>x!==a&&sameZone.has(x.node)&&distance(graph.nodes[a.node],graph.nodes[x.node])<=18);if(others.length){const b=others[Math.floor(Math.random()*others.length)],roll=Math.random();pairInteraction(a,b,now,roll<.52?'chat':roll<.84?'play':'highfive');}nextPairAt=now+6000+Math.random()*5500;}
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
