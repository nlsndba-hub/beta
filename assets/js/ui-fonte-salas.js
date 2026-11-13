/* ===== v14: troca de fonte (5 opções, em ordem) ===== */
const FONTS=[['Atkinson Hyperlegible','"Atkinson Hyperlegible",Verdana,sans-serif'],['Arial','Arial,Helvetica,sans-serif'],['Verdana','Verdana,Geneva,sans-serif'],['Roboto','Roboto,"Segoe UI",Arial,sans-serif'],['Open Sans','"Open Sans","Segoe UI",Arial,sans-serif']];
let FI=1;
const ffApply=()=>{document.body.style.fontFamily=FONTS[FI][1]};ffApply();
Object.assign(A,{font(){FI=(FI+1)%FONTS.length;ffApply();render()}});


/* ===== v15: Salas (croqui do prédio) — Visualizar e Cadastrar ===== */
const COLS=24,ROWS=12,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ov=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const demoSL=()=>[['Recepção',0,0,5,3],['Ultrassonografia',5,0,6,3],['Mamografia',11,0,6,3],['Biópsias e Punções',17,0,7,3],['Espera',0,3,3,5],['Sala de laudos',0,8,3,4],...Array.from({length:6},(_,i)=>['Consultório '+(i+1),4+(i%3)*5,4+Math.floor(i/3)*5,5,3])].map(([nome,x,y,w,h])=>({id:uid(),nome,x,y,w,h,vinc:''}));
const SL=()=>S.sl||(S.sl=demoSL()),pos=r=>`left:${r.x/COLS*100}%;top:${r.y/ROWS*100}%;width:${r.w/COLS*100}%;height:${r.h/ROWS*100}%`;
const nz=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase(),m2=h=>+h.slice(0,2)*60+ +h.slice(3,5),hm2=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const names=r=>[r.nome,...String(r.vinc||'').split(',')].map(nz).filter(Boolean),hit=(r,a)=>{const n=names(r);return n.includes(nz(a.sala))||n.includes(nz(by('ex',a.ex).nome))};
const linked=r=>names(r).some(n=>salas().some(q=>nz(q)===n)||S.ex.some(e=>nz(e.nome)===n||nz(e.sala)===n));
const curA=(l,m)=>l.find(a=>a.ent&&!a.sai)||l.find(a=>!a.sai&&m2(a.hora)<=m&&m<m2(a.hora)+30),occ=(r,d,hm)=>{const m=m2(hm),l=S.ag.filter(a=>!OFF.includes(a.st)&&a.data===d&&hit(r,a)).sort(srt);return{r,l,link:linked(r),cur:curA(l,m),es:(c=>!!c&&m2(c.hora)+30-m<=10)(curA(l,m)),nx:l.find(a=>m2(a.hora)>m&&m2(a.hora)<=m+30)}};
let SELR=null,DR=null;
/* v20: quem está na sala — estetoscópio + médico(a), ícone de paciente + paciente, e o exame abaixo */
const PI='<svg class="pi" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect class="pi-t" x="1" y="1" width="22" height="22" rx="7"/><circle class="pi-p" cx="12" cy="9.3" r="3.7"/><path class="pi-p" d="M5.8 18.4c0-2.7 2.8-4.3 6.2-4.3s6.2 1.6 6.2 4.3c0 .6-.4 1-1 1H6.8c-.6 0-1-.4-1-1z"/></svg>';
const who=(a,full=true)=>`<div class="who">${full?`<div>${IC('steth')}<strong>${esc(sn(by('med',a.med).nome))}</strong></div><div>${PI}<strong>${esc(sn(by('pac',a.pac).nome))}</strong></div>`:''}<div class="ex">${esc(by('ex',a.ex).nome)}</div></div>`;
V.salv=()=>{const d=F.sd||today(),hm=F.sh||new Date().toTimeString().slice(0,5),R=SL().map(r=>occ(r,d,hm)),st=o=>!o.link?'n':o.cur?(o.es?'s':'o'):o.nx?'s':'l',LB={l:'Livre',o:'Ocupada',s:'Em breve',n:'Sem vínculo'},cnt=k=>R.filter(o=>st(o)===k).length;
 return`<h1>Salas · Visualizar</h1><p class="sub">Situação das salas no horário escolhido. Cada exame ocupa a sala por 30 minutos. Clique numa sala para ver a agenda dela.</p>
 <div class="top"><div><label for="sd">Data</label><input id="sd" type="date" data-f="sd" value="${d}"></div><div><label for="sh">Hora</label><input id="sh" type="time" data-f="sh" value="${hm}"></div><div><label>&nbsp;</label><button class="btn" data-a="slNow">Agora</button></div><div class="sp"></div><div class="nx-chips">${['l','o','s','n'].map(k=>`<span class="rl ${k}"><i></i>${LB[k]}: ${cnt(k)}</span>`).join('')}</div></div>
 <div class="cr-wrap v"><div class="cr-area"><div class="cr-cv">${R.map(o=>{const k=st(o),a=o.cur||o.nx;return`<button class="rm ${k}" style="${pos(o.r)}" data-a="slInfo,${o.r.id}"><b>${esc(o.r.nome)}</b><span>${k==='s'&&o.cur?'Terminando':LB[k]}${o.cur?' até '+hm2(m2(o.cur.hora)+30):o.nx?' às '+o.nx.hora:''}</span>${a?who(a):''}</button>`}).join('')}</div></div></div>`};
V.salc=()=>{const L=SL(),r=L.find(x=>x.id===SELR),opts=[...new Set([...salas(),...S.ex.map(e=>e.nome)])];
 return`<h1>Salas · Cadastrar</h1><p class="sub">Monte o croqui: arraste os quadrados, puxe o canto para redimensionar e nomeie cada sala (o nome vincula à sala ou exame).</p>
 <div class="top"><button class="btn p" data-a="slAdd">${IC('plus')}Adicionar sala</button><span class="hint">Grade ${COLS} × ${ROWS} · ${L.length} sala(s)</span></div>
 <div class="cr-wrap"><div class="cr-area"><div class="cr-cv ed" id="cr">${L.map(x=>`<div class="rm${x.id===SELR?' sel':''} ${linked(x)?'l':'n'}" data-id="${x.id}" style="${pos(x)}"><b>${esc(x.nome)}</b><div class="rs"></div></div>`).join('')}</div></div>
 <section class="pn cr-pn"><h3>Sala selecionada</h3>${r?`<div><label for="r_n">Nome da sala</label><input id="r_n" list="dl" value="${esc(r.nome)}" autocomplete="off"><datalist id="dl">${opts.map(o=>`<option value="${esc(o)}">`).join('')}</datalist></div><div><label for="r_v">Outros nomes vinculados (opcional, separe por vírgula)</label><input id="r_v" value="${esc(r.vinc||'')}" autocomplete="off"></div><div class="hint">${linked(r)?`Vinculada. ${S.ag.filter(a=>hit(r,a)).length} exame(s) na agenda.`:'Sem vínculo: o nome não coincide com nenhuma sala ou exame cadastrado.'}</div><div class="acts"><button class="btn p" data-a="slSave">Salvar</button><button class="btn d" data-a="slDel">Excluir</button></div>`:'<div class="hint">Clique num quadrado para nomear e vincular, ou use “Adicionar sala”.</div>'}</section></div>`};
Object.assign(A,{slNow(){F.sd='';F.sh='';render()},
 slInfo(id){const r=SL().find(x=>x.id===id),d=F.sd||today(),o=occ(r,d,F.sh||new Date().toTimeString().slice(0,5));modal(`<h2 class="f">${esc(r.nome)}</h2><div class="f hint">${o.link?'Agenda de '+fd(d):'Sem vínculo com sala ou exame. Ajuste o nome em Salas › Cadastrar.'}</div>`+(o.l.length?`<div class="f">${o.l.map(a=>`<div class="row"><span>${a.hora} · ${esc(sn(by('pac',a.pac).nome))} · ${esc(by('ex',a.ex).nome)} · ${esc(sn(by('med',a.med).nome))}</span>${sb('',`det,${a.id}`,'Detalhes')}</div>`).join('')}</div>`:'<div class="f hint">Nenhum exame neste dia.</div>'))},
 slAdd(){const L=SL();for(let y=0;y<=ROWS-3;y++)for(let x=0;x<=COLS-4;x++){const t={x,y,w:4,h:3};if(!L.some(r=>ov(r,t))){const r={id:uid(),nome:'Nova sala',...t,vinc:''};L.push(r);SELR=r.id;save();render();return}}toast('Sem espaço livre no croqui')},
 slSave(){const r=SL().find(x=>x.id===SELR);if(!r)return;const n=$('#r_n').value.trim();if(!n){toast('Dê um nome à sala');return}r.nome=n;r.vinc=$('#r_v').value.trim();save();toast('Sala salva');render()},
 slDel(){const r=SL().find(x=>x.id===SELR);if(r&&confirm('Excluir a sala “'+r.nome+'” do croqui?')){S.sl=SL().filter(x=>x!==r);SELR=null;save();render()}}});
document.addEventListener('pointerdown',e=>{if(view!=='salc')return;const el=e.target.closest('#cr .rm');if(!el){if(e.target.closest('#cr')&&SELR){SELR=null;render()}return}
 const r=SL().find(x=>x.id===el.dataset.id),b=$('#cr').getBoundingClientRect();if(!r)return;SELR=r.id;DR={r,rs:!!e.target.closest('.rs'),x0:e.clientX,y0:e.clientY,ox:r.x,oy:r.y,ow:r.w,oh:r.h,cw:b.width/COLS,ch:b.height/ROWS};try{el.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault()});
document.addEventListener('pointermove',e=>{if(!DR)return;const r=DR.r,dx=Math.round((e.clientX-DR.x0)/DR.cw),dy=Math.round((e.clientY-DR.y0)/DR.ch);
 if(DR.rs){r.w=clamp(DR.ow+dx,2,COLS-r.x);r.h=clamp(DR.oh+dy,2,ROWS-r.y)}else{r.x=clamp(DR.ox+dx,0,COLS-r.w);r.y=clamp(DR.oy+dy,0,ROWS-r.h)}
 const el=document.querySelector('#cr .rm[data-id="'+r.id+'"]');if(el)el.style.cssText=pos(r)});
const dEnd=()=>{if(!DR)return;const r=DR.r;if(SL().some(o=>o!==r&&ov(o,r))){Object.assign(r,{x:DR.ox,y:DR.oy,w:DR.ow,h:DR.oh});toast('Esse espaço já está ocupado por outra sala')}DR=null;save();render()};
document.addEventListener('pointerup',dEnd);document.addEventListener('pointercancel',dEnd);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target.id==='r_n'||e.target.id==='r_v'))A.slSave()});
setInterval(()=>{if(me&&view==='salv'&&!F.sh&&!F.sd&&!document.querySelector('dialog[open]'))render()},60000);

