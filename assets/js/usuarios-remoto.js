/* Usuários no modo nuvem: as contas ficam no Supabase Auth e o "perfil" (tipo de acesso, médico e clínicas)
   na tabela profiles. Substitui as ações de usuário do modo local. */
if(window.RSL_REMOTE){
  [['pending','Aguardando liberação'],['none','Desativado']].forEach(r=>{if(!ROLES.some(x=>x[0]===r[0]))ROLES.push(r)});
  const USFR=novo=>[...(novo?[['email','E-mail','email'],['pw','Senha inicial (mín. 8 caracteres)','password']]:[]),
    ['u','Nome de exibição','text'],
    ['r','Tipo de acesso','sel',ROLES.filter(r=>!['pending','none'].includes(r[0]))],
    ['m','Médico vinculado (para o acesso Médico)','sel',()=>[['','—'],...S.med.filter(m=>m.tipo==='Radiologista').map(m=>[m.id,m.nome])]],
    ['cl','Clínicas vinculadas','chk',()=>CLS().map(c=>[c.id,c.nome])]];
  const fields=o=>({username:(o.u||'').trim()||undefined,role:o.r,medico_id:o.m||null,clinicas:o.cl&&o.cl.length?o.cl:CLS().map(c=>c.id)});
  const ok=async(msg,p)=>{try{await p;await Auth.reloadUsers();render();toast(msg)}catch(e){toast('Não foi possível concluir: '+(e.message||e))}};
  const admins=()=>S.cfg.users.filter(y=>y.r==='admin').length;
  const createUser=async o=>{
    const C=window.RSL_CONFIG,tmp=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const{data,error}=await tmp.auth.signUp({email:o.email,password:o.pw,options:{data:{username:(o.u||'').trim()}}});
    if(error)throw error;
    if(!data.user||(data.user.identities&&!data.user.identities.length))throw new Error('este e-mail já está cadastrado');
    const f=fields(o);if(!f.username)delete f.username;
    const{error:e2}=await window.sb.from('profiles').update(f).eq('id',data.user.id);if(e2)throw e2};
  Object.assign(A,{
    usNew(){CLS();form('Novo usuário',USFR(true),{r:'rec',cl:[curCl().id]},o=>{
      o.email=(o.email||'').trim();
      if(!/^\S+@\S+\.\S+$/.test(o.email)){toast('Informe um e-mail válido');return}
      if((o.pw||'').length<8){toast('A senha precisa ter ao menos 8 caracteres');return}
      if(o.r==='med'&&!o.m){toast('Vincule um médico a este acesso');return}
      ok('Usuário criado',createUser(o))})},
    usEdit(u){const x=S.cfg.users.find(y=>y.u===u);if(!x)return;
      form('Editar usuário',USFR(false),{...x,cl:x.cl&&x.cl.length?x.cl:CLS().map(c=>c.id)},o=>{
        if(x.r==='admin'&&o.r!=='admin'&&admins()<2){toast('Mantenha ao menos um administrador');return}
        if(o.r==='med'&&!o.m){toast('Vincule um médico a este acesso');return}
        ok('Usuário atualizado',window.sb.from('profiles').update(fields(o)).eq('id',x.id).then(r=>{if(r.error)throw r.error}))})},
    usDel(u){const x=S.cfg.users.find(y=>y.u===u);if(!x)return;
      if(me&&x.id===me.id){toast('Você não pode desativar o próprio acesso');return}
      if(x.r==='admin'&&admins()<2){toast('Mantenha ao menos um administrador');return}
      if(!confirm('Desativar o acesso de "'+u+'"? A conta continua no Supabase, mas deixa de ver os dados.'))return;
      ok('Acesso desativado',window.sb.from('profiles').update({role:'none'}).eq('id',x.id).then(r=>{if(r.error)throw r.error}))}});
}
