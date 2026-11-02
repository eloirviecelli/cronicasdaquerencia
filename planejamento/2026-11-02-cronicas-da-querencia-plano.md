# Crônicas da Querência — Plano de construção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar o site estático "Crônicas da Querência" (lista paginada, páginas de leitura, SEO completo) a partir de arquivos Markdown, pronto para o GitHub Pages.

**Architecture:** Um gerador em Node.js (módulos pequenos em `scripts/lib/`) lê `content/*.md` e `site.config.json` e escreve todo o site em `docs/`. Um validador confere conteúdo e saída. `AGENTS.md` ensina qualquer IA a publicar uma obra nova.

**Tech Stack:** Node.js 24, ES modules, `node:test`, `marked` (Markdown), `sharp` (imagens). Nenhuma outra dependência. Sem JavaScript no navegador do leitor.

**Spec:** `planejamento/2026-11-02-cronicas-da-querencia-design.md`

## Global Constraints

- Idioma `pt-BR`; autor exibido: `Eloir`; nome do site: `Crônicas da Querência`; frase: `Crônicas e contos sobre o campo, a cultura gaúcha e a alma do homem simples`.
- URL-base hoje `https://eloirviecelli.github.io/cronicasdaquerencia`; deve ser lida só de `site.config.json` (campo `url`). Todos os links internos, `canonical`, sitemap e feed respeitam o caminho-base (`/cronicasdaquerencia`) e funcionam também com caminho-base vazio (domínio próprio).
- Até 10 obras por página (`porPagina: 10`), da mais nova para a mais antiga (`data` desc, desempate por `slug`).
- Endereços: `/`, `/pagina/N/` (N≥2), `/conto/<slug>/`, `/cronica/<slug>/`, `/sobre/`, `404.html`, `sitemap.xml`, `robots.txt`, `feed.xml`. Slugs sem acentos. Endereço publicado nunca muda.
- Cores: fundo `#f1e6d0`, borda `#d9c9a8`, texto `#3b2a1e`, apoio `#5d4630`, secundário `#7a5c44`, destaque `#b5452a`. Fonte `Georgia, "Times New Roman", serif`.
- Sem recursos de terceiros em tempo de leitura. Toda imagem com `alt`, `width` e `height`; `loading="lazy"` nas miniaturas abaixo da dobra.
- `docs/` é gerado e versionado; nunca editar à mão. Só o Eloir pede commit/push (os passos de commit abaixo valem quando ele autorizar a execução).
- Site funciona com zero obras.

## Review Focus

- Obra com título contendo `&`, `<`, aspas ou acentos: deve sair escapada em HTML, JSON-LD e RSS (Task 3, 4, 6).
- Duas obras com a mesma `data`: ordem estável por `slug` (Task 1).
- Exatamente 10 e exatamente 11 obras: 1 página sem paginação e 2 páginas, respectivamente (Task 3).
- `url` sem caminho (domínio próprio): links não podem sair com `//` ou prefixo errado (Task 2).
- Front matter com campo faltando ou `tipo` inválido: erro claro com o nome do arquivo (Task 1, 8).

## Estrutura de arquivos

- `package.json`, `site.config.json`, `.gitignore` (já existe), `AGENTS.md`, `CLAUDE.md`
- `content/` — uma obra por arquivo `AAAA-MM-<slug>.md`; `content/imagens/<slug>.jpg|png|webp` — imagem original
- `site/style.css` — CSS único copiado para `docs/style.css`
- `scripts/lib/config.js`, `content.js`, `slug.js`, `html.js`, `layout.js`, `pages.js`, `images.js`, `seo.js`
- `scripts/build.js`, `scripts/validate.js`
- `test/` — testes `node:test`; `test/fixtures/` — obras e imagem de teste (nunca publicadas)
- `docs/` — saída gerada

---

### Task 1: Projeto, configuração e leitura de obras

**Files:**
- Create: `package.json`, `site.config.json`, `scripts/lib/config.js`, `scripts/lib/slug.js`, `scripts/lib/content.js`, `test/content.test.js`, `test/fixtures/content/2026-11-teste-um.md`, `test/fixtures/content/2026-10-teste-dois.md`

**Interfaces:**
- Produces:
  - `loadConfig(path: string): Config` com `{nome, frase, autor, idioma, url, porPagina}`; lança erro se faltar campo.
  - `basePath(config: Config): string` — caminho da `url` sem barra final (`""` ou `"/cronicasdaquerencia"`).
  - `href(config: Config, path: string): string` — `basePath + path` (path começa com `/`).
  - `absUrl(config: Config, path: string): string` — `url` sem barra final + path.
  - `slugify(text: string): string` — minúsculas, sem acentos, hífens.
  - `type Work = {titulo, tipo: 'conto'|'cronica', data: string /*YYYY-MM-DD*/, slug, resumo, descricao, imagem, imagem_alt, markdown: string, arquivo: string, path: string /*"/conto/<slug>/"*/}`
  - `parseWork(text: string, arquivo: string): Work` — front matter `chave: valor` entre `---`; lança `Error` com o nome do arquivo se faltar campo, `tipo` inválido ou `data` fora de `YYYY-MM-DD`.
  - `loadWorks(dir: string): Work[]` — ordenado por `data` desc, depois `slug` asc.

- [ ] **Step 1: Escrever os testes** em `test/content.test.js`: `slugify("Chimarrão à Tarde!") === "chimarrao-a-tarde"`; `parseWork` lê os campos da fixture; `parseWork` com `tipo: poema` lança erro contendo o nome do arquivo; faltando `resumo` lança erro; `loadWorks` com duas fixtures de mesma `data` ordena por `slug`; `basePath` de `https://x.github.io/repo` é `/repo` e de `https://dominio.com.br` é `""`; `href(config,'/a/')` com base vazia é `/a/` (nunca `//a/`); `absUrl` sem barra final dupla.
- [ ] **Step 2: Rodar** `node --test test/` — esperado: FALHA (módulos inexistentes).
- [ ] **Step 3: Criar** `package.json` (`"type": "module"`, scripts `build`, `validate`, `test`, dependências `marked` e `sharp`; rodar `npm install`), `site.config.json` com os valores de Global Constraints e `porPagina: 10`, e implementar os módulos acima. Parser de front matter próprio e simples (linhas `chave: valor`, aspas opcionais).
- [ ] **Step 4: Rodar** `node --test test/` — esperado: PASS.
- [ ] **Step 5: Commit** `feat: configuração e leitura de obras`.

### Task 2: Layout base, `<head>` de SEO e CSS

**Files:**
- Create: `scripts/lib/html.js`, `scripts/lib/layout.js`, `site/style.css`, `test/layout.test.js`

**Interfaces:**
- Consumes: `Config`, `href`, `absUrl` (Task 1).
- Produces:
  - `esc(text: string): string` — escapa `& < > " '`.
  - `type PageMeta = {titulo: string, descricao: string, path: string, ogImage?: string /*caminho do site*/, tipoOg?: 'website'|'article', jsonLd?: object[], prev?: string, next?: string /*paths*/}`
  - `renderLayout(config: Config, meta: PageMeta, bodyHtml: string): string` — documento completo.

- [ ] **Step 1: Escrever os testes**: saída tem `<html lang="pt-BR">`, exatamente um `<h1>` quando o corpo tem um, `<link rel="canonical" href="<absUrl>">`, `og:title`, `og:description`, `og:image` absoluto, `twitter:card`, `<link rel="prev">`/`next` só quando informados, JSON-LD dentro de `<script type="application/ld+json">`, link de pular para o conteúdo, `<link rel="stylesheet" href="<base>/style.css">`, link do feed `<link rel="alternate" type="application/rss+xml">`. Com `url` sem caminho, nenhum `href` começa com `//`. Título `A & B <i>` sai escapado.
- [ ] **Step 2: Rodar** `node --test test/layout.test.js` — esperado: FALHA.
- [ ] **Step 3: Implementar** `html.js` e `layout.js`: cabeçalho centralizado (nome em letras espaçadas, frase em itálico, filete ferrugem), `<main id="conteudo">`, rodapé com autor e links para `/sobre/` e `feed.xml`. Em `site/style.css` aplicar as cores e a fonte de Global Constraints, imagem quadrada de lista de 96px, coluna de leitura de ~66ch, áreas de toque ≥ 44px, `max-width` responsivo, foco visível. Meta `viewport`.
- [ ] **Step 4: Rodar** `node --test test/layout.test.js` — esperado: PASS.
- [ ] **Step 5: Commit** `feat: layout base com SEO e estilo almanaque`.

### Task 3: Páginas de lista com paginação

**Files:**
- Create: `scripts/lib/pages.js`, `test/list.test.js`

**Interfaces:**
- Consumes: `Work`, `Config`, `renderLayout`, `esc`, `href`.
- Produces:
  - `paginate<T>(items: T[], porPagina: number): T[][]` — sempre ao menos uma página (vazia se não há itens).
  - `listPath(page: number): string` — `"/"` para 1, `"/pagina/N/"` para N≥2.
  - `renderListPage(config: Config, pageWorks: Work[], page: number, totalPages: number): string`
  - `formatMonth(data: string): string` — `"2026-11-05"` → `"novembro de 2026"`.

- [ ] **Step 1: Escrever os testes**: `paginate` com 10 itens → 1 página; com 11 → 2 páginas (10 e 1); com 0 → `[[]]`. `listPath(1)==="/"`, `listPath(2)==="/pagina/2/"`. `formatMonth("2026-11-05")==="novembro de 2026"`. Página com obras contém, por obra, miniatura (`<img>` com `alt`, `width`, `height`), título como link para `href(config, work.path)`, resumo e `"novembro de 2026 · conto"`. Página 1 de 2: contém "próxima" e não contém "anterior"; página 2: o inverso; ambas têm `rel` prev/next corretos via meta. Sem obras: mensagem "Em breve, a primeira história chega por aqui." e nenhum erro. Título `Tom & "Jerry"` sai escapado.
- [ ] **Step 2: Rodar** `node --test test/list.test.js` — esperado: FALHA.
- [ ] **Step 3: Implementar** conforme as assinaturas. Miniatura em `/imagens/<slug>-thumb.jpg` (192×192 reais, exibida com `width="96" height="96"`); `<h1>` da página 1 é o nome do site, nas demais "Página N". Paginação: "← anterior · 1 2 · próxima →" com a página atual sem link e `aria-current="page"`. JSON-LD `Blog` na página 1.
- [ ] **Step 4: Rodar** `node --test test/list.test.js` — esperado: PASS.
- [ ] **Step 5: Commit** `feat: lista paginada de obras`.

### Task 4: Página de leitura

**Files:**
- Modify: `scripts/lib/pages.js`
- Create: `test/work.test.js`

**Interfaces:**
- Consumes: `Work`, `renderLayout`, `formatMonth`, `marked`.
- Produces:
  - `renderWorkPage(config: Config, work: Work, older: Work|null, newer: Work|null): string`

- [ ] **Step 1: Escrever os testes**: contém `<h1>` com o título; imagem de capa `/imagens/<slug>-capa.jpg` com `alt = imagem_alt`; texto convertido de Markdown (parágrafos `<p>`, `*itálico*` → `<em>`); "anterior" aponta para `older`, "próximo" para `newer`, e cada um some quando `null`; link de volta à lista; `og:type` é `article`; `og:image` termina em `-og.jpg`; JSON-LD `Article` com `headline`, `datePublished` (a `data`), `author.name === "Eloir"`, `image` absoluta, `inLanguage: "pt-BR"`; `<title>` é `"<titulo> — Crônicas da Querência"`; `meta description` é o campo `descricao`; título com `&` e `"` escapado no HTML e JSON-LD válido (`JSON.parse` do bloco funciona).
- [ ] **Step 2: Rodar** `node --test test/work.test.js` — esperado: FALHA.
- [ ] **Step 3: Implementar** `renderWorkPage`. Escapar `</script>` dentro do JSON-LD (trocar `<` por `<`). Texto da obra em `<article>` com coluna estreita; data e tipo abaixo do título.
- [ ] **Step 4: Rodar** `node --test test/work.test.js` — esperado: PASS.
- [ ] **Step 5: Commit** `feat: página de leitura com dados estruturados`.

### Task 5: Páginas Sobre e 404

**Files:**
- Modify: `scripts/lib/pages.js`
- Create: `content/sobre.md`, `test/static-pages.test.js`

**Interfaces:**
- Produces:
  - `renderAboutPage(config: Config, markdown: string): string` — path `/sobre/`
  - `render404(config: Config): string` — com link para a lista; `noindex`.

- [ ] **Step 1: Escrever os testes**: Sobre contém `<h1>Sobre</h1>` e o texto convertido; 404 tem `<meta name="robots" content="noindex">` e link para `href(config,'/')`; 404 usa caminhos absolutos do site (funciona em qualquer profundidade).
- [ ] **Step 2: Rodar** `node --test test/static-pages.test.js` — esperado: FALHA.
- [ ] **Step 3: Implementar** as duas funções e escrever o rascunho de `content/sobre.md` a partir do README (marcado no topo do arquivo com comentário HTML `<!-- rascunho: revisar com o Eloir -->`; o validador não bloqueia, mas `AGENTS.md` manda avisar o Eloir).
- [ ] **Step 4: Rodar** `node --test test/static-pages.test.js` — esperado: PASS.
- [ ] **Step 5: Commit** `feat: páginas sobre e 404`.

### Task 6: Sitemap, robots e feed RSS

**Files:**
- Create: `scripts/lib/seo.js`, `test/seo.test.js`

**Interfaces:**
- Produces:
  - `buildSitemap(config: Config, works: Work[], totalPages: number): string` — inclui `/`, `/pagina/N/`, `/sobre/` e cada obra com `<lastmod>` = `data`; não inclui `404.html`.
  - `buildRobots(config: Config): string` — `User-agent: *`, `Allow: /`, `Sitemap: <absUrl>/sitemap.xml`.
  - `buildFeed(config: Config, works: Work[]): string` — RSS 2.0, `<language>pt-BR</language>`, até 20 itens mais novos, `<pubDate>` RFC 822, `<link>` e `<guid>` absolutos, `<description>` com o resumo; válido com zero itens.

- [ ] **Step 1: Escrever os testes**: sitemap com 11 obras lista `/pagina/2/`; todas as `<loc>` são absolutas e começam com `config.url`; robots contém a linha `Sitemap:` correta; feed com 0 obras tem `<channel>` e nenhum `<item>`; feed com título `Tom & Jerry <3` tem o texto escapado (XML bem-formado: `&amp;`, `&lt;`); `pubDate` da data `2026-11-05` é `Thu, 05 Nov 2026 12:00:00 GMT`.
- [ ] **Step 2: Rodar** `node --test test/seo.test.js` — esperado: FALHA.
- [ ] **Step 3: Implementar** com `esc` de `html.js`.
- [ ] **Step 4: Rodar** `node --test test/seo.test.js` — esperado: PASS.
- [ ] **Step 5: Commit** `feat: sitemap, robots e feed`.

### Task 7: Processamento de imagens

**Files:**
- Create: `scripts/lib/images.js`, `test/images.test.js`, `test/fixtures/content/imagens/teste-um.jpg` (imagem pequena de teste gerada por `sharp` no próprio teste, se preferir não versionar binário)

**Interfaces:**
- Produces:
  - `processImage(srcFile: string, slug: string, outDir: string): Promise<{thumb: string, capa: string, og: string}>` — grava em `outDir/imagens/`: `<slug>-thumb.jpg` (192×192, `cover`), `<slug>-capa.jpg` (960 px de largura, proporção mantida), `<slug>-og.jpg` (1200×630, `cover`); JPEG qualidade 82, sem metadados; retorna os caminhos relativos.
  - `imageSize(file: string): Promise<{width: number, height: number}>` — para `width`/`height` no HTML da capa.

- [ ] **Step 1: Escrever os testes**: com uma imagem de origem 2000×1500, `processImage` cria os 3 arquivos; `sharp(thumb)` mede 192×192, `og` 1200×630, `capa` 960×720; imagem de origem inexistente rejeita com mensagem que contém o caminho.
- [ ] **Step 2: Rodar** `node --test test/images.test.js` — esperado: FALHA.
- [ ] **Step 3: Implementar** com `sharp`.
- [ ] **Step 4: Rodar** `node --test test/images.test.js` — esperado: PASS.
- [ ] **Step 5: Commit** `feat: processamento de imagens`.

### Task 8: Gerador (`build`) e validador (`validate`)

**Files:**
- Create: `scripts/build.js`, `scripts/validate.js`, `test/build.test.js`

**Interfaces:**
- Consumes: todos os módulos anteriores.
- Produces:
  - `build(opts: {root: string, contentDir: string, outDir: string}): Promise<{works: number, pages: number}>` — apaga `outDir` e recria: `index.html`, `pagina/N/index.html`, `<tipo>/<slug>/index.html`, `sobre/index.html`, `404.html`, `style.css`, `sitemap.xml`, `robots.txt`, `feed.xml`, `imagens/*`. Usa a primeira imagem de cada obra a partir de `content/imagens/<arquivo em imagem>`. Se existir `root/CNAME`, copia para `outDir/CNAME`. Cria `outDir/.nojekyll`.
  - `validate(opts: {root, contentDir, outDir}): Promise<string[]>` — lista de erros (vazia = ok). Confere: campos obrigatórios e `tipo`; `slug` único e igual ao do nome do arquivo; `slug` só `[a-z0-9-]`; `resumo` entre 80 e 300 caracteres e `descricao` até 160; imagem existe e `imagem_alt` não vazio; `autor` configurado; `outDir` contém a página de cada obra, e `sitemap.xml` lista exatamente as páginas geradas; links internos `href`/`src` de todo HTML em `outDir` apontam para arquivos existentes (descontando o caminho-base); nenhum `docs/` ausente de arquivo esperado (saída sincronizada com `content/`).
  - Scripts npm: `npm run build` e `npm run validate` (este falha com código ≠ 0 se houver erros e imprime um erro por linha).

- [ ] **Step 1: Escrever os testes** em `test/build.test.js` usando `test/fixtures` e um `outDir` temporário: com 2 obras gera todos os arquivos listados; com 11 obras gera `pagina/2/index.html`; com 0 obras gera `index.html` e `feed.xml` válidos; `validate` retorna `[]` na saída gerada; apagar um arquivo de `outDir` faz `validate` reportar o caminho; `slug` duplicado reportado; `resumo` curto demais reportado; link interno quebrado reportado; com `url` sem caminho-base, `build` + `validate` passam e nenhum HTML contém `href="//`.
- [ ] **Step 2: Rodar** `node --test test/build.test.js` — esperado: FALHA.
- [ ] **Step 3: Implementar** `build.js` e `validate.js` (cada um com CLI no fim: `if (import.meta.url === ...)` executando com `root = process.cwd()`, `contentDir = content`, `outDir = docs`).
- [ ] **Step 4: Rodar** `npm test` — esperado: todos PASS. Depois `npm run build && npm run validate` com `content/` só contendo `sobre.md` — esperado: build ok, validate sem erros, `docs/index.html` com a mensagem "Em breve".
- [ ] **Step 5: Commit** `feat: gerador e validador do site`.

### Task 9: Documentação para a IA, fluxo de publicação e verificação visual

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md` (apenas `@AGENTS.md`), `content/imagens/.gitkeep`
- Modify: `README.md` (acrescentar seção curta "Como publicar")

- [ ] **Step 1: Escrever `AGENTS.md`** em português com: visão do projeto e mapa de pastas; regra "`docs/` é gerado, nunca editar"; o passo a passo "Publicar uma nova obra" (receber texto → propor título, resumo de 80–300 caracteres, descrição ≤160, slug sem acentos, prompt de imagem → receber imagem do Eloir em `content/imagens/` → criar `content/AAAA-MM-<slug>.md` com todos os campos do front matter → `npm run build` → `npm run validate` → conferir no navegador → só então oferecer commit/push); guia de estilo dos prompts de imagem (ilustração pictórica suave, cores de terra e ferrugem, luz de fim de tarde, paisagem rural do sul, sem texto na imagem, formato 4:3); regra de endereços congelados e redirecionamento; roteiro da futura troca de domínio (mudar `url` em `site.config.json`, criar `CNAME` com `cronicasdaquerencia.com.br`, DNS, ajustar Pages, `npm run build`, `npm run validate`); roteiro de Search Console e Bing Webmaster (guiar o Eloir, gerar tag de verificação em `site.config.json` campo opcional `verificacao` se necessário); aviso de que `content/sobre.md` é rascunho a revisar.
- [ ] **Step 2: Verificação visual**: iniciar um servidor estático em `docs/` com o caminho-base correto (por exemplo, `npx serve` ou um servidor simples que mapeie `/cronicasdaquerencia/` para `docs/`) e abrir no navegador; criar uma obra de teste temporária fora de `content/` apenas para conferir a lista, a página de leitura e o celular (largura 375). Esperado: visual do mockup A sem rolagem horizontal. Remover o que for temporário.
- [ ] **Step 3: Rodar** `npm test && npm run build && npm run validate` — esperado: tudo verde.
- [ ] **Step 4: Commit** `docs: guia para IA e fluxo de publicação`.

### Task 10: Publicação no GitHub Pages (com o Eloir)

Esta tarefa depende de ações do Eloir no GitHub e só avança com ele.

- [ ] **Step 1:** Com autorização do Eloir, enviar a `main` ao GitHub (`git push`).
- [ ] **Step 2:** Guiar o Eloir: Settings → Pages → Source `Deploy from a branch`, branch `main`, pasta `/docs`.
- [ ] **Step 3: Verificar** `https://eloirviecelli.github.io/cronicasdaquerencia/`, `/sitemap.xml`, `/robots.txt`, `/feed.xml` e uma página inexistente (deve mostrar a 404 do site). Esperado: todos respondem como projetado.
- [ ] **Step 4:** Guiar o cadastro no Google Search Console e no Bing Webmaster Tools e o envio do `sitemap.xml`.
