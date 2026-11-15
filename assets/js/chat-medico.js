/* ===== Chat Médico — v59 =====
   Chat estilo messenger entre recepção/administração e médicos.
   - Recepção/admin: botão do chat abre a lista de médicos; também abre direto pelo botão "Chat médico" da sala.
   - Médico: botão do chat abre a conversa com a recepção; mensagem nova abre a janela sozinha (minimizada, com contador).
   - Endereçamento (corrigido na v59): toda mensagem leva o id do cadastro do médico (med.id = me.m do médico logado).
       recepção → médico: {dir:'r2m', med:<id do médico>}      médico → recepção: {dir:'m2r', med:<id do médico>}
     Assim os dois lados sempre acham a mesma conversa, não importa o nome de usuário de cada um.
   - Mensagens trafegam pelo canal Supabase Realtime (nuvem) ou BroadcastChannel (local/teste).
   - O histórico (últimas 80 por conversa) fica salvo neste navegador, por usuário. */
(()=>{
const CHAN_PREFIX='rsl-chat-',KEEP=80;
const CSS=`
#cm-fab{position:fixed;bottom:80px;right:18px;z-index:9000;width:48px;height:48px;border-radius:50%;border:none;background:var(--c1);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.28);transition:transform .15s}
#cm-fab:hover{transform:scale(1.1)}
#cm-fab .cm-badge{position:absolute;top:-4px;right:-4px;background:#e53935;color:#fff;border-radius:50%;font-size:11px;font-weight:700;min-width:18px;height:18px;line-height:18px;text-align:center;padding:0 4px;display:none}
#cm-fab .cm-badge.on{display:block}
#cm-list{position:fixed;bottom:136px;right:18px;z-index:9100;width:240px;background:var(--s);border:1px solid var(--ln);border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.22);overflow:hidden;display:none}
#cm-list.on{display:block}
#cm-list-h{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--c1);color:#fff;font-weight:600;font-size:14px}
#cm-list-h button{background:none;border:none;color:#fff;cursor:pointer;padding:2px 4px;line-height:1}
.cm-li{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-top:1px solid var(--ln);transition:background .1s}
.cm-li:hover{background:var(--s2)}
.cm-li-av{width:34px;height:34px;border-radius:50%;background:var(--c1);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex:none}
.cm-li-info{flex:1;min-width:0}
.cm-li-name{font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-li-last{font-size:11px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-li-badge{background:#e53935;color:#fff;border-radius:50%;font-size:11px;font-weight:700;min-width:18px;height:18px;line-height:18px;text-align:center;padding:0 4px;display:none;flex:none}
.cm-li-badge.on{display:block}

.cm-win{position:fixed;bottom:0;right:84px;z-index:9200;width:300px;background:var(--s);border:1px solid var(--ln);border-radius:12px 12px 0 0;box-shadow:0 6px 28px rgba(0,0,0,.26);display:flex;flex-direction:column;transition:height .18s,bottom .18s}
.cm-win.mini{height:44px!important;overflow:hidden}
.cm-win.maxi{width:420px;height:520px!important}
.cm-win-h{display:flex;align-items:center;gap:8px;padding:0 10px;height:44px;background:var(--c1);color:#fff;border-radius:12px 12px 0 0;cursor:pointer;flex:none}
.cm-win-h .cm-av{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none}
.cm-win-h .cm-name{flex:1;font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-win-h .cm-on{width:9px;height:9px;border-radius:50%;background:#69f0ae;flex:none}
.cm-win-h .cm-acts{display:flex;gap:2px;flex:none}
.cm-win-h .cm-acts button{background:none;border:none;color:#fff;cursor:pointer;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;opacity:.85}
.cm-win-h .cm-acts button:hover{opacity:1;background:rgba(255,255,255,.18)}
.cm-win-h .cm-badge2{background:#e53935;color:#fff;border-radius:50%;font-size:11px;font-weight:700;min-width:16px;height:16px;line-height:16px;text-align:center;padding:0 3px;display:none;flex:none}
.cm-win-h .cm-badge2.on{display:block}
.cm-msgs{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;min-height:0}
.cm-bubble{max-width:82%;padding:7px 11px;border-radius:14px;font-size:13px;line-height:1.4;word-break:break-word;white-space:pre-wrap}
.cm-bubble.out{align-self:flex-end;background:var(--c1);color:#fff;border-bottom-right-radius:4px}
.cm-bubble.in{align-self:flex-start;background:var(--s2);color:var(--tx);border-bottom-left-radius:4px}
.cm-bubble .cm-ts{font-size:10px;opacity:.65;margin-top:3px;text-align:right;white-space:normal}
.cm-typing{align-self:flex-start;font-size:11px;color:var(--mu);padding:2px 6px;min-height:16px}
.cm-footer{padding:8px;border-top:1px solid var(--ln);display:flex;gap:6px;align-items:flex-end;flex:none;background:var(--s)}
.cm-footer textarea{flex:1;resize:none;border:1px solid var(--ln);border-radius:8px;padding:6px 10px;font-size:13px;line-height:1.4;background:var(--s2);color:var(--tx);min-height:34px;max-height:90px;font-family:inherit;overflow-y:auto}
.cm-footer textarea:focus{outline:none;border-color:var(--c1)}
.cm-footer button{width:34px;height:34px;border-radius:8px;border:none;background:var(--c1);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}
.cm-footer button:hover{opacity:.88}
.cm-empty{text-align:center;color:var(--mu);font-size:13px;padding:28px 10px}
`;
const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);

/* ---------- estado ---------- */
let me2=null,loadedFor='';
const msgs={};   // msgs[chave] = [{id,out,text,ts,fromName}]  — chave: id do médico (recepção) ou 'rec' (médico)
const unread={}; // unread[chave] = não lidas
const wins={};   // wins[chave] = {el,mini,maxi}
let listOpen=false,sig=null,sigName='';
const CID=Math.random().toString(36).slice(2,10);

/* ---------- canal realtime ---------- */
const chanName=()=>CHAN_PREFIX+((typeof curCl==='function'&&curCl().id)||'x');
const sigClose=()=>{if(sig){try{sig.close()}catch(e){}sig=null;sigName=''}};
const sigOpen=()=>{const n=chanName();if(sig&&sigName===n)return;sigClose();sigName=n;
  if(window.RSL_REMOTE&&window.sb){
    const ch=window.sb.channel(n,{config:{broadcast:{self:false}}});
    ch.on('broadcast',{event:'cm'},m=>onMsg(m.payload)).subscribe();
    sig={send:p=>ch.send({type:'broadcast',event:'cm',payload:p}),close:()=>window.sb.removeChannel(ch)}
  }else if('BroadcastChannel'in window){
    const bc=new BroadcastChannel(n);
    bc.onmessage=e=>onMsg(e.data);
    sig={send:p=>bc.postMessage(p),close:()=>bc.close()}}};
const send=p=>{if(!sig)sigOpen();if(sig)sig.send({...p,cid:CID})};

/* ---------- helpers ---------- */
const isRec=()=>!!me2&&(me2.r==='rec'||me2.r==='admin');
const isMed=()=>!!me2&&me2.r==='med';
const short=n=>String(n||'').split(' ').slice(0,2).join(' ');
const chatMeds=()=>{const r=S.med.filter(m=>m.tipo==='Radiologista');return r.length?r:S.med};
const peerName=key=>{if(isMed())return'Recepção';const m=S.med.find(x=>x.id===key);return m?short(m.nome):'Médico'};
const av=name=>String(name||'?')[0].toUpperCase();
const hm=ts=>new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const totalUnread=()=>Object.values(unread).reduce((a,b)=>a+b,0);

/* ---------- histórico salvo no navegador ---------- */
const lsKey=()=>me2?'rsl-chat:'+((typeof curCl==='function'&&curCl().id)||'x')+':'+me2.u:'';
const loadMsgs=()=>{Object.keys(msgs).forEach(k=>delete msgs[k]);
  try{const o=JSON.parse(localStorage.getItem(lsKey())||'{}');Object.keys(o).forEach(k=>{if(Array.isArray(o[k]))msgs[k]=o[k]})}catch(e){}};
const saveMsgs=()=>{try{const o={};Object.keys(msgs).forEach(k=>{o[k]=msgs[k].slice(-KEEP)});localStorage.setItem(lsKey(),JSON.stringify(o))}catch(e){}};
const resetAll=()=>{Object.values(wins).forEach(w=>w.el.remove());Object.keys(wins).forEach(k=>delete wins[k]);
  Object.keys(msgs).forEach(k=>delete msgs[k]);Object.keys(unread).forEach(k=>delete unread[k]);
  const f=document.getElementById('cm-fab');if(f)f.remove();const l=document.getElementById('cm-list');if(l)l.remove();listOpen=false;loadedFor=''};

/* ---------- recebimento ---------- */
function onMsg(m){
  if(!m||m.cid===CID||!me2||!m.med)return;
  let key;
  if(isMed()){if(m.dir!=='r2m'||m.med!==me2.m)return;key='rec'}
  else if(isRec()){if(m.dir!=='m2r')return;key=m.med}
  else return;
  const list=msgs[key]||(msgs[key]=[]);
  if(m.id&&list.some(x=>x.id===m.id))return;
  const msg={id:m.id||uid(),out:false,text:String(m.text||''),ts:m.ts||new Date().toISOString(),fromName:m.fromName||''};
  list.push(msg);saveMsgs();
  const w=wins[key];
  if(w&&!w.mini){appendMsg(key,msg);scrollToBottom(key)}
  else{
    unread[key]=(unread[key]||0)+1;
    if(!w)openWin(key,{mini:true});   // abre a janela minimizada, com o contador no cabeçalho
    toast('Nova mensagem de '+peerName(key));
    if(window.RSL_wake)window.RSL_wake()}
  refreshList()}

/* ---------- envio ---------- */
function sendMsg(key,text){
  text=String(text||'').trim();if(!text||!me2)return;
  let med;
  if(isMed()){
    if(!me2.m){toast('Seu usuário ainda não está ligado a um cadastro de médico. Peça à administração.');return}
    med=me2.m}
  else if(isRec())med=key;
  else return;
  const m={id:uid(),dir:isMed()?'m2r':'r2m',med,fromName:me2.u,text,ts:new Date().toISOString()};
  const msg={id:m.id,out:true,text,ts:m.ts,fromName:me2.u};
  (msgs[key]||(msgs[key]=[])).push(msg);saveMsgs();
  send(m);
  if(wins[key]){appendMsg(key,msg);scrollToBottom(key)}
  refreshList()}

/* ---------- render de mensagem ---------- */
function bubble(msg){
  const div=document.createElement('div');
  div.className='cm-bubble '+(msg.out?'out':'in');
  div.innerHTML=esc(msg.text)+'<div class="cm-ts">'+hm(msg.ts)+'</div>';
  return div}
function appendMsg(key,msg){
  const w=wins[key];if(!w)return;
  const c=w.el.querySelector('.cm-msgs');if(!c)return;
  const e=c.querySelector('.cm-empty');if(e)e.remove();
  c.appendChild(bubble(msg))}
function scrollToBottom(key){
  const w=wins[key];if(!w)return;
  const c=w.el.querySelector('.cm-msgs');if(c)c.scrollTop=c.scrollHeight}
function renderMsgs(key){
  const w=wins[key];if(!w)return;
  const c=w.el.querySelector('.cm-msgs');if(!c)return;
  const list=msgs[key]||[];
  if(!list.length){c.innerHTML='<div class="cm-empty">Nenhuma mensagem ainda.<br>Diga olá! 👋</div>';return}
  c.innerHTML='';list.forEach(m=>c.appendChild(bubble(m)));c.scrollTop=c.scrollHeight}

/* ---------- janela de chat ---------- */
function openWin(key,opt){
  if(isMed())key='rec';
  else if(!S.med.some(x=>x.id===key)){toast('Médico não encontrado.');return}
  const mini=!!(opt&&opt.mini);
  if(wins[key]){
    const w=wins[key];
    if(!mini){if(w.mini){w.mini=false;w.el.classList.remove('mini')}unread[key]=0;scrollToBottom(key);
      const t=w.el.querySelector('textarea');if(t)t.focus()}
    refreshBadges();refreshList();return}

  const name=peerName(key);
  const el=document.createElement('div');
  el.className='cm-win'+(mini?' mini':'');
  el.style.height='340px';
  el.innerHTML=`
    <div class="cm-win-h" title="Clique para minimizar/restaurar">
      <div class="cm-av">${esc(av(name))}</div>
      <div class="cm-name">${esc(name)}</div>
      <span class="cm-badge2"></span>
      <div class="cm-acts">
        <button class="cm-btn-max" title="Maximizar/Restaurar" aria-label="Maximizar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
        </button>
        <button class="cm-btn-close" title="Fechar" aria-label="Fechar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
    </div>
    <div class="cm-msgs"></div>
    <div class="cm-footer">
      <textarea placeholder="Digite uma mensagem…" rows="1" aria-label="Mensagem"></textarea>
      <button type="button" title="Enviar" aria-label="Enviar">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
      </button>
    </div>`;
  document.body.appendChild(el);
  const w={el,mini,maxi:false};
  wins[key]=w;
  renderMsgs(key);
  if(!mini)unread[key]=0;
  refreshBadges();refreshList();repositionWins();

  el.querySelector('.cm-win-h').addEventListener('click',e=>{
    if(e.target.closest('.cm-acts'))return;
    w.mini=!w.mini;el.classList.toggle('mini',w.mini);
    if(!w.mini){unread[key]=0;refreshBadges();refreshList();scrollToBottom(key)}});
  el.querySelector('.cm-btn-max').addEventListener('click',e=>{
    e.stopPropagation();
    w.maxi=!w.maxi;el.classList.toggle('maxi',w.maxi);
    if(!w.maxi)el.style.height='340px';
    if(!w.mini)scrollToBottom(key)});
  el.querySelector('.cm-btn-close').addEventListener('click',e=>{
    e.stopPropagation();
    el.remove();delete wins[key];repositionWins()});

  const ta=el.querySelector('textarea'),btn=el.querySelector('.cm-footer button');
  const doSend=()=>{const t=ta.value;if(!t.trim())return;sendMsg(key,t);ta.value='';ta.style.height='';ta.focus()};
  btn.addEventListener('click',doSend);
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend()}});
  ta.addEventListener('input',()=>{ta.style.height='';ta.style.height=Math.min(ta.scrollHeight,90)+'px'});
  if(!mini)ta.focus()}

function repositionWins(){
  Object.values(wins).forEach((w,i)=>{w.el.style.right=(84+i*(w.maxi?430:310))+'px'})}

/* ---------- lista de médicos (recepção/admin) ---------- */
function buildList(){
  const el=document.getElementById('cm-list');if(!el)return;
  const body=el.querySelector('#cm-list-body'),meds=chatMeds();
  if(!meds.length){body.innerHTML='<div style="padding:14px;font-size:13px;color:var(--mu)">Nenhum médico cadastrado.</div>';return}
  body.innerHTML=meds.map(m=>{
    const u=unread[m.id]||0,last=(msgs[m.id]||[]).slice(-1)[0];
    return`<div class="cm-li" data-peer="${esc(m.id)}">
      <div class="cm-li-av">${esc(av(m.nome))}</div>
      <div class="cm-li-info">
        <div class="cm-li-name">${esc(short(m.nome))}</div>
        <div class="cm-li-last">${last?esc(last.text.slice(0,32)):'Iniciar conversa…'}</div>
      </div>
      <div class="cm-li-badge${u?' on':''}">${u||''}</div>
    </div>`}).join('')}

function refreshList(){
  if(isRec()&&listOpen)buildList();
  refreshBadges()}

function refreshBadges(){
  const tot=totalUnread(),fab=document.getElementById('cm-fab');
  if(fab){const b=fab.querySelector('.cm-badge');if(b){b.textContent=tot||'';b.classList.toggle('on',tot>0)}}
  Object.keys(wins).forEach(k=>{
    const w=wins[k],b=w.el.querySelector('.cm-badge2'),u=unread[k]||0;
    if(b){b.textContent=u||'';b.classList.toggle('on',u>0&&w.mini)}})}

/* ---------- botão flutuante e lista ---------- */
function buildFab(){
  if(document.getElementById('cm-fab'))return;
  const fab=document.createElement('button');
  fab.id='cm-fab';fab.type='button';fab.title='Chat com médico';fab.setAttribute('aria-label','Chat com médico');
  fab.innerHTML=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v11H9l-5 4z"/></svg><span class="cm-badge"></span>`;
  document.body.appendChild(fab);
  if(isRec()){
    const list=document.createElement('div');list.id='cm-list';
    list.innerHTML=`<div id="cm-list-h">Chat com médico <button type="button" aria-label="Fechar lista" title="Fechar">✕</button></div><div id="cm-list-body"></div>`;
    document.body.appendChild(list);
    list.querySelector('#cm-list-h button').addEventListener('click',()=>{listOpen=false;list.classList.remove('on')});
    list.addEventListener('click',e=>{const li=e.target.closest('.cm-li');if(li){listOpen=false;list.classList.remove('on');openWin(li.dataset.peer)}});
    fab.addEventListener('click',()=>{listOpen=!listOpen;list.classList.toggle('on',listOpen);if(listOpen)buildList()})
  }else if(isMed()){
    fab.addEventListener('click',()=>openWin('rec'))}}

/* ---------- tick ---------- */
function tick(){
  me2=typeof me!=='undefined'?me:null;
  if(!me2){if(loadedFor)resetAll();sigClose();return}
  if(loadedFor!==lsKey()){resetAll();loadedFor=lsKey();loadMsgs()}   // trocou de usuário: histórico próprio
  sigOpen();
  const fab=document.getElementById('cm-fab'),show=isMed()||(isRec()&&chatMeds().length>0);
  if(show&&!fab)buildFab();
  if(!show&&fab){fab.remove();const l=document.getElementById('cm-list');if(l)l.remove()}
  refreshBadges()}
setInterval(tick,1500);tick();

/* ---------- API pública e ações ---------- */
window.RSL_CHAT={open:key=>openWin(key),send:sendMsg};
if(typeof A!=='undefined'){
  A.chatMed=A.chatMed||(id=>openWin(id));   // recepção/admin → chat com o médico escolhido (a versão de chamada-salas.js fecha o modal antes)
  A.chatRec=()=>openWin('rec')}             // médico → chat com a recepção
})();
