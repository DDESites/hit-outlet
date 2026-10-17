# HiT Outlet — Site institucional e loja virtual (estático)

Site completo da **HiT Outlet** (moda masculina — tênis, chinelos, camisetas, calças/bermudas, jaquetas e moletons), construído conforme o PRD em anexo. Sem build: HTML + CSS + JavaScript puro, prontos para hospedar em qualquer servidor estático (GitHub Pages, Netlify, Vercel, Hostinger etc.).

## Como rodar localmente

No PowerShell, dentro da pasta do projeto:

```powershell
.\server.ps1
```

Depois abra <http://localhost:8080>. (Alternativa simples: `npx serve .` ou abrir o `index.html` direto no navegador — o carrinho funciona via localStorage.)

## Estrutura

```
hit-outlet/
├── index.html              Home (hero, categorias, destaques, promoções, novidades)
├── catalogo.html           Catálogo com filtros, busca e ordenação
├── tenis.html              Categoria: tênis
├── chinelos.html           Categoria: chinelos e slides
├── camisetas.html          Categoria: camisetas
├── calcas-bermudas.html    Categoria: calças e bermudas
├── jaquetas-moletons.html  Categoria: jaquetas e moletons
├── produto.html            Página do produto (galeria, tamanhos, cores, frete)
├── sacola.html             Sacola persistente (cupom + frete)
├── checkout.html           Checkout em 3 passos (dados, entrega, pagamento)
├── confirmacao.html        Confirmação + próximo passo via WhatsApp
├── entrega.html            Política de entrega e prazos
├── trocas.html             Política de trocas e devoluções
├── contato.html            Contatos, loja física e redes sociais
├── css/style.css           Identidade visual completa + responsivo
├── assets/js/
│   ├── data.js             ⚙️ LOJA, categorias, cupons, frete e catálogo de produtos
│   ├── main.js             Layout (cabeçalho/rodapé), sacola, busca, cards
│   ├── catalogo.js         Filtros, busca, ordenação
│   ├── produto.js          Página de produto
│   ├── sacola.js           Sacola
│   ├── checkout.js         Checkout em 3 passos (CEP automático via ViaCEP)
│   └── confirmacao.js      Confirmação de pedido
├── assets/img/produtos/    Fotos dos produtos (1000px)
├── assets/img/marca/       Selo da marca (selo.png, favicon.png)
├── server.ps1              Servidor local (powershell .\server.ps1)
└── _fonte/                 Scripts que regeneram as imagens (PowerShell)
```

## Funcionalidades

- **Catálogo**: 43 produtos em 5 categorias; filtros por categoria, marca, faixa de preço, promoções e novidades; ordenação (destaques, preço, novidades, A–Z); busca com sugestões no cabeçalho; chips de filtros ativos; tudo legível via URL (`catalogo.html?busca=tênis`).
- **Produto**: galeria com miniaturas, seletor de cor e tamanho (com tamanhos esgotados), quantidade, cálculo de frete por CEP (ViaCEP + tabela interna), abas de descrição/detalhes/trocas e produtos relacionados.
- **Sacola persistente** (localStorage): alterar quantidade, remover, cupons (`HIT10`, `FRETEGRATIS`), cálculo de frete e resumo ao vivo.
- **Checkout em 3 passos**: identificação + endereço com preenchimento automático por CEP, entrega (padrão/expressa/retirada na loja) e pagamento (Pix, cartão, boleto, dinheiro na entrega), com revisão editável e validação em português.
- **Confirmação**: código de pedido gerado, resumo e botão para confirmar no WhatsApp.
- **WhatsApp**: botão flutuante em todas as páginas + links contextuais (produto, pedido, troca).
- **Acessibilidade**: contraste alto (vermelho sobre branco, texto grafite), labels reais nos formulários, `alt` em todas as imagens, foco visível, navegação por teclado nas sugestões de busca, alvos de toque ≥ 44px e respeito a `prefers-reduced-motion`.
- **Responsivo**: desktop (grade larga + barra lateral de filtros), tablet e mobile (menu hambúrguer, filtros em gaveta, grade 2 colunas).

## 📣 Dados coletados nas redes oficiais da loja

Estes itens já foram conferidos nas fontes públicas da própria loja e estão aplicados no site:

| Dado | Valor | Fonte |
|---|---|---|
| Nome / perfil | HiT Outlet — Hugo Ciel · `@hit_outlet_01` (8,1 mil seguidores) | Instagram |
| Perfil reserva | `@hit_outlet_reserva` | Instagram |
| WhatsApp | (61) 99231-6858 (`5561992316858`) | link `wa.me` no perfil |
| Telefone alternativo | (61) 98539-0847 | Facebook HiT STORE |
| E-mail | romannos9@gmail.com | Facebook HiT STORE |
| Horário | Sempre aberto | Facebook HiT STORE |
| Endereço | Jardim Brasília, ao lado da Mega 25 — Águas Lindas de Goiás/GO | legendas dos reels |
| Variedade | +300 modelos | legendas dos reels |
| **Tênis** | **1 par por R$ 90** · **3 pares por R$ 220** | reel de 09/10 |
| **Chinelo Slide Nuvem** | **R$ 60,00** | reel da promoção |
| Facebook | `hitstore01` (HiT Store, Roupas e vestuário) | — |

Os preços do catálogo foram reancorados nessa faixa real de outlet (tênis a partir de **R$ 90**, chinelos e camisetas abaixo de R$ 60) e a home exibe a seção **"As ofertas que estão no Instagram"**, alimentada por `LOJA.promoTenisUnitario`, `LOJA.promoTenisTrio` e `LOJA.promoChineloSlide`.

> ⚠️ O CEP `72920-548` que aparece cadastrado no Facebook é do **Jardim da Barragem III** (outro bairro) e não foi publicado — o endereço usado no site é o que a loja repete em todas as legendas.

## ⚙️ Pontos a confirmar antes de publicar (marcados em `data.js`)

Contatos, redes, localização, horário e as **promoções de tênis/chinelo** são dados oficiais. Ainda faltam, e continuam marcados como `TODO`:

1. **Tabela de preços completa** — tênis e chinelo seguem a promoção real publicada; camisetas, calças e jaquetas usam faixa de outlet estimada. Substituir pela tabela oficial.
2. **Condições de frete** — prazos e faixas de CEP em `calcularFrete()`; limiar de frete grátis (hoje R$ 299,99) em `LOJA.freteGratisAcimaDe`.
3. **% de desconto no Pix** — hoje 5%, em `LOJA.pixDescontoPercentual`.
4. **Formas de pagamento** — confirmar quais realmente são aceitas (Pix, cartão, boleto, débito/dinheiro na entrega).
5. **Chave Pix** — o checkout informa que o QR Code é enviado no WhatsApp; se preferir exibir a chave na página, acrescente em `LOJA.pixChave`.

Tudo isso fica em **um lugar só**: o objeto `LOJA` no topo de `assets/js/data.js`.

## 🧩 Convenções do `data.js` (ao editar produtos)

O restante do site lê esses campos — mantenha os formatos:

| Campo | Formato | Observação |
|---|---|---|
| `estoque` | `true` / `false` | `false` mostra o produto como **Esgotado**. |
| `estoqueMax` | número (opcional) | Limite de unidades por item na sacola. Sem esse campo, vale `ESTOQUE_MAXIMO_PADRAO` (8) definido em `main.js`. |
| `categoria` | **nome** (`"Tênis"`) | Deve ser igual a `CATEGORIAS[].nome`; o site também aceita o `id`. |
| `detalhes` | **objeto** | `{ Material: "…", Uso: "…" }` — vira lista na aba "Detalhes". |
| `esgotados` | array | Tamanhos indisponíveis, ex.: `["39", "42"]`. |
| `precoAntigo` | número ou ausente | Preenchido (e maior que `preco`) ativa o rótulo de promoção e o desconto no card. |
| `CUPONS` | array | `HIT10` (percentual) e `FRETEGRATIS` (frete). O limiar do frete grátis é `LOJA.freteGratisAcimaDe`. |

## Identidade visual

- **Ação/ofertas**: vermelho `#e2001a` (escuro `#b30014`)
- **Texto/títulos**: grafite `#17181c` / `#23252c`
- **Fundos**: branco + cinza claro `#f6f6f8`, divisórias `#e6e7eb`
- **Tipografia**: Archivo (títulos, caixa alta, esportiva) + Inter (texto)
- **Formas**: cantos arredondados e círculos remetendo ao selo da marca
- Fotografia de produto sempre sobre fundo neutro/claro (fotos de banco de imagens — Unsplash — servindo como representação dos modelos; substituir pelas fotos da própria loja quando disponíveis)

## Regenerar as imagens

As fotos dos produtos e o selo podem ser regenerados com:

```powershell
.\_fonte\gerar-imagens.ps1   # fotos dos produtos (requer internet)
.\_fonte\gerar-selo.ps1      # selo circular + favicon
```
