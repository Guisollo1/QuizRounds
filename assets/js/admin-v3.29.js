import{db,$,esc,renderRank,setConnection,serverRemaining,sleep}from'./common-v3.29.js';
import{avatarMarkup}from'./avatars-v3.29.js';

let room=null,roomState=null,queueRows=[],questionBank=[],participants=[],historyRows=[],channel=null,progressChannel=null,poll=null,serverOffset=0,timerTick=null,reconnectTimer=null,reconnectAttempt=0,auditTick=null,actionBusy=false,presenceOnline=null,displayOnline=false,progressRefreshTimer=null,lastAdminQr='',activeAdminTab='questions',autoOpening=false,autoClosing=false,lastLatency=0,subscriptionEpoch=0,lastConnectionKey='',refreshSeq=0,refreshAppliedSeq=0,displayWindowRef=null,remoteAuthorized=false,remoteModeActive=false,remoteDeviceLabel='',remotePairLink='',remotePairExpiresAt=0;
let parsedImport={questions:[],errors:[],results:[]},parseTimer=null,recentQuestionIds=new Set(),connectionTestNonce='',connectionAcks=new Set();
let editingQuestionId=null,selectedQuestionIds=new Set(),activeBankQuick='all',visibleQuestionRows=[];
const POLL_CONNECTED=4000,POLL_FALLBACK=1500,MAX_IMPORT=500,REMOTE_DEVICE_KEY='quizRemoteDeviceToken:v1';

const $$=s=>[...document.querySelectorAll(s)];
function conn(status,detail=''){const key=`${status}|${detail}`;if(key===lastConnectionKey)return;lastConnectionKey=key;setConnection($('#adminConnection'),status,detail);}
function switchAdminTab(name){activeAdminTab=name;document.documentElement.classList.toggle('questions-page-scroll',name==='questions');document.body.classList.toggle('questions-page-scroll',name==='questions');$$('.admin-tab').forEach(btn=>{const on=btn.dataset.tab===name;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on));});$$('.tab-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===name));try{localStorage.setItem('quizAdminTab',name);}catch{}if(name==='presentation'){renderAdminQr();refreshState(false);loadParticipants();}}
function initAdminTabs(){if($('#adminTabs')?.dataset.ready)return;$('#adminTabs').dataset.ready='1';$$('.admin-tab').forEach(btn=>btn.addEventListener('click',()=>switchAdminTab(btn.dataset.tab)));let saved='questions';try{saved=localStorage.getItem('quizAdminTab')||'questions';}catch{}switchAdminTab(['questions','config','presentation'].includes(saved)?saved:'questions');}
function setMobileQuestionPane(name,{scroll=false}={}){const panel=$('#adminPanelQuestions');if(!panel)return;const pane=['edit','bank','import'].includes(name)?name:'edit';panel.dataset.mobilePane=pane;$$('[data-question-mobile-pane]').forEach(btn=>{const on=btn.dataset.questionMobilePane===pane;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));});try{localStorage.setItem('quizMobileQuestionPane',pane);}catch{}if(scroll&&window.matchMedia('(max-width:700px)').matches){panel.querySelector('.question-mobile-nav')?.scrollIntoView({behavior:'smooth',block:'start'});}}
function initMobileQuestionNav(){const nav=document.querySelector('.question-mobile-nav');if(!nav||nav.dataset.ready)return;nav.dataset.ready='1';let pane='edit';try{pane=localStorage.getItem('quizMobileQuestionPane')||'edit';}catch{}$$('[data-question-mobile-pane]').forEach(btn=>btn.addEventListener('click',()=>setMobileQuestionPane(btn.dataset.questionMobilePane,{scroll:true})));setMobileQuestionPane(pane);}
function plannedRounds(){return Math.max(1,Math.min(200,Number($('#plannedRounds').value)||10));}
function phase(){return roomState?.room?.phase||room?.phase||'lobby';}
function roomSettings(){return roomState?.room?.settings||room?.settings||{};}
function canEditQueue(){return !!(room&&phase()==='lobby');}
function queueAtLimit(){const target=Number(roomState?.room?.planned_rounds||room?.planned_rounds||plannedRounds());return !room||queueRows.length>=target;}
function statusLabel(p){return({lobby:'LOBBY',preparing:'3…2…1',question_open:'PERGUNTA ABERTA',paused:'PAUSADO',result:'RESULTADO',finished:'ENCERRADO'})[p]||String(p||'SEM SALA').toUpperCase();}
async function withAction(label,fn){if(actionBusy)return false;actionBusy=true;$$('[data-admin-action],[data-remote-action],#startQuizBtn,#prepareRoundBtn,#openRoundBtn,#closeRoundBtn,#restartQuizBtn,#shuffleQueueBtn,#createRoomBtn,#pauseQuizBtn,#extend5Btn,#extend10Btn,#annulRoundBtn,#regradeRoundBtn').forEach(b=>b.disabled=true);if($('#adminActionStatus'))$('#adminActionStatus').textContent=label;let ok=false;try{await fn();ok=true;}catch(e){alert(e.message||String(e));}finally{actionBusy=false;if($('#adminActionStatus'))$('#adminActionStatus').textContent='';updateControls();renderRemoteControl();}return ok;}

function rememberRoom(){try{if(room?.id)localStorage.setItem('quizAdminRoomId',String(room.id));}catch{}}
function rememberedRoomId(){try{return localStorage.getItem('quizAdminRoomId')||'';}catch{return'';}}
function roomRiskSummary(){const joined=Number(roomState?.participant_count||0),queued=queueRows.length;return{joined,queued,hasWork:joined>0||queued>0||Number(roomState?.used_rounds||0)>0};}

async function authCheck(){const{data:{session}}=await db.auth.getSession();if(!session)return;const{data}=await db.rpc('is_quiz_admin');if(data)await showAdmin();}
async function login(){const box=$('#loginError');box.textContent='';const{error}=await db.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error){box.textContent=error.message;return;}const{data}=await db.rpc('is_quiz_admin');if(!data){box.textContent='Este usuário não está autorizado como administrador.';await db.auth.signOut();return;}await showAdmin();}
async function logout(){await db.auth.signOut();location.reload();}

function remoteDeviceToken(){
  try{
    let token=localStorage.getItem(REMOTE_DEVICE_KEY)||'';
    if(token.length<20){token=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}-${Math.random()}`;localStorage.setItem(REMOTE_DEVICE_KEY,token);}
    return token;
  }catch{return crypto.randomUUID?.()||`${Date.now()}-${Math.random()}-${Math.random()}`;}
}
function remoteUrlParams(){return new URLSearchParams(location.search);}
function remotePairCodeFromUrl(){return (remoteUrlParams().get('remote_pair')||'').trim().toUpperCase();}
function wantsRemoteFromUrl(){return remoteUrlParams().get('remote')==='1';}
function setRemoteUrl({pair=null,remote=null}={}){const u=new URL(location.href);if(pair===null)u.searchParams.delete('remote_pair');else u.searchParams.set('remote_pair',pair);if(remote===null)u.searchParams.delete('remote');else u.searchParams.set('remote',remote?'1':'0');history.replaceState(null,'',u);}
function openRemotePairModal(view='create'){const modal=$('#remotePairModal');if(!modal)return;modal.classList.remove('hidden');$('#remotePairCreateView').classList.toggle('hidden',view!=='create');$('#remoteClaimView').classList.toggle('hidden',view!=='claim');}
function closeRemotePairModal(){$('#remotePairModal')?.classList.add('hidden');}
function defaultRemoteDeviceName(){const ua=navigator.userAgent||'';if(/iPhone/i.test(ua))return'iPhone do apresentador';if(/iPad/i.test(ua))return'iPad do apresentador';if(/Android/i.test(ua))return'Celular Android do apresentador';return'Meu celular';}
async function checkRemoteAuthorization(){
  const token=remoteDeviceToken();
  const{data,error}=await db.rpc('admin_remote_device_status',{p_device_token:token});
  if(error){remoteAuthorized=false;remoteDeviceLabel='';return false;}
  remoteAuthorized=!!data?.authorized;remoteDeviceLabel=data?.device_label||'';
  if(remoteAuthorized&&data?.room&&!room){room=data.room;rememberRoom();await refreshState(true);await subscribe();}
  updateRemoteAvailability();return remoteAuthorized;
}
function updateRemoteAvailability(){
  const activeRoom=!!(room&&phase()!=='finished');
  const btn=$('#remoteModeBtn');if(btn){btn.classList.toggle('hidden',!(remoteAuthorized&&activeRoom));btn.textContent=remoteModeActive?'Controle remoto ativo':'Controle remoto';}
  const pair=$('#pairRemoteBtn');if(pair)pair.disabled=!activeRoom||actionBusy;
  const revoke=$('#revokeRemoteBtn');if(revoke)revoke.disabled=actionBusy;
}
async function initRemoteFeature(){
  await checkRemoteAuthorization();
  const code=remotePairCodeFromUrl();
  if(code&&!remoteAuthorized){$('#remoteClaimCode').textContent=code;$('#remoteDeviceName').value=defaultRemoteDeviceName();$('#remoteClaimStatus').textContent='Entre com a mesma conta ADM usada no computador e confirme este aparelho.';openRemotePairModal('claim');return;}
  if(code&&remoteAuthorized){setRemoteUrl({pair:null,remote:true});}
  if(remoteAuthorized&&wantsRemoteFromUrl()&&room)enterRemoteMode();
}
async function createRemotePairing(){
  if(!room)return alert('Abra ou crie uma sala antes de autorizar o celular.');
  const{data,error}=await db.rpc('admin_create_remote_pairing',{p_room_id:room.id});
  if(error)return alert(error.message);
  const u=new URL('admin.html',location.href);u.search='';u.hash='';u.searchParams.set('remote_pair',data.code);u.searchParams.set('remote','1');
  remotePairLink=u.href;remotePairExpiresAt=Date.parse(data.expires_at||0);$('#remotePairCode').textContent=data.code;$('#remotePairQr').innerHTML='';
  try{window.QuizQR?.render($('#remotePairQr'),remotePairLink);}catch{$('#remotePairQr').textContent=data.code;}
  const mins=Math.max(1,Math.ceil((remotePairExpiresAt-Date.now())/60000));$('#remotePairExpires').textContent=`Válido por aproximadamente ${mins} minuto${mins===1?'':'s'} • Sala ${data.room_code}`;openRemotePairModal('create');
}
async function claimRemotePairing(){
  const code=remotePairCodeFromUrl()||$('#remoteClaimCode').textContent.trim();if(!code)return;
  const status=$('#remoteClaimStatus');status.textContent='Autorizando este aparelho…';$('#remoteClaimBtn').disabled=true;
  const{data,error}=await db.rpc('admin_claim_remote_pairing',{p_code:code,p_device_token:remoteDeviceToken(),p_device_label:$('#remoteDeviceName').value.trim()||defaultRemoteDeviceName()});
  $('#remoteClaimBtn').disabled=false;
  if(error){status.textContent=error.message;status.className='error';return;}
  remoteAuthorized=!!data?.authorized;remoteDeviceLabel=data?.device_label||defaultRemoteDeviceName();status.textContent='Celular autorizado com sucesso.';status.className='success';
  if(data?.room){room={...(room||{}),...data.room};rememberRoom();await refreshState(true);await subscribe();}
  setRemoteUrl({pair:null,remote:true});updateRemoteAvailability();setTimeout(()=>{closeRemotePairModal();enterRemoteMode();},450);
}
async function revokeRemoteDevices(){
  if(!confirm('Revogar todos os celulares autorizados como controle remoto?'))return;
  const{data,error}=await db.rpc('admin_revoke_remote_devices');if(error)return alert(error.message);
  remoteAuthorized=false;remoteDeviceLabel='';if(remoteModeActive)exitRemoteMode();updateRemoteAvailability();alert(`${Number(data)||0} dispositivo(s) revogado(s).`);
}
async function copyRemotePairLink(){if(!remotePairLink)return;try{await navigator.clipboard.writeText(remotePairLink);$('#remotePairExpires').textContent='Link copiado. O código continua válido até expirar.';}catch{prompt('Copie o link:',remotePairLink);}}
function enterRemoteMode(){
  if(!remoteAuthorized)return alert('Este aparelho ainda não foi autorizado como controle remoto.');if(!room)return alert('Nenhuma sala ativa encontrada.');
  remoteModeActive=true;document.body.classList.add('remote-control-active');$('#remoteControlView').classList.remove('hidden');setRemoteUrl({pair:null,remote:true});renderRemoteControl();renderRemoteTimer();
}
function exitRemoteMode(){remoteModeActive=false;document.body.classList.remove('remote-control-active');$('#remoteControlView').classList.add('hidden');setRemoteUrl({pair:null,remote:null});updateRemoteAvailability();}
function remotePrimaryAction(){const p=phase();if(p==='lobby')return startQuiz();if(p==='preparing')return openPreparedRound();if(p==='question_open')return closeRound();if(p==='result')return prepareRound();if(p==='paused')return pauseQuiz();}
function renderRemoteTimer(){
  const el=$('#remoteTimer');if(!el||!remoteModeActive)return;const p=phase(),r=roomState?.round;let text='—',danger=false;
  if(p==='lobby')text='LOBBY';else if(p==='paused')text='II';else if(p==='finished')text='FIM';else if(p==='preparing'){const remain=Math.max(0,serverRemaining(roomState?.room?.prepared_until,serverOffset));text=String(Math.max(1,Math.ceil(remain/1000)));danger=remain<=3000;}else if(r?.status==='open'){const remain=serverRemaining(r.closes_at,serverOffset);text=remain<=0?'0':`${Math.ceil(remain/1000)}s`;danger=remain<=5000;}else if(r?.round_no)text=`R${r.round_no}`;
  el.textContent=text;el.classList.toggle('danger',danger);
}
function renderRemoteControl(){
  updateRemoteAvailability();if(!remoteModeActive)return;
  const p=phase(),r=roomState?.round,total=Number(roomState?.participant_count||0),answers=Number(roomState?.answer_count||0),rate=p==='question_open'&&total?Math.min(100,Math.round(answers*100/total)):0,target=Number(roomState?.room?.planned_rounds||room?.planned_rounds||0),used=Number(roomState?.used_rounds||0),queued=Number(roomState?.queued_count||0);
  $('#remoteRoomTitle').textContent=roomState?.room?.title||room?.title||'Quiz ao vivo';$('#remoteRoomCode').textContent=`Sala ${roomState?.room?.code||room?.code||'------'}`;$('#remotePhaseBadge').textContent=statusLabel(p);$('#remoteRoundLabel').textContent=r?.round_no?`Round ${r.round_no} de ${target}`:`${used} de ${target} rounds`;
  $('#remoteQuestion').textContent=r?.prompt||roomState?.prepared?.prompt||(p==='lobby'?'Lobby aberto. Os jogadores já podem entrar.':p==='paused'?'Partida pausada.':'Aguardando a próxima pergunta.');
  $('#remoteParticipantCount').textContent=total;$('#remoteAnswerCount').textContent=answers;$('#remoteAnswerTotal').textContent=total;$('#remoteResponseRate').textContent=`${rate}%`;$('#remoteResponseBar').style.width=`${rate}%`;$('#remoteDeviceLabel').textContent=remoteDeviceLabel||'Celular autorizado';
  const net=$('#remoteConnectionStatus');net.classList.toggle('online',navigator.onLine&&lastLatency<1500);net.classList.toggle('offline',!navigator.onLine);net.querySelector('strong').textContent=!navigator.onLine?'Sem internet':lastLatency<500?`Online • ${lastLatency} ms`:lastLatency<1500?`Online • ${lastLatency} ms`:`Instável • ${lastLatency} ms`;
  const ds=$('#remoteDisplayStatus');ds.classList.toggle('online',displayOnline);ds.classList.toggle('offline',!displayOnline);ds.querySelector('strong').textContent=displayOnline?'Telão conectado':'Telão não detectado';
  const primary=$('#remotePrimaryBtn');let label='Aguardando',enabled=false;if(p==='lobby'){label=queued>0?'Começar Quiz':'Adicione perguntas';enabled=queued>0;}else if(p==='preparing'){label='Liberar pergunta agora';enabled=true;}else if(p==='question_open'){label='Encerrar e pontuar';enabled=!!r?.status;}else if(p==='result'){label=used<target&&queued>0?'Preparar próximo round':'Aguardando resultado final';enabled=used<target&&queued>0;}else if(p==='paused'){label='Retomar partida';enabled=true;}else if(p==='finished'){label='Quiz encerrado';}
  primary.textContent=label;primary.disabled=actionBusy||!enabled;
  const pause=$('#remotePauseBtn');pause.textContent=p==='paused'?'Retomar partida':'Pausar partida';pause.disabled=actionBusy||['lobby','question_open','finished'].includes(p);
  const canExtend=!actionBusy&&p==='question_open'&&!!r?.accepting_responses;$('#remoteExtend5Btn').disabled=!canExtend;$('#remoteExtend10Btn').disabled=!canExtend;
  const canReveal=!actionBusy&&['result','finished'].includes(p);$('#remoteRevealAnswerBtn').disabled=!canReveal;$('#remoteRevealDistributionBtn').disabled=!canReveal;$('#remoteRevealRankingBtn').disabled=!canReveal;
  $('#remoteAnnulBtn').disabled=actionBusy||!(['result','finished'].includes(p)&&r?.status==='closed'&&!r?.annulled);$('#remoteRestartBtn').disabled=actionBusy||used===0;
  renderRemoteTimer();
}
function bindHoldAction(el,fn){let timer=null;const cancel=()=>{clearTimeout(timer);timer=null;el?.classList.remove('is-holding');};el?.addEventListener('pointerdown',e=>{if(el.disabled)return;e.preventDefault();cancel();el.classList.add('is-holding');timer=setTimeout(()=>{cancel();fn();},1000);});['pointerup','pointercancel','pointerleave'].forEach(ev=>el?.addEventListener(ev,cancel));}
async function showAdmin(){$('#loginView').classList.add('hidden');$('#adminView').classList.remove('hidden');$('#logoutBtn').classList.remove('hidden');initAdminTabs();initMobileQuestionNav();startTimerLoop();await Promise.all([loadQuestions(),loadTemplates()]);await resumeLatestRoom();await initRemoteFeature();}
async function resumeLatestRoom(){let data=null,error=null;const saved=rememberedRoomId();if(saved){const res=await db.rpc('admin_get_room_by_id',{p_room_id:saved});data=res.data;error=res.error;}if(error||!data){const res=await db.rpc('admin_get_latest_room');data=res.data;error=res.error;}if(error||!data){conn(navigator.onLine?'idle':'offline');updateControls();return;}room=data;rememberRoom();$('#plannedRounds').value=room.planned_rounds||10;$('#randomizeQueueToggle').checked=!!room.randomize_queue;$('#roomTitle').value=room.title||'Quiz ao vivo';$('#roomInfo').textContent=`Código: ${room.code}`;$('#roomInfo').classList.add('room-protected');$('#roomProgress').classList.remove('hidden');await Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants(),loadHistory()]);await subscribe();}

async function createRoom(){if(room){const risk=roomRiskSummary();if(risk.hasWork){const carried=risk.queued>0?` As ${risk.queued} pergunta(s) selecionada(s) serão copiadas para a nova sala.`:'';const msg=`A sala atual ${room.code} será encerrada ao criar a nova sala.${carried} Jogadores permanecem vinculados à sala anterior e podem entrar novamente pelo novo PIN.

Deseja continuar?`;if(!confirm(msg))return;}}await withAction('Criando sala…',async()=>{const{data,error}=await db.rpc('admin_create_room_v4',{p_title:$('#roomTitle').value.trim()||'Quiz ao vivo',p_planned_rounds:plannedRounds()});if(error)throw error;const carried=Number(data?.carried_queue_count||0);room=data;rememberRoom();roomState=null;queueRows=[];presenceOnline=null;displayOnline=false;lastAdminQr='';$('#plannedRounds').value=room.planned_rounds||plannedRounds();$('#roomInfo').textContent=`Código: ${room.code}`;$('#roomInfo').classList.add('room-protected');$('#roomProgress').classList.remove('hidden');await Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants()]);await saveRoomSettings(false);await subscribe();if(carried>0&&$('#queueWarning')){$('#queueWarning').textContent=`${carried} pergunta(s) mantida(s) da sala anterior. A nova partida está pronta para usar essa seleção.`;$('#queueWarning').className='queue-warning ready';}});}
async function updatePlannedRounds(){if(!room||phase()!=='lobby')return;await withAction('Salvando quantidade…',async()=>{const prev=Number(roomState?.room?.planned_rounds||room.planned_rounds||10);const{data,error}=await db.rpc('admin_update_planned_rounds',{p_room_id:room.id,p_planned_rounds:plannedRounds()});if(error){$('#plannedRounds').value=prev;throw error;}room.planned_rounds=data;await Promise.all([refreshState(true),loadQueue()]);});}
async function updateRandomizeQueue(){if(!room||phase()!=='lobby')return;const enabled=$('#randomizeQueueToggle').checked;await withAction('Salvando ordem aleatória…',async()=>{const{data,error}=await db.rpc('admin_set_randomize_queue',{p_room_id:room.id,p_enabled:enabled});if(error){$('#randomizeQueueToggle').checked=!enabled;throw error;}room.randomize_queue=!!data;await refreshState(true);});}
async function shuffleQueue(){if(!room||phase()!=='lobby')return;await withAction('Embaralhando…',async()=>{const{error}=await db.rpc('admin_shuffle_queue',{p_room_id:room.id});if(error)throw error;await Promise.all([loadQueue(),refreshState(true),loadAudit()]);});}

function collectQuestionPayload(){
  const type=$('#qType').value,prompt=$('#qPrompt').value.trim();
  let opts=null,cc=null,cn=null;
  if(!prompt)throw new Error('Digite a pergunta.');
  if(type==='choice'){
    opts=['A','B','C','D'].map(k=>({key:k,text:$(`#opt${k}`).value.trim()}));
    if(opts.some(o=>!o.text))throw new Error('Preencha as quatro alternativas.');
    cc=$('#correctChoice').value;
  }else{
    cn=Number($('#correctNumber').value);
    if(!Number.isFinite(cn))throw new Error('Informe o valor correto.');
  }
  return{type,prompt,opts,cc,cn,points:Number($('#points').value)||10,time:Number($('#timeLimit').value)||30,category:$('#qCategory').value.trim()||'Geral',difficulty:$('#qDifficulty').value,scoreEnabled:$('#qScoreEnabled').checked,speedBonus:Number($('#qSpeedBonus').value)||0,tiebreaker:$('#qTiebreaker').checked,presenterNotes:$('#qPresenterNotes').value.trim()};
}
function resetQuestionEditor(clearMessage=true){
  editingQuestionId=null;
  $('#qPrompt').value='';$('#qType').value='choice';['A','B','C','D'].forEach(k=>$(`#opt${k}`).value='');$('#correctChoice').value='A';$('#correctNumber').value='';
  $('#points').value=10;$('#timeLimit').value=30;$('#qCategory').value='Geral';$('#qDifficulty').value='medio';$('#qSpeedBonus').value=0;$('#qTiebreaker').checked=false;$('#qScoreEnabled').checked=true;$('#qPresenterNotes').value='';
  $('#choiceFields').classList.remove('hidden');$('#numericFields').classList.add('hidden');
  $('#editorTitle').textContent='Nova pergunta';$('#editorModeBadge').textContent='CRIANDO';$('#editorModeBadge').classList.remove('editing');$('#cancelQuestionEditBtn').classList.add('hidden');$('#saveQuestionBtn').textContent='Salvar pergunta';
  if(clearMessage)$('#questionMsg').textContent='';
  updateQuestionPreview();
}
function startQuestionEdit(id){
  const q=questionBank.find(x=>String(x.id)===String(id));if(!q)return;
  editingQuestionId=q.id;
  $('#qPrompt').value=q.prompt||'';$('#qType').value=q.question_type||'choice';$('#points').value=q.points||10;$('#timeLimit').value=q.time_limit_seconds||30;$('#qCategory').value=q.category||'Geral';$('#qDifficulty').value=q.difficulty||'medio';$('#qSpeedBonus').value=Number(q.speed_bonus_pct||0);$('#qTiebreaker').checked=!!q.is_tiebreaker;$('#qScoreEnabled').checked=q.score_enabled!==false;$('#qPresenterNotes').value=q.presenter_notes||'';
  if(q.question_type==='choice'){
    const byKey=Object.fromEntries((Array.isArray(q.options)?q.options:[]).map(o=>[String(o.key||'').toUpperCase(),o.text||'']));['A','B','C','D'].forEach(k=>$(`#opt${k}`).value=byKey[k]||'');$('#correctChoice').value=q.correct_choice||'A';$('#choiceFields').classList.remove('hidden');$('#numericFields').classList.add('hidden');
  }else{$('#correctNumber').value=q.correct_number??'';$('#choiceFields').classList.add('hidden');$('#numericFields').classList.remove('hidden');}
  $('#editorTitle').textContent='Editar pergunta';$('#editorModeBadge').textContent='EDITANDO';$('#editorModeBadge').classList.add('editing');$('#cancelQuestionEditBtn').classList.remove('hidden');$('#saveQuestionBtn').textContent='Salvar alterações';$('#questionMsg').textContent='Edição carregada. Filas de rounds já preparadas mantêm o snapshot anterior.';
  updateQuestionPreview();document.querySelector('.question-editor-scroll')?.scrollTo({top:0,behavior:'smooth'});
}
async function saveQuestion(){
  let payload;try{payload=collectQuestionPayload();}catch(e){alert(e.message);return;}
  $('#saveQuestionBtn').disabled=true;$('#editorSavedState').textContent=editingQuestionId?'Salvando alterações…':'Salvando pergunta…';
  try{
    if(editingQuestionId){
      const{error}=await db.rpc('admin_update_question_v3',{p_question_id:editingQuestionId,p_prompt:payload.prompt,p_type:payload.type,p_options:payload.opts,p_correct_choice:payload.cc,p_correct_number:Number.isFinite(payload.cn)?payload.cn:null,p_points:payload.points,p_time_limit:payload.time,p_category:payload.category,p_difficulty:payload.difficulty,p_score_enabled:payload.scoreEnabled,p_speed_bonus_pct:payload.speedBonus,p_is_tiebreaker:payload.tiebreaker,p_presenter_notes:payload.presenterNotes});
      if(error)throw error;$('#questionMsg').textContent='Alterações salvas no banco.';
    }else{
      const{data:id,error}=await db.rpc('admin_create_question_v2',{p_prompt:payload.prompt,p_type:payload.type,p_options:payload.opts,p_correct_choice:payload.cc,p_correct_number:Number.isFinite(payload.cn)?payload.cn:null,p_points:payload.points,p_time_limit:payload.time});if(error)throw error;
      const meta=await db.rpc('admin_update_question_metadata',{p_question_id:id,p_category:payload.category,p_difficulty:payload.difficulty,p_score_enabled:payload.scoreEnabled,p_speed_bonus_pct:payload.speedBonus,p_is_tiebreaker:payload.tiebreaker,p_presenter_notes:payload.presenterNotes});if(meta.error)throw new Error(`Pergunta criada, mas metadados falharam: ${meta.error.message}`);$('#questionMsg').textContent='Pergunta salva no banco.';
    }
    $('#editorSavedState').textContent='Banco sincronizado no Supabase';
    await loadQuestions();resetQuestionEditor(false);
  }catch(e){$('#questionMsg').textContent=e.message||String(e);$('#editorSavedState').textContent='Falha ao salvar';}
  finally{$('#saveQuestionBtn').disabled=false;}
}
function difficultyLabel(value){return({facil:'Fácil',medio:'Médio',dificil:'Difícil',final:'Final'})[value]||'Médio';}
function updateQuestionPreview(){
  const type=$('#qType')?.value||'choice',prompt=$('#qPrompt')?.value.trim()||'Sua pergunta aparecerá aqui.',points=Math.max(1,Number($('#points')?.value)||10),time=Math.max(5,Number($('#timeLimit')?.value)||30),category=$('#qCategory')?.value.trim()||'Geral',difficulty=$('#qDifficulty')?.value||'medio';
  if($('#qPromptCount'))$('#qPromptCount').textContent=String($('#qPrompt')?.value.length||0);if($('#qPresenterNotesCount'))$('#qPresenterNotesCount').textContent=String($('#qPresenterNotes')?.value.length||0);
  $('#previewQuestionType').textContent=type==='choice'?'MÚLTIPLA ESCOLHA':'NÚMERO / MAIS PRÓXIMO';$('#previewMeta').textContent=`${points} pts • ${time}s`;$('#previewQuestionText').textContent=prompt;$('#previewCategory').textContent=category;$('#previewDifficulty').textContent=difficultyLabel(difficulty);
  if(type==='choice'){
    const icons={A:'◆',B:'●',C:'▲',D:'■'};$('#previewAnswers').className='preview-answer-grid';$('#previewAnswers').innerHTML=['A','B','C','D'].map(k=>`<div class="preview-answer preview-${k.toLowerCase()}"><span>${icons[k]} ${k}</span><b>${esc($(`#opt${k}`)?.value.trim()||`Alternativa ${k}`)}</b></div>`).join('');
  }else{$('#previewAnswers').className='preview-answer-grid numeric-preview';$('#previewAnswers').innerHTML='<div class="preview-numeric">Digite um número no celular. O mais próximo vence.</div>';}
  const len=($('#qPrompt')?.value||'').trim().length,filled=type==='choice'?['A','B','C','D'].filter(k=>$(`#opt${k}`)?.value.trim()).length:Number.isFinite(Number($('#correctNumber')?.value))?1:0;
  $('#creatorTip').textContent=!len?'Comece pelo enunciado. Uma frase curta costuma funcionar melhor no telão.':len>180?'O enunciado está longo. Considere reduzir para facilitar a leitura durante o cronômetro.':type==='choice'&&filled<4?'Complete as quatro alternativas para deixar a pergunta pronta.':'Boa estrutura. Revise o gabarito, a pontuação e o tempo antes de salvar.';
}

function normalizeFieldName(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
}
function compactValue(value){return String(value??'').replace(/\s+/g,' ').trim();}
function splitTxtBlocks(text){
  const lines=String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n');
  const blocks=[];let current=[];
  const meaningful=arr=>arr.some(x=>{const t=x.trim();return t&&!/^#/.test(t);});
  const flush=()=>{if(meaningful(current))blocks.push(current);current=[];};
  for(const line of lines){
    if(/^\s*-{3,}\s*$/.test(line)){flush();continue;}
    if(/^\s*(PERGUNTA|QUEST[AÃ]O|QUESTION)\s*:/i.test(line)&&meaningful(current))flush();
    current.push(line);
  }
  flush();return blocks;
}
function parseTxtBlock(lines,index){
  const fields={},options={};let freePrompt='';
  for(const raw of lines){
    const line=raw.trim();if(!line||/^#/.test(line))continue;
    const opt=line.match(/^([ABCD])\s*[\)\].:\-]\s*(.+)$/i);
    if(opt){options[opt[1].toUpperCase()]=compactValue(opt[2]);continue;}
    const field=line.match(/^([^:]{2,40})\s*:\s*(.*)$/);
    if(field){fields[normalizeFieldName(field[1])]=compactValue(field[2]);continue;}
    freePrompt+=(freePrompt?' ':'')+compactValue(line);
  }
  const prompt=fields.PERGUNTA||fields.QUESTAO||fields.QUESTION||freePrompt;
  const rawType=normalizeFieldName(fields.TIPO||'');
  const answer=fields.CORRETA||fields.RESPOSTA||fields.GABARITO||'';
  const hasFour=['A','B','C','D'].every(k=>options[k]);
  const type=rawType.includes('NUM')?'numeric':rawType.includes('ESCOL')||rawType.includes('MULTIP')?'choice':hasFour?'choice':'numeric';
  const points=Number(String(fields.PONTOS||fields.PONTUACAO||'10').replace(',','.'));
  const time=Number(String(fields.TEMPO||fields.SEGUNDOS||'30').replace(',','.'));
  const errors=[];let payload=null;
  if(!prompt)errors.push('Pergunta ausente');
  if(!Number.isInteger(points)||points<1||points>100000)errors.push('Pontos inválidos');
  if(!Number.isInteger(time)||time<5||time>600)errors.push('Tempo inválido');
  if(type==='choice'){
    const correct=String(answer).toUpperCase();
    if(!hasFour)errors.push('Alternativas A–D incompletas');
    if(!['A','B','C','D'].includes(correct))errors.push('Gabarito inválido');
    if(new Set(['A','B','C','D'].map(k=>(options[k]||'').toLocaleLowerCase('pt-BR'))).size!==4)errors.push('Alternativas repetidas');
    if(!errors.length)payload={prompt,question_type:'choice',options:['A','B','C','D'].map(k=>({key:k,text:options[k]})),correct_choice:correct,correct_number:null,points,time_limit_seconds:time};
  }else{
    const numeric=Number(String(answer).replace(',','.'));
    if(!Number.isFinite(numeric))errors.push('Resposta numérica inválida');
    if(!errors.length)payload={prompt,question_type:'numeric',options:null,correct_choice:null,correct_number:numeric,points,time_limit_seconds:time};
  }
  if(payload){
    const yn=v=>['SIM','S','YES','TRUE','1'].includes(normalizeFieldName(v));
    payload.category=fields.CATEGORIA||'Geral';
    payload.difficulty=({'FACIL':'facil','FÁCIL':'facil','MEDIO':'medio','MÉDIO':'medio','DIFICIL':'dificil','DIFÍCIL':'dificil','FINAL':'final'})[normalizeFieldName(fields.DIFICULDADE||'MEDIO')]||'medio';
    payload.score_enabled=fields.PONTUAR===undefined?true:yn(fields.PONTUAR);
    payload.speed_bonus_pct=Math.max(0,Math.min(100,Number(fields.BONUS_VELOCIDADE||fields.BONUS||0)||0));
    payload.is_tiebreaker=yn(fields.DESEMPATE||'NAO');
    payload.presenter_notes=fields.NOTA||fields.NOTAS||fields.APRESENTADOR||'';
    payload.archived=yn(fields.ARQUIVADA||'NAO');
  }
  return{index:index+1,payload,errors,preview:prompt||'(sem pergunta)'};
}
function currentImportMode(){return document.querySelector('input[name="importMode"]:checked')?.value==='replace'?'replace':'append';}
function syncImportModeUi(){
  const mode=currentImportMode();
  document.querySelectorAll('.import-mode-option').forEach(label=>label.classList.toggle('selected',label.querySelector('input')?.checked));
  $('#replaceImportWarning')?.classList.toggle('hidden',mode!=='replace');
  const button=$('#importQuestionsBtn');
  if(button){button.textContent=mode==='replace'?'Substituir banco pelo lote':'Adicionar lote validado';button.classList.toggle('replace-armed',mode==='replace');}
  renderImportPreview();
}
function analyzeBulkText(){
  const text=$('#bulkQuestionText').value;
  if(!text.trim()){parsedImport={questions:[],errors:[],results:[]};renderImportPreview();return;}
  const blocks=splitTxtBlocks(text).slice(0,MAX_IMPORT+1);
  const results=blocks.map(parseTxtBlock);
  parsedImport={
    questions:results.filter(x=>x.payload).slice(0,MAX_IMPORT).map(x=>x.payload),
    errors:[...results.flatMap(x=>x.errors.map(e=>`Pergunta ${x.index}: ${e}`)),...(blocks.length>MAX_IMPORT?[`Limite: ${MAX_IMPORT}`]:[])],
    results:results.slice(0,MAX_IMPORT)
  };
  renderImportPreview();
}
function renderImportPreview(){
  const total=parsedImport.results?.length||0,valid=parsedImport.questions.length,errors=parsedImport.errors.length,mode=currentImportMode();
  const modeText=mode==='replace'?'SUBSTITUIR BANCO':'ADICIONAR';
  $('#importSummary').textContent=total?`${modeText} • ${total} bloco(s) • ${valid} válido(s) • ${errors} erro(s)`:'Cole um texto ou selecione um TXT. Nada será gravado antes da validação.';
  $('#importSummary').className=`import-summary ${errors?'error':valid?'success':'muted'}`;
  const button=$('#importQuestionsBtn');
  button.disabled=total===0;
  button.textContent=errors?`Revisar ${errors} erro${errors===1?'':'s'}`:(mode==='replace'?'Substituir banco pelo lote':'Adicionar lote validado');
  button.classList.toggle('replace-armed',mode==='replace'&&!button.disabled&&!errors);
  button.classList.toggle('import-has-errors',errors>0);
  $('#importPreview').innerHTML=(parsedImport.results||[]).slice(0,40).map(r=>`<div class="import-preview-row ${r.errors.length?'invalid':'valid'}"><b>${r.index}</b><span>${esc(r.preview)}</span><em>${r.errors.length?esc(r.errors.join(' • ')):'Pronta para importar'}</em></div>`).join('');
}
function txtForQuestion(q){
  const lines=[`PERGUNTA: ${compactValue(q.prompt)}`,`TIPO: ${q.question_type==='choice'?'ESCOLHA':'NUMERO'}`];
  if(q.question_type==='choice'){
    for(const k of ['A','B','C','D'])lines.push(`${k}: ${compactValue((q.options||[]).find(o=>o.key===k)?.text||'')}`);
    lines.push(`CORRETA: ${q.correct_choice}`);
  }else lines.push(`CORRETA: ${q.correct_number}`);
  lines.push(`PONTOS: ${q.points}`,`TEMPO: ${q.time_limit_seconds}`,`CATEGORIA: ${compactValue(q.category||'Geral')}`,`DIFICULDADE: ${(q.difficulty||'medio').toUpperCase()}`,`PONTUAR: ${q.score_enabled===false?'NAO':'SIM'}`,`BONUS_VELOCIDADE: ${Number(q.speed_bonus_pct||0)}`,`DESEMPATE: ${q.is_tiebreaker?'SIM':'NAO'}`,`ARQUIVADA: ${q.archived?'SIM':'NAO'}`);
  if(q.presenter_notes)lines.push(`NOTA: ${compactValue(q.presenter_notes)}`);
  lines.push('---');return lines.join('\n');
}
function downloadText(filename,text){
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadTemplate(){
  downloadText('QuizRounds_modelo_v3_29.txt',['# QuizRounds v3.29 — o mesmo formato serve para importar e exportar.','PERGUNTA: Qual é a capital do Brasil?','TIPO: ESCOLHA','A: São Paulo','B: Brasília','C: Salvador','D: Recife','CORRETA: B','PONTOS: 100','TEMPO: 30','CATEGORIA: Geografia','DIFICULDADE: FACIL','PONTUAR: SIM','BONUS_VELOCIDADE: 20','DESEMPATE: NAO','ARQUIVADA: NAO','NOTA: Comentário opcional do apresentador','---','PERGUNTA: Quantos minutos existem em 2 horas?','TIPO: NUMERO','CORRETA: 120','PONTOS: 50','TEMPO: 20','CATEGORIA: Matemática','DIFICULDADE: FACIL','PONTUAR: SIM','---'].join('\n'));
}
async function getExportableQuestionBank(){
  const{data,error}=await db.rpc('admin_list_question_bank',{p_scope:'all'});
  if(error)throw error;
  return data||[];
}
async function exportQuestionBank(filename){
  const rows=await getExportableQuestionBank();
  const header=['# QuizRounds v3.29 — banco completo de perguntas.','# Inclui respostas corretas, pontuação, tempo e metadados.','# Este arquivo pode ser importado novamente em modo ADICIONAR ou SUBSTITUIR.',''].join('\n');
  downloadText(filename,header+rows.map(txtForQuestion).join('\n'));
  return rows.length;
}
async function exportQuestions(){
  try{const count=await exportQuestionBank(`QuizRounds_banco_perguntas_${new Date().toISOString().slice(0,10)}.txt`);$('#importSummary').textContent=`Backup/exportação concluída: ${count} pergunta(s).`;}catch(e){alert(e.message||String(e));}
}
async function importBulkQuestions(){
  analyzeBulkText();
  const button=$('#importQuestionsBtn');
  if(parsedImport.errors.length){
    const first=parsedImport.errors.slice(0,3).join(' • ');
    $('#importSummary').textContent=`Importação não iniciada: ${parsedImport.errors.length} erro(s). ${first}`;
    $('#importSummary').className='import-summary error';
    $('#importPreview').querySelector('.invalid')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    button.textContent=`Revisar ${parsedImport.errors.length} erro${parsedImport.errors.length===1?'':'s'}`;
    return;
  }
  if(!parsedImport.questions.length){
    $('#importSummary').textContent='Nenhuma pergunta válida encontrada para importar.';
    $('#importSummary').className='import-summary error';
    return;
  }
  const mode=currentImportMode();
  if(mode==='replace'){
    const typed=prompt(`ATENÇÃO: o banco atual será substituído por ${parsedImport.questions.length} pergunta(s).\n\nDigite SUBSTITUIR para confirmar.`,'');
    if(typed!=='SUBSTITUIR'){ $('#importSummary').textContent='Substituição cancelada. Nenhuma alteração foi feita.'; return; }
    if($('#backupBeforeReplace')?.checked){
      try{await exportQuestionBank(`QuizRounds_backup_antes_substituir_${new Date().toISOString().replace(/[:.]/g,'-')}.txt`);}catch(e){alert(`Não foi possível gerar o backup: ${e.message||e}`);return;}
    }
  }
  button.disabled=true;button.textContent=mode==='replace'?'Substituindo…':'Importando…';
  try{
    const{data,error}=await db.rpc('admin_import_questions_v2',{p_questions:parsedImport.questions,p_mode:mode});
    if(error)throw error;
    const imported=Number(data?.imported||parsedImport.questions.length),replaced=Number(data?.replaced||0);
    $('#importSummary').textContent=mode==='replace'?`Banco substituído com segurança: ${replaced} pergunta(s) anterior(es) removida(s) da operação e ${imported} nova(s) importada(s).`:`${imported} pergunta(s) adicionada(s) ao banco.`;
    $('#importSummary').className='import-summary success';
    $('#bulkQuestionText').value='';parsedImport={questions:[],errors:[],results:[]};$('#importPreview').innerHTML='';
    await loadQuestions();
  }catch(e){
    $('#importSummary').textContent=`Importação cancelada sem alterações parciais: ${e.message||String(e)}`;
    $('#importSummary').className='import-summary error';
  }finally{
    const modeNow=currentImportMode();
    button.textContent=parsedImport.errors.length?`Revisar ${parsedImport.errors.length} erro${parsedImport.errors.length===1?'':'s'}`:(modeNow==='replace'?'Substituir banco pelo lote':'Adicionar lote validado');
    button.disabled=(parsedImport.results?.length||0)===0;
    button.classList.toggle('replace-armed',modeNow==='replace'&&!button.disabled&&!parsedImport.errors.length);
    button.classList.toggle('import-has-errors',parsedImport.errors.length>0);
  }
}
async function readTxtFile(file){
  if(!file)return;
  if(file.size>2*1024*1024)return alert('TXT máximo: 2 MB.');
  try{
    $('#bulkQuestionText').value=(await file.text()).replace(/^\uFEFF/,'');
    analyzeBulkText();
    if(!parsedImport.errors.length&&parsedImport.questions.length){
      $('#importSummary').textContent=`${file.name} • ${parsedImport.questions.length} pergunta(s) válidas • pronto para importar.`;
      $('#importSummary').className='import-summary success';
    }
  }catch(e){
    $('#importSummary').textContent=`Não foi possível ler o TXT: ${e.message||String(e)}`;
    $('#importSummary').className='import-summary error';
  }
}

function questionMatches(q){
  const term=($('#questionSearch')?.value||'').trim().toLowerCase(),cat=$('#questionCategoryFilter')?.value||'',dif=$('#questionDifficultyFilter')?.value||'',usage=$('#questionUsageFilter')?.value||'';
  if(term&&!`${q.prompt} ${q.category||''}`.toLowerCase().includes(term))return false;if(cat&&q.category!==cat)return false;if(dif&&q.difficulty!==dif)return false;if(usage==='unused'&&Number(q.use_count||0)>0)return false;if(usage==='recent'&&!q.last_used_at)return false;
  if(activeBankQuick==='choice'&&q.question_type!=='choice')return false;if(activeBankQuick==='numeric'&&q.question_type!=='numeric')return false;if(activeBankQuick==='unused'&&Number(q.use_count||0)>0)return false;if(activeBankQuick==='tiebreaker'&&!q.is_tiebreaker)return false;if(activeBankQuick==='unscored'&&q.score_enabled!==false)return false;if(activeBankQuick==='final'&&q.difficulty!=='final')return false;
  return true;
}
function sortQuestionRows(rows){
  const mode=$('#questionSort')?.value||'newest',difficultyOrder={facil:1,medio:2,dificil:3,final:4};
  return [...rows].sort((a,b)=>{if(mode==='prompt')return String(a.prompt||'').localeCompare(String(b.prompt||''),'pt-BR');if(mode==='category')return String(a.category||'').localeCompare(String(b.category||''),'pt-BR')||String(a.prompt||'').localeCompare(String(b.prompt||''),'pt-BR');if(mode==='difficulty')return (difficultyOrder[a.difficulty]||9)-(difficultyOrder[b.difficulty]||9)||String(a.prompt||'').localeCompare(String(b.prompt||''),'pt-BR');if(mode==='points_desc')return Number(b.points||0)-Number(a.points||0);if(mode==='used_desc')return Number(b.use_count||0)-Number(a.use_count||0);return new Date(b.created_at||0)-new Date(a.created_at||0);});
}
function refreshCategoryFilter(){const sel=$('#questionCategoryFilter');if(!sel)return;const current=sel.value,cats=[...new Set(questionBank.map(q=>q.category||'Geral'))].sort((a,b)=>a.localeCompare(b,'pt-BR'));sel.innerHTML='<option value="">Todas categorias</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join('');sel.value=cats.includes(current)?current:'';}
function refreshCategoryQuickFilters(){
  const host=$('#categoryQuickFilters');if(!host)return;const current=$('#questionCategoryFilter')?.value||'',cats=[...new Set(questionBank.map(q=>q.category||'Geral'))].sort((a,b)=>a.localeCompare(b,'pt-BR')).slice(0,18);host.innerHTML=cats.map(c=>`<button type="button" class="category-chip ${current===c?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join('')||'<span class="muted compact">Categorias aparecem aqui quando o banco tiver perguntas.</span>';host.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>{const sel=$('#questionCategoryFilter');sel.value=sel.value===btn.dataset.category?'':btn.dataset.category;renderQuestionBank();}));
}
function updateQuestionBankSummary(rows){
  const choices=rows.filter(q=>q.question_type==='choice').length,numerics=rows.filter(q=>q.question_type==='numeric').length,scored=rows.filter(q=>q.score_enabled!==false),avg=scored.length?Math.round(scored.reduce((sum,q)=>sum+Number(q.points||0),0)/scored.length):0;
  if($('#bankVisibleCount'))$('#bankVisibleCount').textContent=String(rows.length);if($('#bankChoiceCount'))$('#bankChoiceCount').textContent=String(choices);if($('#bankNumericCount'))$('#bankNumericCount').textContent=String(numerics);if($('#bankPointsAverage'))$('#bankPointsAverage').textContent=String(avg);if($('#bankResultBadge'))$('#bankResultBadge').textContent=`${rows.length} ${rows.length===1?'ITEM':'ITENS'}`;
}
function updateSelectionToolbar(){
  const count=selectedQuestionIds.size;if($('#selectedQuestionCount'))$('#selectedQuestionCount').textContent=`${count} ${count===1?'selecionada':'selecionadas'}`;['#clearQuestionSelectionBtn','#queueSelectedQuestionsBtn','#archiveSelectedQuestionsBtn','#restoreSelectedQuestionsBtn'].forEach(id=>{if($(id))$(id).disabled=count===0;});
}
function renderQuestionBank(){
  const canQueue=canEditQueue()&&!queueAtLimit();visibleQuestionRows=sortQuestionRows(questionBank.filter(questionMatches));selectedQuestionIds=new Set([...selectedQuestionIds].filter(id=>questionBank.some(q=>String(q.id)===String(id))));updateQuestionBankSummary(visibleQuestionRows);refreshCategoryQuickFilters();updateSelectionToolbar();
  $('#questionList').innerHTML=visibleQuestionRows.map(q=>{const archived=!!q.archived,queued=queueRows.some(x=>x.question_id===q.id),recentBlocked=recentQuestionIds.has(q.id)&&Number(roomSettings().avoid_recent_games||0)>0,disabled=!canQueue||archived||queued||recentBlocked,selected=selectedQuestionIds.has(String(q.id)),typeLabel=q.question_type==='choice'?'Escolha':'Número';return `<div class="question-item ${archived?'archived':''} ${selected?'selected':''}" data-id="${q.id}"><label class="question-select" title="Selecionar"><input type="checkbox" data-act="select" ${selected?'checked':''}></label><div class="question-card-main"><div class="question-card-top"><strong>${esc(q.prompt)}</strong><div class="question-card-tags"><span class="qtag ${q.question_type}">${typeLabel}</span><span class="qtag ${q.difficulty==='final'?'final':''}">${esc(difficultyLabel(q.difficulty))}</span>${q.is_tiebreaker?'<span class="qtag tiebreaker">DESEMPATE</span>':''}</div></div><div class="question-card-meta"><span>${esc(q.category||'Geral')}</span><span>${q.score_enabled===false?'Sem pontos':`${q.points} pts`}</span><span>${q.time_limit_seconds}s</span>${q.speed_bonus_pct?`<span>+${q.speed_bonus_pct}% velocidade</span>`:''}<span>${q.use_count?`Usada ${q.use_count}x`:'Nunca usada'}</span>${recentBlocked?'<span>Recente</span>':''}</div><div class="question-card-actions"><button class="queue-question" data-act="queue" ${disabled?'disabled':''}>${queued?'Já escolhida':archived?'Arquivada':recentBlocked?'Usada recentemente':'＋ Sala'}</button><button class="edit-question" data-act="edit">Editar</button><button class="ghost" data-act="duplicate">Duplicar</button><button class="ghost archive-question" data-act="archive">${archived?'Restaurar':'Arquivar'}</button></div></div></div>`;}).join('')||'<div class="empty">Nenhuma pergunta corresponde aos filtros atuais.</div>';
  $$('#questionList .question-item').forEach(el=>{const id=el.dataset.id,q=questionBank.find(x=>String(x.id)===String(id));el.querySelector('[data-act="select"]')?.addEventListener('change',e=>{if(e.target.checked)selectedQuestionIds.add(id);else selectedQuestionIds.delete(id);el.classList.toggle('selected',e.target.checked);updateSelectionToolbar();});el.querySelector('[data-act="queue"]')?.addEventListener('click',()=>queueQuestion(id));el.querySelector('[data-act="edit"]')?.addEventListener('click',()=>startQuestionEdit(id));el.querySelector('[data-act="duplicate"]')?.addEventListener('click',()=>duplicateQuestion(id));el.querySelector('[data-act="archive"]')?.addEventListener('click',()=>setArchived(id,!q?.archived));});
}
function clearQuestionFilters(){
  $('#questionSearch').value='';$('#questionCategoryFilter').value='';$('#questionDifficultyFilter').value='';$('#questionUsageFilter').value='';$('#questionSort').value='newest';activeBankQuick='all';$$('[data-bank-quick]').forEach(btn=>btn.classList.toggle('active',btn.dataset.bankQuick==='all'));renderQuestionBank();
}
function setBankQuickFilter(value){activeBankQuick=value||'all';$$('[data-bank-quick]').forEach(btn=>btn.classList.toggle('active',btn.dataset.bankQuick===activeBankQuick));renderQuestionBank();}
async function bulkSetArchived(archived){
  const ids=[...selectedQuestionIds];if(!ids.length)return;if(archived&&!confirm(`Arquivar ${ids.length} pergunta(s) selecionada(s)?`))return;
  for(const id of ids){const{error}=await db.rpc('admin_set_question_archived',{p_question_id:id,p_archived:archived});if(error){alert(error.message);break;}}
  selectedQuestionIds.clear();await loadQuestions();
}
async function bulkQueueSelected(){
  if(!room)return alert('Crie uma sala primeiro.');if(!canEditQueue())return alert('A fila fica bloqueada depois do início.');let available=Math.max(0,Number(roomState?.room?.planned_rounds||room.planned_rounds||plannedRounds())-queueRows.length),added=0;
  for(const id of [...selectedQuestionIds]){if(available<=0)break;const q=questionBank.find(x=>String(x.id)===String(id));if(!q||q.archived||queueRows.some(x=>String(x.question_id)===String(id))||recentQuestionIds.has(q.id)&&Number(roomSettings().avoid_recent_games||0)>0)continue;const{error}=await db.rpc('admin_queue_question',{p_room_id:room.id,p_question_id:id});if(!error){added++;available--;}}
  selectedQuestionIds.clear();await Promise.all([loadQueue(),refreshState(true)]);renderQuestionBank();if(!added)alert('Nenhuma pergunta selecionada pôde ser adicionada à sala.');
}

async function loadQuestions(){const{data,error}=await db.rpc('admin_list_question_bank',{p_scope:$('#questionScope')?.value||'active'});if(error){$('#questionList').textContent=error.message;return;}questionBank=data||[];await loadRecentQuestionIds();refreshCategoryFilter();renderQuestionBank();}
async function loadRecentQuestionIds(){recentQuestionIds=new Set();if(!room)return;const n=Math.max(0,Number(roomSettings().avoid_recent_games||$('#avoidRecentGames')?.value||0));if(!n)return;const{data}=await db.rpc('admin_recent_question_ids',{p_room_id:room.id,p_games:n});recentQuestionIds=new Set((data||[]).map(String));}
async function duplicateQuestion(id){const{error}=await db.rpc('admin_duplicate_question',{p_question_id:id});if(error)return alert(error.message);await loadQuestions();}
async function setArchived(id,archived){const{error}=await db.rpc('admin_set_question_archived',{p_question_id:id,p_archived:archived});if(error)return alert(error.message);await loadQuestions();}
async function queueQuestion(id){if(!room)return alert('Crie uma sala primeiro.');if(!canEditQueue())return alert('Fila bloqueada após o início.');if(queueAtLimit())return alert('Quantidade de rounds já completa.');const{error}=await db.rpc('admin_queue_question',{p_room_id:room.id,p_question_id:id});if(error)return alert(error.message);await Promise.all([loadQueue(),refreshState(true)]);renderQuestionBank();}
async function loadQueue(){if(!room){queueRows=[];$('#roundQueue').innerHTML='<div class="empty">Crie uma sala para montar os rounds.</div>';return;}const{data,error}=await db.rpc('admin_list_room_queue',{p_room_id:room.id});if(error){$('#roundQueue').textContent=error.message;return;}queueRows=data||[];const target=Number(roomState?.room?.planned_rounds||room.planned_rounds||plannedRounds()),locked=!canEditQueue();$('#queueCount').textContent=`${queueRows.length} / ${target}`;$('#queueWarning').textContent=locked?'Fila bloqueada durante a partida.':queueRows.length<1?'Adicione pelo menos 1 pergunta para liberar o início.':queueRows.length<target?`${queueRows.length} de ${target} planejadas • faltam ${target-queueRows.length}, mas você já pode iniciar com a seleção atual.`:'Fila completa. Você pode embaralhar ou iniciar.';$('#queueWarning').className=`queue-warning ${queueRows.length>0?'ready':''}`;$('#roundQueue').innerHTML=queueRows.map((q,i)=>`<div class="question-item queue-item ${q.status==='used'?'used':''}" draggable="${!locked&&q.status==='queued'}" data-id="${q.id}"><div class="queue-pos">${q.status==='used'?'✓':q.position}</div><div><strong>${esc(q.prompt)}</strong><div class="question-meta">${esc(q.category||'Geral')} • ${esc(q.difficulty||'medio')} • ${q.score_enabled===false?'sem pontos':`${q.points} pts`} • ${q.time_limit_seconds}s${q.is_tiebreaker?' • desempate':''}</div></div><div class="item-actions">${!locked&&q.status==='queued'?`<button class="ghost small" data-act="up" ${i===0?'disabled':''}>↑</button><button class="ghost small" data-act="down" ${i===queueRows.length-1?'disabled':''}>↓</button><button class="warn small" data-act="remove">Remover</button>`:''}</div></div>`).join('')||'<div class="empty">Nenhuma pergunta escolhida.</div>';let dragId=null;$$('#roundQueue .queue-item').forEach(el=>{el.querySelector('[data-act="up"]')?.addEventListener('click',()=>moveQueue(el.dataset.id,-1));el.querySelector('[data-act="down"]')?.addEventListener('click',()=>moveQueue(el.dataset.id,1));el.querySelector('[data-act="remove"]')?.addEventListener('click',()=>removeQueue(el.dataset.id));el.addEventListener('dragstart',()=>{dragId=el.dataset.id;el.classList.add('dragging');});el.addEventListener('dragend',()=>el.classList.remove('dragging'));el.addEventListener('dragover',e=>{if(dragId&&dragId!==el.dataset.id)e.preventDefault();});el.addEventListener('drop',async e=>{e.preventDefault();if(!dragId||dragId===el.dataset.id)return;const from=queueRows.findIndex(x=>x.id===dragId),to=queueRows.findIndex(x=>x.id===el.dataset.id),dir=to>from?1:-1;for(let i=0;i<Math.abs(to-from);i++)await moveQueue(dragId,dir,false);await loadQueue();dragId=null;});});updateControls();renderQuestionBank();}
async function moveQueue(id,direction,reload=true){const{error}=await db.rpc('admin_move_queue_item',{p_room_id:room.id,p_queue_id:id,p_direction:direction});if(error)return alert(error.message);if(reload)await loadQueue();}
async function removeQueue(id){const{error}=await db.rpc('admin_remove_queue_item',{p_room_id:room.id,p_queue_id:id});if(error)return alert(error.message);await Promise.all([loadQueue(),refreshState(true)]);}

function parseQualificationSchedule(raw){return String(raw||'').split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const[a,b]=x.split(':').map(Number);return Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>0?{round:Math.round(a),top:Math.round(b)}:null;}).filter(Boolean).sort((a,b)=>a.round-b.round).slice(0,20);}
function currentQualifyTop(){const s=roomSettings(),base=Math.max(1,Number(s.qualify_top||5)),roundNo=Number(roomState?.round?.round_no||roomState?.used_rounds||0),schedule=Array.isArray(s.qualification_schedule)?s.qualification_schedule:[];let cut=base;for(const x of schedule){if(roundNo>=Number(x.round||0))cut=Math.max(1,Number(x.top||cut));}return cut;}
function getSettingsPatch(){return{classification_enabled:$('#classificationEnabled').checked,qualify_top:Math.max(1,Number($('#qualifyTop').value)||5),qualification_schedule:parseQualificationSchedule($('#qualificationSchedule').value),late_join_policy:$('#lateJoinPolicy').value,late_join_until_round:Math.max(1,Number($('#lateJoinUntil').value)||3),auto_close_all_answered:$('#autoCloseAll').checked,speed_bonus_enabled:$('#speedBonusEnabled').checked,streak_enabled:$('#streakEnabled').checked,streak_bonus:Math.max(0,Number($('#streakBonus').value)||0),avoid_recent_games:Math.max(0,Number($('#avoidRecentGames').value)||0),theme:$('#themePreset').value,logo_url:$('#logoUrl').value.trim(),sound_enabled:$('#soundEnabled').checked,allow_duplicate_names:$('#allowDuplicateNames').checked,banned_words:$('#bannedWords').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,100),is_rehearsal:$('#rehearsalMode').checked};}
function fillSettings(){const s=roomSettings();$('#classificationEnabled').checked=!!s.classification_enabled;$('#qualifyTop').value=s.qualify_top||5;$('#qualificationSchedule').value=Array.isArray(s.qualification_schedule)?s.qualification_schedule.map(x=>`${x.round}:${x.top}`).join(', '):'';$('#lateJoinPolicy').value=s.late_join_policy||'allow_zero';$('#lateJoinUntil').value=s.late_join_until_round||3;$('#autoCloseAll').checked=!!s.auto_close_all_answered;$('#speedBonusEnabled').checked=s.speed_bonus_enabled!==false;$('#streakEnabled').checked=s.streak_enabled!==false;$('#streakBonus').value=s.streak_bonus||0;$('#avoidRecentGames').value=s.avoid_recent_games||0;$('#themePreset').value=roomState?.room?.theme||s.theme||'violet';$('#logoUrl').value=roomState?.room?.logo_url||'';$('#soundEnabled').checked=s.sound_enabled!==false;$('#allowDuplicateNames').checked=!!s.allow_duplicate_names;$('#bannedWords').value=Array.isArray(s.banned_words)?s.banned_words.join(', '):'';$('#rehearsalMode').checked=!!roomState?.room?.is_rehearsal;}
async function saveRoomSettings(show=true){if(!room){if(show)alert('Crie a sala primeiro.');return false;}const{data,error}=await db.rpc('admin_update_room_settings',{p_room_id:room.id,p_patch:getSettingsPatch()});if(error){if(show){alert(error.message);return false;}throw error;}room=data;rememberRoom();await refreshState(true);await loadRecentQuestionIds();renderQuestionBank();if(show)alert('Configurações salvas.');return true;}
async function saveTemplate(){if(!room)return alert('Crie uma sala.');const name=prompt('Nome do modelo de partida:',`${room.title} — modelo`);if(!name)return;const{error}=await db.rpc('admin_save_template',{p_room_id:room.id,p_name:name});if(error)return alert(error.message);await loadTemplates();alert('Modelo salvo.');}
async function loadTemplates(){const sel=$('#templateSelect');if(!sel)return;const{data,error}=await db.rpc('admin_list_templates');if(error)return;const rows=data||[],current=sel.value;sel.innerHTML='<option value="">Selecione um modelo...</option>'+rows.map(t=>`<option value="${t.id}">${esc(t.name)} • ${t.question_count} perguntas</option>`).join('');if(rows.some(t=>t.id===current))sel.value=current;}
async function useTemplate(){const id=$('#templateSelect').value;if(!id)return alert('Selecione um modelo.');await withAction('Criando sala do modelo…',async()=>{const{data,error}=await db.rpc('admin_create_from_template',{p_template_id:id,p_title:null});if(error)throw error;room=data;rememberRoom();roomState=null;queueRows=[];presenceOnline=null;displayOnline=false;lastAdminQr='';$('#plannedRounds').value=room.planned_rounds||10;await Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants(),loadQuestions()]);await subscribe();switchAdminTab('config');});}
async function duplicateRoom(){if(!room)return alert('Crie ou abra uma sala.');const title=prompt('Nome da cópia:',`${room.title} — cópia`);if(!title)return;await withAction('Duplicando sala…',async()=>{const{data,error}=await db.rpc('admin_duplicate_room',{p_room_id:room.id,p_title:title});if(error)throw error;room=data;rememberRoom();roomState=null;queueRows=[];presenceOnline=null;displayOnline=false;lastAdminQr='';$('#plannedRounds').value=room.planned_rounds||10;await Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants(),loadQuestions()]);await subscribe();switchAdminTab('config');});}

async function startQuiz(){if(!room)return alert('Crie ou abra uma sala primeiro.');if(phase()!=='lobby')return alert('O quiz só pode ser iniciado enquanto a sala está no lobby.');await Promise.all([refreshState(true),loadQueue()]);const queued=queueRows.length;if(queued<1)return alert('Adicione pelo menos 1 pergunta à sala antes de começar.');const saved=await withAction('Validando configurações…',async()=>{await saveRoomSettings(false);});if(!saved)return;await withAction(`Preparando ${queued} pergunta${queued===1?'':'s'}…`,async()=>{const{error}=await db.rpc('admin_start_quiz',{p_room_id:room.id});if(error)throw error;await Promise.all([refreshState(true),loadQueue(),loadAudit()]);$('#plannedRounds').value=Number(roomState?.room?.planned_rounds||queued);});}
async function prepareRound(){if(!room)return;await withAction('Preparando próximo round…',async()=>{const{error}=await db.rpc('admin_prepare_next_round',{p_room_id:room.id});if(error)throw error;await refreshState(true);});}
async function openPreparedRound(){if(!room)return;await withAction('Liberando pergunta…',async()=>{const{error}=await db.rpc('admin_open_prepared_round',{p_room_id:room.id});if(error)throw error;await Promise.all([refreshState(true),loadQueue(),loadAudit()]);});}
async function closeRound(){if(!room)return;await withAction('Encerrando e pontuando…',async()=>{const{data,error}=await db.rpc('admin_close_and_score_round',{p_room_id:room.id});if(error)throw error;await Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants(),loadHistory()]);if(data?.finished)$('#roundHint').textContent='Último round encerrado. Use as etapas de revelação para apresentar o resultado final.';});}
async function pauseQuiz(){if(!room)return;const isPaused=phase()==='paused';await withAction(isPaused?'Retomando…':'Pausando…',async()=>{const{error}=await db.rpc('admin_pause_quiz',{p_room_id:room.id,p_pause:!isPaused});if(error)throw error;await refreshState(true);});}
async function extendRound(sec){if(!room)return;const{error}=await db.rpc('admin_extend_round',{p_room_id:room.id,p_seconds:sec});if(error)return alert(error.message);await refreshState(true);}
async function annulRound(){if(!room||!confirm('Anular o último round? Os pontos dele serão removidos do ranking.'))return;const{error}=await db.rpc('admin_annul_round',{p_room_id:room.id});if(error)return alert(error.message);await Promise.all([refreshState(true),loadHistory()]);}
async function regradeRound(){const r=roomState?.round;if(!r)return;if(!confirm('Corrigir o gabarito do último round e recalcular o ranking?'))return;let choice=null,num=null;if(r.question_type==='choice'){choice=prompt('Nova alternativa correta (A, B, C ou D):',r.correct_choice||'A');if(!choice)return;choice=choice.trim().toUpperCase();}else{const raw=prompt('Novo valor correto:',r.correct_number??'');if(raw===null)return;num=Number(raw.replace(',','.'));if(!Number.isFinite(num))return alert('Número inválido.');}const{error}=await db.rpc('admin_regrade_round',{p_room_id:room.id,p_correct_choice:choice,p_correct_number:num});if(error)return alert(error.message);await Promise.all([refreshState(true),loadHistory()]);}
async function reveal(stage){if(!room)return;const{error}=await db.rpc('admin_set_reveal_stage',{p_room_id:room.id,p_stage:stage});if(error)return alert(error.message);await refreshState(true);}
async function restartQuiz(){if(!room||!confirm('Recomeçar do Round 1? Respostas, pontos e ranking serão zerados; jogadores permanecem.'))return;await withAction('Recomeçando…',async()=>{const{error}=await db.rpc('admin_restart_quiz',{p_room_id:room.id});if(error)throw error;await Promise.all([refreshState(true),loadQueue(),loadHistory()]);});}

function renderAdminQr(){const codeEl=$('#adminLobbyCode'),urlEl=$('#adminJoinUrl'),qrEl=$('#adminQr');if(!codeEl||!urlEl||!qrEl)return;if(!room){codeEl.textContent='------';urlEl.textContent='Crie uma sala para gerar o link';qrEl.innerHTML='<div class="qr-placeholder">QR</div>';lastAdminQr='';return;}codeEl.textContent=room.code;const value=joinUrl();try{const u=new URL(value);urlEl.textContent=`${u.host}${u.pathname}?code=${room.code}`;}catch{urlEl.textContent=value;}if(value===lastAdminQr)return;qrEl.innerHTML='';try{window.QuizQR?.render(qrEl,value);lastAdminQr=value;}catch{qrEl.textContent='QR indisponível';}}
function joinUrl(){if(!room)return'';const url=new URL('index.html',location.href);url.search='';url.hash='';url.searchParams.set('code',room.code);return url.href;}
async function copyJoinLink(){if(!room)return;const text=joinUrl();try{await navigator.clipboard.writeText(text);$('#joinLinkStatus').textContent='Link copiado.';}catch{$('#joinLinkStatus').textContent=text;}}
function openDisplay(mode='reuse'){if(!room)return;const url=`display.html?code=${encodeURIComponent(room.code)}`;if(mode==='window'){const width=Math.max(1100,Math.floor((window.screen?.availWidth||1600)*.92)),height=Math.max(720,Math.floor((window.screen?.availHeight||900)*.92)),left=Math.max(0,Math.floor(((window.screen?.availWidth||width)-width)/2)),top=Math.max(0,Math.floor(((window.screen?.availHeight||height)-height)/2));displayWindowRef=window.open(url,'quiz_display_popup',`popup=yes,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`);if(displayWindowRef){try{displayWindowRef.focus();}catch{}}else window.open(url,'_blank');return;}if(displayWindowRef&&!displayWindowRef.closed){try{displayWindowRef.location.href=url;displayWindowRef.focus();return;}catch{}}const opened=window.open(url,'quiz_display');if(opened){displayWindowRef=opened;try{opened.focus();}catch{}}else window.open(url,'_blank');}

function updatePresentationStage(){const p=room?phase():'lobby',stage=p==='lobby'?'lobby':p==='question_open'||p==='preparing'?'question':'result',badge=$('#presentationStageBadge');if(badge){badge.textContent=statusLabel(p);badge.className=`live-stage-badge stage-${stage}`;}$$('.presentation-stepper [data-stage]').forEach(el=>el.classList.toggle('active',el.dataset.stage===stage));const title=$('#presentationStageTitle'),hint=$('#presentationStageHint');if(!title)return;if(!room){title.textContent='Crie uma sala';hint.textContent='Configure a partida para gerar PIN e QR Code.';}else if(p==='lobby'){const joined=Number(roomState?.participant_count||0);title.textContent='Lobby aberto';hint.textContent=joined<1?'Você já pode iniciar se houver perguntas; participantes podem entrar depois.':'Pronto para iniciar com as perguntas selecionadas.';}else if(p==='preparing'){title.textContent='Prepare-se';hint.textContent='Contagem regressiva 3…2…1 sincronizada.';}else if(p==='question_open'){title.textContent='Pergunta no ar';hint.textContent='Acompanhe respostas; você pode estender +5/+10 s antes do prazo.';}else if(p==='paused'){title.textContent='Partida pausada';hint.textContent='Os jogadores permanecem conectados.';}else if(p==='result'){title.textContent='Resultado do round';hint.textContent='Revele resposta, distribuição e ranking em etapas.';}else{title.textContent='Final';hint.textContent='Mostre campeão, pódio e relatório.';}}
function updateLiveStats(data){const total=Number(data?.participant_count||0),active=Number(presenceOnline??data?.active_count??0),answers=Number(data?.answer_count||0),open=data?.room?.phase==='question_open',pending=open?Math.max(0,total-answers):0,rate=open&&total?Math.min(100,Math.round(answers*100/total)):0;$('#participantCount').textContent=total;$('#activeCount').textContent=active;$('#answerCount').textContent=answers;$('#pendingCount').textContent=pending;$('#responseRate').textContent=`${rate}%`;$('#adminResponseBar').style.width=`${rate}%`;if(open&&roomSettings().auto_close_all_answered&&total>0&&answers>=total&&!autoClosing){autoClosing=true;closeRound().finally(()=>autoClosing=false);}}
function renderPresenter(){const r=roomState?.round,p=roomState?.prepared,box=$('#presenterPrivate'),preview=$('#nextPreview');if(r&&['question_open','result','finished'].includes(phase())){box.classList.remove('hidden');const answer=r.question_type==='choice'?`${r.correct_choice||'—'}`:`${r.correct_number??'—'}`;$('#presenterAnswer').textContent=`Gabarito: ${answer}`;$('#presenterNotes').textContent=r.presenter_notes||'';}else box.classList.add('hidden');if(p){preview.classList.remove('hidden');$('#nextPreviewPrompt').textContent=p.prompt;$('#nextPreviewMeta').textContent=`${p.category||'Geral'} • ${p.difficulty||'medio'} • ${p.points||0} pts`;if(p.presenter_notes){box.classList.remove('hidden');$('#presenterNotes').textContent=p.presenter_notes;}}else preview.classList.add('hidden');}
function renderRankingMovers(){const rows=(roomState?.round?.movers||[]).filter(x=>x.change).slice(0,6),el=$('#rankingMovers'),signature=JSON.stringify(rows.map(x=>[x.participant_id,x.display_name,x.change]));if(el.dataset.moversSignature!==signature){el.innerHTML=rows.map(x=>`<span class="mover ${x.change>0?'up':'down'}">${x.change>0?'↑':'↓'} ${esc(x.display_name)} ${Math.abs(x.change)} posição(ões)</span>`).join('');el.dataset.moversSignature=signature;}const s=roomSettings();$('#qualificationBadge').textContent=s.classification_enabled?`Classificam Top ${currentQualifyTop()}`:'Sem corte';}
async function refreshState(force=false){if(!room)return false;const seq=++refreshSeq,t=performance.now();const{data,error}=await db.rpc('admin_get_room_state',{p_room_id:room.id});lastLatency=Math.round(performance.now()-t);if($('#latencyBadge')){$('#latencyBadge').textContent=`Latência ${lastLatency} ms`;$('#latencyBadge').className=`badge ${lastLatency<400?'ready':lastLatency<1200?'neutral':'warn'}`;}if(error){if(force&&seq>=refreshAppliedSeq)$('#roundHint').textContent=`Falha ao sincronizar: ${error.message}`;return false;}if(seq<refreshAppliedSeq)return false;refreshAppliedSeq=seq;roomState=data;if(data.room){room={...room,...data.room};rememberRoom();}serverOffset=Date.parse(data.server_now)-Date.now();$('#randomizeQueueToggle').checked=!!room.randomize_queue;renderRank($('#adminRanking'),data.ranking||[]);updateLiveStats(data);$('#stateVersionAdmin').textContent=`v${data.room?.state_version||0} • g${data.room?.generation||1}`;$('#currentQuestionAdmin').textContent=data.round?.prompt||data.prepared?.prompt||'Nenhuma pergunta em execução.';$('#roomProgress').textContent=`${data.used_rounds||0}/${data.room?.planned_rounds||0} rounds • ${data.queued_count||0} aguardando • ${data.ready_count||0} prontos`;renderAdminQr();fillSettings();if($('#eventStatusBadge')&&data.room?.is_rehearsal)$('#eventStatusBadge').textContent=`${statusLabel(data.room.phase)} • ENSAIO`;renderPresenter();renderRankingMovers();updatePresentationStage();updateControls();renderTimer();renderRemoteControl();await maybeAutoOpen();return true;}
async function maybeAutoOpen(){if(autoOpening||phase()!=='preparing'||!roomState?.room?.prepared_until)return;const remain=serverRemaining(roomState.room.prepared_until,serverOffset);if(remain>0)return;autoOpening=true;try{const{error}=await db.rpc('admin_open_prepared_round',{p_room_id:room.id});if(!error)await Promise.all([refreshState(true),loadQueue()]);}finally{autoOpening=false;}}
function updateStartReadiness(){const target=Number(roomState?.room?.planned_rounds||room?.planned_rounds||plannedRounds()),joined=Number(roomState?.participant_count||0),queued=queueRows.length,lobby=!!room&&phase()==='lobby'&&Number(roomState?.used_rounds||0)===0;const roomCheck=$('#startRoomCheck'),peopleCheck=$('#startPeopleCheck'),queueCheck=$('#startQueueCheck'),guard=$('#startRoomGuard'),btn=$('#startQuizBtn');if(roomCheck){roomCheck.textContent=room?`Sala ${room.code} • lobby`:'Crie uma sala';roomCheck.className=`start-check ${lobby?'ready':'warn'}`;}if(peopleCheck){peopleCheck.textContent=joined>0?`${joined} participante${joined===1?'':'s'} cadastrado${joined===1?'':'s'}`:'0 participantes • podem entrar depois';peopleCheck.className='start-check ready';}if(queueCheck){queueCheck.textContent=queued>0?`${queued} pergunta${queued===1?'':'s'} selecionada${queued===1?'':'s'}${queued!==target?` • a partida usará ${queued} round${queued===1?'':'s'}`:''}`:'Nenhuma pergunta selecionada';queueCheck.className=`start-check ${queued>0?'ready':'warn'}`;}const ready=lobby&&queued>0;if(guard){guard.classList.toggle('hidden',ready||!room);guard.textContent=!room?'':'Adicione pelo menos 1 pergunta à sala para liberar o início da partida.';}if(btn){btn.disabled=actionBusy||!ready;btn.classList.toggle('needs-setup',lobby&&!ready);btn.textContent=ready?'Começar Quiz':'Adicione perguntas para começar';btn.title=ready?`${queued} pergunta${queued===1?'':'s'} pronta${queued===1?'':'s'} para iniciar.`:'O quiz só começa quando existe pelo menos 1 pergunta selecionada.';}}
function updateControls(){const has=!!room;if(!has){$$('#displayBtn,#fullscreenDisplayBtn,#pairRemoteBtn,#copyJoinLinkBtn,#startQuizBtn,#prepareRoundBtn,#openRoundBtn,#closeRoundBtn,#restartQuizBtn,#shuffleQueueBtn,#pauseQuizBtn,#extend5Btn,#extend10Btn,#annulRoundBtn,#regradeRoundBtn').forEach(b=>b.disabled=true);updateRemoteAvailability();renderRemoteControl();return;}const p=phase(),target=Number(roomState?.room?.planned_rounds||plannedRounds()),used=Number(roomState?.used_rounds||0),queued=Number(roomState?.queued_count||0),r=roomState?.round;$('#eventStatusBadge').textContent=statusLabel(p);$('#roundProgressBadge').textContent=`${used} / ${target}`;$('#displayBtn').disabled=false;$('#fullscreenDisplayBtn').disabled=false;$('#pairRemoteBtn').disabled=actionBusy||p==='finished';$('#copyJoinLinkBtn').disabled=false;const joined=Number(roomState?.participant_count||0);updateStartReadiness();$('#plannedRounds').disabled=p!=='lobby';$('#randomizeQueueToggle').disabled=p!=='lobby'||actionBusy;$('#shuffleQueueBtn').disabled=actionBusy||!(p==='lobby'&&queueRows.length>=2);$('#restartQuizBtn').disabled=actionBusy||used===0;$('#prepareRoundBtn').disabled=actionBusy||!(p==='result'&&used<target&&queued>0);$('#openRoundBtn').disabled=actionBusy||p!=='preparing';$('#closeRoundBtn').disabled=actionBusy||!(p==='question_open'&&r?.status==='open');$('#pauseQuizBtn').disabled=actionBusy||p==='question_open'||p==='finished'||p==='lobby';$('#pauseQuizBtn').textContent=p==='paused'?'Retomar partida':'Pausar partida';$('#extend5Btn').disabled=actionBusy||!(p==='question_open'&&r?.accepting_responses);$('#extend10Btn').disabled=$('#extend5Btn').disabled;$('#annulRoundBtn').disabled=actionBusy||!(['result','finished'].includes(p)&&r?.status==='closed'&&!r.annulled);$('#regradeRoundBtn').disabled=actionBusy||!(['result','finished'].includes(p)&&r?.status==='closed');$$('[data-reveal]').forEach(b=>b.disabled=actionBusy||!(['result','finished'].includes(p)));$('#createRoomBtn').disabled=actionBusy;$('#createRoomBtn').textContent=room?'Criar outra sala':'Criar sala';updateRemoteAvailability();renderRemoteControl();}
function renderTimer(){const el=$('#adminTimer'),r=roomState?.round,p=phase();if(!room){el.textContent='Aguardando início';return;}if(p==='lobby'){el.textContent='Lobby aberto';el.className='round-clock';return;}if(p==='preparing'){const remain=Math.max(0,serverRemaining(roomState.room.prepared_until,serverOffset));el.textContent=`Prepare-se • ${Math.max(1,Math.ceil(remain/1000))}`;el.className='round-clock live';maybeAutoOpen();return;}if(p==='paused'){el.textContent='PAUSADO';el.className='round-clock closed';return;}if(p==='finished'){el.textContent='Quiz encerrado';el.className='round-clock closed';return;}if(!r){el.textContent='Sincronizando';return;}if(r.status!=='open'){el.textContent=`Round ${r.round_no} encerrado`;el.className='round-clock closed';return;}const remain=serverRemaining(r.closes_at,serverOffset);el.textContent=remain<=0?`Round ${r.round_no} • TEMPO ESGOTADO`:`Round ${r.round_no} • ${(remain/1000).toFixed(remain<10000?1:0)}s`;el.className=remain<=5000?'round-clock expired':'round-clock live';}
function startTimerLoop(){clearInterval(timerTick);timerTick=setInterval(()=>{renderTimer();renderRemoteTimer();},100);}

async function loadParticipants(){if(!room)return;const{data,error}=await db.rpc('admin_list_participants',{p_room_id:room.id});if(error)return;participants=data||[];const now=Date.now(),fmtSeen=v=>{const ms=now-Date.parse(v||0);if(!Number.isFinite(ms)||ms<0)return 'sem heartbeat';if(ms<60000)return `visto há ${Math.max(1,Math.round(ms/1000))}s`;if(ms<3600000)return `visto há ${Math.round(ms/60000)}min`;return `visto ${new Date(v).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;};$('#participantAdminList').innerHTML=participants.map(p=>`<div class="participant-admin-row ${p.kicked?'kicked':''}" data-id="${p.id}"><span class="presence-dot ${now-Date.parse(p.last_seen_at)<90000?'online':'offline'}"></span><span class="participant-avatar">${avatarMarkup(p.avatar_key||'robot',{compact:true,animated:now-Date.parse(p.last_seen_at)<90000})}</span><strong>${esc(p.display_name)}</strong><span class="participant-state">${p.ready?'PRONTO':'AGUARDANDO'}</span><b class="participant-points">${Number(p.total_points)||0} pts</b><small class="participant-diagnostics">${Number(p.answer_count)||0} resp • ${Number(p.missed_count)||0} perd. • ${fmtSeen(p.last_seen_at)} • 🔥 ${Number(p.current_streak)||0}</small><div class="participant-admin-actions participant-desktop-actions"><button class="ghost small" data-detail>Detalhes</button><button class="ghost small" data-kick ${p.kicked?'disabled':''}>Remover</button></div><details class="participant-mobile-actions"><summary aria-label="Ações de ${esc(p.display_name)}">⋯</summary><div><button class="ghost small" data-detail>Detalhes</button><button class="ghost small" data-kick ${p.kicked?'disabled':''}>Remover</button></div></details></div>`).join('')||'<div class="empty">Nenhum participante.</div>';$$('[data-detail]').forEach(b=>b.addEventListener('click',()=>{const p=participants.find(x=>x.id===b.closest('[data-id]').dataset.id);if(!p)return;alert(`${p.display_name}\n\nPontos: ${Number(p.total_points)||0}\nRespostas: ${Number(p.answer_count)||0}\nRounds perdidos: ${Number(p.missed_count)||0}\nStreak atual: ${Number(p.current_streak)||0}\nMelhor streak: ${Number(p.best_streak)||0}\nÚltimo heartbeat: ${p.last_seen_at?new Date(p.last_seen_at).toLocaleString('pt-BR'):'sem registro'}\nStatus: ${p.kicked?'REMOVIDO':(now-Date.parse(p.last_seen_at)<90000?'CONECTADO':'DESCONECTADO')}`);}));$$('[data-kick]').forEach(b=>b.addEventListener('click',()=>kickParticipant(b.closest('[data-id]').dataset.id)));}
async function kickParticipant(id){if(!confirm('Remover e bloquear este participante nesta sala?'))return;const{error}=await db.rpc('admin_kick_participant',{p_room_id:room.id,p_participant_id:id,p_block:true});if(error)return alert(error.message);await Promise.all([loadParticipants(),refreshState(true)]);}
async function loadHistory(){if(!room)return;const{data,error}=await db.rpc('admin_get_round_history',{p_room_id:room.id});if(error)return;historyRows=data||[];const answered=historyRows.filter(x=>x.choice_value!==null||x.numeric_value!==null).length,missed=historyRows.length-answered;$('#historySummary').innerHTML=`<span><b>${historyRows.length}</b> registros</span><span><b>${answered}</b> respostas</span><span><b>${missed}</b> rounds sem resposta</span>`;}
function showEvolution(){if(!historyRows.length)return;const rounds=[...new Set(historyRows.map(x=>Number(x.round_no)))].filter(Number.isFinite).sort((a,b)=>a-b),names=[...new Set(historyRows.map(x=>x.display_name))].slice(0,10),maxPos=Math.max(1,...historyRows.map(x=>Number(x.current_position)||0)),w=Math.max(720,rounds.length*84),h=360,padL=54,padR=20,padT=24,padB=44,x=r=>rounds.length<2?padL+(w-padL-padR)/2:padL+(rounds.indexOf(r)/(rounds.length-1))*(w-padL-padR),y=pos=>padT+((Math.max(1,pos)-1)/Math.max(1,maxPos-1))*(h-padT-padB),series=names.map((name,i)=>{const pts=rounds.map(r=>{const row=historyRows.find(v=>Number(v.round_no)===r&&v.display_name===name),pos=Number(row?.current_position);return Number.isFinite(pos)&&pos>0?{r,pos}:null;}).filter(Boolean);return{name,i,pts};}),grid=[1,...Array.from({length:Math.min(4,maxPos-1)},(_,i)=>Math.round(1+(i+1)*(maxPos-1)/Math.min(4,maxPos-1)))].filter((v,i,a)=>a.indexOf(v)===i);$('#evolutionChart').classList.remove('hidden');$('#evolutionChart').innerHTML=`<div class="evolution-legend">${series.map((s,i)=>`<span class="evo-series-${(i%6)+1}"><i></i>${esc(s.name)}</span>`).join('')}</div><div class="evolution-svg-wrap"><svg class="evolution-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolução de posição por round">${grid.map(v=>`<g><line x1="${padL}" y1="${y(v)}" x2="${w-padR}" y2="${y(v)}" class="evo-grid"/><text x="${padL-10}" y="${y(v)+4}" text-anchor="end">${v}º</text></g>`).join('')}${rounds.map(r=>`<g><line x1="${x(r)}" y1="${padT}" x2="${x(r)}" y2="${h-padB}" class="evo-vgrid"/><text x="${x(r)}" y="${h-15}" text-anchor="middle">R${r}</text></g>`).join('')}${series.map((s,i)=>`<g class="evo-series-${(i%6)+1}"><polyline points="${s.pts.map(p=>`${x(p.r)},${y(p.pos)}`).join(' ')}"/><g>${s.pts.map(p=>`<circle cx="${x(p.r)}" cy="${y(p.pos)}" r="5"><title>${esc(s.name)} • Round ${p.r}: ${p.pos}º</title></circle>`).join('')}</g></g>`).join('')}</svg></div>`;}
async function exportReport(){if(!room)return alert('Crie/abra uma sala.');await loadHistory();const head=['round','pergunta','categoria','dificuldade','jogador','resposta','tempo_ms','pontos','anulada'],lines=[head.join(';')];for(const x of historyRows){const ans=x.choice_value??x.numeric_value??'';lines.push([x.round_no,x.prompt,x.category,x.difficulty,x.display_name,ans,x.response_ms??'',x.awarded_points||0,x.annulled?'SIM':'NAO'].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';'));}downloadText(`QuizRounds_relatorio_${room.code}.csv`,lines.join('\n'));}
async function loadAudit(){if(!room)return;const{data,error}=await db.rpc('admin_list_audit',{p_room_id:room.id,p_limit:60});if(error)return;$('#auditList').innerHTML=(data||[]).map(x=>`<div class="audit-row"><time>${new Date(x.created_at).toLocaleTimeString('pt-BR')}</time><strong>${esc(x.action)}</strong><span>${esc(JSON.stringify(x.details||{}))}</span></div>`).join('')||'<div class="empty">Sem eventos.</div>';}
function setPoll(ms){clearInterval(poll);poll=setInterval(()=>refreshState(false),ms);clearInterval(auditTick);auditTick=setInterval(()=>Promise.all([loadAudit(),loadParticipants()]),Math.max(6000,ms*2));}
function scheduleReconnect(epoch=subscriptionEpoch){
  if(epoch!==subscriptionEpoch)return;
  if(reconnectTimer)return;
  reconnectAttempt=Math.min(reconnectAttempt+1,6);
  conn(navigator.onLine?'fallback':'offline',navigator.onLine?'sincronização por segurança':'aguardando internet');
  setPoll(POLL_FALLBACK);
  reconnectTimer=setTimeout(()=>{reconnectTimer=null;if(epoch===subscriptionEpoch)subscribe();},Math.min(15000,700*(2**(reconnectAttempt-1))));
}
function applyAnswerProgress(payload){if(!roomState?.round||payload?.round_id!==roomState.round.id||progressRefreshTimer)return;progressRefreshTimer=setTimeout(async()=>{progressRefreshTimer=null;await refreshState(false);},500);}
async function runConnectionTest(){if(!room||!channel)return alert('Abra uma sala e aguarde a conexão.');connectionTestNonce=`ct-${Date.now()}-${Math.random().toString(36).slice(2)}`;connectionAcks=new Set();const out=$('#connectionTestResult');out.textContent='Testando…';await channel.send({type:'broadcast',event:'connection_test',payload:{nonce:connectionTestNonce,at:Date.now()}});setTimeout(()=>{const online=Number(roomState?.active_count||presenceOnline||0);out.textContent=`${connectionAcks.size}/${online||roomState?.participant_count||0} responderam`;out.className=`badge ${connectionAcks.size>=Math.max(1,online)?'ready':'neutral'}`;},4000);}
async function subscribe(){
  if(!room)return;
  const epoch=++subscriptionEpoch;
  clearTimeout(reconnectTimer);reconnectTimer=null;
  const oldChannel=channel,oldProgress=progressChannel;
  channel=null;progressChannel=null;
  if(oldChannel)try{await db.removeChannel(oldChannel);}catch{}
  if(oldProgress)try{await db.removeChannel(oldProgress);}catch{}
  if(epoch!==subscriptionEpoch)return;
  conn('connecting');
  const progress=db.channel(`quiz-admin:${room.id}`,{config:{private:true}})
    .on('broadcast',{event:'response_progress'},({payload})=>{if(epoch===subscriptionEpoch)applyAnswerProgress(payload);});
  progressChannel=progress;
  progress.subscribe(status=>{
    if(epoch!==subscriptionEpoch||progress!==progressChannel)return;
    if(['CHANNEL_ERROR','TIMED_OUT'].includes(status))scheduleReconnect(epoch);
  });
  const main=db.channel(`quiz:${room.id}`,{config:{private:true}})
    .on('broadcast',{event:'state_changed'},async()=>{if(epoch!==subscriptionEpoch)return;await Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants()]);})
    .on('broadcast',{event:'connection_ack'},({payload})=>{if(epoch!==subscriptionEpoch)return;if(connectionTestNonce&&payload?.nonce===connectionTestNonce){connectionAcks.add(payload.participant_id||payload.user_id||Math.random().toString());const el=$('#connectionTestResult');if(el)el.textContent=`${connectionAcks.size} resposta(s) ao teste`;}})
    .on('presence',{event:'sync'},()=>{if(epoch!==subscriptionEpoch||main!==channel)return;const ps=Object.values(main.presenceState()).flat();presenceOnline=ps.filter(x=>x?.kind==='participant'||x?.participant_id).length;displayOnline=ps.some(x=>x?.kind==='display'||x?.display_id);updateLiveStats(roomState);renderRemoteControl();});
  channel=main;
  main.subscribe(async status=>{
    if(epoch!==subscriptionEpoch||main!==channel)return;
    if(status==='SUBSCRIBED'){
      clearTimeout(reconnectTimer);reconnectTimer=null;reconnectAttempt=0;conn('connected');setPoll(POLL_CONNECTED);await refreshState(true);return;
    }
    if(['CHANNEL_ERROR','TIMED_OUT'].includes(status))scheduleReconnect(epoch);
    if(status==='CLOSED'&&navigator.onLine)scheduleReconnect(epoch);
  });
}

$('#loginBtn').addEventListener('click',login);$('#password').addEventListener('keydown',e=>{if(e.key==='Enter')login();});$('#logoutBtn').addEventListener('click',logout);$('#createRoomBtn').addEventListener('click',createRoom);$('#plannedRounds').addEventListener('change',updatePlannedRounds);$('#randomizeQueueToggle').addEventListener('change',updateRandomizeQueue);$('#shuffleQueueBtn').addEventListener('click',shuffleQueue);$('#saveRoomSettingsBtn').addEventListener('click',()=>saveRoomSettings(true));$('#saveTemplateBtn').addEventListener('click',saveTemplate);$('#loadTemplateBtn').addEventListener('click',useTemplate);$('#duplicateRoomBtn').addEventListener('click',duplicateRoom);$('#exportReportBtn').addEventListener('click',exportReport);
$('#saveQuestionBtn').addEventListener('click',saveQuestion);$('#newQuestionBtn').addEventListener('click',()=>{resetQuestionEditor();document.querySelector('.question-editor-scroll')?.scrollTo({top:0,behavior:'smooth'});});$('#resetQuestionBtn').addEventListener('click',()=>{if(editingQuestionId&&!confirm('Descartar a edição atual?'))return;resetQuestionEditor();});$('#cancelQuestionEditBtn').addEventListener('click',()=>resetQuestionEditor());
$('#refreshQuestionsBtn').addEventListener('click',loadQuestions);$('#questionScope').addEventListener('change',loadQuestions);['#questionSearch','#questionCategoryFilter','#questionDifficultyFilter','#questionUsageFilter','#questionSort'].forEach(id=>$(id)?.addEventListener(id==='#questionSearch'?'input':'change',renderQuestionBank));$('#clearQuestionFiltersBtn').addEventListener('click',clearQuestionFilters);$$('[data-bank-quick]').forEach(btn=>btn.addEventListener('click',()=>setBankQuickFilter(btn.dataset.bankQuick)));$('#selectVisibleQuestionsBtn').addEventListener('click',()=>{visibleQuestionRows.forEach(q=>selectedQuestionIds.add(String(q.id)));renderQuestionBank();});$('#clearQuestionSelectionBtn').addEventListener('click',()=>{selectedQuestionIds.clear();renderQuestionBank();});$('#queueSelectedQuestionsBtn').addEventListener('click',bulkQueueSelected);$('#archiveSelectedQuestionsBtn').addEventListener('click',()=>bulkSetArchived(true));$('#restoreSelectedQuestionsBtn').addEventListener('click',()=>bulkSetArchived(false));
$('#qType').addEventListener('change',()=>{const n=$('#qType').value==='numeric';$('#choiceFields').classList.toggle('hidden',n);$('#numericFields').classList.toggle('hidden',!n);updateQuestionPreview();});['#qPrompt','#optA','#optB','#optC','#optD','#correctChoice','#correctNumber','#points','#timeLimit','#qCategory','#qDifficulty','#qSpeedBonus','#qTiebreaker','#qScoreEnabled','#qPresenterNotes'].forEach(id=>$(id)?.addEventListener(['#qPrompt','#optA','#optB','#optC','#optD','#correctNumber','#points','#timeLimit','#qCategory','#qSpeedBonus','#qPresenterNotes'].includes(id)?'input':'change',updateQuestionPreview));$$('[data-points-preset]').forEach(btn=>btn.addEventListener('click',()=>{$('#points').value=btn.dataset.pointsPreset;updateQuestionPreview();}));$$('[data-time-preset]').forEach(btn=>btn.addEventListener('click',()=>{$('#timeLimit').value=btn.dataset.timePreset;updateQuestionPreview();}));document.querySelector('.question-editor-card')?.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();saveQuestion();}});updateQuestionPreview();updateSelectionToolbar();
$('#txtImportFile').addEventListener('change',e=>{readTxtFile(e.target.files?.[0]);e.target.value='';});$('#bulkQuestionText').addEventListener('input',()=>{clearTimeout(parseTimer);parseTimer=setTimeout(analyzeBulkText,250);});$('#analyzeImportBtn').addEventListener('click',analyzeBulkText);$('#importQuestionsBtn').addEventListener('click',importBulkQuestions);$('#clearImportBtn').addEventListener('click',()=>{$('#bulkQuestionText').value='';parsedImport={questions:[],errors:[],results:[]};renderImportPreview();});document.querySelectorAll('input[name="importMode"]').forEach(r=>r.addEventListener('change',syncImportModeUi));$('#downloadTemplateBtn').addEventListener('click',downloadTemplate);$('#exportQuestionsBtn').addEventListener('click',exportQuestions);syncImportModeUi();
$('#goQuestionsBtn').addEventListener('click',()=>switchAdminTab('questions'));$('#startQuizBtn').addEventListener('click',startQuiz);$('#prepareRoundBtn').addEventListener('click',prepareRound);$('#openRoundBtn').addEventListener('click',openPreparedRound);$('#closeRoundBtn').addEventListener('click',closeRound);$('#pauseQuizBtn').addEventListener('click',pauseQuiz);$('#extend5Btn').addEventListener('click',()=>extendRound(5));$('#extend10Btn').addEventListener('click',()=>extendRound(10));$('#annulRoundBtn').addEventListener('click',annulRound);$('#regradeRoundBtn').addEventListener('click',regradeRound);$$('[data-reveal]').forEach(b=>b.addEventListener('click',()=>reveal(b.dataset.reveal)));$('#restartQuizBtn').addEventListener('click',restartQuiz);$('#displayBtn').addEventListener('click',()=>openDisplay('reuse'));$('#fullscreenDisplayBtn').addEventListener('click',()=>openDisplay('window'));$('#copyJoinLinkBtn').addEventListener('click',copyJoinLink);$('#forceSyncBtn').addEventListener('click',()=>Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants()]));$('#connectionTestBtn').addEventListener('click',runConnectionTest);$('#refreshParticipantsBtn').addEventListener('click',loadParticipants);$('#loadHistoryBtn').addEventListener('click',loadHistory);$('#showEvolutionBtn').addEventListener('click',showEvolution);
$('#pairRemoteBtn').addEventListener('click',createRemotePairing);$('#revokeRemoteBtn').addEventListener('click',revokeRemoteDevices);$('#remoteModeBtn').addEventListener('click',enterRemoteMode);$('#remoteExitBtn').addEventListener('click',exitRemoteMode);$('#remotePairCloseBtn').addEventListener('click',closeRemotePairModal);$('#remotePairCopyBtn').addEventListener('click',copyRemotePairLink);$('#remotePairRegenerateBtn').addEventListener('click',createRemotePairing);$('#remoteClaimBtn').addEventListener('click',claimRemotePairing);$('#remotePrimaryBtn').addEventListener('click',remotePrimaryAction);$('#remotePauseBtn').addEventListener('click',pauseQuiz);$('#remoteExtend5Btn').addEventListener('click',()=>extendRound(5));$('#remoteExtend10Btn').addEventListener('click',()=>extendRound(10));$('#remoteRevealAnswerBtn').addEventListener('click',()=>reveal('answer'));$('#remoteRevealDistributionBtn').addEventListener('click',()=>reveal('distribution'));$('#remoteRevealRankingBtn').addEventListener('click',()=>reveal('ranking'));$('#remoteRefreshBtn').addEventListener('click',()=>refreshState(true));bindHoldAction($('#remoteAnnulBtn'),annulRound);bindHoldAction($('#remoteRestartBtn'),restartQuiz);$('#remotePairModal').addEventListener('click',e=>{if(e.target===$('#remotePairModal'))closeRemotePairModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#remotePairModal').classList.contains('hidden'))closeRemotePairModal();});
window.addEventListener('online',()=>room&&subscribe());window.addEventListener('offline',()=>{conn('offline');setPoll(POLL_FALLBACK);});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&room)Promise.all([refreshState(true),loadQueue(),loadAudit(),loadParticipants()]);});window.addEventListener('load',authCheck);
