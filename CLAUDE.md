# CLAUDE.md — contexto do projeto

Preferências e decisões acumuladas no desenvolvimento deste portfólio. Valem em qualquer máquina (Windows ou macOS).

## Quem é o usuário
- Felipe Luiz — ACD | AI Creative Lead, +12 anos em publicidade/branding, São Paulo. Hoje AI Creative Lead na Jotacom.
- Escreve em português (pt-BR) — **responder sempre em pt-BR**, de forma simples: não é um usuário dev; explicar passos sem jargão.
- O site usa a marca **"Felipe Pidi"** (LinkedIn/Behance dizem "Felipe Luiz"). Manter "Felipe Pidi" a menos que ele peça para trocar.
- O **conteúdo do site é em inglês** (mercado internacional). Título: "ACD & AI Creative Lead".

## Regras que ele pediu explicitamente
1. **Sempre enviar para o GitHub.** Toda alteração termina com commit + push para `felipeluizpidi/pidifolio`, branch `main`. Se o push pedir login, avisar para clicar em **Push origin** no GitHub Desktop.
2. **Paleta fixa — nunca mudar as cores do site por causa de um case.** Destaques dos cases só em **vermelho #EF2917, laranja #FF6030 ou marfim #F4E9D6** (fundo preto #0B0B0B). Azul e menta existem como tokens no CSS, mas **não** fazem parte da paleta visual — não usar. Nunca usar cores das marcas dos clientes. `ACCENT_PALETTE` em `src/lib/types.ts` e o servidor (`saveProject`) garantem isso.
3. **Não usar projetos em rascunho** — nem rascunhos do Behance (páginas que dão 404 sem login: Onodera, Parahome Velozes 7, Paramount Exterminador, Parahome Dia dos Namorados) nem projetos de exemplo/demo.
4. **Sem caixas de texto sobrepostas** — títulos não podem encostar/cobrir outros textos (verificar no desktop 1440px e no celular 390px).
5. Capas dos cases = **capas originais do Behance**. Se o recorte cortar texto da capa, ajustar o campo **Cover focus** (left/center/right) no editor do projeto.

## Decisões de layout já tomadas
- Fontes de títulos/hero 15% menores e +15% de espaçamento entre blocos de texto (já aplicado — manter o padrão).
- Faixa **"Career in numbers"** logo abaixo do hero (números reais do LinkedIn; editáveis em Settings → About).
- **Selected Work**: numeração **01, 02, 03, 04** na ordem **01 Nazca · 02 Zona Criativa · 03 JandaIA · 04 Óticas Diniz**. O número fica junto ao título (mesmo padrão nos 4).
- Archive: barra de filtros **não** é fixa (sem `sticky`). Numeração de 2 dígitos em todo o site.
- **Fotografia** é uma categoria normal (05 — Photography), com cases iguais aos outros. Não existe mais seção/lightbox separada.
- Sem Showreel.
- Contato: formulário (nome, e-mail, mensagem) → mensagens em `/admin → Messages` (`storage/messages.json`, nunca vai para o Git). Links: e-mail, LinkedIn, Behance, Instagram @olhosdefelipe, WhatsApp.

## Fontes de conteúdo
- Behance: https://www.behance.net/felipeluiz (o Behance bloqueia download direto; as imagens já foram baixadas para `storage/uploads/`).
- LinkedIn: bloqueia leitura automática — pedir o PDF do perfil ao usuário.
- Fotos de fotografia: pasta do Google Drive enviada por ele ("_RETRO 2018").
- Nunca inventar resultados/números: só usar o que está no Behance/LinkedIn ou o que ele fornecer.

## Técnico
- Next.js 15 + React 19 + Tailwind 3. Conteúdo vivo em `storage/content.json` (sobrepõe `src/lib/seed.ts`); uploads em `storage/uploads/` (versionados no Git).
- Rodar: `npm install` e `npm run dev` → http://localhost:3000 · admin em `/admin`.
- `.env.local` (senha do admin e SESSION_SECRET) **não vai para o Git** — precisa existir em cada máquina.
- Se o CSS aparecer sem estilo, apagar a pasta `.next` e rodar `npm run dev` de novo (o servidor precisa rodar a partir da pasta do projeto).
- Antes de commitar: `npx tsc --noEmit` e `npx next lint` sem erros; confirmar que `.env.local` e `storage/messages.json` não estão no commit.
- Em 2 computadores: **Pull antes de começar, Push ao terminar** — `storage/content.json` é editado pelos dois e gera conflito se divergir.
