/* Autenticação (modo nuvem): entrar, sair, trocar a própria senha e listar usuários (perfis). */
const Auth=(()=>{
  const toUser=p=>({id:p.id,u:p.username,email:p.email,r:p.role,m:p.medico_id||undefined,cl:p.clinicas||[]});
  return{toUser,
    async login(email,pw,el){
      const{error}=await window.sb.auth.signInWithPassword({email,password:pw});
      if(error){el.textContent='E-mail ou senha incorretos. Confira os dados e tente de novo.';return}
      location.reload()},
    async logout(){try{await window.sb.auth.signOut()}catch(e){}location.reload()},
    async setPassword(pw){
      if(pw.length<8){toast('A senha precisa ter ao menos 8 caracteres');return}
      const{error}=await window.sb.auth.updateUser({password:pw});
      toast(error?'Não foi possível trocar a senha: '+error.message:'Senha alterada')},
    async reloadUsers(){
      const{data,error}=await window.sb.from('profiles').select('*').order('created_at');
      if(error)throw error;S.cfg.users=data.map(toUser)}};
})();
