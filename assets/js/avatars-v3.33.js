export const AVATAR_CATEGORIES=[
  {key:'animals',label:'Animais',icon:'🐾'},
  {key:'people_m',label:'Pessoas ♂',icon:'👨'},
  {key:'people_f',label:'Pessoas ♀',icon:'👩'},
  {key:'anime_m',label:'Anime ♂',icon:'⚡'},
  {key:'anime_f',label:'Anime ♀',icon:'🌸'},
  {key:'fantasy',label:'Fantasia',icon:'✨'}
];

export const AVATARS=[
  // Animais
  {key:'fox',label:'Raposa',emoji:'🦊',main:'#ff7a32',accent:'#fff1d6',category:'animals'},
  {key:'cat',label:'Gato',emoji:'😺',main:'#a855f7',accent:'#f3dcff',category:'animals'},
  {key:'panda',label:'Panda',emoji:'🐼',main:'#f4f4f5',accent:'#27272a',category:'animals'},
  {key:'lion',label:'Leão',emoji:'🦁',main:'#f4a62a',accent:'#ffe29b',category:'animals'},
  {key:'frog',label:'Sapo',emoji:'🐸',main:'#39c85a',accent:'#a9ffb7',category:'animals'},
  {key:'unicorn',label:'Unicórnio',emoji:'🦄',main:'#ff79c6',accent:'#bde9ff',category:'animals'},
  {key:'shark',label:'Tubarão',emoji:'🦈',main:'#4c93c7',accent:'#c8ebff',category:'animals'},
  {key:'owl',label:'Coruja',emoji:'🦉',main:'#a96c3c',accent:'#ffd999',category:'animals'},
  {key:'dog',label:'Cachorro',emoji:'🐶',main:'#ba7a42',accent:'#fff0cf',category:'animals'},
  {key:'rabbit',label:'Coelho',emoji:'🐰',main:'#d991c6',accent:'#fff3fb',category:'animals'},
  {key:'tiger',label:'Tigre',emoji:'🐯',main:'#f08b2f',accent:'#ffe2a8',category:'animals'},
  {key:'bear',label:'Urso',emoji:'🐻',main:'#875b42',accent:'#ead0b5',category:'animals'},
  {key:'koala',label:'Coala',emoji:'🐨',main:'#78859a',accent:'#e6ebf4',category:'animals'},
  {key:'monkey',label:'Macaco',emoji:'🐵',main:'#aa7046',accent:'#f6d6a9',category:'animals'},
  {key:'penguin',label:'Pinguim',emoji:'🐧',main:'#39445b',accent:'#eef6ff',category:'animals'},
  {key:'wolf',label:'Lobo',emoji:'🐺',main:'#66748a',accent:'#e2e9f4',category:'animals'},

  // Pessoas — masculino
  {key:'man_classic',label:'Rapaz',emoji:'👨🏻',main:'#4263eb',accent:'#dbe4ff',category:'people_m',gender:'m'},
  {key:'man_beard',label:'Barba',emoji:'🧔🏽',main:'#8b5e3c',accent:'#f1d2b5',category:'people_m',gender:'m'},
  {key:'man_curly',label:'Cacheado',emoji:'👨🏾‍🦱',main:'#6f42c1',accent:'#eadcff',category:'people_m',gender:'m'},
  {key:'man_blond',label:'Loiro',emoji:'👱🏻‍♂️',main:'#e0a82e',accent:'#fff0ae',category:'people_m',gender:'m'},
  {key:'man_redhair',label:'Ruivo',emoji:'👨🏻‍🦰',main:'#d9480f',accent:'#ffd8bd',category:'people_m',gender:'m'},
  {key:'man_glasses',label:'Óculos',emoji:'🧑🏽‍💼',main:'#176b87',accent:'#c8f1ff',category:'people_m',gender:'m',symbol:'👓'},
  {key:'man_cap',label:'Boné',emoji:'👨🏽',main:'#2f9e44',accent:'#d3f9d8',category:'people_m',gender:'m',symbol:'🧢'},
  {key:'boy',label:'Garoto',emoji:'👦🏻',main:'#339af0',accent:'#d0ebff',category:'people_m',gender:'m'},

  // Pessoas — feminino
  {key:'woman_classic',label:'Moça',emoji:'👩🏻',main:'#e64980',accent:'#ffdeeb',category:'people_f',gender:'f'},
  {key:'woman_curly',label:'Cacheada',emoji:'👩🏾‍🦱',main:'#7b2cbf',accent:'#ead7ff',category:'people_f',gender:'f'},
  {key:'woman_blond',label:'Loira',emoji:'👱🏻‍♀️',main:'#f59f00',accent:'#fff3bf',category:'people_f',gender:'f'},
  {key:'woman_redhair',label:'Ruiva',emoji:'👩🏻‍🦰',main:'#e8590c',accent:'#ffe8cc',category:'people_f',gender:'f'},
  {key:'woman_glasses',label:'Óculos',emoji:'👩🏽‍💼',main:'#0b7285',accent:'#c5f6fa',category:'people_f',gender:'f',symbol:'👓'},
  {key:'woman_hat',label:'Chapéu',emoji:'👩🏽',main:'#a61e4d',accent:'#fcc2d7',category:'people_f',gender:'f',symbol:'👒'},
  {key:'girl',label:'Garota',emoji:'👧🏻',main:'#cc5de8',accent:'#f3d9fa',category:'people_f',gender:'f'},
  {key:'princess',label:'Princesa',emoji:'👸🏽',main:'#e64980',accent:'#ffe3f1',category:'people_f',gender:'f',symbol:'👑'},

  // Anime genérico — masculino (sem personagens/licenças)
  {key:'anime_hero',label:'Herói',emoji:'🧑🏻',main:'#3b5bdb',accent:'#dbe4ff',category:'anime_m',gender:'m',symbol:'⚡'},
  {key:'anime_blue',label:'Azul',emoji:'🧑🏼',main:'#228be6',accent:'#d0ebff',category:'anime_m',gender:'m',symbol:'🌊'},
  {key:'anime_fire',label:'Fogo',emoji:'🧑🏽',main:'#f03e3e',accent:'#ffe3e3',category:'anime_m',gender:'m',symbol:'🔥'},
  {key:'anime_ninja',label:'Lua',emoji:'🧑🏻',main:'#343a40',accent:'#e9ecef',category:'anime_m',gender:'m',symbol:'🌙'},

  // Anime genérico — feminino (sem personagens/licenças)
  {key:'anime_magic',label:'Mágica',emoji:'👩🏻',main:'#9c36b5',accent:'#f3d9fa',category:'anime_f',gender:'f',symbol:'✨'},
  {key:'anime_pink',label:'Rosa',emoji:'👩🏼',main:'#f06595',accent:'#ffdeeb',category:'anime_f',gender:'f',symbol:'🌸'},
  {key:'anime_bluegirl',label:'Cristal',emoji:'👩🏽',main:'#1c7ed6',accent:'#d0ebff',category:'anime_f',gender:'f',symbol:'💎'},
  {key:'anime_star',label:'Estrela',emoji:'👩🏻',main:'#7048e8',accent:'#e5dbff',category:'anime_f',gender:'f',symbol:'⭐'},

  // Fantasia e clássicos
  {key:'robot',label:'Robô',emoji:'🤖',main:'#607dff',accent:'#cfe7ff',category:'fantasy'},
  {key:'astro',label:'Astronauta',emoji:'🧑‍🚀',main:'#e8eefc',accent:'#55d7ff',category:'fantasy'},
  {key:'ninja',label:'Ninja',emoji:'🥷',main:'#28303d',accent:'#ff3f86',category:'fantasy'},
  {key:'alien',label:'Alien',emoji:'👽',main:'#63e86f',accent:'#c6ff8e',category:'fantasy'},
  {key:'wizard',label:'Mago',emoji:'🧙🏻‍♂️',main:'#7048e8',accent:'#e5dbff',category:'fantasy',gender:'m',symbol:'🔮'},
  {key:'fairy',label:'Fada',emoji:'🧚🏽‍♀️',main:'#d6336c',accent:'#ffdeeb',category:'fantasy',gender:'f',symbol:'✨'},
  {key:'pirate',label:'Pirata',emoji:'🏴‍☠️',main:'#495057',accent:'#ffd8a8',category:'fantasy',symbol:'⚓'},
  {key:'detective',label:'Detetive',emoji:'🕵🏽',main:'#5f3dc4',accent:'#e5dbff',category:'fantasy',symbol:'🔎'}
];

const MAP=new Map(AVATARS.map(a=>[a.key,a]));
const CATEGORY_MAP=new Map(AVATAR_CATEGORIES.map(c=>[c.key,c]));
export function normalizeAvatarKey(key){const normalized=String(key||'').toLowerCase();return MAP.has(normalized)?normalized:'robot';}
export function avatarInfo(key){return MAP.get(normalizeAvatarKey(key));}
export function normalizeAvatarCategory(category){const key=String(category||'').toLowerCase();return CATEGORY_MAP.has(key)?key:'animals';}
export function avatarCategoryInfo(category){return CATEGORY_MAP.get(normalizeAvatarCategory(category));}
export function avatarMarkup(key,{animated=false,label=false,compact=false}={}){
  const a=avatarInfo(key),cls=['quiz-avatar',`avatar-${a.key}`,`avatar-category-${a.category}`,a.gender?`avatar-gender-${a.gender}`:'',animated?'avatar-animated':'',compact?'avatar-compact':''].filter(Boolean).join(' ');
  return `<span class="${cls}" data-avatar="${a.key}" style="--avatar-main:${a.main};--avatar-accent:${a.accent}" aria-hidden="true"><span class="qa-shadow"></span><span class="qa-body"><span class="qa-head"><span class="qa-emoji">${a.emoji}</span>${a.symbol?`<span class="qa-badge">${a.symbol}</span>`:''}</span><span class="qa-torso"></span><span class="qa-feet"><i></i><i></i></span></span>${label?`<span class="qa-label">${a.label}</span>`:''}</span>`;
}
export function avatarPickerMarkup(selected='robot',category=null){
  const current=normalizeAvatarKey(selected),selectedInfo=avatarInfo(current),active=normalizeAvatarCategory(category||selectedInfo.category);
  const tabs=AVATAR_CATEGORIES.map(c=>{const count=AVATARS.filter(a=>a.category===c.key).length;return `<button type="button" class="avatar-filter ${c.key===active?'active':''}" data-avatar-filter="${c.key}" aria-pressed="${c.key===active?'true':'false'}"><span>${c.icon}</span><b>${c.label}</b><small>${count}</small></button>`}).join('');
  const choices=AVATARS.filter(a=>a.category===active).map(a=>`<button type="button" class="avatar-choice ${a.key===current?'selected':''}" data-avatar-choice="${a.key}" aria-pressed="${a.key===current?'true':'false'}" title="${a.label}">${avatarMarkup(a.key,{animated:true})}<span>${a.label}</span></button>`).join('');
  const cat=avatarCategoryInfo(active);
  return `<div class="avatar-filter-bar" role="group" aria-label="Categorias de avatar">${tabs}</div><div class="avatar-category-title"><span>${cat.icon}</span><strong>${cat.label}</strong></div><div class="avatar-picker-grid">${choices}</div>`;
}
