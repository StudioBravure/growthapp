# 🚀 Como Implantar o Studio360 no Seu Domínio

A maneira mais rápida e eficiente de colocar seu projeto Next.js no ar com seu domínio próprio é usando a **Vercel** (criadora do Next.js).

## ✅ Passo 1: Preparar o Código (GitHub)

1.  Certifique-se de que seu código está em um repositório no **GitHub**, **GitLab** ou **Bitbucket**.
2.  Se ainda não estiver, crie um repositório e suba o código:
    ```bash
    git init
    git add .
    git commit -m "Deploy inicial"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
    git push -u origin main
    ```

## ✅ Passo 2: Implantar na Vercel

1.  Crie uma conta em [vercel.com](https://vercel.com/signup).
2.  Clique em **"Add New..."** > **"Project"**.
3.  Importe seu repositório do GitHub.
4.  **Configure as Variáveis de Ambiente:**
    Nas configurações do projeto na Vercel "Environment Variables", adicione as mesmas chaves do seu `.env.local`:
    *   `NEXT_PUBLIC_SUPABASE_URL`: (Sua URL do Supabase)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Sua chave Anon)
    *   `NEXT_PUBLIC_SITE_URL`: `https://seu-dominio.com` (ou a URL que a Vercel gerar inicialmente)

5.  Clique em **Deploy**.

## ✅ Passo 3: Configurar Seu Domínio

1.  No painel do seu projeto na Vercel, vá em **Settings** > **Domains**.
2.  Digite seu domínio (ex: `meusite.com`) e clique em **Add**.
3.  A Vercel vai te dar os **Nameservers** ou registros **A/CNAME** para você configurar onde comprou seu domínio (GoDaddy, Registro.br, Namecheap, etc.).
    *   **Opção Recomendada:** Alterar os Nameservers no seu registrador para os da Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).
    *   **Opção Alternativa:** Adicionar um registro `A` apontando para o IP que a Vercel mostrar.

## ✅ Passo 4: Atualizar o Supabase (CRÍTICO)

Para que o Login/Auth funcione em produção, você precisa avisar o Supabase sobre seu novo domínio.

1.  Vá no [Supabase Dashboard](https://supabase.com/dashboard).
2.  Entre em **Authentication** > **URL Configuration**.
3.  Em **Site URL**, coloque seu domínio principal: `https://seu-dominio.com`.
4.  Em **Redirect URLs**, adicione:
    *   `https://seu-dominio.com/`
    *   `https://seu-dominio.com/auth/callback`
    *   `https://seu-dominio.com/reset-password`
5.  Clique em **Save**.

---

## 💡 Dicas Importantes

*   **HTTPS:** A Vercel gera o certificado SSL (cadeado) automaticamente para seu domínio.
*   **Deploy Contínuo:** Toda vez que você fizer um `git push` para a `main`, a Vercel atualizará seu site automaticamente.
