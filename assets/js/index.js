/* =========================================================
   HiT Outlet — página inicial
   ========================================================= */

(function () {
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
