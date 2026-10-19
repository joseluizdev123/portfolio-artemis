# Portfólio — modelo de dados WordPress

Tema `wordpress/artemis-portfolio/`. Ele espelha a página estática (`index.html`) com o mesmo HTML, o mesmo CSS e o
mesmo JS, e deixa **todo o conteúdo editável no painel**. Segue as convenções do tema oficial (`site_artemis/theme/artemis`):
meta box nativa (sem ACF), `{entre chaves}` para o trecho em cinza dos títulos e um seeder de um clique.

## Decisões

| Pergunta | Decisão |
|---|---|
| ACF ou meta box nativa? | **Nativa**, sem depender de plugin (como o tema oficial) |
| Onde se editam os textos da página? | **Na própria página "Portfólio"** (Páginas → Portfólio), em caixas por seção |
| Header e rodapé | **Personalizar → Portfólio: header e rodapé** + **Aparência → Menus**. São globais, como no site oficial |
| Números ("23 projetos", "Projetos 23", "Formatos 04", "[ Projetos: 23 ]") | **Calculados** pelos projetos publicados e pelas categorias |
| Imagens | Capturas = imagem destacada do projeto (seeder importa as 20 para a Mídia). Padrões e ícones são fixos do tema |
| Updates | Cabeçalho `GitHub Theme URI` no `style.css` (Git Updater) |

## Conteúdo

| Conteúdo | Tipo | Slug WP | Campos |
|---|---|---|---|
| Projetos | CPT | `art_projeto` | título (nome) · imagem destacada (captura 16:10) · ordem (`menu_order`) · `_pf_dominio` (texto do cartão) · `_pf_url` (vazio = sem link) · `_pf_cta` (padrão "Ver site no ar") · `_pf_cta_sem_link` (padrão "Protótipo em breve") |
| Projeto em destaque | campos no CPT | `_pf_destaque` = 1 | `_pf_selo` ("Em destaque") · `_pf_formato` ("Site de evento") · `_pf_descricao` · `_pf_fato_N_rotulo` / `_pf_fato_N_valor` (N = 1–3) · `_pf_botao` ("Ver site no ar"). Vale o primeiro marcado pela ordem; ele sai da grade |
| Categorias (abas do filtro) | taxonomia | `art_projeto_cat` | nome (texto da aba) · slug (`site`, `onepage`, `blog` — a aba Plataforma do design foi retirada) · `_pf_plural` (rótulo da grade: "Sites") · `_pf_ordem` (ordem das abas) |
| Textos da página | meta da página | template **Portfólio** | por seção: Hero · Filtro (inclui as palavras que o filtro escreve: "projetos", "em", "Ver os projetos ↓", avisos) · Projeto em destaque ("Abrir site") · Todos os projetos (inclui "Captura do site") · Cartão de chamada (com os 3 números) · Chamada final · SEO. Lista completa em `inc/pagina.php` (`artemis_pf_campos()`) |
| Header e rodapé | Customizer | `art_pf_*` | selo, CTA do header, frase e newsletter do rodapé, contatos, redes sociais, textos legais. Lista em `inc/customizer.php` |
| Menus | Menus | `pf_principal`, `pf_rodape_artemis`, `pf_rodape_linhas`, `pf_legal` | com os links do design como reserva enquanto o menu não existe |

Página: `portfolio-artemis` (template *Portfólio*). O seeder cria a página e a define como página inicial do tema de prévia.
No site oficial, ela fica em `/portfolio-artemis/`.

## Fonte única dos dados iniciais

`src/projetos.json` alimenta o build estático (cartões) e o seeder do WordPress (copiado para o tema pelo
`tools/build.py`). Os textos padrão da página ficam em `inc/pagina.php`. A validação `tools/comparar.py` (WordPress ×
`index.html`) acusa qualquer diferença entre as duas versões.
