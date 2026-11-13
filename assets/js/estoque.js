/* ===== v31 · ESTOQUE — telas e ações ===== */
(()=>{
 const ts=t=>new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}),
  TP={ent:['Entrada','ok'],sai:['Saída','wr'],aj:['Ajuste','bad']},pode=()=>adm()||me.r==='fin',
  nm=(a,b)=>a.item.localeCompare(b.item,'pt-BR'),
  EF=(ti,fl,v,fn)=>form(ti,fl,v,o=>{const r=fn(o);if(r){toast(r);setTimeout(()=>EF(ti,fl,{...v,...o},fn),0)}}),
  dif=l=>l.cont==null?null:q3(l.cont-l.esp),
  dTag=d=>d===null?'—':d===0?'<span class="tag ok">confere</span>':`<span class="tag ${d<0?'bad':'wr'}">${d>0?'+':''}${eN(d)}</span>`,
  ivProg=v=>{const c=v.lin.filter(l=>l.cont!=null);return`${c.length} de ${v.lin.length} linhas contadas · ${c.filter(dif).length} divergência(s)`},
  motSel=(l,d)=>`<select data-cm="${l.id}" ${d?'':'disabled'} class="${d&&!l.mot&&F.ive?'er':''}" aria-label="Motivo da divergência"><option value="">Motivo…</option>${EST_MI.map(m=>`<option ${l.mot===m?'selected':''}>${m}</option>`).join('')}</select>`,
  espT=(l,v,i)=>!v.cego||l.cont!=null?eN(l.esp??eBal(i,l.lote)):'<span class="hint">oculto</span>',
  ivRow=(l,v)=>{const i=by('est',l.item),d=dif(l);return`<tr class="${d?'dvr':''}"><td>${esc(i.item)}${i.ativo===false?' <span class="tag">inativo</span>':''}<br><span class="hint">${esc([i.cod,i.local].filter(Boolean).join(' · '))}</span></td><td>${l.lote?esc(l.lote)+(l.val?'<br><span class="hint">val. '+fd(l.val)+'</span>':''):'—'}</td><td>${esc(i.un)}</td><td class="ie">${espT(l,v,i)}</td><td><input class="ci" type="number" min="0" step="any" inputmode="decimal" data-ci="${l.id}" value="${l.cont??''}" aria-label="Contagem de ${esc(i.item)}"></td><td class="id">${dTag(d)}</td><td>${motSel(l,d)}</td></tr>`},
  ivCells=(tr,l,v)=>{const i=by('est',l.item),d=dif(l);if(tr){tr.classList.toggle('dvr',!!d);tr.querySelector('.ie').innerHTML=espT(l,v,i);tr.querySelector('.id').innerHTML=dTag(d);tr.lastElementChild.innerHTML=motSel(l,d)}const p=$('#ivp');if(p)p.textContent=ivProg(v)},
  dl=(n,rows)=>{if(!rows.length){toast('Sem dados para exportar');return}const ks=Object.keys(rows[0]),c=x=>'"'+String(typeof x==='number'?String(x).replace('.',','):x??'').replace(/"/g,'""')+'"',b=new Blob(['\ufeff'+[ks.join(';'),...rows.map(r=>ks.map(k=>c(r[k])).join(';'))].join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n+'.csv';a.click()};

 /* cadastro do item */
 const itF=i=>[['item','Item','text'],['cod','Código / referência','text'],['cat','Categoria','sel',EST_CAT],['un','Unidade','sel',[...new Set([...EST_UN,i.un].filter(Boolean))]],['ctl','Controla lote e validade?','sel',[['n','Não'],['s','Sim']]],['min','Estoque mínimo','number'],['max','Estoque máximo (opcional)','number'],['custo','Custo unitário (R$)','number'],['forn','Fornecedor','text'],['local','Local de armazenamento','text'],...(i.id?[]:[['qtd','Saldo inicial (só para itens sem lote)','number']])],
  estEdit=id=>{const i=id?by('est',id):{},v=id?{...i,ctl:i.ctl?'s':'n'}:{cat:EST_CAT[0],un:'un',ctl:'n',min:0,max:0,custo:0,qtd:0};
   EF(id?'Editar item':'Novo item de estoque',itF(i),v,o=>{const n=o.item.trim(),c=o.ctl==='s';
    if(!n)return'Informe o nome do item.';
    if(S.est.some(x=>x.id!==id&&x.item.trim().toLowerCase()===n.toLowerCase()))return'Já existe um item com este nome.';
    if(o.max>0&&o.max<o.min)return'O máximo não pode ser menor que o mínimo.';
    const d={item:n,cod:o.cod.trim(),cat:o.cat,un:o.un,ctl:c,min:o.min,max:o.max,custo:o.custo,forn:o.forn.trim(),local:o.local.trim()};
    if(id){if(i.ctl&&!c&&i.lotes.length)return'Zere os lotes antes de desligar o controle de lote.';if(!i.ctl&&c&&i.qtd>0)i.lotes=[{n:'SEM LOTE',val:'',q:i.qtd}];Object.assign(i,d);if(!c)i.lotes=[]}
    else{const x={id:uid(),...d,qtd:0,lotes:[],ativo:true};S.est.push(x);if(!c&&o.qtd>0)eMv(x,o.qtd,{tipo:'ent',mot:'Saldo inicial'});toast('Item cadastrado'+(c?'. Use Entrada para informar lote e validade.':'.'))}
    return''})},
  livre=i=>{if(i.ativo===false){toast('Item inativo. Reative para movimentar.');return false}return true};
 const a0=A.add,e0=A.edit,d0=A.del;
 A.add=c=>c==='est'?estEdit():a0(c);A.edit=(c,id)=>c==='est'?estEdit(id):e0(c,id);A.del=(c,id)=>c==='est'?A.estDel(id):d0(c,id);
 A.mov=(id,n)=>+n>0?A.estIn(id):A.estOut(id);
 A.estIn=id=>{const i=by('est',id);if(!livre(i))return;
  EF('Entrada — '+i.item,[['q','Quantidade recebida ('+i.un+')','number'],...(i.ctl?[['lote','Lote','text'],['val','Validade','date']]:[]),['custo','Custo unitário (R$) — opcional','number'],['forn','Fornecedor / nota fiscal','text'],['pg','Gerar conta a pagar (Financeiro)','sel',[['','Não gerar'],['0','Vencimento hoje'],['30','Vence em 30 dias'],['60','Vence em 60 dias']]]],{custo:i.custo||0,pg:''},o=>{
   const q=q3(o.q);if(q<=0)return'Informe uma quantidade maior que zero.';
   if(i.ctl&&o.val&&o.val<today())return'Não é possível dar entrada em lote já vencido.';
   if(o.pg!==''&&!(o.custo>0))return'Informe o custo unitário para gerar a conta a pagar.';
   const r=eMv(i,q,{tipo:'ent',lote:(o.lote||'').trim(),val:o.val,custo:o.custo,mot:'Recebimento',obs:o.forn});if(r)return r;
   if(o.pg!=='')S.pag.push({id:uid(),desc:'Compra de '+i.item+' ('+eN(q)+' '+i.un+')'+(o.forn?' — '+o.forn:''),cat:'Insumos',valor:+(q*o.custo).toFixed(2),venc:addD(today(),+o.pg),pago:false,est:i.id});
   toast('Entrada registrada'+(o.pg!==''?'. Conta a pagar criada.':'.'));return''})};
 A.estOut=id=>{const i=by('est',id);if(!livre(i))return;
  EF('Saída — '+i.item,[['q','Quantidade ('+i.un+')','number'],['mot','Motivo','sel',EST_MS],...(i.ctl?[['lote','Lote','sel',[['','Automático (vence primeiro)'],...eLots(i).map(l=>[l.n,l.n+' · '+(l.val?fd(l.val):'sem validade')+' · '+eN(l.q)+' '+i.un+(eSt(l)==='v'?' · VENCIDO':'')])]]]:[]),['obs','Observação','area']],{q:1,mot:'Consumo'},o=>{
   const q=q3(o.q);if(q<=0)return'Informe uma quantidade maior que zero.';
   const r=eMv(i,-q,{tipo:'sai',lote:o.lote||'',exp:o.mot==='Vencido (descarte)'&&!o.lote,mot:o.mot,obs:o.obs});if(r)return r;toast('Saída registrada.');return''})};
 A.estHist=id=>{const i=by('est',id),M=S.mov.filter(m=>m.item===id).sort((a,b)=>b.t.localeCompare(a.t)),usado=M.length||S.inv.some(v=>v.lin.some(l=>l.item===id));
  modal(`<h2 class="f">${esc(i.item)}</h2><div class="f hint">${esc(i.cat)}${i.cod?' · cód. '+esc(i.cod):''}</div><dl class="inf f"><dt>Saldo</dt><dd>${eN(i.qtd)} ${esc(i.un)}</dd><dt>Mínimo / máximo</dt><dd>${eN(i.min)} / ${i.max?eN(i.max):'—'}</dd>${eCost()?`<dt>Custo unitário</dt><dd>${brl(i.custo)} · em estoque ${brl(i.custo*i.qtd)}</dd>`:''}<dt>Fornecedor</dt><dd>${esc(i.forn||'—')}</dd><dt>Local</dt><dd>${esc(i.local||'—')}</dd></dl>
  ${i.ctl?`<div class="f"><div class="hint">Lotes com saldo (vence primeiro, no topo)</div>${eLots(i).map(l=>`<div class="hint">${esc(l.n)} · ${l.val?'val. '+fd(l.val):'sem validade'} · ${eN(l.q)} ${esc(i.un)} ${eSt(l)==='v'?'<span class="tag bad">vencido</span>':eSt(l)?'<span class="tag wr">vence em breve</span>':''}</div>`).join('')||'<div class="hint">Nenhum lote com saldo.</div>'}</div>`:''}
  <div class="f"><div class="hint">Últimas movimentações</div>${M.slice(0,12).map(m=>`<div class="hint">${ts(m.t)} · ${(TP[m.tipo]||['?'])[0]} ${m.q>0?'+':''}${eN(m.q)} → saldo ${eN(m.saldo)}${m.lote?' · lote '+esc(m.lote):''} · ${esc(m.mot)} · ${esc(m.u)}</div>`).join('')||'<div class="hint">Sem movimentações.</div>'}</div>
  <div class="f acts"><button class="btn" data-a="estEd,${id}">Editar cadastro</button><button class="btn" data-a="estAtv,${id}">${i.ativo===false?'Reativar item':'Inativar item'}</button>${usado?'':`<button class="btn d" data-a="estDel,${id}">Excluir item</button>`}</div>`)};
 A.estEd=id=>{closeM();estEdit(id)};
 A.estAtv=id=>{const i=by('est',id);if(i.ativo!==false&&i.qtd>0&&!confirm('Este item ainda tem saldo. Inativar mesmo assim? Ele deixa de gerar alertas e de entrar nos inventários.'))return;i.ativo=i.ativo===false;save();render()};
 A.estDel=id=>{if(S.mov.some(m=>m.item===id)||S.inv.some(v=>v.lin.some(l=>l.item===id))){toast('Item com histórico não pode ser excluído. Use Inativar.');return}if(confirm('Excluir este item?')){S.est=S.est.filter(x=>x.id!==id);S.ex.forEach(e=>{e.ins=(e.ins||[]).filter(x=>x.item!==id)});save();render()}};
 A.esf=k=>{F.ee=k;PGN={};render()};
 A.estCsv=k=>k==='est'?dl('estoque',S.est.map(i=>({Item:i.item,Codigo:i.cod,Categoria:i.cat,Unidade:i.un,Saldo:i.qtd,Minimo:i.min,Maximo:i.max,...(eCost()?{Custo:i.custo}:{}),Controla_lote:i.ctl?'sim':'nao',Lotes:(i.lotes||[]).map(l=>l.n+':'+(l.val||'')+':'+l.q).join(' | '),Ativo:i.ativo===false?'nao':'sim'}))):dl('movimentacoes',S.mov.map(m=>({Data:m.t,Item:by('est',m.item).item||'',Tipo:(TP[m.tipo]||['?'])[0],Qtd:m.q,Saldo:m.saldo,Lote:m.lote,Validade:m.val,Motivo:m.mot,Obs:m.obs,Usuario:m.u})));

 /* inventário */
 A.ivNew=()=>{if(ivOpen()){toast('Já existe um inventário aberto. Conclua ou cancele antes de abrir outro.');return}
  form('Novo inventário',[['esc','Escopo','sel',[['','Todos os itens ativos'],...EST_CAT.map(c=>[c,'Somente: '+c])]],['cego','Contagem às cegas (oculta o saldo do sistema)','sel',[['s','Sim — recomendado'],['n','Não']]]],{cego:'s'},o=>{
   const lin=[];eAt().filter(i=>!o.esc||i.cat===o.esc).sort((a,b)=>(a.local||'').localeCompare(b.local||'','pt-BR')||nm(a,b)).forEach(i=>{const ls=i.ctl?eLots(i):[];(ls.length?ls:[{n:'',val:''}]).forEach(l=>lin.push({id:uid(),item:i.id,lote:l.n,val:l.val||'',esp:null,cont:null,mot:''}))});
   if(!lin.length){toast('Nenhum item neste escopo.');return}
   S.inv.push({id:uid(),n:S.inv.length+1,ini:new Date().toISOString(),fim:'',u:me.u,esc:o.esc,cego:o.cego==='s',st:'aberto',lin});SH.est='iv';toast('Inventário aberto. Conte e digite a quantidade de cada linha.')})};
 document.addEventListener('change',e=>{const x=e.target.closest&&e.target.closest('[data-ci],[data-cm]');if(!x)return;const v=ivOpen(),l=v&&v.lin.find(y=>y.id===(x.dataset.ci||x.dataset.cm));if(!l)return;
  if(x.dataset.ci){const r=x.value.trim();if(r===''){l.cont=l.esp=null;l.mot=''}else{l.cont=q3(Math.max(0,+r));l.esp=eBal(by('est',l.item),l.lote)}}else l.mot=x.value;
  save();ivCells(x.closest('tr'),l,v)});
 A.ivCx=()=>{const v=ivOpen();if(v&&confirm('Cancelar o inventário nº '+v.n+'? As contagens serão descartadas e nenhum ajuste será feito.')){v.st='cancelado';v.fim=new Date().toISOString();save();render()}};
 A.ivEnd=()=>{const v=ivOpen();if(!v)return;if(!pode()){toast('Só Administrador ou Financeiro concluem o inventário.');return}
  const C=v.lin.filter(l=>l.cont!=null),D=C.filter(dif);if(!C.length){toast('Nenhuma linha foi contada.');return}
  if(D.some(l=>!l.mot)){F.ive=1;render();toast('Escolha o motivo de cada divergência.');return}
  const nc=v.lin.length-C.length;
  if(!confirm('Concluir o inventário nº '+v.n+'?\n\n• '+C.length+' linha(s) contada(s), '+D.length+' com divergência\n'+(nc?'• '+nc+' linha(s) NÃO contada(s): o saldo delas não será alterado\n':'')+'• Os ajustes entram no estoque e não podem ser desfeitos.'))return;
  D.forEach(l=>{const i=by('est',l.item),d=dif(l);l.dif=d;l.vd=q3(d*(i.custo||0));eMv(i,d,{tipo:'aj',lote:l.lote||(i.ctl?'SEM LOTE':''),val:l.val,semVal:1,clamp:1,mot:l.mot,obs:'Inventário nº '+v.n,ref:v.id})});
  v.st='fechado';v.fim=new Date().toISOString();v.fe=me.u;F.ive='';save();render();toast('Inventário concluído. Ajustes lançados.')};
 A.ivView=id=>{const v=S.inv.find(x=>x.id===id),D=v.st==='fechado'?v.lin.filter(l=>l.dif):[],C=v.lin.filter(l=>l.cont!=null).length;
  modal(`<h2 class="f">Inventário nº ${v.n}</h2><div class="f hint">${ts(v.ini)}${v.fim?' → '+ts(v.fim):''} · ${esc(v.esc||'Todos os itens')} · ${v.cego?'contagem às cegas':'saldo visível'}</div><dl class="inf f"><dt>Situação</dt><dd>${v.st==='fechado'?'Concluído':v.st==='aberto'?'Aberto':'Cancelado'}</dd><dt>Aberto por</dt><dd>${esc(v.u)}</dd>${v.fe?`<dt>Concluído por</dt><dd>${esc(v.fe)}</dd>`:''}<dt>Linhas</dt><dd>${v.lin.length} · contadas ${C} · divergentes ${D.length}</dd>${eCost()&&v.st==='fechado'?`<dt>Impacto</dt><dd>${brl(D.reduce((s,l)=>s+l.vd,0))}</dd>`:''}</dl>
  ${D.length?`<div class="f tw"><table><thead><tr><th>Item</th><th>Lote</th><th>Sistema</th><th>Contado</th><th>Dif.</th><th>Motivo</th></tr></thead><tbody>${D.map(l=>`<tr><td>${esc(by('est',l.item).item||'(removido)')}</td><td>${esc(l.lote||'—')}</td><td>${eN(l.esp)}</td><td>${eN(l.cont)}</td><td>${dTag(l.dif)}</td><td>${esc(l.mot)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="f hint">Sem divergências lançadas.</div>'}`)};

 /* insumos por exame */
 A.exIns=id=>{const e=by('ex',id),m=Object.fromEntries((e.ins||[]).map(x=>[x.item,x.qtd])),L=S.est.filter(i=>i.ativo!==false||m[i.id]).sort(nm);
  modal(`<h2 class="f">Insumos — ${esc(e.nome)}</h2><div class="f hint">Quantidade consumida por exame. A baixa acontece quando o exame é marcado como realizado e é estornada se ele for cancelado.</div><div class="f tw"><table><thead><tr><th>Item</th><th>Un</th><th>Qtd por exame</th></tr></thead><tbody>${L.map(i=>`<tr><td>${esc(i.item)}</td><td>${esc(i.un)}</td><td><input type="number" min="0" step="any" data-ei="${i.id}" value="${m[i.id]||''}" aria-label="Quantidade de ${esc(i.item)}"></td></tr>`).join('')||'<tr><td colspan="3">Cadastre itens em Estoque primeiro.</td></tr>'}</tbody></table></div><div class="f acts"><button class="btn p" data-a="exInsOk,${id}">Salvar</button></div>`)};
 A.exInsOk=id=>{by('ex',id).ins=[...document.querySelectorAll('dialog[open] [data-ei]')].filter(x=>+x.value>0).map(x=>({item:x.dataset.ei,qtd:q3(+x.value)}));closeM();save();render();toast('Insumos do exame salvos')};
 {const s0=A.st;A.st=(id,v)=>{const a=by('ag',id);if(a.id){if(v==='Realizado'||v==='Laudo liberado')eCons(a);else if(OFF.includes(v))eEstorno(a)}s0(id,v)}}

 /* telas */
 const ITENS=()=>{const q=(F.eq||'').toLowerCase(),se=F.ee||'t',at=eAt(),pb=eProb(),
   L=S.est.filter(i=>(se==='i'?i.ativo===false:i.ativo!==false)&&(!q||(i.item+' '+i.cod).toLowerCase().includes(q))&&(!F.ek||i.cat===F.ek)&&(se==='b'?i.qtd<=i.min:se==='z'?i.qtd<=0:se==='v'?pb.includes(i):true)).sort(nm),
   kp=(k,n,l)=>`<button class="card kp${n?' al':''}" style="--k:var(--c2)" data-a="esf,${k}"><b>${n}</b><span>${l}</span></button>`,cs=eCost();
  return`<div class="kg">${kp('b',estLow().length,'Abaixo do mínimo')}${kp('z',at.filter(i=>i.qtd<=0).length,'Zerados')}${kp('v',pb.length,'Lote vencido ou a vencer ('+EST_VD+' d)')}${cs?`<div class="card kp"><b>${brl(at.reduce((s,i)=>s+i.qtd*(i.custo||0),0))}</b><span>Valor em estoque</span></div>`:`<button class="card kp" style="--k:var(--c2)" data-a="esf,t"><b>${at.length}</b><span>Itens ativos</span></button>`}</div>
  <div class="top"><div><label for="d_eq">Buscar item ou código</label><input id="d_eq" type="search" data-f="eq" value="${esc(F.eq||'')}"></div>${sel('ek','Categoria',EST_CAT.map(c=>[c,c]))}${sl('ee','Situação',[['t','Ativos'],['b','Abaixo do mínimo'],['z','Zerados'],['v','Vencidos / a vencer'],['i','Inativos']],'t')}<div class="sp"></div><button class="btn" data-a="estCsv,est">Exportar CSV</button><button class="btn p" data-a="add,est">${IC('plus')}Novo</button></div>`+
  tbl(['Item','Categoria','Saldo','Mín.','Repor','Validade',...(cs?['Valor']:[]),'Ações'],L.map(i=>{const ls=eLots(i),pv=ls.find(l=>l.val),vc=ls.filter(l=>eSt(l)==='v').length,low=i.qtd<=i.min,
    va=i.ctl?(ls.length?(vc?`<span class="tag bad">${vc} lote(s) vencido(s)</span>`:pv?`<span class="tag ${eSt(pv)?'wr':''}">${fd(pv.val)}</span>`:'<span class="hint">sem validade</span>')+`<br><span class="hint">${ls.length} lote(s)</span>`:'—'):'<span class="hint">sem controle</span>',
    ac=i.ativo===false?'':sb('',`estIn,${i.id}`,'Entrada')+' '+sb('',`estOut,${i.id}`,'Saída')+' ';
   return`<tr><td>${esc(i.item)}${i.ativo===false?' <span class="tag">Inativo</span>':''}<br><span class="hint">${esc([i.cod,i.local].filter(Boolean).join(' · ')||'—')}</span></td><td>${esc(i.cat)}</td><td><span class="tag ${low?'bad':''}">${eN(i.qtd)} ${esc(i.un)}</span>${low?`<br><span class="hint">${i.qtd<=0?'zerado':'baixo'}</span>`:''}</td><td>${eN(i.min)}</td><td>${i.ativo===false?'—':eN(eFa(i))}</td><td>${va}</td>${cs?`<td>${brl(i.qtd*(i.custo||0))}</td>`:''}<td style="white-space:nowrap">${ac}${sb('',`estHist,${i.id}`,'Detalhes')}</td></tr>`}),'Nenhum item neste filtro.')},
  MOVS=()=>{const p=F.mp||'30',lim=p==='t'?'':addD(today(),-+p),L=S.mov.filter(m=>(!lim||m.t.slice(0,10)>=lim)&&(!F.mi||m.item===F.mi)&&(!F.mt||m.tipo===F.mt)).sort((a,b)=>b.t.localeCompare(a.t));
   return`<div class="top">${sel('mi','Item',S.est.slice().sort(nm).map(i=>[i.id,i.item]))}${sel('mt','Tipo',[['ent','Entradas'],['sai','Saídas'],['aj','Ajustes de inventário']])}${sl('mp','Período',[['7','7 dias'],['30','30 dias'],['90','90 dias'],['t','Tudo']],'30')}<div class="sp"></div><button class="btn" data-a="estCsv,mov">Exportar CSV</button></div>`+
   tbl(['Data','Item','Tipo','Qtd','Saldo','Lote','Motivo / obs.','Usuário'],L.map(m=>{const i=by('est',m.item),tp=TP[m.tipo]||['?',''];return`<tr><td>${ts(m.t)}</td><td>${esc(i.item||'(removido)')}</td><td><span class="tag ${tp[1]}">${tp[0]}</span></td><td>${m.q>0?'+':''}${eN(m.q)} ${esc(i.un||'')}</td><td>${eN(m.saldo)}</td><td>${esc(m.lote||'—')}</td><td>${esc(m.mot)}${m.obs?'<br><span class="hint">'+esc(m.obs)+'</span>':''}</td><td>${esc(m.u)}</td></tr>`}),'Nenhuma movimentação neste filtro.')},
  INV=()=>{const v=ivOpen();
   if(v)return`<div class="top"><div><b>Inventário nº ${v.n}</b><div class="hint">Aberto ${ts(v.ini)} por ${esc(v.u)} · ${esc(v.esc||'Todos os itens')} · ${v.cego?'contagem às cegas':'saldo visível'}</div></div><div class="sp"></div><button class="btn" data-a="print">Imprimir folha</button><button class="btn d" data-a="ivCx">Cancelar inventário</button><button class="btn p" data-a="ivEnd" ${pode()?'':'disabled title="Somente Administrador ou Financeiro"'}>Concluir inventário</button></div><p class="hint" id="ivp" aria-live="polite">${ivProg(v)}</p><div class="tw"><table><thead><tr><th>Item</th><th>Lote</th><th>Un</th><th>Sistema</th><th>Contagem</th><th>Diferença</th><th>Motivo</th></tr></thead><tbody>${v.lin.map(l=>ivRow(l,v)).join('')}</tbody></table></div>`;
   const f=S.inv.filter(x=>x.st==='fechado').pop(),d=f?Math.round((new Date(today()+'T12:00')-new Date(f.fim.slice(0,10)+'T12:00'))/864e5):0;
   return`<div class="top"><div class="sp"></div><button class="btn p" data-a="ivNew">${IC('plus')}Novo inventário</button></div><p class="hint">${f?`Último inventário concluído há ${d} dia(s)${d>90?' — recomendado a cada 90 dias ou menos.':'.'}`:'Nenhum inventário concluído ainda.'} O saldo não é editado à mão: correções entram por inventário, com motivo e usuário registrados.</p>`+
   tbl(['Nº','Aberto em','Concluído em','Escopo','Linhas','Divergências','Responsável','Situação','Ações'],S.inv.slice().reverse().map(x=>`<tr><td>${x.n}</td><td>${ts(x.ini)}</td><td>${x.fim?ts(x.fim):'—'}</td><td>${esc(x.esc||'Todos')}</td><td>${x.lin.length}</td><td>${x.st==='fechado'?x.lin.filter(l=>l.dif).length:'—'}</td><td>${esc(x.u)}</td><td><span class="tag ${x.st==='fechado'?'ok':x.st==='aberto'?'wr':''}">${x.st==='fechado'?'Concluído':x.st==='aberto'?'Aberto':'Cancelado'}</span></td><td>${sb('',`ivView,${x.id}`,'Ver')}</td></tr>`),'Nenhum inventário realizado.')};
 V.est=()=>{const iv4=planLv()>=4,t=['it','mv',...(iv4?['iv']:[])].includes(SH.est)?SH.est:'it',bar=xbar([['it','Itens'],['mv','Movimentações'],...(iv4?[['iv','Inventário',ivOpen()?'aberto':'']]:[])],t,'sht');
  return`<h1>Estoque</h1><p class="sub">Saldo por lote e validade, razão de movimentações e inventário.</p>${bar}`+(t==='it'?ITENS():t==='mv'?MOVS():INV())};
})();

