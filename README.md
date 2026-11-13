# Ultraclínica · Gestão (RSL)

Sistema de gestão de clínica de imagem em HTML/CSS/JS puro (sem build). Funciona de dois jeitos:

- **Modo local:** deixe `assets/js/config.js` vazio. Os dados ficam só no navegador (para testar). Primeiro acesso: usuário `admin`, senha `0000` (troque em Configurações).
- **Modo nuvem:** preencha `config.js` com o Supabase. Login por e-mail e senha, dados no banco, vários usuários ao mesmo tempo, tempo real.

## Estrutura

```
index.html                   página única (carrega os scripts na ordem certa)
assets/css/                  01-base, 02-layout, 03-painel (carregados nessa ordem)
assets/js/config.js          URL e chave do Supabase  <- o único arquivo que você edita
assets/js/boot.js            decide modo local/nuvem, carrega os dados e os demais scripts
assets/js/storage.js         camada de dados (localStorage ou Supabase, só envia o que mudou)
assets/js/auth.js            entrar, sair, trocar senha
assets/js/usuarios-remoto.js criação/edição de usuários no modo nuvem
assets/js/core.js ... pacs.js módulos do sistema (agenda, financeiro, estoque, médico, PACS, planos...)
assets/js/main.js            desenha a tela
supabase/schema.sql          tabelas, segurança (RLS) e tempo real
```
Os scripts compartilham o mesmo escopo global; a ordem está em `boot.js`.

## Passo a passo

### 1. Criar o projeto no Supabase
1. Entre em https://supabase.com e crie a conta (pode ser com GitHub).
2. **New project**: escolha a organização, dê um nome, crie uma **senha do banco** (guarde) e a região **South America (São Paulo)**. Aguarde uns 2 minutos.

### 2. Criar as tabelas
1. Menu **SQL Editor > New query**.
2. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**. Deve aparecer "Success".
3. Em **Table Editor** confira as tabelas `profiles`, `records` e `settings`.

### 3. Configurar o login
1. **Authentication > Sign In / Providers** (ou *Providers*): deixe **Email** ligado.
2. Desligue **Confirm email** (assim o usuário criado pelo administrador já entra). Os nomes dos menus mudam de vez em quando; procure essas opções.

### 4. Ligar o código ao Supabase
1. **Project Settings > API** (ou *Data API / API Keys*).
2. Copie a **Project URL** e a chave **anon / publishable**.
3. Cole em `assets/js/config.js`:
   ```js
   window.RSL_CONFIG={ SUPABASE_URL:'https://xxxx.supabase.co', SUPABASE_ANON_KEY:'sua-chave-anon' };
   ```
4. A chave anon é pública por desenho; quem protege os dados são as regras de segurança do `schema.sql`. **Nunca** use a chave `service_role` / `secret` no site.

### 5. Criar o primeiro usuário (administrador)
1. **Authentication > Users > Add user > Create new user**: informe e-mail e senha e marque **Auto Confirm User**.
2. O **primeiro** usuário criado vira administrador automaticamente. Faça isso logo, antes de publicar o site.
3. Os demais usuários você cria dentro do sistema, em **Funcionários e acessos > Novo usuário**.

### 6. Testar no computador
Na pasta do projeto: `python -m http.server 8000` e abra http://localhost:8000. Entre com o e-mail e a senha do passo 5.

### 7. Publicar no GitHub Pages
1. Em https://github.com crie um repositório (ex.: `ultraclinica`).
2. Envie os arquivos (**Add file > Upload files**, arrastando o *conteúdo* da pasta, com `index.html` na raiz) ou use o Git:
   ```bash
   git init && git add . && git commit -m "Primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/ultraclinica.git
   git push -u origin main
   ```
3. **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, pasta `/ (root)`, **Save**.
4. Em 1 a 2 minutos o site abre em `https://SEU-USUARIO.github.io/ultraclinica/`.
5. De volta ao Supabase: **Authentication > URL Configuration**, coloque essa URL em **Site URL**.

## Tipos de acesso
`admin` (tudo), `fin` (financeiro), `rec` (recepção), `med` (médico, vinculado a um médico cadastrado), `vend` (vendedor: vê a aba Planos), `pending` (conta nova sem liberação) e `none` (desativado). "Excluir" usuário no sistema **desativa** o acesso; para apagar a conta de vez use Authentication > Users.

## O que você precisa saber antes de usar com pacientes reais
- **Regras por tipo de acesso:** hoje, o banco só exige login e separa quem lê/grava. As restrições entre recepção, financeiro e médico (o que cada um enxerga) são feitas na tela. Quem tiver login e conhecimento técnico poderia consultar mais dados do que a tela mostra. Para separar de verdade, é preciso criar regras por coleção no `schema.sql`.
- **Planos e código de teste:** também funcionam só na tela. Servem para demonstração, não para cobrança real.
- **Dados de saúde (LGPD):** são dados sensíveis. Use senhas fortes, o plano pago do Supabase com backups, e revise os termos de uso com um profissional de privacidade.
- **Plano gratuito do Supabase** pausa o projeto após uma semana sem uso. Para produção, use o plano pago.
- **Repositório público** expõe o código. Se o sistema é um produto seu, use repositório privado.
- **Falha de conexão:** o sistema avisa e tenta salvar de novo a cada 5 segundos; não feche a aba enquanto houver aviso.
- **Atualizar o Supabase JS:** a versão está fixa em `index.html` (2.45.4). Para atualizar, troque o número na URL do script.
