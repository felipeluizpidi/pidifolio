# Começar no Mac

## 1. Antes do primeiro chat (uma vez só)
- [ ] Instalar **Node.js LTS** (nodejs.org) e **GitHub Desktop** (desktop.github.com).
- [ ] GitHub Desktop → **File → Clone Repository** → `felipeluizpidi/pidifolio`.
- [ ] Copiar o **`.env.local`** do Windows para a raiz do projeto no Mac (pendrive/AirDrop — nunca por e-mail ou chat).
- [ ] No Claude, abrir a **pasta do projeto clonada** como pasta de trabalho.

## 2. Mensagem para colar no primeiro chat

Copie tudo dentro do bloco abaixo e cole como primeira mensagem:

```
Oi! Estou continuando no Mac o meu portfólio (pidifolio), que comecei no Windows.

Antes de qualquer coisa:
1. Leia o CLAUDE.md da raiz — ali estão minhas preferências e as regras do projeto. Siga todas.
2. Salve na sua memória as regras principais: responder em pt-BR e de forma simples; sempre commit + push no GitHub ao terminar; paleta fixa (só vermelho #EF2917, laranja #FF6030 e marfim #F4E9D6 nos cases — nunca azul, menta ou cores de cliente); não usar projetos em rascunho; nenhum texto sobreposto.
3. Confira se o arquivo .env.local existe na raiz (sem me mostrar o conteúdo).
4. Rode npm install e depois npm run dev, abra http://localhost:3000 e me diga se o site e o /admin estão funcionando.
5. Faça um git pull antes de mexer em qualquer coisa.

Depois disso, me avise que está tudo pronto para continuarmos.
```

## 3. Rotina entre Windows e Mac
- **Ao começar:** GitHub Desktop → **Fetch / Pull origin**.
- **Ao terminar:** **Commit** + **Push origin**.
- Não editar nos dois ao mesmo tempo sem sincronizar (o `storage/content.json` gera conflito).
