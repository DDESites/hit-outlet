/* =========================================================
   HiT Outlet — main.js (compartilhado: layout, sacola, busca)
   ========================================================= */

const CHAVE_SACOLA = 'hit_sacola';
const CHAVE_CUPOM = 'hit_cupom';
const CHAVE_PEDIDO = 'hit_pedido';
const CHAVE_CLIENTE = 'hit_cliente';

/* ---------------- utilidades ---------------- */
const formatarBRL = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function calcularParcelas(preco) {
  const n = 10;
  const valor = preco / n;
  return { n, valor };
}

function escapeHTML(txt) {
  return String(txt ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function obterProduto(id) {
  return PRODUTOS.find(p => String(p.id) === String(id));
}

/* `estoque` é booleano (true = disponível, false = esgotado).
   O limite de unidades por item vem de `estoqueMax` no produto,
   com o padrão abaixo quando não informado. */
const ESTOQUE_MAXIMO_PADRAO = 8;
function estoqueMaximo(p) {
  const v = p && Number.isFinite(p.estoqueMax) ? p.estoqueMax : ESTOQUE_MAXIMO_PADRAO;
  return Math.max(1, v);
}
function disponivel(p) {
  return !!p && p.estoque !== false && p.estoque > 0;
}

function linkProduto(p) {
  return `produto.html?id=${encodeURIComponent(p.id)}`;
}

function linkWhatsApp(texto) {
  const numero = LOJA.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto || LOJA.mensagemPadrao)}`;
}

/* ---------------- sacola (localStorage) ---------------- */
function lerSacola() {
  try {
    const raw = localStorage.getItem(CHAVE_SACOLA);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function gravarSacola(itens) {
  localStorage.setItem(CHAVE_SACOLA, JSON.stringify(itens));
  atualizarContadorSacola();
}

function itemChave(item) {
  return `${item.id}|${item.tamanho || ''}|${item.cor || ''}`;
}

function adicionarSacola(id, tamanho, cor, qtd = 1) {
  const produto = obterProduto(id);
  if (!produto) return false;
  const itens = lerSacola();
  const novo = { id: String(id), tamanho: tamanho || '', cor: cor || '', qtd: Math.max(1, qtd | 0) };
  const idx = itens.findIndex(i => itemChave(i) === itemChave(novo));
  const max = estoqueMaximo(produto);
  if (idx >= 0) itens[idx].qtd = Math.min(max, itens[idx].qtd + novo.qtd);
  else itens.push(novo);
  gravarSacola(itens);
  return true;
}

function alterarQtdSacola(chave, delta) {
  const itens = lerSacola();
  const item = itens.find(i => itemChave(i) === chave);
  if (!item) return;
  const produto = obterProduto(item.id);
  const max = estoqueMaximo(produto);
  item.qtd = Math.min(max, Math.max(1, item.qtd + delta));
  gravarSacola(itens);
  return item.qtd;
}

function definirQtdSacola(chave, qtd) {
  const itens = lerSacola();
  const item = itens.find(i => itemChave(i) === chave);
  if (!item) return;
  const produto = obterProduto(item.id);
  const max = estoqueMaximo(produto);
  item.qtd = Math.min(max, Math.max(1, qtd | 0));
  gravarSacola(itens);
  return item.qtd;
}

function removerSacolaItem(chave) {
  gravarSacola(lerSacola().filter(i => itemChave(i) !== chave));
}

function limparSacola() {
  localStorage.removeItem(CHAVE_SACOLA);
  localStorage.removeItem(CHAVE_CUPOM);
  atualizarContadorSacola();
}

function contarSacola() {
  return lerSacola().reduce((s, i) => s + i.qtd, 0);
}

function subtotalSacola(itens = lerSacola()) {
  return itens.reduce((s, i) => {
    const p = obterProduto(i.id);
    return p ? s + p.preco * i.qtd : s;
  }, 0);
}

function atualizarContadorSacola() {
  const n = contarSacola();
  document.querySelectorAll('[data-contador-sacola]').forEach(el => {
    el.textContent = n;
    el.style.display = n > 0 ? 'inline-flex' : 'none';
  });
}

/* ---------------- cupons ---------------- */
function lerCupom() {
  try { return localStorage.getItem(CHAVE_CUPOM) || ''; } catch { return ''; }
}
function gravarCupom(codigo) {
  if (codigo) localStorage.setItem(CHAVE_CUPOM, codigo);
  else localStorage.removeItem(CHAVE_CUPOM);
}

function validarCupom(codigo) {
  const c = (codigo || '').trim().toUpperCase();
  if (!c) return { ok: false, mensagem: 'Digite um código de cupom.' };
  const cupom = CUPONS.find(x => x.codigo === c);
  if (!cupom) return { ok: false, mensagem: 'Cupom inválido ou expirado.' };
  const subtotal = subtotalSacola();
  if (cupom.minimo && subtotal < cupom.minimo)
    return { ok: false, mensagem: `Cupom ${c} vale para compras acima de ${formatarBRL(cupom.minimo)}.` };
  return { ok: true, cupom };
}

function descontoCupom(subtotal) {
  const { ok, cupom } = validarCupom(lerCupom());
  if (!ok) return 0;
  return cupom.descontoPercentual ? subtotal * (cupom.descontoPercentual / 100) : 0;
}

function cupomFreteGratisAtivo() {
  const { ok, cupom } = validarCupom(lerCupom());
  return !!(ok && cupom.freteGratis);
}

function calcularFreteLocal(cep, subtotal) {
  return calcularFrete(cep, { subtotal, cupomFreteGratis: cupomFreteGratisAtivo() });
}

/* ---------------- ícones / layout ---------------- */
const ICONE_WHATSAPP = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.32A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3 .78.8-2.92-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>`;

function renderizarCabecalho() {
  const pagina = document.body.dataset.pagina || '';
  const links = [
    { href: 'index.html', rotulo: 'Início', id: 'inicio' },
    ...CATEGORIAS.map(c => ({ href: c.slug, rotulo: c.nome, id: 'cat-' + c.id })),
    { href: 'catalogo.html', rotulo: 'Catálogo completo', id: 'catalogo' },
    { href: 'entrega.html', rotulo: 'Entrega', id: 'entrega' },
    { href: 'trocas.html', rotulo: 'Trocas', id: 'trocas' },
    { href: 'contato.html', rotulo: 'Contato', id: 'contato' },
  ];
  const el = document.getElementById('cabecalho-site');
  if (!el) return;
  el.innerHTML = `
  <div class="faixa-topo">
    <span><span class="ponto">●</span> Tênis a partir de <strong>${formatarBRL(LOJA.promoTenisUnitario)}</strong></span>
    <span class="esconder-mobile"><span class="ponto">●</span> Envio para todo o Brasil</span>
    <span class="esconder-mobile"><span class="ponto">●</span> Direto da fábrica</span>
  </div>
  <header class="cabecalho">
    <div class="container cabecalho-linha">
      <a class="marca" href="index.html" aria-label="HiT Outlet — página inicial">
        <img src="assets/img/marca/selo.png" alt="">
        <span><span class="marca-hit">HiT</span> Outlet</span>
      </a>
      <form class="barra-busca" role="search" id="form-busca" autocomplete="off">
        <label class="somente-leitor" for="input-busca">Buscar produtos</label>
        <input type="search" id="input-busca" placeholder="Buscar tênis, camiseta, moletom..."
               aria-label="Buscar produtos" aria-controls="painel-sugestoes">
        <button type="submit" aria-label="Buscar">🔍</button>
        <div id="painel-sugestoes"></div>
      </form>
      <button class="btn-menu-mobile" id="btn-menu-mobile" aria-label="Abrir menu" aria-expanded="false">☰</button>
      <div class="acoes-topo">
        <a class="acao-topo" href="${linkWhatsApp()}" target="_blank" rel="noopener">
          <span class="icone">${ICONE_WHATSAPP}</span><span class="rotulo-acao">WhatsApp</span>
        </a>
        <a class="acao-topo" href="sacola.html">
          <span class="icone" aria-hidden="true">🛍️</span>
          <span class="rotulo-acao">Sacola</span>
          <span class="badge-contador" data-contador-sacola style="display:none">0</span>
        </a>
      </div>
    </div>
    <nav class="container menu-principal" id="menu-principal" aria-label="Navegação principal">
      ${links.map(l => `<a href="${l.href}" class="${l.id === pagina ? 'ativo' : ''}"${l.id === pagina ? ' aria-current="page"' : ''}>${l.rotulo}</a>`).join('')}
    </nav>
  </header>`;

  const btnMenu = document.getElementById('btn-menu-mobile');
  const menu = document.getElementById('menu-principal');
  btnMenu?.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    btnMenu.setAttribute('aria-expanded', String(aberto));
  });

  atualizarContadorSacola();
  configurarBusca();
}

function renderizarRodape() {
  const el = document.getElementById('rodape-site');
  if (!el) return;
  el.innerHTML = `
  <footer class="rodape">
    <div class="container rodape-grade">
      <div class="sobre">
        <a class="marca" href="index.html">
          <img src="assets/img/marca/selo.png" alt="">
          <span><span class="marca-hit">HiT</span> Outlet</span>
        </a>
        <p>Moda masculina com o melhor preço: tênis, camisetas, calças, jaquetas e moletons direto da fábrica. Mais de 300 modelos disponíveis.</p>
        <div class="social-rodape">
          <a href="${LOJA.instagram}" target="_blank" rel="noopener" aria-label="Instagram da HiT Outlet">📷</a>
          <a href="${LOJA.facebook}" target="_blank" rel="noopener" aria-label="Facebook da HiT Outlet">👍</a>
          <a href="${linkWhatsApp()}" target="_blank" rel="noopener" aria-label="WhatsApp da HiT Outlet">${ICONE_WHATSAPP}</a>
        </div>
      </div>
      <div>
        <h2>Categorias</h2>
        ${CATEGORIAS.map(c => `<a href="${c.slug}">${c.nome}</a>`).join('')}
        <a href="catalogo.html">Catálogo completo</a>
      </div>
      <div>
        <h2>Ajuda</h2>
        <a href="entrega.html">Entrega e prazos</a>
        <a href="trocas.html">Trocas e devoluções</a>
        <a href="contato.html">Fale conosco</a>
        <a href="sacola.html">Minha sacola</a>
      </div>
      <div>
        <h2>Novidades e promoções</h2>
        <p>Receba ofertas exclusivas e lançamentos no seu e-mail.</p>
        <form class="form-newsletter" id="form-newsletter">
          <label class="somente-leitor" for="news-email">Seu e-mail</label>
          <input type="email" id="news-email" placeholder="Seu e-mail" required>
          <button type="submit">Assinar</button>
        </form>
        <p class="texto-pequeno" style="margin-top:.6rem">WhatsApp: <strong>${LOJA.telefoneExibicao}</strong></p>
        <p class="texto-pequeno" style="margin:.3rem 0 0">E-mail: <a href="mailto:${LOJA.email}">${LOJA.email}</a></p>
      </div>
    </div>
    <div class="container rodape-base">
      <span>© ${new Date().getFullYear()} HiT Outlet — ${LOJA.cidade}. Todos os direitos reservados.</span>
      <div class="pagamentos-badge">
        <span>PIX</span><span>Boleto</span><span>Cartão de crédito</span><span>Débito na entrega</span>
      </div>
    </div>
  </footer>
  <a class="btn-whatsapp" href="${linkWhatsApp()}" target="_blank" rel="noopener">
    <span class="icone" aria-hidden="true">${ICONE_WHATSAPP}</span><span class="rotulo">Fale conosco</span>
  </a>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  document.getElementById('form-newsletter')?.addEventListener('submit', e => {
    e.preventDefault();
    mostrarToast('Pronto! Você receberá nossas ofertas por e-mail.');
    e.target.reset();
  });
}

/* ---------------- busca com sugestões ---------------- */
function configurarBusca() {
  const form = document.getElementById('form-busca');
  const input = document.getElementById('input-busca');
  const painel = document.getElementById('painel-sugestoes');
  if (!form || !input || !painel) return;

  let focado = -1;

  function fechar() {
    painel.innerHTML = '';
    focado = -1;
  }

  function termoValido(t) { return t.trim().length >= 2; }

  function sugerir() {
    const t = input.value.trim().toLowerCase();
    if (!termoValido(t)) { fechar(); return; }
    const achados = PRODUTOS.filter(p =>
      p.nome.toLowerCase().includes(t) ||
      p.tags.some(g => g.toLowerCase().includes(t)) ||
      categoriaDe(p).nome.toLowerCase().includes(t)
    ).slice(0, 6);
    painel.className = 'sugestoes-painel';
    if (!achados.length) {
      painel.innerHTML = `<div class="sug-vazio">Nenhum produto encontrado para “${escapeHTML(input.value)}”.</div>`;
    } else {
      painel.innerHTML = achados.map((p, i) => `
        <button type="button" data-link="${linkProduto(p)}" data-idx="${i}">
          <img src="${p.imagens[0]}" alt="">
          <span>${escapeHTML(p.nome)}</span>
          <span class="sug-preco">${formatarBRL(p.preco)}</span>
        </button>`).join('');
    }
    painel.querySelectorAll('button').forEach(b =>
      b.addEventListener('click', () => { window.location.href = b.dataset.link; })
    );
  }

  function moverFoco(dir) {
    const btns = [...painel.querySelectorAll('button')];
    if (!btns.length) return;
    focado = (focado + dir + btns.length) % btns.length;
    btns.forEach((b, i) => {
      b.classList.toggle('focado', i === focado);
    });
    btns[focoado].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', sugerir);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moverFoco(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moverFoco(-1); }
    else if (e.key === 'Enter' && focado >= 0) {
      const btn = painel.querySelectorAll('button')[focado];
      if (btn) { e.preventDefault(); window.location.href = btn.dataset.link; }
    } else if (e.key === 'Escape') fechar();
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.trim();
    window.location.href = t ? `catalogo.html?busca=${encodeURIComponent(t)}` : 'catalogo.html';
  });
  document.addEventListener('click', e => {
    if (!form.contains(e.target)) fechar();
  });
}

/* Os produtos guardam o NOME da categoria (ex.: "Tênis"), enquanto
   CATEGORIAS usa o id (ex.: "tenis"). Aqui as duas formas são
   resolvidas para a categoria completa. */
function categoriaDe(p) {
  const chave = p ? p.categoria : '';
  const encontrada = CATEGORIAS.find(c => c.id === chave || c.nome === chave);
  return encontrada || { id: '', nome: '', slug: '', foto: '', resumo: '' };
}

/* ---------------- cards de produto ---------------- */
function montarCard(p) {
  const cat = categoriaDe(p);
  const etiquetas = [
    p.promo ? `<span class="etiqueta etiqueta-promo">Promoção</span>` : '',
    p.novidade ? `<span class="etiqueta etiqueta-novo">Novidade</span>` : '',
    !disponivel(p) ? `<span class="etiqueta etiqueta-esgotado">Esgotado</span>` : '',
  ].join('');
  const temDesconto = p.precoAntigo && p.precoAntigo > p.preco;
  const { n, valor } = calcularParcelas(p.preco);
  const tamanhos = (p.tamanhos || []).map(t =>
    `<span class="tamanho-mini ${(p.esgotados || []).includes(t) ? 'esgotado' : ''}">${t}</span>`
  ).join('');
  return `
  <article class="card-produto">
    <div class="midia">
      <div class="etiquetas">${etiquetas}</div>
      <a href="${linkProduto(p)}" aria-label="Ver ${escapeHTML(p.nome)}">
        <img src="${p.imagens[0]}" alt="${escapeHTML(p.nome)} — ${escapeHTML(cat.nome)} HiT Outlet" loading="lazy">
      </a>
    </div>
    <div class="corpo">
      <span class="marca-p">${escapeHTML(cat.nome)}</span>
      <h3 class="nome"><a href="${linkProduto(p)}">${escapeHTML(p.nome)}</a></h3>
      ${tamanhos ? `<div class="tamanhos-mini" aria-hidden="true">${tamanhos}</div>` : ''}
      <div class="precos">
        ${temDesconto ? `<span class="preco-antigo">${formatarBRL(p.precoAntigo)}</span>` : ''}
        <span class="preco-atual ${temDesconto ? 'vermelho' : ''}">${formatarBRL(p.preco)}</span>
        <span class="preco-parcela">ou ${n}x de ${formatarBRL(valor)} sem juros</span>
      </div>
      <div class="rodape-card">
        <a class="btn btn-primario btn-mini" href="${linkProduto(p)}" style="flex:1">Ver produto</a>
      </div>
    </div>
  </article>`;
}

function renderizarGrade(elemento, produtos) {
  if (!elemento) return;
  if (!produtos.length) {
    elemento.innerHTML = '';
    return;
  }
  elemento.innerHTML = produtos.map(montarCard).join('');
}

/* ---------------- toast ---------------- */
let toastTimer = null;
function mostrarToast(msg, icone = '✓') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<span class="icone">${icone}</span> ${escapeHTML(msg)}`;
  t.classList.add('mostrar');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('mostrar'), 3200);
}

/* ---------------- links de WhatsApp por contexto ---------------- */
function linkWhatsAppProduto(p, tamanho) {
  const msg = `Olá! Tenho interesse no ${p.nome} (${formatarBRL(p.preco)})${tamanho ? `, tamanho ${tamanho}` : ''}. Vi no site da HiT Outlet e queria mais informações.`;
  return linkWhatsApp(msg);
}

function linkWhatsAppPedido(codigo) {
  const msg = `Olá! Acabei de fazer o pedido ${codigo} no site da HiT Outlet e gostaria de confirmar os próximos passos.`;
  return linkWhatsApp(msg);
}

/* ---------------- boot ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderizarCabecalho();
  renderizarRodape();
});
