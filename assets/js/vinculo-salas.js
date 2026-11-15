/* ===== v41 — Médico pede a sala ao entrar; a administração aprova; o vínculo vale até ele sair =====
   1) Ao logar, o médico vê as salas cadastradas e solicita o vínculo com uma delas (coleção "mr").
   2) Quem administra (admin ou recepção logados) recebe o pedido num cartão piscando em néon branco
      e aprova ou recusa. Aprovar cria o vínculo (coleção "mv", marcado "ses") sem hora final.
   3) O vínculo termina quando o médico sai do sistema, ou quando a administração o desvincula
      em Salas › Visualizar (para o caso de ele ir embora sem sair). */
(()=>{
const pad=n=>String(n).padStart(2,'0'),FOREVER='2999-12-31T23:59',FLAG='ur-vq';
const nowS=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const mvL=()=>S.mv||(S.mv=[]),mrL=()=>S.mr||(S.mr=[]),actv=v=>v.ini<=nowS()&&nowS()<v.fim;
const medN=id=>sn(by('med',id).nome||'Médico'),roomN=id=>(SL().find(r=>r.id===id)||{}).nome||'';
const isMed=()=>!!me&&me.r==='med',isAdm=()=>!!me&&(me.r==='admin'||me.r==='rec');
const findRoom=q=>SL().find(x=>x.id===q.sala)||SL().find(x=>nz(x.nome)===nz(q.rn)),qRoom=q=>(findRoom(q)||{}).nome||q.rn||'';
const myLinks=()=>me&&me.m?mvL().filter(v=>v.med===me.m&&actv(v)):[];
const myReqs=()=>mrL().filter(r=>r.u===me.u);
const mk=(id,tag='div')=>{let e=document.getElementById(id);if(!e){e=document.createElement(tag);e.id=id;document.body.appendChild(e)}return e};
const show=e=>{if('popover'in e){if(!e.hasAttribute('popover'))e.setAttribute('popover','manual');try{if(!e.matches(':popover-open'))e.showPopover()}catch(x){}}else e.classList.add('fb')};
const hide=e=>{if(!e)return;if('popover'in e){try{if(e.matches(':popover-open'))e.hidePopover()}catch(x){}}else e.classList.remove('fb');if(e.innerHTML){e.innerHTML='';e.dataset.h=''}};
const put=(e,h)=>{if(e.dataset.h!==h){e.innerHTML=h;e.dataset.h=h}show(e)};
const ago=t=>{const m=Math.max(0,Math.round((Date.now()-new Date(t))/60000));return m<1?'agora mesmo':m<60?'há '+m+' min':'há '+Math.floor(m/60)+' h'};
const wake=()=>{if(window.RSL_wake)window.RSL_wake()};

/* ---------- médico: escolha da sala ---------- */
let OPEN=false,focused=false,prevPend=false,prevKey='',prevSes=null,seen=new Set(),started=false;
const shown=()=>{try{return sessionStorage.getItem(FLAG)==='1'}catch(e){return false}},mark=()=>{try{sessionStorage.setItem(FLAG,'1')}catch(e){}};
const pickHTML=()=>{const pend=myReqs().find(r=>r.st==='pend'),links=myLinks(),mine=new Set(links.map(v=>v.sala));
 if(pend)return`<div class="vqh"><span class="vqi">${IC('steth')}</span><div><b>Aguardando aprovação</b><div class="hint">Pedido enviado para a sala <b>${esc(qRoom(pend))}</b>. Quando a administração aprovar, você fica vinculado até sair do sistema.</div></div></div><div class="vqs" role="status"><span class="vqd"></span>Aguardando a administração…</div><div class="vqa"><button type="button" class="btn" data-a="vqCancel">Trocar de sala</button><button type="button" class="btn p" data-a="vqClose">Continuar no sistema</button></div>`;
 const L=SL(),warn=me.m?'':'<div class="vqw" role="alert">Seu usuário ainda não está ligado a um cadastro de médico. Peça à administração para ligar em Funcionários e acessos.</div>';
 return`<div class="vqh"><span class="vqi">${IC('steth')}</span><div><b>${links.length?'Trocar de sala':'Em qual sala você vai atender?'}</b><div class="hint">Escolha a sala e solicite o vínculo. A administração precisa aprovar.</div></div></div>${warn}<div class="vqg">${L.length?L.map(r=>{const on=mvL().filter(v=>v.sala===r.id&&actv(v)),here=mine.has(r.id);return`<button type="button" class="vqr${here?' me':''}" data-a="vqPick,${r.id}" ${here||!me.m?'disabled':''}><b>${esc(r.nome)}</b><span>${here?'Você está aqui':on.length?'Com '+on.map(v=>esc(medN(v.med))).join(', '):'Livre de médico'}</span></button>`}).join(''):'<div class="hint">Nenhuma sala cadastrada ainda. Peça à administração para cadastrar em Salas › Cadastrar.</div>'}</div><div class="vqa"><button type="button" class="btn" data-a="vqClose">Agora não</button></div>`};
const medTick=()=>{const reqs=myReqs(),no=reqs.find(r=>r.st==='no'),pend=reqs.find(r=>r.st==='pend'),links=myLinks(),key=links.map(v=>v.id).join(),ses=links.find(v=>v.ses);
 if(no){S.mr=mrL().filter(r=>r.id!==no.id);save();toast('A administração recusou a sala '+qRoom(no)+'. Escolha outra sala.');OPEN=true;focused=false}
 else if(started&&prevPend&&!pend&&links.length&&key!==prevKey){OPEN=false;toast('Vínculo aprovado: sala '+roomN(links[0].sala)+'.')}
 else if(started&&prevSes&&!ses&&!pend){toast('A administração desvinculou você da sala '+roomN(prevSes.sala)+'.')}
 if(!started&&!shown()&&!links.length&&!pend){OPEN=true}
 if(!started)mark();
 prevPend=!!pend;prevKey=key;prevSes=ses||null;started=true;
 const p=mk('vq-pick');
 if(OPEN){put(p,pickHTML());p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label','Escolher a sala de atendimento');if(!focused){focused=true;const b=p.querySelector('button:not([disabled])');if(b)b.focus()}}
 else{focused=false;hide(p)}
 const pill=mk('vq-pill','button');pill.className='btn'+(pend?' wt':links.length?' ok':'');pill.setAttribute('data-a','vqOpen');pill.type='button';
 const t=pend?'Aguardando aprovação · '+qRoom(pend):links.length?'Sala '+roomN(links[0].sala):'Solicitar sala';
 if(pill.dataset.h!==t){pill.innerHTML=IC('steth')+esc(t);pill.dataset.h=t;pill.title='Escolher ou trocar a sala de atendimento'}pill.hidden=OPEN};

/* ---------- administração: pedidos piscando em néon branco ---------- */
const admTick=()=>{const rs=mrL().filter(r=>r.st==='pend'&&r.t).sort((a,b)=>a.t.localeCompare(b.t)),e=mk('vq-adm');
 if(!rs.length){hide(e);seen=new Set();return}
 let fresh=false;rs.forEach(r=>{if(!seen.has(r.id)){seen.add(r.id);fresh=true}});if(fresh)wake();
 put(e,`<div class="vqt">${IC('bell')}<b>${rs.length>1?rs.length+' solicitações de vínculo':'Solicitação de vínculo'}</b></div>${rs.map(r=>`<div class="vqq"><div><b>${esc(medN(r.med))}</b> pede a sala <b>${esc(qRoom(r)||'(removida)')}</b><div class="vqm">${ago(r.t)}</div></div><div class="vqx"><button type="button" class="btn w s" data-a="vqOk,${r.id}">Aprovar</button><button type="button" class="btn s" data-a="vqNo,${r.id}">Recusar</button></div></div>`).join('')}`);
 e.setAttribute('role','alertdialog');e.setAttribute('aria-live','assertive');e.setAttribute('aria-label','Solicitação de vínculo de médico à sala')};

const reset=()=>{OPEN=false;focused=false;prevPend=false;prevKey='';prevSes=null;seen=new Set();started=false;['vq-pick','vq-adm'].forEach(i=>hide(document.getElementById(i)));const p=document.getElementById('vq-pill');if(p)p.remove()};
const tick=()=>{if(!me){reset();return}
 if(isMed())medTick();else{hide(document.getElementById('vq-pick'));const p=document.getElementById('vq-pill');if(p)p.remove()}
 if(isAdm())admTick();else hide(document.getElementById('vq-adm'))};

/* ---------- ações ---------- */
Object.assign(A,{
 vqOpen(){OPEN=true;focused=false;tick()},
 vqClose(){OPEN=false;tick()},
 vqCancel(){S.mr=mrL().filter(r=>!(r.u===me.u&&r.st==='pend'));save();focused=false;tick()},
 vqPick(sala){if(!isMed())return;if(!me.m){toast('Seu usuário ainda não está ligado a um cadastro de médico.');return}
  if(!SL().some(r=>r.id===sala)){toast('Essa sala não existe mais.');return}
  if(myLinks().some(v=>v.sala===sala)){toast('Você já está nessa sala.');return}
  S.mr=mrL().filter(r=>r.u!==me.u);S.mr.push({id:uid(),med:me.m,u:me.u,sala,rn:roomN(sala),t:new Date().toISOString(),st:'pend'});save();focused=false;tick()},
 vqOk(id){if(!isAdm())return;const r=mrL().find(x=>x.id===id);if(!r)return;
  const room=findRoom(r);if(!room){S.mr=mrL().filter(x=>x.id!==id);save();tick();toast('Essa sala foi removida. Pedido descartado.');return}
  const n=nowS();mvL().forEach(v=>{if(v.med===r.med&&actv(v))v.fim=n});
  S.mv=mvL().filter(v=>v.fim>v.ini);S.mv.push({id:uid(),med:r.med,sala:room.id,ini:n,fim:FOREVER,ses:1,by:(me&&me.u)||''});
  S.mr=mrL().filter(x=>x.id!==id);save();render();tick();toast(medN(r.med)+' vinculado(a) à sala '+room.nome+'.')},
 vqNo(id){if(!isAdm())return;const r=mrL().find(x=>x.id===id);if(!r)return;r.st='no';r.by=(me&&me.u)||'';save();tick();toast('Pedido recusado.')}});

/* ao sair, o vínculo do médico termina (e espera o envio antes de recarregar, no modo nuvem) */
const out=A.out;
A.out=async function(){
 try{if(me){const n=nowS();
   if(me.m)mvL().forEach(v=>{if(v.ses&&v.med===me.m&&actv(v))v.fim=n});
   S.mv=mvL().filter(v=>v.fim>v.ini);S.mr=mrL().filter(r=>r.u!==me.u);save();
   try{sessionStorage.removeItem(FLAG)}catch(e){}
   reset();if(window.RSL_REMOTE&&Store.idle)await Store.idle()}}catch(e){}
 return out.apply(this,arguments)};

/* modo local: acompanha as mudanças feitas em outra aba do mesmo navegador (serve para testar) */
window.addEventListener('storage',e=>{if(window.RSL_REMOTE||e.key!==Store.KEY||!e.newValue)return;
 try{const n=JSON.parse(e.newValue);if(Array.isArray(n.mv))S.mv=n.mv;if(Array.isArray(n.mr))S.mr=n.mr;tick()}catch(x){}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&OPEN&&isMed()){OPEN=false;tick()}});
setInterval(tick,1000);tick();
})();
