# Crônicas da Querência — guia para IA

Site estático de crônicas e contos sobre o campo e a cultura gaúcha. Autor: Eloir (coordenador; fornece texto e imagem, a IA cuida do resto). Uma obra nova por mês. Hospedado no GitHub Pages (https://www.cronicasdaquerencia.com.br), servindo a pasta `docs/` da branch `main`.

Documentos de origem: `planejamento/2026-11-02-cronicas-da-querencia-design.md` (o quê e por quê) e `planejamento/2026-11-02-cronicas-da-querencia-plano.md` (como foi construído).

## Mapa do projeto

- `content/AAAA-MM-<slug>.md` — uma obra por arquivo (front matter + texto em Markdown).
- `content/imagens/` — imagem original de cada obra (entregue pelo Eloir).
- `content/sobre.md` — página Sobre (texto aprovado pelo Eloir).
- `site.config.json` — nome, frase, autor, idioma, `url` e `porPagina`. **Única** fonte da URL do site.
- `site/style.css` — estilo (almanaque: creme `#f1e6d0`, texto `#3b2a1e`, destaque ferrugem `#a63f26`).
- `scripts/lib/*.js` — módulos do gerador; `scripts/build.js` gera o site; `scripts/validate.js` valida.
- `test/` — testes (`npm test`).
- `docs/` — **saída gerada. Nunca editar à mão.** Sempre regerar com `npm run build`.

## Publicar uma nova obra

1. Receba o texto do Eloir.
2. Proponha e combine com ele: título; `resumo` (80–300 caracteres, que encante e dê vontade de ler); `descricao` (até 160, para buscadores); `slug` (sem acentos, minúsculas, hífens); e o **prompt da imagem** (ver estilo abaixo). A IA não gera imagens.
3. O Eloir gera a imagem e a entrega. Salve em `content/imagens/<arquivo>`.
4. Crie `content/AAAA-MM-<slug>.md`:

   ```
   ---
   titulo: Título da obra
   tipo: conto            # conto ou cronica
   data: 2026-12-05       # AAAA-MM-DD
   slug: titulo-da-obra
   resumo: ...
   descricao: ...
   imagem: titulo-da-obra.jpg
   imagem_alt: Descrição da imagem para acessibilidade
   ---
   Texto da obra em Markdown.
   ```
5. `npm run build` e `npm run validate` (devem terminar sem erros). `npm test` também deve passar.
6. Confira no navegador (lista e página da obra, também em 375 px de largura).
7. Só então ofereça commit e push ao Eloir. Não faça commit nem push sem pedido dele.

## Estilo das imagens (prompt)

Ilustração pictórica suave, cores de terra e ferrugem, luz de fim de tarde, paisagem rural do sul do Brasil, sem texto na imagem, formato 4:3, tom sereno e melancólico. Descreva a cena central do texto.

## Regras

- **Endereços congelados:** depois de publicada, o `slug` e o `tipo` de uma obra não mudam (a URL é `/<tipo>/<slug>/`). Se precisar mudar, deixe uma página de redirecionamento no endereço antigo com `canonical` para o novo.
- Ordem: lista da obra mais nova para a mais antiga (`data` desc, desempate por `slug`).
- Nunca adicionar recursos de terceiros (fontes, scripts, rastreadores). Única exceção, decidida pelo Eloir: o contador de visitas GoatCounter (sem cookies, sem aviso de consentimento), ligado pelo campo `goatcounter` de `site.config.json`; sem o campo, nada é carregado.
- Toda imagem precisa de `imagem_alt`.

## Domínio próprio (www.cronicasdaquerencia.com.br)

O site usa `https://www.cronicasdaquerencia.com.br` (campo `url` de `site.config.json`). O arquivo `CNAME` na raiz do repositório contém `www.cronicasdaquerencia.com.br` e o build o copia para `docs/`. **Nunca apague o `CNAME`**, ou o GitHub Pages perde o domínio.

DNS no Registro.br: `CNAME www → eloirviecelli.github.io.` e quatro registros `A` no domínio raiz (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) para o redirecionamento do raiz para o `www`. Em Settings → Pages do repositório, domínio personalizado `www.cronicasdaquerencia.com.br` com *Enforce HTTPS* ligado.

Ao mudar de endereço de novo: altere `url`, ajuste o `CNAME`, `npm run build`, `npm run validate`, commit e push (com autorização do Eloir) e reenvie o sitemap nos buscadores.

## Buscadores

O Eloir cadastra o site no Google Search Console e no Bing Webmaster Tools (o DuckDuckGo usa parte dos dados do Bing) e envia `sitemap.xml`. Se for preciso uma tag de verificação, adicione-a ao layout (`scripts/lib/layout.js`) com um campo opcional em `site.config.json`.
