# FELIPE PIDI — Cinematic Creative Portfolio

> *A body of work, directed like cinema.*

Portfólio de Felipe Pidi (AI Creative & Design Leader) com landing de cinco cenas, páginas de case em `/work/[slug]` e um painel `/admin` funcional para editar tudo — projetos, galerias, mídia e textos — sem tocar em código.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Motion for React · Lucide · dnd-kit · Zod.
**Persistência:** arquivo JSON + pasta de uploads no servidor (sem Supabase, por decisão do projeto). Ver “Como o conteúdo é guardado”.

---

## 1. Rodar localmente

Requisitos: Node 20+ (testado com Node 22).

```bash
npm install
cp .env.example .env.local      # edite ADMIN_PASSWORD e SESSION_SECRET
npm run dev                      # http://localhost:3000  ·  painel em /admin
```

Gerar um `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Scripts: `npm run dev` · `npm run build` · `npm start` · `npm run lint` · `npm run typecheck`.

## 2. Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `ADMIN_PASSWORD` | sim (para o admin) | Senha do `/admin`. Mínimo 12 caracteres. Sem ela o painel fica desativado e avisa por quê. |
| `SESSION_SECRET` | sim (para o admin) | Assina o cookie de sessão (HMAC-SHA256). Mínimo 32 caracteres. Trocar invalida todas as sessões. |
| `NEXT_PUBLIC_SITE_URL` | recomendado | URL pública — usada em SEO, sitemap e Open Graph. |
| `STORAGE_DIR` | não | Onde ficam `content.json` e `uploads/`. Padrão: `./storage`. |
| `CONTENT_READONLY` | não | `1` bloqueia gravações (ativado automaticamente na Vercel). |

Nenhum segredo vai para o navegador: só `NEXT_PUBLIC_SITE_URL` é público.

## 3. O painel `/admin`

- **Projects** — criar, editar, excluir, publicar/despublicar, marcar como destaque, arrastar para reordenar (a ordem define a numeração 001, 002… e a sequência do Archive). Ao lado, a ordem da seção *Selected Work* (até 6 destaques), também por arrastar.
- **Editor de projeto** — título, subtítulo, slug (gerado do título), cliente, ano, papel, disciplinas, categorias (várias), cor de destaque, layout em Selected Work (*full-bleed*, *split*, *poster de festival*, *film strip*), formato do card no Archive, capa e vídeo de capa, textos do case (Overview, Challenge, Concept, Process, Outcomes), créditos e **blocos do case**:
  imagem full-width · vídeo full-width · grid 2 · grid 3 · editorial assimétrico · imagem + texto · film strip horizontal · galeria com lightbox · vídeo embutido (URL) · texto editorial grande. Blocos são adicionados, configurados e reordenados por arrastar.
- **Media** — upload por arrastar ou seletor com barra de progresso por arquivo, validação de tipo e tamanho (no navegador e de novo no servidor, inclusive pelos *magic bytes*), alt text, legenda, frame de pôster para vídeos, links do YouTube/Vimeo, filtro “só não usados”. Arquivo em uso **não pode ser excluído** — o painel mostra onde ele está sendo usado.
- **Settings** — retratos do hero (desktop e mobile separados), textos do hero, títulos das seções, bio, disciplinas, números de carreira (faixa abaixo do hero), retrato do About, e-mail, LinkedIn, Behance, Instagram, WhatsApp, CV (PDF enviado ou link), rodapé, SEO e **Photography** (seção única do Archive: escolher, enviar e arrastar fotos).
- **Messages** — mensagens do formulário de contato (nome, e-mail, mensagem), guardadas em `storage/messages.json`. Marcar como lida, responder por e-mail, excluir. O formulário valida os campos, tem honeypot anti-bot e limita 3 envios por IP a cada 10 min.
- **Cores dos cases** — só a paleta do site (vermelho, laranja, azul, menta, marfim, preto); o servidor recusa outras cores.

Limites de upload: imagens (JPG, PNG, WebP, AVIF) até 20 MB · vídeos (MP4, WebM) até 400 MB · PDF até 15 MB.

**Segurança:** cookie `httpOnly`, `SameSite=Strict`, `Secure` em produção; middleware bloqueia `/admin` e `/api/admin` e **toda** server action/rota revalida a sessão; senha comparada em tempo constante; 5 tentativas de login por IP a cada 15 min; uploads com checagem de origem, nomes gerados no servidor e rota de mídia que não aceita caminhos (sem *path traversal*). Todas as entradas são validadas com Zod.

## 4. Como o conteúdo é guardado

```
storage/
├── content.json        ← projetos, categorias, mídia, settings (criado na 1ª edição)
├── content.prev.json   ← versão anterior (backup automático a cada gravação)
└── uploads/            ← arquivos enviados, servidos em /media/<arquivo>
```

- Enquanto `content.json` não existe, o site usa o conteúdo inicial de `src/lib/seed.ts`.
- Gravações são serializadas e atômicas (arquivo temporário → `fsync` → `rename`): uma queda no meio não corrompe o conteúdo.
- Depois de cada edição o site é revalidado na hora (`revalidatePath`); as páginas públicas são estáticas com revalidação a cada 5 min.
- Toda a leitura/gravação passa por `src/lib/store.ts`. Para migrar para um banco no futuro, troca-se só esse módulo.

**Backup:** basta copiar a pasta `storage/`.

## 5. Conteúdo inicial — o que é real e o que é demo

- Textos de hero, bio, disciplinas, métricas (12+ / 3+ / 10+), e-mail, LinkedIn e Behance vêm do briefing e dos dados do Felipe.
- Os 7 projetos iniciais estão marcados como **Demo content** (aparece uma etiqueta na página do case). Os títulos usam trabalhos reais citados (Nazca, Óticas Diniz, Node Styles, Mercado Livre, KFC, Duolingo, Showreel), mas a copy é neutra e **nenhum resultado foi inventado** — o único “Outcomes” preenchido (Node Styles: ~25 estilos; rota criativa de ~2h para 20–30 min) usa números fornecidos pelo próprio Felipe.
- Todas as imagens e o vídeo em `public/placeholders/` são **placeholders** gerados, com legenda “PLACEHOLDER · proporção”. Substitua no admin:
  - Hero desktop **16:9** (retrato à direita do centro, luz lateral, fundo escuro) e hero mobile **9:16**.
  - About **4:5** (vira P&B automaticamente).
  - Capas: *full-bleed* ~**21:9**, *split* **4:5**, *poster* **1:1**, *film strip* imagem larga (vira 3 quadros).
- Depois de trocar a copy e a mídia de um projeto, desligue o toggle **Demo content**.
- A categoria *Branding* começa com só um projeto — vale adicionar trabalhos de identidade.

## 6. Deploy

### Opção A — servidor com disco persistente (recomendado: admin edita em produção)

Qualquer host que rode Node com um volume persistente: Railway (Volume), Render (Persistent Disk), Fly.io (Volume), DigitalOcean/VPS.

Com Docker (incluso):

```bash
docker build -t felipe-pidi .
docker run -p 3000:3000 \
  -e ADMIN_PASSWORD='sua-senha-longa' \
  -e SESSION_SECRET='...' \
  -e NEXT_PUBLIC_SITE_URL='https://seu-dominio.com' \
  -v felipe-pidi-data:/data \
  felipe-pidi
```

Sem Docker: `npm ci && npm run build && STORAGE_DIR=/caminho/persistente npm start`.
Monte o volume em `STORAGE_DIR` (no Docker é `/data`). Coloque um proxy com HTTPS na frente (o próprio host costuma fazer isso).

### Opção B — Vercel (site perfeito, admin só local)

Na Vercel o sistema de arquivos é somente leitura e não persiste entre requisições, então **o admin não consegue salvar lá** — ele detecta isso e mostra um aviso em vez de falhar em silêncio. O fluxo que funciona:

1. Edite localmente (`npm run dev` → `/admin`). As mudanças vão para `storage/`.
2. No `.gitignore`, remova as linhas de `storage/uploads/*` para versionar os uploads.
3. `git add storage && git commit && git push` — a Vercel faz o deploy com o conteúdo novo (o `next.config.ts` já inclui `storage/` no bundle).

Passos na Vercel:

1. Suba o projeto para um repositório no GitHub.
2. Vercel → **Add New → Project** → importe o repositório (framework detectado: Next.js; build `next build`).
3. Em **Environment Variables**, defina `NEXT_PUBLIC_SITE_URL` (as variáveis do admin são opcionais lá).
4. Deploy. Domínio próprio em **Settings → Domains**.

Atenção: vídeos grandes no repositório pesam no git e no deploy. Para vídeos longos, prefira links do YouTube/Vimeo no Media.

## 7. Estrutura

```
src/
├── app/
│   ├── (site)/              landing, /work/[slug], transição de página, 404
│   ├── admin/               login, painel (projects, media, settings), server actions
│   ├── api/admin/upload/    upload em streaming (progresso, validação)
│   ├── media/[...path]/     serve uploads com suporte a Range (vídeo)
│   ├── sitemap.ts · robots.ts · opengraph-image.tsx
├── components/
│   ├── site/                Hero, SelectedWork, Archive, About, Contact, CaseBlocks, Nav, Motion
│   ├── media/               Media (next/image), VideoPlayer, AmbientVideo, EmbedPlayer, Lightbox
│   └── admin/               editor de projeto, biblioteca, picker, uploader, sortable
├── lib/                     types (Zod), store, seed, queries, auth/session, embed
└── middleware.ts            proteção de /admin e /api/admin
storage/                     conteúdo + uploads (fora do git por padrão)
public/placeholders/         placeholders gerados
```

## 8. Design system (resumo)

- **Cores:** Near Black `#0B0B0B` · Cinematic Red `#EF2917` · Analog Orange `#FF6030` · Electric Blue `#138FE0` · Mint `#A8F5E5` · Warm Ivory `#F4E9D6` (tokens no `tailwind.config.ts` e em `:root`).
- **Tipos:** Anton (display) · Archivo Black (display secundário) · Space Grotesk (texto/UI) · IBM Plex Mono (metadados). Servidos localmente via Fontsource — nenhuma chamada ao Google Fonts.
- **Movimento:** máscaras de título, wipes de clip-path, parallax leve, grão de filme, timecode “REC”, corte vermelho entre páginas. Sem *scroll hijacking*; tudo respeita `prefers-reduced-motion`.
- **Vídeo:** prévias silenciosas tocam só quando visíveis e pausam fora da tela; nada toca com som sozinho; embeds do YouTube/Vimeo só carregam após o clique.

## 9. Verificação feita

TypeScript (`tsc`) e ESLint sem erros · `next build` de produção OK · testes automatizados em navegador (Playwright) contra o build de produção: login (senha errada e certa), redirecionamento sem sessão, upload com progresso e registro de dimensões, rejeição de tipo inválido, resposta 206 para vídeo, edição e publicação de projeto refletindo no site, settings persistindo em `content.json`, filtro e ordenação do Archive, lightbox (abrir, setas, Esc), autoplay silencioso e pausa fora da tela, ausência de overflow horizontal em 320/390/768/1024/1440 px e renderização com movimento reduzido.

Não testado: deploy real em host externo e Safari/iOS em dispositivo físico.
