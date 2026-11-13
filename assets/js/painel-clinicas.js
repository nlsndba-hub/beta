/* ===== v10: painel com filtros cruzados (estilo Power BI) + histórico de navegação ===== */
V.pend=V.dash;

/* ===== v22 — clínicas, usuários e tipos de acesso ===== */
const ROLES=[['admin','Administrador (acesso total)'],['med','Médico (atendimento, agenda e fichas)'],['fin','Financeiro (tudo, menos Configurações e Salas)'],['rec','Recepção (atendimento e cadastros)']];
const roleN=r=>((ROLES.find(x=>x[0]===r)||ROLES[2])[1]).split(' (')[0];
const CLS=()=>S.cfg.clinicas&&S.cfg.clinicas.length?S.cfg.clinicas:(S.cfg.clinicas=[{id:'c1',nome:S.cfg.nome||'Clínica',end:S.cfg.end||''}]);
let CUR=null;try{CUR=sessionStorage.getItem('ur-cl')}catch(e){}
const myCl=()=>CLS().filter(c=>!me||!me.cl||!me.cl.length||me.cl.includes(c.id));
const curCl=()=>{const l=myCl();return l.find(c=>c.id===CUR)||l[0]||{id:'',nome:S.cfg.nome}};
const can=k=>{if(!me)return false;if(k==='plan')return me.r==='admin'||me.r==='vend';if(!planOK(k))return false;return me.r==='med'?['mdc','ag','pac'].includes(k):me.r==='admin'?true:me.r==='vend'?!['cfg','func'].includes(k):me.r==='fin'?!['cfg','salc','func'].includes(k):!ONLY_ADM.includes(k)};
const clinUI=w=>{const us=S.cfg.users||[],nm=u=>{const l=(u.cl&&u.cl.length)?CLS().filter(c=>u.cl.includes(c.id)):CLS();return l.map(c=>esc(c.nome)).join(', ')||'—'};
 return w!=='us'?`<h2>Clínicas</h2><p class="hint">Cadastre cada unidade (ex.: Ultra - Barra, Ultra - Leblon).</p><div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn p" data-a="clNew">${IC('plus')}Nova clínica</button></div>`+
 tbl(['Clínica','Endereço','Ações'],CLS().map(c=>`<tr><td>${esc(c.nome)}</td><td>${esc(c.end||'')}</td><td style="white-space:nowrap"><button type="button" class="btn s" data-a="clEdit,${c.id}">Editar</button> <button type="button" class="btn s d" data-a="clDel,${c.id}">Excluir</button></td></tr>`),'Nenhuma clínica.'):
 `<h2>Usuários e acessos</h2><p class="hint">Funcionários, tipo de acesso e clínicas em que podem trabalhar.</p><div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn p" data-a="usNew">${IC('plus')}Novo usuário</button></div>`+
 tbl(['Usuário','Acesso','Clínicas','Ações'],us.map(u=>`<tr><td>${esc(u.u)}</td><td>${esc(roleN(u.r))}</td><td>${nm(u)}</td><td style="white-space:nowrap"><button type="button" class="btn s" data-a="usEdit,${esc(u.u)}">Editar</button> <button type="button" class="btn s d" data-a="usDel,${esc(u.u)}">${window.RSL_REMOTE?'Desativar':'Excluir'}</button></td></tr>`),'Nenhum usuário.')};
V.func=()=>`<h1>Funcionários e acessos</h1><p class="sub">Cadastre médicos (vinculados ao cadastro de Médicos), recepção e financeiro. Cada tipo de acesso vê um menu diferente.</p>`+clinUI('us');
