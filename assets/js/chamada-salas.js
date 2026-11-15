/* ===== v40 — Médico ↔ sala por período + chamada de voz entre salas =====
   1) Vínculo: a recepção/administração vincula o médico a uma sala por um período (coleção "mv").
   2) Chamada: em Salas › Visualizar, clicar na sala mostra o botão do microfone. A sala escolhida toca
      (tela piscando verde néon + toque suave) e quem estiver nela clica em "Atender", como numa ligação.
   Funciona sala↔recepção e médico↔médico. Áudio via WebRTC; o aviso da chamada passa pelo canal de
   tempo real do Supabase (modo nuvem) ou entre abas do mesmo navegador (modo local, só para teste). */
(()=>{
const CID=Math.random().toString(36).slice(2,10),pad=n=>String(n).padStart(2,'0');

/* ---------- ícones ---------- */
const sp=document.createElementNS('http://www.w3.org/2000/svg','svg');sp.setAttribute('width','0');sp.setAttribute('height','0');sp.setAttribute('aria-hidden','true');sp.style.position='absolute';
sp.innerHTML='<defs><symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></symbol><symbol id="i-micoff" viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M9 9v2a3 3 0 0 0 5 2.2M15 9.5V6a3 3 0 0 0-5.7-1.3M5 11a7 7 0 0 0 11 5.7M19 11a7 7 0 0 1-.6 2.8M12 18v3"/></symbol><symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></symbol><symbol id="i-phoneoff" viewBox="0 0 24 24"><path d="M3 14c5-5 13-5 18 0l-2.500 3-3.500-1.500V13a8 8 0 0 0-6 0v2.500L5.500 17z"/></symbol></defs>';
document.body.appendChild(sp);

/* ---------- vínculo médico ↔ sala ---------- */
const nowS=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const mvL=()=>S.mv||(S.mv=[]),actv=v=>v.ini<=nowS()&&nowS()<v.fim,hhmm=s=>String(s).slice(11,16);
const mvRoom=id=>mvL().filter(v=>v.sala===id&&actv(v)),medN=id=>sn(by('med',id).nome||'Médico'),roomN=id=>(SL().find(r=>r.id===id)||{}).nome||'';
const DEV='ur-dev-room',devRoom=()=>{try{return localStorage.getItem(DEV)||''}catch(e){return''}};
const myRooms=()=>{const s=new Set(),d=devRoom();if(d&&SL().some(r=>r.id===d))s.add(d);if(me&&me.m)mvL().filter(v=>v.med===me.m&&actv(v)).forEach(v=>s.add(v.sala));return s};
const canMv=()=>!!me&&(me.r==='admin'||me.r==='rec');
const isRec=r=>!!r&&/recep/.test(nz(r.nome)),recId=id=>isRec(SL().find(r=>r.id===id));
/* quem recebe chamadas: o computador da sala, o médico vinculado e, para a sala Recepção, os usuários de recepção/administração logados */
const recvRooms=()=>{const s=myRooms();if(me&&(me.r==='rec'||me.r==='admin'))SL().filter(isRec).forEach(r=>s.add(r.id));return s};
const waBtn=(id,full)=>mvRoom(id).map(v=>`<button type="button" class="btn${full?'':' s'}" data-a="waMed,${v.med}" title="Chamar ${esc(medN(v.med))} no WhatsApp" aria-label="Ligar no WhatsApp para ${esc(medN(v.med))}">${IC('wa')}${full?'Ligar no WhatsApp · '+esc(medN(v.med)):'WhatsApp'}</button>`).join('');
const chipRoom=id=>{const l=mvRoom(id);return l.length?`<span class="mvc">${IC('steth')}${l.map(v=>esc(medN(v.med))).join(', ')}</span>`:''};

/* ---------- canal de aviso (signaling) ---------- */
let sig=null,sigName='';
const chan=()=>'rsl-voz-'+((typeof curCl==='function'&&curCl().id)||'x');
const sigClose=()=>{if(sig){try{sig.close()}catch(e){}sig=null;sigName=''}};
const sigOpen=()=>{const n=chan();if(sig&&sigName===n)return;sigClose();sigName=n;
 if(window.RSL_REMOTE&&window.sb){const ch=window.sb.channel(n,{config:{broadcast:{self:false}}});ch.on('broadcast',{event:'v'},m=>onMsg(m.payload)).subscribe();
  sig={send:p=>ch.send({type:'broadcast',event:'v',payload:p}),close:()=>window.sb.removeChannel(ch)}}
 else if('BroadcastChannel'in window){const bc=new BroadcastChannel(n);bc.onmessage=e=>onMsg(e.data);sig={send:p=>bc.postMessage(p),close:()=>bc.close()}}};
const send=p=>{if(!sig)sigOpen();if(sig)sig.send({...p,from:CID})};

/* ---------- toque suave ---------- */
let AC=null,ringTm=0;
const actx=()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}};
['pointerdown','keydown'].forEach(n=>document.addEventListener(n,()=>{actx()},{capture:true,passive:true}));
const note=(f,t0,d,v)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+.05);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g);g.connect(AC.destination);o.start(t0);o.stop(t0+d+.05)};
const ringOnce=out=>{const a=actx();if(!a||a.state!=='running')return;const t=a.currentTime+.02;if(out)note(440,t,.9,.05);else{note(523.25,t,.5,.08);note(659.25,t+.4,.6,.08);note(523.25,t+1.2,.5,.08);note(659.25,t+1.6,.6,.08)}};
const SOM=()=>window.RSL_SOM,ringStop=()=>{clearInterval(ringTm);ringTm=0;if(SOM())SOM().stop('call')},ringStart=out=>{ringStop();if(!out&&SOM()&&SOM().start('call'))return;ringOnce(out);ringTm=setInterval(()=>ringOnce(out),3200)};

/* ---------- tela da chamada (camada acima de tudo) ---------- */
let C=null;
const mk=id=>{let e=document.getElementById(id);if(!e){e=document.createElement('div');e.id=id;document.body.appendChild(e)}return e};
const topShow=e=>{if('popover'in e){if(!e.hasAttribute('popover'))e.setAttribute('popover','manual');try{if(e.matches(':popover-open'))e.hidePopover();e.showPopover()}catch(x){}}else e.classList.add('fb')};
const topHide=e=>{if(!e)return;if('popover'in e){try{e.hidePopover()}catch(x){}}else e.classList.remove('fb')};
const mmss=ms=>{const s=Math.floor(ms/1000);return pad(Math.floor(s/60))+':'+pad(s%60)};
const ui=()=>{const p=mk('cv-pulse'),u=mk('cv-ui');
 if(!C){topHide(p);topHide(u);u.className='';u.innerHTML='';return}
 const nm=esc(C.name||'')+(C.rn?' · '+esc(C.rn):'');let h='';
 if(C.role==='in'&&C.st==='ring')h=`<div class="cvh"><span class="cvi">${IC('phone')}</span><div><b>Chamada de ${nm}</b><div class="hint">Está ligando para esta sala…</div></div></div><div class="cva"><button type="button" class="btn w cvbig" data-a="cvAns">${IC('phone')}Atender</button><button type="button" class="btn d cvbig" data-a="cvRej">${IC('phoneoff')}Recusar</button></div>`;
 else if(C.role==='out'&&C.st==='ring')h=`<div class="cvh"><span class="cvi">${IC('mic')}</span><div><b>Chamando ${nm}…</b><div class="hint">Aguardando alguém atender.</div></div></div><div class="cva"><button type="button" class="btn d cvbig" data-a="cvEnd">${IC('phoneoff')}Cancelar</button></div>`;
 else h=`<div class="cvh"><span class="cvi on">${IC('phone')}</span><div><b>${C.st==='live'?'Em chamada com':'Conectando com'} ${nm}</b><div class="hint"><span id="cv-t">${C.t0?mmss(Date.now()-C.t0):'00:00'}</span></div></div></div><div class="cva"><button type="button" class="btn cvbig" data-a="cvMute" aria-pressed="${!!C.mute}">${IC(C.mute?'micoff':'mic')}${C.mute?'Ativar microfone':'Silenciar'}</button><button type="button" class="btn d cvbig" data-a="cvEnd">${IC('phoneoff')}Encerrar</button></div>`;
 u.className='cv-'+C.role+' '+C.st;u.setAttribute('role','alertdialog');u.setAttribute('aria-live','assertive');u.setAttribute('aria-label','Chamada de voz');u.innerHTML=h;
 topShow(u);if(C.role==='in'&&C.st==='ring')topShow(p);else topHide(p)};
const audio=()=>{let a=document.getElementById('cv-audio');if(!a){a=document.createElement('audio');a.id='cv-audio';a.autoplay=true;document.body.appendChild(a)}return a};

/* ---------- fim de chamada ---------- */
const end=(msg,tell)=>{const c=C;if(!c)return;if(tell)send({t:'end',call:c.call,to:c.peer});
 clearTimeout(c.tmo);clearTimeout(c.dc);clearInterval(c.tk);ringStop();
 try{c.pc&&c.pc.close()}catch(e){}try{c.stream&&c.stream.getTracks().forEach(t=>t.stop())}catch(e){}
 const a=document.getElementById('cv-audio');if(a)a.srcObject=null;
 C=null;ui();if(msg)toast(msg)};

/* ---------- ligação de voz (WebRTC) ---------- */
const startPeer=async caller=>{const c=C,pc=c.pc=new RTCPeerConnection({iceServers:(window.RSL_CONFIG&&window.RSL_CONFIG.ICE_SERVERS)||[{urls:'stun:stun.l.google.com:19302'}]});c.q=[];
 c.stream.getTracks().forEach(t=>pc.addTrack(t,c.stream));
 pc.onicecandidate=e=>{if(e.candidate)send({t:'ice',call:c.call,to:c.peer,c:e.candidate})};
 pc.ontrack=e=>{const a=audio();a.srcObject=e.streams[0];const p=a.play();if(p&&p.catch)p.catch(()=>{})};
 pc.onconnectionstatechange=()=>{if(C!==c)return;const s=pc.connectionState;
  if(s==='connected'){clearTimeout(c.dc);c.st='live';if(!c.t0){c.t0=Date.now();c.tk=setInterval(()=>{const e=document.getElementById('cv-t');if(e)e.textContent=mmss(Date.now()-c.t0)},1000)}ui()}
  else if(s==='failed')end('A ligação falhou. Verifique a internet das duas pontas.',true);
  else if(s==='disconnected'){clearTimeout(c.dc);c.dc=setTimeout(()=>{if(C===c&&pc.connectionState!=='connected')end('Conexão perdida.',true)},6000)}};
 if(caller){const o=await pc.createOffer();await pc.setLocalDescription(o);send({t:'sdp',call:c.call,to:c.peer,sdp:pc.localDescription})}};
const flushIce=async c=>{const q=c.q||[];c.q=[];for(const x of q){try{await c.pc.addIceCandidate(x)}catch(e){}}};
const mic=()=>navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
const myName=()=>me.m?medN(me.m):(me.u||'Usuário');

/* ---------- mensagens recebidas ---------- */
async function onMsg(m){if(!m||m.from===CID||!me)return;
 if(m.t==='ring'){if(!recvRooms().has(m.to))return;if(C){send({t:'busy',call:m.call,to:m.from});return}
  C={role:'in',st:'ring',call:m.call,peer:m.from,name:(m.fr||{}).name,rn:(m.fr||{}).rn,to:m.to};
  ringStart(false);if(window.RSL_wake)window.RSL_wake();ui();const c=C;c.tmo=setTimeout(()=>{if(C===c&&c.st==='ring')end('Chamada perdida de '+(c.name||'uma sala')+'.')},60000);return}
 if(!C||C.call!==m.call)return;
 if(m.t==='cancel'&&C.role==='in'&&C.st==='ring'){end('Chamada perdida de '+(C.name||'uma sala')+'.');return}
 if(m.t==='taken'&&C.role==='in'&&C.st==='ring'&&m.by!==CID){end();return}
 if(m.t==='acc'&&C.role==='out'&&C.st==='ring'){clearTimeout(C.tmo);ringStop();C.st='conn';C.peer=m.from;if(m.nm){C.name=m.nm.name||C.name;C.rn=m.nm.rn||''}ui();send({t:'taken',call:C.call,by:m.from});try{await startPeer(true)}catch(e){end('Não foi possível iniciar a ligação.',true)}return}
 if((m.t==='rej'||m.t==='busy')&&C.role==='out'&&C.st==='ring'){end(m.t==='busy'?'A sala está em outra chamada.':'Chamada recusada.');return}
 if(m.to&&m.to!==CID)return;
 if(m.t==='sdp'&&C.pc){const c=C;try{await c.pc.setRemoteDescription(m.sdp);await flushIce(c);if(m.sdp.type==='offer'){const a=await c.pc.createAnswer();await c.pc.setLocalDescription(a);send({t:'sdp',call:c.call,to:c.peer,sdp:c.pc.localDescription})}}catch(e){end('Falha ao conectar o áudio.',true)}return}
 if(m.t==='ice'&&C.pc){if(C.pc.remoteDescription){try{await C.pc.addIceCandidate(m.c)}catch(e){}}else(C.q=C.q||[]).push(m.c);return}
 if(m.t==='end'){end('Chamada encerrada.');return}}

/* ---------- ações ---------- */
async function dial(roomId){
 if(C){toast('Você já está em uma chamada.');return}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('O microfone só funciona em site seguro (https) ou em localhost.');return}
 let st;try{st=await mic()}catch(e){toast('Permita o uso do microfone no navegador para ligar.');return}
 if(C){st.getTracks().forEach(t=>t.stop());return}
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 const mine=[...myRooms()][0]||'';
 C={role:'out',st:'ring',call:uid(),name:roomN(roomId),rn:'',to:roomId,stream:st};
 send({t:'ring',call:C.call,to:roomId,fr:{name:myName(),room:mine,rn:roomN(mine)}});
 ringStart(true);const c=C;c.tmo=setTimeout(()=>{if(C===c&&c.st==='ring'){send({t:'cancel',call:c.call});end('Ninguém atendeu a chamada.')}},45000);ui()}
const rooms=()=>{const mine=myRooms();modal(`<h2 class="f">Ligar para uma sala</h2><div class="f hint">A chamada toca na sala escolhida, para o médico vinculado a ela ou para o computador dedicado à sala.${mine.size?' Você está em: <b>'+[...mine].map(r=>esc(roomN(r))).join(', ')+'</b>.':''}</div><div class="f cvl">${SL().map(r=>`<div class="row"><span><b>${esc(r.nome)}</b> ${chipRoom(r.id)}</span><span class="cvx">${waBtn(r.id)}<button type="button" class="btn s p" data-a="cvCall,${r.id}" ${mine.has(r.id)?'disabled':''}>${IC('mic')}Ligar</button></span></div>`).join('')}</div><div class="f"><label for="cv_dev">Este computador fica na sala</label><select id="cv_dev" data-cvdev><option value="">Nenhuma (vale o vínculo do médico)</option>${SL().map(r=>`<option value="${r.id}" ${devRoom()===r.id?'selected':''}>${esc(r.nome)}</option>`).join('')}</select></div>`)};
document.addEventListener('change',e=>{const s=e.target.closest&&e.target.closest('[data-cvdev]');if(s){try{localStorage.setItem(DEV,s.value)}catch(x){}toast(s.value?'Este computador agora recebe chamadas da sala '+roomN(s.value)+'.':'Este computador não está vinculado a uma sala.')}});
const mvAdd=id=>{const meds=S.med.filter(m=>m.tipo==='Radiologista'),L=(meds.length?meds:S.med).map(m=>[m.id,sn(m.nome)]),R=SL().filter(r=>!isRec(r)).map(r=>[r.id,r.nome]);
 if(!L.length){toast('Cadastre um médico primeiro.');return}if(!R.length){toast('Cadastre as salas primeiro.');return}
 const d=new Date(),mn=d.getHours()*60+d.getMinutes(),f=n=>pad(Math.floor(n/60))+':'+pad(n%60);
 form('Vincular médico à sala',[['med','Médico(a)','sel',L],['sala','Sala','sel',R],['dia','Dia','date'],['de','Das','time'],['ate','Até','time']],{med:L[0][0],sala:R.some(x=>x[0]===id)?id:R[0][0],dia:today(),de:f(mn),ate:f(Math.min(mn+240,1439))},o=>{
  if(o.ate<=o.de){toast('O horário final precisa ser depois do inicial.');return}
  const ini=o.dia+'T'+o.de,fim=o.dia+'T'+o.ate;
  const bz=mvL().find(v=>v.sala===o.sala&&v.med!==o.med&&v.ini<fim&&v.fim>ini);if(bz){toast('A sala '+roomN(o.sala)+' já tem médico vinculado nesse horário: '+medN(bz.med)+'. Só um médico por sala.');return}
  S.mv=mvL().filter(v=>{if(v.med!==o.med||v.fim<=ini||v.ini>=fim)return true;if(v.ini<ini){v.fim=ini;return true}return false});
  S.mv.push({id:uid(),med:o.med,sala:o.sala,ini,fim,by:(me&&me.u)||''});toast(sn(by('med',o.med).nome)+' vinculado(a) à sala '+roomN(o.sala)+'.')})};
Object.assign(A,{
 cvCall(id){dial(id)},cvRooms:rooms,mvAdd,
 waMed(id){const m=by('med',id);if(!m)return;let n=String(m.tel||'').replace(/\D/g,'');if(!n){toast(sn(m.nome)+' não tem WhatsApp cadastrado. Cadastre em Médicos › Editar.');return}if(n.length<=11)n='55'+n;window.open('https://wa.me/'+n,'_blank','noopener')},
 cvAns:async()=>{if(!C||C.role!=='in'||C.st!=='ring')return;const c=C;let st;try{st=await mic()}catch(e){toast('Permita o uso do microfone para atender.');return}
  if(C!==c){st.getTracks().forEach(t=>t.stop());return}
  ringStop();clearTimeout(c.tmo);c.stream=st;c.st='conn';ui();
  try{await startPeer(false)}catch(e){end('Não foi possível iniciar a ligação.',true);return}
  send({t:'acc',call:c.call,to:c.peer,nm:{name:myName(),rn:roomN(c.to)}})},
 cvRej(){if(!C)return;send({t:'rej',call:C.call,to:C.peer});end()},
 cvEnd(){if(!C)return;if(C.role==='out'&&C.st==='ring'){send({t:'cancel',call:C.call});end('Chamada cancelada.')}else end('Chamada encerrada.',true)},
 cvMute(){if(!C||!C.stream)return;C.mute=!C.mute;C.stream.getAudioTracks().forEach(t=>t.enabled=!C.mute);ui()},
 mvEnd(id){const v=mvL().find(x=>x.id===id);if(!v)return;if(v.ini<nowS()&&!confirm('Desvincular '+medN(v.med)+' da sala '+roomN(v.sala)+'?'))return;if(v.ini>=nowS())S.mv=mvL().filter(x=>x.id!==id);else v.fim=nowS();save();render();toast('Médico(a) desvinculado(a) da sala.')}});

/* ---------- integra na tela Salas ---------- */
const si=A.slInfo;
A.slInfo=function(id){si.apply(this,arguments);const h=document.querySelector('dialog[open] .mb h2');if(!h)return;
 const on=mvRoom(id),mine=myRooms();
 h.insertAdjacentHTML('afterend',`<div class="f cvb"><div class="cvw">${IC('steth')}<span>${on.length?'Médico(a) na sala agora: <b>'+on.map(v=>esc(medN(v.med))+(v.ses?' (até sair)':' (até '+hhmm(v.fim)+')')).join(', ')+'</b>':'Nenhum médico vinculado a esta sala agora.'}</span></div><div class="cvx"><button type="button" class="btn p" data-a="cvCall,${id}" ${mine.has(id)?'disabled':''}>${IC('mic')}Ligar para esta sala</button>${waBtn(id,1)}${canMv()?(recId(id)?'':`<button type="button" class="btn" data-a="mvAdd,${id}">${IC('plus')}Vincular médico</button>`)+on.map(v=>`<button type="button" class="btn d" data-a="mvEnd,${v.id}">Desvincular ${esc(medN(v.med))}</button>`).join(''):''}</div></div>`)};
const sv=V.salv;
V.salv=()=>{let h=sv();
 h=h.replace(/(data-a="slInfo,([^"]+)"><b>[^<]*<\/b>)/g,(m,a,id)=>a+chipRoom(id));
 const td=today(),L=mvL().filter(v=>v.ini.slice(0,10)===td||actv(v)).sort((a,b)=>a.ini.localeCompare(b.ini));
 const panel=`<div class="mvp"><b>Médicos nas salas hoje:</b>${L.length?L.map(v=>`<span class="mvi${actv(v)?' on':''}">${esc(medN(v.med))} → ${esc(roomN(v.sala))} · ${v.ses?'desde '+hhmm(v.ini)+' · até sair':hhmm(v.ini)+'–'+hhmm(v.fim)}${actv(v)?' (agora)':''}${canMv()?`<button type="button" class="x" data-a="mvEnd,${v.id}" aria-label="Desvincular médico da sala" title="Desvincular">${IC('x')}</button>`:''}</span>`).join(''):'<span class="hint">Nenhum vínculo para hoje.</span>'}${canMv()?`<button type="button" class="btn s" data-a="mvAdd,">${IC('plus')}Vincular médico</button>`:''}</div>`;
 return h.replace('<div class="top">',panel+'<div class="top">')};

/* ---------- botão flutuante (telefone) e canal ---------- */
const fabOK=()=>!!me&&(['med','rec','admin'].includes(me.r)||!!devRoom()||(window.planLv&&window.planLv()>=2));
const tick=()=>{let f=document.getElementById('cv-fab');
 if(fabOK()){if(!f){f=document.createElement('button');f.id='cv-fab';f.type='button';f.className='btn p';f.setAttribute('data-a','cvRooms');f.setAttribute('aria-label','Ligar para uma sala');f.title='Ligar para uma sala';f.innerHTML=IC('phone');document.body.appendChild(f)}f.hidden=!!C;sigOpen()}
 else{if(f)f.remove();if(!me){if(C)end();sigClose()}}};
setInterval(tick,1500);tick();
window.RSL_CALL={state:()=>C,rooms:myRooms};
})();
