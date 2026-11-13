/* Inicialização: decide entre modo local e nuvem, carrega os dados do Supabase (se houver sessão)
   e só então carrega os demais scripts, na ordem certa. */
(async()=>{
  const C=window.RSL_CONFIG||{},hasCloud=!!(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY);
  const SCRIPTS=['storage','auth','logo','core','agenda-pacs-repasse','painel-clinicas','financeiro','clinicas-usuarios','usuarios-remoto','medico','ui-fonte-salas','ui-tela-cheia-descanso','ui-ajuste-janela','estoque','planos-e-campos','pacs','main'].map(n=>'assets/js/'+n+'.js');
  const screen=(t,m,btn)=>{document.body.innerHTML='<div style="font:16px/1.5 system-ui,sans-serif;max-width:520px;margin:12vh auto;padding:24px"><h2 style="margin:0 0 8px">'+t+'</h2><p>'+m+'</p>'+(btn||'')+'</div>'};
  const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Falha ao carregar '+src));document.body.appendChild(s)});
  const all=async(sb,table,order)=>{const out=[];for(let a=0;;a+=1000){
      const{data,error}=await sb.from(table).select('*').order(order[0],order[1]||{}).range(a,a+999);
      if(error)throw error;out.push(...data);if(data.length<1000)break}return out};
  window.RSL_REMOTE=false;
  if(hasCloud){
    if(!window.supabase){screen('Não foi possível iniciar','A biblioteca do Supabase não carregou. Verifique a internet e recarregue a página.');return}
    window.RSL_REMOTE=true;window.__RSL_PRELOAD={me:null,data:null};
    try{
      const sb=window.sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
      const{data:{session}}=await sb.auth.getSession();
      if(session){
        const{data:p,error:pe}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
        if(pe){if(pe.code==='PGRST301'||/jwt/i.test(pe.message||'')){await sb.auth.signOut();location.reload();return}throw pe}
        if(!p||['pending','none'].includes(p.role)){
          screen('Acesso aguardando liberação','Sua conta existe, mas ainda não foi liberada por um administrador. Peça a liberação e entre de novo.','<button id="so" style="padding:10px 18px;font:inherit;cursor:pointer">Sair</button>');
          document.getElementById('so').onclick=async()=>{await sb.auth.signOut();location.reload()};return}
        const users=p.role==='admin'?(await all(sb,'profiles',['created_at'])).map(x=>({id:x.id,u:x.username,email:x.email,r:x.role,m:x.medico_id||undefined,cl:x.clinicas||[]})):[{id:p.id,u:p.username,email:p.email,r:p.role,m:p.medico_id||undefined,cl:p.clinicas||[]}];
        const records=await all(sb,'records',['seq']),settings=await all(sb,'settings',['key']);
        window.__RSL_PRELOAD={me:{id:p.id,email:p.email,u:p.username||p.email,r:p.role,m:p.medico_id||undefined,cl:p.clinicas||[]},data:{records,settings,users}};
      }
    }catch(e){screen('Erro ao conectar ao Supabase',(e.message||e)+'<br><br>Confira assets/js/config.js e se o arquivo supabase/schema.sql foi executado.');return}
  }
  try{for(const s of SCRIPTS)await load(s)}catch(e){screen('Erro ao carregar o sistema',e.message)}
})();
