/* ===== v35 — Integração PACS: visualizar exames, worklist (RIS→PACS) e retorno de laudos ===== */
(()=>{
const PI=()=>Object.assign({modo:'sim',wurl:'',wtok:'',lurl:'',ltok:'',lview:'',ris:'RIS',aet:'PACS',host:'',port:'104'},S.cfg.pi||{});
const log=(a,t)=>{(a.log=a.log||[]).push({t:new Date().toISOString(),u:me.u,st:t})};
const fill=(t,a)=>{const p=by('pac',a.pac),m={id:a.id,accession:acc(a),paciente:encodeURIComponent(p.nome||''),pacid:a.pac,cpf:String(p.cpf||'').replace(/\D/g,''),studyuid:a.suid||acc(a)};return String(t).replace(/\{(\w+)\}/g,(x,k)=>k in m?m[k]:x)};
const pay=a=>Object.assign(wl(a),{SpecificCharacterSet:'ISO_IR 192',ScheduledStationAETitle:PI().aet});
const hl7=a=>{const p=by('pac',a.pac),n=String(p.nome||'').trim().split(/\s+/),ts=new Date().toISOString().replace(/\D/g,'').slice(0,14),k=acc(a);
 return['MSH|^~\\&|'+PI().ris+'|CLINICA|'+PI().aet+'|PACS|'+ts+'||ORM^O01|'+k+'|P|2.3','PID|1||'+a.pac+'||'+n[n.length-1]+'^'+n.slice(0,-1).join(' ')+'||'+(p.nasc||'').replace(/-/g,''),'ORC|NW|'+k,'OBR|1|'+k+'||'+MOD(a.sala)+'^'+by('ex',a.ex).nome+'|||'+a.data.replace(/-/g,'')+a.hora.replace(':','')+'00|||||||||'+(by('med',a.sol).nome||'')+'||||||||'+MOD(a.sala)].join('\r')};
const dl=(n,t,m)=>{const u=URL.createObjectURL(new Blob([t],{type:m})),x=document.createElement('a');x.href=u;x.download=n;document.body.appendChild(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)};
const rec=()=>S.ag.filter(a=>!OFF.includes(a.st)&&a.data>=addD(today(),-7)).sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
const send=async a=>{const p=PI();
 if(p.modo==='web'){if(!p.wurl)throw new Error('informe a URL do webhook em Configurações › Integração PACS');
  const r=await fetch(p.wurl,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},p.wtok?{Authorization:p.wtok}:{}),body:JSON.stringify(pay(a))});
  if(!r.ok)throw new Error('o servidor respondeu '+r.status)}
 a.px='Na worklist';log(a,p.modo==='web'?'Worklist enviada ao PACS':'Worklist enviada (simulado)')};
const imp=list=>{const arr=Array.isArray(list)?list:(list&&(list.laudos||list.reports))||[];let ok=0,ig=0,sem=0;const r0=render;render=()=>{};
 try{arr.forEach(r=>{const k=String(r.AccessionNumber||r.accession||'').trim(),a=S.ag.find(x=>acc(x)===k);if(!a){sem++;return}
  if(!/laudad|final|complet|report/i.test(String(r.Status||'Laudado'))||!['Realizado','Laudo liberado'].includes(a.st)){ig++;return}
  if(r.ReportUrl)a.laudoUrl=String(r.ReportUrl);if(r.StudyInstanceUID)a.suid=String(r.StudyInstanceUID);a.px='Laudado';
  if(a.st!=='Laudo liberado')A.st(a.id,'Laudo liberado');ok++})}finally{render=r0}
 save();render();toast(ok+' laudo(s) importado(s)'+(ig?' · '+ig+' ignorado(s) (exame não realizado ou sem laudo)':'')+(sem?' · '+sem+' sem correspondência':''))};
const busca=async()=>{const p=PI();if(!p.lurl){toast('Informe a URL de consulta de laudos em Configurações › Integração PACS');return}
 try{const r=await fetch(p.lurl,{headers:p.ltok?{Authorization:p.ltok}:{}});if(!r.ok)throw new Error('o servidor respondeu '+r.status);imp(await r.json())}catch(e){toast('Falha ao buscar laudos: '+e.message)}};

Object.assign(A,{
 pacs(id){const a=by('ag',id),u=S.cfg.pacs;if(!u){toast('Configure o visualizador em Configurações › Integração PACS');return}open(fill(u,a),'_blank','noopener')},
 async wlSend(id){try{await send(by('ag',id));save();render();toast(PI().modo==='web'?'Worklist enviada ao PACS':'Worklist enviada (simulado)')}catch(e){toast('Falha ao enviar: '+e.message+(/fetch|network/i.test(e.message)?' (confira a URL e o CORS do servidor)':''))}},
 async wlAll(){const l=rec().filter(a=>!a.px);if(!l.length){toast('Nada pendente de envio.');return}let ok=0,er='';
  for(const a of l){try{await send(a);ok++}catch(e){er=e.message;break}}save();render();toast(er?ok+' enviada(s). Parou por falha: '+er:ok+' worklist(s) enviada(s)')},
 wlExp(k){const l=rec().filter(a=>!a.px);if(!l.length){toast('Nenhum exame pendente de envio.');return}
  if(k==='hl7')dl('worklist-'+today()+'.hl7',l.map(hl7).join('\r\n\r\n'),'text/plain');else dl('worklist-'+today()+'.json',JSON.stringify(l.map(pay),null,2),'application/json');toast(l.length+' exame(s) exportado(s)')},
 lgBusca:busca,
 lgView(id){const a=by('ag',id),u=a.laudoUrl||(PI().lview?fill(PI().lview,a):'');if(!u){toast('Sem link de laudo. Configure em Integração PACS.');return}open(u,'_blank','noopener')},
 lgImp(){modal(`<h2 class="f">Importar retorno de laudos</h2><p class="hint f">Cada item: {"AccessionNumber":"...","Status":"Laudado","ReportUrl":"https://...","StudyInstanceUID":"..."}</p><div class="f"><label for="lg_f">Arquivo .json</label><input id="lg_f" type="file" accept=".json,application/json"></div><div class="f"><label for="lg_t">ou cole o JSON</label><textarea id="lg_t" rows="6"></textarea></div><div class="f acts"><button class="btn p" data-a="lgGo">Importar</button></div>`)},
 async lgGo(){let t=$('#lg_t').value.trim();const f=$('#lg_f').files[0];if(f)t=await f.text();if(!t){toast('Cole o JSON ou escolha um arquivo.');return}try{imp(JSON.parse(t))}catch(e){toast('JSON inválido: '+e.message)}},
 pcPre(v){if(v==='ohif')$('#pc_v').value='https://SEU-SERVIDOR/viewer?StudyInstanceUIDs={studyuid}'},
 pcSave(){const g=i=>$('#'+i).value.trim();S.cfg.pacs=g('pc_v');S.cfg.pi={modo:g('pc_m'),wurl:g('pc_wu'),wtok:g('pc_wt'),lurl:g('pc_lu'),ltok:g('pc_lt'),lview:g('pc_lv'),ris:g('pc_ris')||'RIS',aet:g('pc_aet')||'PACS',host:g('pc_h'),port:g('pc_p')||'104'};save();render();toast('Integração PACS salva')}});

window.PCCFG=()=>{const p=PI(),f=(i,l,v,h,t)=>`<div><label for="${i}">${l}</label><input id="${i}" type="${t||'text'}" autocomplete="off" value="${esc(v)}">${h?`<span class="hint">${h}</span>`:''}</div>`;
 return`<div class="top"><div class="sp"></div><button class="btn p" data-a="pcSave">Salvar integração</button></div><div class="fx"><div style="display:grid;gap:12px;max-width:640px">
 <h2>1. Visualizar as imagens</h2><div><label for="pc_pre">Modelo de visualizador</label><select id="pc_pre" onchange="A.pcPre(this.value)"><option value="">Personalizado</option><option value="ohif">OHIF Viewer</option></select></div>
 ${f('pc_v','URL do visualizador',S.cfg.pacs||'','Campos: {accession} {studyuid} {pacid} {cpf} {paciente} {id}. O {studyuid} vem do retorno do PACS; sem ele, usa o accession.')}
 <h2>2. Enviar worklist (RIS → PACS)</h2><div><label for="pc_m">Modo de envio</label><select id="pc_m"><option value="sim" ${p.modo==='web'?'':'selected'}>Simulado (não envia nada)</option><option value="web" ${p.modo==='web'?'selected':''}>Webhook (POST JSON)</option></select></div>
 ${f('pc_wu','URL do webhook / gateway',p.wurl,'Servidor que recebe o JSON e o transforma em worklist DICOM (MWL).')}${f('pc_wt','Token (cabeçalho Authorization)',p.wtok,'Fica salvo neste navegador.','password')}
 ${f('pc_ris','AE Title do RIS',p.ris)}${f('pc_aet','AE Title do PACS',p.aet)}${f('pc_h','Endereço (IP) do PACS',p.host,'Informativo: usado na configuração do gateway.')}${f('pc_p','Porta DICOM',p.port)}
 <h2>3. Retorno de laudos</h2>${f('pc_lu','URL de consulta de laudos (GET, JSON)',p.lurl,'Usada pelo botão “Buscar laudos” da tela PACS / Worklist.')}${f('pc_lt','Token da consulta',p.ltok,'','password')}${f('pc_lv','URL do laudo (PDF/visualização)',p.lview,'Campos: {accession} {cpf} {id}. Usada se o retorno não trouxer ReportUrl.')}</div></div>`};

V.pacs=()=>{const l=rec(),p=PI(),un=l.filter(a=>!a.px).length;
 return`<h1>PACS / Worklist</h1><p class="sub">Envia a worklist ao PACS (modo atual: <b>${p.modo==='web'?'webhook':'simulado'}</b>), abre as imagens e recebe o retorno do laudo, que gera o repasse. Ajuste em Configurações › Integração PACS.</p><div class="top"><button class="btn p" data-a="wlAll">Enviar pendentes (${un})</button><button class="btn" data-a="lgBusca">Buscar laudos</button><button class="btn" data-a="lgImp">Importar laudos</button><button class="btn" data-a="wlExp,json">Exportar worklist JSON</button><button class="btn" data-a="wlExp,hl7">Exportar HL7</button></div>`+
 tbl(['Accession','Paciente','Modalidade · sala','Radiologista','Estudo no PACS','Ações'],l.map(a=>`<tr><td>${acc(a)}</td><td>${esc(sn(by('pac',a.pac).nome))}<br><span class="hint">${fd(a.data)} ${a.hora}</span></td><td>${MOD(a.sala)} · ${esc(a.sala)}</td><td>${esc(sn(by('med',a.med).nome))}</td><td><span class="tag ${a.px==='Laudado'||a.st==='Laudo liberado'?'ok':a.px?'wr':''}">${a.st==='Laudo liberado'?'Laudado':a.px||'Não enviado'}</span></td><td style="white-space:nowrap">${a.px?'':`<button class="btn s p" data-a="wlSend,${a.id}">Enviar worklist</button> `}<button class="btn s" data-a="wlJson,${a.id}">Payload</button> <button class="btn s" data-a="pacs,${a.id}">Visualizar</button>${a.laudoUrl||p.lview?` <button class="btn s" data-a="lgView,${a.id}">Laudo</button>`:''}${a.st==='Realizado'?` <button class="btn s w" data-a="wlLaudo,${a.id}">Simular laudo</button>`:''}</td></tr>`),'Nenhum exame recente.')};
})();

