export const AVATARS=[
  {key:'scientist_m',label:'Cientista M',gender:'m',category:'science',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Cientista_M.png',preview:'assets/avatars/hd/scientist_m.png',accent:'#24a7d8'},
  {key:'scientist_f',label:'Cientista F',gender:'f',category:'science',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Cientista_F.png',preview:'assets/avatars/hd/scientist_f.png',accent:'#24a7d8'},
  {key:'chemist_m',label:'Químico M',gender:'m',category:'science',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Quimico_M.png',preview:'assets/avatars/hd/chemist_m.png',accent:'#c43bd9'},
  {key:'chemist_f',label:'Química F',gender:'f',category:'science',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Quimico_F.png',preview:'assets/avatars/hd/chemist_f.png',accent:'#c43bd9'},
  {key:'cleanroom_m',label:'Sala limpa M',gender:'m',category:'lab',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Sala_Limpa_M.png',preview:'assets/avatars/hd/cleanroom_m.png',accent:'#4f8ff7'},
  {key:'cleanroom_f',label:'Sala limpa F',gender:'f',category:'lab',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Sala_Limpa_F.png',preview:'assets/avatars/hd/cleanroom_f.png',accent:'#4f8ff7'},
  {key:'oil_ops_m',label:'Petroleiro • Operação M',gender:'m',category:'oil',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Petroleiro_Operacao_M.png',preview:'assets/avatars/hd/oil_ops_m.png',accent:'#ff8a1f'},
  {key:'oil_ops_f',label:'Petroleira • Operação F',gender:'f',category:'oil',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Petroleiro_Operacao_F.png',preview:'assets/avatars/hd/oil_ops_f.png',accent:'#ff8a1f'},
  {key:'oil_maint_m',label:'Petroleiro • Manutenção M',gender:'m',category:'oil',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Petroleiro_Manutencao_M.png',preview:'assets/avatars/hd/oil_maint_m.png',accent:'#ff9d23'},
  {key:'oil_maint_f',label:'Petroleira • Manutenção F',gender:'f',category:'oil',sprite:'assets/sprites/rpgmaker/hd2x/$QR_Petroleiro_Manutencao_F.png',preview:'assets/avatars/hd/oil_maint_f.png',accent:'#ff9d23'}
];

const MAP=new Map(AVATARS.map(a=>[a.key,a]));
const LEGACY={
  robot:'cleanroom_m',astro:'cleanroom_m',alien:'cleanroom_f',wizard:'scientist_m',fairy:'scientist_f',
  man_classic:'scientist_m',man_beard:'chemist_m',man_curly:'scientist_m',man_blond:'oil_ops_m',man_redhair:'oil_maint_m',man_glasses:'chemist_m',man_cap:'oil_ops_m',boy:'cleanroom_m',
  woman_classic:'scientist_f',woman_curly:'chemist_f',woman_blond:'oil_ops_f',woman_redhair:'oil_maint_f',woman_glasses:'chemist_f',woman_hat:'oil_ops_f',girl:'cleanroom_f',princess:'scientist_f',
  fox:'oil_ops_m',cat:'scientist_f',panda:'cleanroom_m',lion:'oil_maint_m',frog:'scientist_m',unicorn:'chemist_f',shark:'cleanroom_m',owl:'chemist_m',dog:'oil_ops_m',rabbit:'scientist_f',tiger:'oil_maint_m',bear:'chemist_m',koala:'cleanroom_f',monkey:'scientist_m',penguin:'cleanroom_m',wolf:'oil_ops_m',
  anime_hero:'scientist_m',anime_blue:'cleanroom_m',anime_fire:'oil_ops_m',anime_ninja:'oil_maint_m',anime_magic:'scientist_f',anime_pink:'chemist_f',anime_bluegirl:'cleanroom_f',anime_star:'oil_ops_f',ninja:'oil_maint_m',pirate:'oil_ops_m',detective:'chemist_m'
};

function avatarChoicePreviewMarkup(key){
  const a=avatarInfo(key);
  return `<span class="avatar-choice-visual"><img class="avatar-choice-image" src="${a.preview}" alt="" decoding="async" loading="lazy"></span>`;
}

function hashString(value){let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function normalizeAvatarKey(key){
  const normalized=String(key||'').toLowerCase();
  if(MAP.has(normalized))return normalized;
  if(LEGACY[normalized]&&MAP.has(LEGACY[normalized]))return LEGACY[normalized];
  return AVATARS[hashString(normalized||'default')%AVATARS.length].key;
}
export function avatarInfo(key){return MAP.get(normalizeAvatarKey(key));}
export function avatarMarkup(key,{animated=false,label=false,compact=false,preview=false}={}){
  const a=avatarInfo(key);
  const cls=['quiz-avatar',`avatar-${a.key}`,`avatar-category-${a.category}`,`avatar-gender-${a.gender}`,animated?'avatar-animated':'',compact?'avatar-compact':'',preview?'avatar-picker-preview':''].filter(Boolean).join(' ');
  return `<span class="${cls}" data-avatar="${a.key}" style="--avatar-accent:${a.accent}" aria-hidden="true"><span class="qa-shadow"></span><span class="qa-sprite" style="background-image:url('${a.sprite}')"></span>${label?`<span class="qa-label">${a.label}</span>`:''}</span>`;
}
export function avatarPickerMarkup(selected='scientist_m'){
  const current=normalizeAvatarKey(selected);
  return `<div class="avatar-picker-grid avatar-picker-grid-all" role="group" aria-label="Avatares profissionais">${AVATARS.map((a,index)=>`<button type="button" class="avatar-choice ${a.key===current?'selected':''}" data-avatar-choice="${a.key}" aria-pressed="${a.key===current?'true':'false'}" aria-label="${a.label}" title="${a.label}">${avatarChoicePreviewMarkup(a.key)}<span class="avatar-choice-label">${a.label}</span><span class="avatar-choice-id">#${String(index+1).padStart(2,'0')}</span></button>`).join('')}</div>`;
}
