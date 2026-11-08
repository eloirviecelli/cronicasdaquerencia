# Crônicas da Querência — Documento de design

Data: 2026-11-02
Repositório: `git@github.com:eloirviecelli/cronicasdaquerencia.git` (branch `main`, hoje só com `README.md`)

Legenda: **[decisão do Eloir]** foi dito ou escolhido por ele na conversa. **[minha escolha]** é proposta do assistente, que o Eloir pode trocar.

## 1. Intenção

Um site estático de crônicas e contos sobre o campo, a cultura gaúcha e a alma do homem simples (frase do README do projeto). O leitor é uma pessoa comum do sul do Brasil: quem vive no meio rural ou quem mora na cidade e sente saudade dele. Ao abrir o site, essa pessoa deve encontrar um lugar de paz, de emoção e de sensação de vida na natureza. Os textos aparecem num ritmo lento, de quem escreve com cuidado, e cada publicação é um pequeno acontecimento.

O Eloir é o coordenador e não vai mexer em arquivos à mão. Ele fornece o texto e a imagem, e a IA faz toda a publicação e a manutenção. Por isso o projeto precisa ser fácil de uma IA entender e alterar com segurança.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos [decisão do Eloir]**
- Página inicial com lista de **até 10** crônicas e contos e paginação ("próxima página").
- Cada item da lista tem imagem pequena, título e um resumo que encanta e leva a querer ler.
- Cada publicação cria um **novo arquivo** próprio.
- Boa localização por Google, DuckDuckGo e outros buscadores e robôs.
- Uma publicação nova por mês.
- Visual rural, melancólico, em cores de terra.
- Site estático hospedado no GitHub (GitHub Pages).

**Não-objetivos [minha escolha]** (podem entrar depois): comentários, busca interna, newsletter, tags e categorias, painel de edição (CMS), estatísticas de acesso, modo escuro, anúncios.

**Anti-objetivos**
- Um site que funcione tecnicamente, mas pareça um blog genérico, frio ou moderno demais.
- Passos manuais frágeis, em que esquecer um arquivo (sitemap, índice, paginação) deixa o site inconsistente.
- Dependência de serviços externos em tempo de leitura (fontes, scripts de terceiros, rastreadores). **[minha escolha]**

## 3. Visual [decisão do Eloir: direção "A — Papel de Almanaque"]

Referência: mockup A mostrado na conversa (arquivo `.superpowers/brainstorm/9996-1793624803/content/layout-palette.html`, não vai para o Git).

- **Clima:** página de almanaque ou livro antigo, creme envelhecido, calma e melancolia suave.
- **Cores base** (valores do mockup, ajustáveis pelo builder sem mudar o clima):
  - fundo `#f1e6d0`, borda `#d9c9a8`
  - texto principal `#3b2a1e`, texto de apoio `#5d4630`, texto secundário `#7a5c44`
  - destaque (ferrugem, escurecido de #b5452a para contraste AA) `#a63f26`, usado em filetes, datas, tipo e links
  - cores de miniatura de apoio, para o carregamento: `#a8794f`, `#8a6a3d`
- **Tipografia:** fonte com serifa, de clima literário. Padrão: pilha do sistema (`Georgia, "Times New Roman", serif`) sem pedido externo. **[minha escolha]**
- **Cabeçalho:** centralizado, nome "Crônicas da Querência" em letras espaçadas, a frase do README em itálico abaixo e um filete ferrugem embaixo.
- **Página inicial:** lista vertical. Cada item tem imagem pequena e quadrada à esquerda (cerca de 72 a 96 px), título em negrito, resumo de 2 a 3 linhas e uma linha com mês, ano e tipo ("novembro de 2026 · conto").
- **Paginação:** "← anterior · 1 2 · próxima →", centralizada, no fim da lista.
- **Celular:** a mesma lista em coluna única, com letra confortável e áreas de toque grandes. Muitos leitores acessam pelo celular. **[minha escolha]**
- **Página de leitura:** coluna estreita de texto (cerca de 60 a 70 caracteres por linha), título grande, data e tipo, imagem do texto no topo, links para o texto anterior e o próximo, e link de volta à lista. **[minha escolha]**
- **Imagens:** geradas por IA a partir do texto de cada publicação, em estilo consistente, com cores de terra e luz de fim de tarde, de preferência pictórico ou de ilustração suave. O guia de estilo para os prompts fica a cargo do builder. **[minha escolha]**

## 4. Como cada publicação é feita [decisão do Eloir: o fluxo]

1. O Eloir envia o texto do conto ou da crônica.
2. A IA propõe o título, o resumo que encanta, a descrição para buscadores, o slug (endereço) e o **prompt da imagem**, escrito a partir do texto. A IA não gera imagens.
3. O Eloir gera a imagem numa ferramenta da sua escolha e entrega o arquivo.
4. A IA cria o arquivo da publicação, processa a imagem (miniatura, imagem de compartilhamento, compressão, texto alternativo) e atualiza tudo o que depende dela: lista, paginação, sitemap, feed RSS, dados estruturados e links de anterior e próximo.
5. A IA valida o resultado e deixa o repositório pronto para publicar no GitHub Pages. O commit e o envio só acontecem com o pedido do Eloir.

## 5. Arquitetura [minha escolha, a trocar se houver motivo forte]

O objetivo é facilitar o trabalho de uma IA e reduzir erros.

- **Sem framework.** O Eloir conhece HTML, CSS e JavaScript. O HTML final é estático e legível, e o site deve funcionar sem JavaScript no navegador do leitor.
- **Uma fonte de verdade por publicação:** um arquivo Markdown com cabeçalho de dados (front matter) em `content/`, por exemplo `content/2026-11-nome-do-conto.md`, com pelo menos: `titulo`, `tipo` (`conto` ou `cronica`), `data`, `slug`, `resumo`, `descricao`, `imagem`, `imagem_alt`.
- **Um script de geração** (Node.js, o mínimo possível de dependências) lê `content/` e `site.config.json` e gera todo o HTML, a paginação, o sitemap, o feed e o `robots.txt` em `docs/`. O GitHub Pages serve a pasta `docs/` da branch `main`. Os arquivos gerados são versionados no Git.
- **Um script de validação** confere: campos obrigatórios, slug único, imagem e texto alternativo presentes, comprimento do resumo e da descrição, links internos válidos e coerência do sitemap com as páginas.
- **Documentação para a IA:** um `AGENTS.md` (e `CLAUDE.md` apontando para ele) com a estrutura do projeto, o passo a passo de "publicar uma nova obra", as regras de SEO, o guia de estilo das imagens e o que nunca editar à mão (`docs/` é gerado).
- **Endereços:** `/` e `/pagina/2/`, `/pagina/3/` etc. para a lista, `/conto/<slug>/` e `/cronica/<slug>/` para as publicações, `/sobre/`, `404.html`.
- **Endereço-base em um único lugar:** `site.config.json` guarda a URL do site, o nome, a frase, o autor e o idioma. Todos os links, o canonical, o sitemap e o feed saem dele.

### Endereço agora e domínio no futuro [decisão do Eloir]
- **Agora:** `https://eloirviecelli.github.io/cronicasdaquerencia/`. Os links precisam respeitar a subpasta `/cronicasdaquerencia/`.
- **Depois:** domínio próprio `cronicasdaquerencia.com.br`. A migração deve ser só: mudar a URL-base no config, adicionar o arquivo `CNAME`, configurar o DNS e o Pages, e gerar o site de novo. Nenhum outro arquivo deve precisar de edição manual. Quando isso acontecer, as URLs antigas devem apontar para as novas, na medida do que o GitHub Pages permitir; o builder avalia.

## 6. SEO e localização por robôs [decisão do Eloir: o objetivo; a técnica é minha escolha]

- HTML semântico, `lang="pt-BR"`, uma única `h1` por página, títulos e `meta description` únicos por página.
- `canonical` em todas as páginas e `rel="prev"`/`rel="next"` na paginação.
- Open Graph e Twitter Card, com a imagem de compartilhamento (cerca de 1200×630) de cada publicação.
- Dados estruturados em JSON-LD: `WebSite`, `Blog` na lista e `Article` ou `CreativeWork` em cada texto, com autor, data de publicação e imagem.
- `sitemap.xml` e `robots.txt` com a linha `Sitemap:`, e feed `feed.xml` (RSS).
- Desempenho: imagens em tamanho adequado, com `width`/`height`, `loading="lazy"` abaixo da dobra, CSS pequeno e inline ou em um único arquivo, e nenhum recurso de terceiros.
- Acessibilidade: texto alternativo em toda imagem, contraste legível, navegação por teclado e link de pular para o conteúdo.
- Passos que dependem do Eloir, fora do código: cadastrar o site no Google Search Console e no Bing Webmaster Tools (o DuckDuckGo usa em parte os dados do Bing) e enviar o sitemap. A IA guia esses passos e gera o arquivo ou a tag de verificação.

## 7. Restrições

- Site 100% estático, hospedado no GitHub Pages, sem servidor e sem banco de dados.
- Frequência de uma publicação por mês. Com 10 itens por página, a página 2 só existe a partir da 11ª publicação, e o site precisa funcionar bem com poucas publicações (inclusive zero na primeira montagem).
- O repositório está vazio. A pasta `.superpowers/` deve ficar no `.gitignore`.
- Conteúdo em português do Brasil.

## 8. Pendências que só o Eloir pode responder

- ~~Nome de autor~~ **[decisão do Eloir]** O autor exibido é **"Eloir"**, para a assinatura das obras e para os dados do Google (`author`).
- ~~Repositório público~~ **[decisão do Eloir]** O repositório é público, então o Pages gratuito funciona.
- Texto e data da primeira publicação real (não bloqueia a montagem, ver seção 8b).

## 8b. Decisões tomadas após a revisão [minha escolha, a conferir pelo Eloir]

- **Página "Sobre":** entra na primeira montagem, com rascunho escrito pela IA a partir do README. O Eloir revisa antes da publicação. O lançamento não depende dela estar perfeita.
- **Primeiro lançamento:** o site funciona sem nenhuma publicação, com uma mensagem de "em breve" na lista, feed e dados estruturados válidos. O fluxo é testado com uma publicação de teste que nunca vai para o `docs/` publicado. A primeira publicação real entra quando o Eloir mandar o texto.
- **Endereços congelados:** depois de publicado, o endereço de uma obra não muda. O validador avisa se um `slug` ou `tipo` mudar. Se for preciso mudar, cria-se uma página de redirecionamento no endereço antigo, com `canonical` para o novo.
- **Ordem:** a lista é ordenada pela `data`, da mais nova para a mais antiga. Na página de leitura, "anterior" é a obra mais antiga e "próxima" a mais nova. Se duas obras tiverem a mesma data, desempata-se pelo `slug`. O slug é gerado sem acentos.
- **Dados estruturados:** `Blog` na lista e `Article` nas obras.
- **Ambiente:** Node.js 24 (já instalado na máquina) para os scripts. A ferramenta de imagens é escolhida pelo builder.
- **GitHub Pages:** configurado para servir `docs/` na branch `main`. A IA guia esse passo, que é feito uma vez nas configurações do repositório, e verifica que a saída gerada confere com `content/` antes de cada publicação.

## 9. O que fica a cargo do builder

Escolha de fonte e ajuste fino das cores, detalhes do layout e da página de leitura, ferramenta de processamento de imagens, formato do guia de estilo das imagens, estrutura exata dos scripts e dos testes, formato do resumo (tamanho ideal) e o mecanismo de redirecionamento na futura troca de domínio.

## Atualização (2026-11-08): paleta "Erva-mate e palha"

Por escolha do Eloir (prancheta de variações), as cores passaram a: fundo `#ece6cf`, cartão `#f6f1de`, borda `#d3cba9`, texto `#2c2a1a`, apoio `#474a2a`, verde-erva `#5c5f3b` (filete do cabeçalho, legendas e etiqueta "A mais recente"), couro `#6b3f1f` (links e datas). Todas passam o contraste AA (≥ 4,5:1) sobre o fundo e sobre o cartão, conferido em `test/style.test.js`. Os valores da seção 3 acima são os da primeira versão.
