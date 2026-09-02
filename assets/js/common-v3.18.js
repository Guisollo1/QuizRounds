import{avatarMarkup}from'./avatars-v3.18.js';
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from'./config.js';

if(!SUPABASE_URL.startsWith('https://'))throw new Error('Configure assets/js/config.js');
if(!SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')){
  throw new Error('Configuração inválida: use somente a Publishable Key do Supabase (sb_publishable_...). Nunca use sb_secret_ ou service_role no navegador.');
}
const scope=document.body?.dataset?.authScope||'quiz';
export const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:`quiz-rounds-v37-${scope}`}
});
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function renderRank(el,rows,opts={}){
  if(!el||!Array.isArray(rows))return false;
  const selfId=opts.selfId?String(opts.selfId):'';
  const signature=JSON.stringify(rows.map((r,i)=>[i+1,String(r.participant_id??''),String(r.display_name??''),String(r.avatar_key??''),Number(r.total_points)||0,selfId&&String(r.participant_id)===selfId?1:0]));
  if(el.dataset.rankSignature===signature)return false;
  const scrollTop=el.scrollTop;
  const html=rows.map((r,i)=>{
    const pos=i+1,top=pos<=5?` rank-${pos}`:'',self=selfId&&String(r.participant_id)===selfId?' is-self':'';
    return `<li class="rank-row${top}${self}" data-rank="${pos}"><span class="rank-pos">${pos}</span><span class="rank-avatar">${avatarMarkup(r.avatar_key||'robot',{compact:true,animated:pos<=3})}</span><strong>${esc(r.display_name)}</strong><b>${Number(r.total_points)||0} pts</b></li>`;
  }).join('')||'<li class="rank-empty">Sem pontuação ainda</li>';
  el.innerHTML=html;
  el.dataset.rankSignature=signature;
  el.scrollTop=scrollTop;
  return true;
}
export function setConnection(el,status,detail=''){
  if(!el)return;
  const map={idle:['Pronto','connected'],connected:['Conectado','connected'],connecting:['Conectando…','connecting'],fallback:['Modo segurança','fallback'],offline:['Sem internet','offline'],error:['Conexão instável','error']};
  const [label,cls]=map[status]||[String(status),'connecting'];
  el.textContent=detail?`${label} • ${detail}`:label;
  el.className=`connection-pill ${cls}`;
}
export function serverRemaining(closesAt,serverOffset=0){
  if(!closesAt)return 0;
  return Date.parse(closesAt)-(Date.now()+serverOffset);
}
export async function ensureAnonymousSession(){
  const{data:{session}}=await db.auth.getSession();
  if(session)return session;
  const{data,error}=await db.auth.signInAnonymously();
  if(error)throw error;
  return data.session;
}
