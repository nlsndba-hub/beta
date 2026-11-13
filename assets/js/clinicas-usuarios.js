const USF=()=>[['u','Usuário','text'],['p','Senha','text'],['r','Tipo de acesso','sel',ROLES],['m','Médico vinculado (para o acesso Médico)','sel',()=>[['','—'],...S.med.filter(m=>m.tipo==='Radiologista').map(m=>[m.id,m.nome])]],['cl','Clínicas vinculadas','chk',()=>CLS().map(c=>[c.id,c.nome])]];
Object.assign(A,{
 clSet(id){CUR=id;try{sessionStorage.setItem('ur-cl',id)}catch(e){}render()},
 clNew(){CLS();form('Nova clínica',[['nome','Nome da clínica (ex.: Ultra - Barra)','text'],['end','Endereço','text']],{},o=>{S.cfg.clinicas.push({id:uid(),...o})})},
 clEdit(id){const c=CLS().find(x=>x.id===id);if(c)form('Editar clínica',[['nome','Nome da clínica','text'],['end','Endereço','text']],c,o=>Object.assign(c,o))},
 clDel(id){const l=CLS();if(l.length<2){toast('Mantenha ao menos uma clínica');return}const c=l.find(x=>x.id===id);if(!c||!confirm('Excluir a clínica "'+c.nome+'"? Os usuários perdem o vínculo com ela.'))return;S.cfg.clinicas=l.filter(x=>x.id!==id);S.cfg.users.forEach(u=>{if(u.cl)u.cl=u.cl.filter(x=>x!==id)});save();render()},
 usNew(){CLS();form('Novo usuário',USF(),{r:'rec',cl:[curCl().id]},o=>{if(S.cfg.users.some(x=>x.u===o.u)){toast('Esse usuário já existe');return}if(o.r==='med'&&!o.m){toast('Vincule um médico a este acesso');return}if(!o.cl.length)o.cl=CLS().map(c=>c.id);S.cfg.users.push(o)})},
 usEdit(u){const x=S.cfg.users.find(y=>y.u===u);if(!x)return;form('Editar usuário',USF(),{...x,cl:x.cl&&x.cl.length?x.cl:CLS().map(c=>c.id)},o=>{if(o.u!==x.u&&S.cfg.users.some(y=>y.u===o.u)){toast('Esse usuário já existe');return}if(x.r==='admin'&&o.r!=='admin'&&S.cfg.users.filter(y=>y.r==='admin').length<2){toast('Mantenha ao menos um administrador');return}if(o.r==='med'&&!o.m){toast('Vincule um médico a este acesso');return}if(!o.cl.length)o.cl=CLS().map(c=>c.id);Object.assign(x,o)})},
 usDel(u){if(me&&u===me.u){toast('Você não pode excluir o próprio usuário');return}const x=S.cfg.users.find(y=>y.u===u);if(!x)return;if(x.r==='admin'&&S.cfg.users.filter(y=>y.r==='admin').length<2){toast('Mantenha ao menos um administrador');return}if(!confirm('Excluir o usuário "'+u+'"?'))return;S.cfg.users=S.cfg.users.filter(y=>y.u!==u);save();render()},
 print(){if(view==='ag'&&F.mode!=='quadro'){const m=F.mode;F.mode='quadro';render();setTimeout(()=>{print();F.mode=m;render()},60)}else print()}
});

