/* =========================================================
   HiT Outlet — página inicial
   ========================================================= */

(function () {
  /* ---------- ofertas reais publicadas no Instagram ---------- */
  const elOfertas = document.getElementById('grade-ofertas');
  if (elOfertas) {
    const ofertas = [
      {
        icone: '👟',
        valor: formatarBRL(LOJA.promoTenisUnitario),
        titulo: '1 par de tênis',
        texto: 'Qualquer modelo entre os +300 disponíveis na loja.',
        href: 'tenis.html',
        cta: 'Ver tênis',
        destaque: true,
      },
      {
        icone: '🔥',
        valor: formatarBRL(LOJA.promoTenisTrio),
        titulo: `${LOJA.promoTenisTrioQtd} pares de tênis`,
        texto: 'Leve o trio e divida o valor: sai mais em conta por par.',
        href: 'tenis.html',
        cta: 'Montar meu trio',
        destaque: false,
      },
      {
        icone: '🩴',
        valor: formatarBRL(LOJA.promoChineloSlide),
        titulo: 'Chinelo Slide Nuvem',
        texto: 'Supermacio e leve — o chinelo mais confortável da loja.',
        href: 'chinelos.html',
        cta: 'Ver chinelos',
        destaque: false,
      },
    ];
    elOfertas.innerHTML = ofertas.map(o => `
      <article class="card-oferta${o.destaque ? ' card-oferta-destaque' : ''}">
        <span class="icone-oferta" aria-hidden="true">${o.icone}</span>
        <p class="valor-oferta">${o.valor}</p>
        <h3>${escapeHTML(o.titulo)}</h3>
        <p class="texto-pequeno">${escapeHTML(o.texto)}</p>
        <a class="btn ${o.destaque ? 'btn-branco' : 'btn-contorno'}" href="${o.href}">${o.cta}</a>
      </article>`).join('');
  }

  /* ---------- preço mínimo do hero ---------- */
  const elPartir = document.getElementById('dado-tenis-partir');
  if (elPartir) elPartir.textContent = `A partir de ${formatarBRL(LOJA.promoTenisUnitario)}`;

  /* ---------- categorias ---------- */
  const elCats = document.getElementById('grade-categorias');
  if (elCats) {
    elCats.innerHTML = CATEGORIAS.map(c => {
      const n = PRODUTOS.filter(p => categoriaDe(p).id === c.id).length;
      return `
      <a class="card-categoria" href="${c.slug}">
        <img src="${c.foto}" alt="Categoria ${escapeHTML(c.nome)}">
        <span class="pilula">${n} itens</span>
        <span class="rotulo">
          <strong>${escapeHTML(c.nome)}</strong>
          <span>${escapeHTML(c.resumo)}</span>
        </span>
      </a>`;
    }).join('');
  }

  /* ---------- destaques ---------- */
  renderizarGrade(
    document.getElementById('grade-destaques'),
    PRODUTOS.filter(p => p.destaque).slice(0, 8)
  );

  /* ---------- promoções ---------- */
  renderizarGrade(
    document.getElementById('grade-promocoes'),
    PRODUTOS.filter(p => p.promo).slice(0, 4)
  );

  /* ---------- novidades ---------- */
  renderizarGrade(
    document.getElementById('grade-novidades'),
    PRODUTOS.filter(p => p.novidade).slice(0, 4)
  );

  /* ---------- número de itens nas seções ---------- */
  const elTotalCatalogo = document.getElementById('total-catalogo');
  if (elTotalCatalogo) elTotalCatalogo.textContent = PRODUTOS.length;
})();
