import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from'./config.js';

if(!SUPABASE_URL.startsWith('https://'))throw new Error('Configure assets/js/config.js');
const scope=document.body?.dataset?.authScope||'quiz';
export const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:`quiz-rounds-v15-${scope}`}
});
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function renderRank(el,rows,opts={}){
  if(!el||!Array.isArray(rows))return;
  const selfId=opts.selfId?String(opts.selfId):'';
  el.innerHTML=rows.map((r,i)=>{
    const pos=i+1,top=pos<=5?` rank-${pos}`:'',self=selfId&&String(r.participant_id)===selfId?' is-self':'';
    return `<li class="rank-row${top}${self}" data-rank="${pos}"><span class="rank-pos">${pos}</span><strong>${esc(r.display_name)}</strong><b>${Number(r.total_points)||0} pts</b></li>`;
  }).join('')||'<li class="rank-empty">Sem pontuação ainda</li>';
}
export function setConnection(el,status,detail=''){
  if(!el)return;
  const map={connected:['Conectado','connected'],connecting:['Reconectando…','connecting'],fallback:['Modo segurança','fallback'],offline:['Sem internet','offline'],error:['Conexão instável','error']};
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
