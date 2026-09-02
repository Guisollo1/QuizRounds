export const AVATARS=[
  {key:'fox',label:'Raposa',emoji:'🦊',main:'#ff7a32',accent:'#fff1d6'},
  {key:'robot',label:'Robô',emoji:'🤖',main:'#607dff',accent:'#cfe7ff'},
  {key:'cat',label:'Gato',emoji:'😺',main:'#a855f7',accent:'#f3dcff'},
  {key:'astro',label:'Astronauta',emoji:'🧑‍🚀',main:'#e8eefc',accent:'#55d7ff'},
  {key:'ninja',label:'Ninja',emoji:'🥷',main:'#28303d',accent:'#ff3f86'},
  {key:'panda',label:'Panda',emoji:'🐼',main:'#f4f4f5',accent:'#27272a'},
  {key:'alien',label:'Alien',emoji:'👽',main:'#63e86f',accent:'#c6ff8e'},
  {key:'lion',label:'Leão',emoji:'🦁',main:'#f4a62a',accent:'#ffe29b'},
  {key:'frog',label:'Sapo',emoji:'🐸',main:'#39c85a',accent:'#a9ffb7'},
  {key:'unicorn',label:'Unicórnio',emoji:'🦄',main:'#ff79c6',accent:'#bde9ff'},
  {key:'shark',label:'Tubarão',emoji:'🦈',main:'#4c93c7',accent:'#c8ebff'},
  {key:'owl',label:'Coruja',emoji:'🦉',main:'#a96c3c',accent:'#ffd999'}
];
const MAP=new Map(AVATARS.map(a=>[a.key,a]));
export function normalizeAvatarKey(key){return MAP.has(String(key||'').toLowerCase())?String(key).toLowerCase():'robot';}
export function avatarInfo(key){return MAP.get(normalizeAvatarKey(key));}
export function avatarMarkup(key,{animated=false,label=false,compact=false}={}){
  const a=avatarInfo(key),cls=['quiz-avatar',`avatar-${a.key}`,animated?'avatar-animated':'',compact?'avatar-compact':''].filter(Boolean).join(' ');
  return `<span class="${cls}" data-avatar="${a.key}" style="--avatar-main:${a.main};--avatar-accent:${a.accent}" aria-hidden="true"><span class="qa-shadow"></span><span class="qa-body"><span class="qa-head"><span class="qa-emoji">${a.emoji}</span></span><span class="qa-torso"></span><span class="qa-feet"><i></i><i></i></span></span>${label?`<span class="qa-label">${a.label}</span>`:''}</span>`;
}
export function avatarPickerMarkup(selected='robot'){
  const current=normalizeAvatarKey(selected);
  return AVATARS.map(a=>`<button type="button" class="avatar-choice ${a.key===current?'selected':''}" data-avatar-choice="${a.key}" aria-pressed="${a.key===current?'true':'false'}" title="${a.label}">${avatarMarkup(a.key,{animated:true})}<span>${a.label}</span></button>`).join('');
}
