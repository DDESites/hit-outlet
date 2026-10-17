/* =========================================================
   HiT Outlet — catálogo e páginas de categoria (filtros + ordenação)
   Usado por: catalogo.html, tenis.html, camisetas.html,
              calcas-bermudas.html, jaquetas-moletons.html
   ========================================================= */

(function () {
  const corpo = document.body;
  const categoriaFixa = corpo.dataset.categoria || '';   // '' = catálogo geral
  const params = new URLSearchParams(window.location.search);
  const buscaInicial = params.get('busca') || '';

  /* `data-categoria` traz o id (ex.: "tenis") e os produtos guardam o
     nome (ex.: "Tênis") — categoriaDe() normaliza as duas formas. */
  const naCategoriaAtual = p => !categoriaFixa || categoriaDe(p).id === categoriaFixa;

  const estado = {
    categorias: categoriaFixa ? [categoriaFixa] : [],
    marcas: [],
    faixa: FAIXAS_PRECO[FAIXAS_PRECO.length - 1].max,   // teto inicial: maior faixa
    cupons: [],                                          // 'promo' e/ou 'novidades'
    ordenacao: 'relevancia',
    busca: buscaInicial,
  };

  const elGrade = document.getElementById('grade-resultados');
  const elContagem = document.getElementById('contagem-resultados');
  const elChips = document.getElementById('chips-ativos');
  const elOrdenacao = document.getElementById('ordenacao');
  const elBuscaTopo = document.getElementById('busca-topo');

  if (elBuscaTopo) elBuscaTopo.value = buscaInicial;

  /* ---------- montar filtros dinamicamente ---------- */
  function montarFiltros() {
    // categorias (só quando catálogo geral)
    const contCat = document.getElementById('filtro-categorias');
    if (contCat) {
      if (categoriaFixa) {
        contCat.closest('.grupo-filtro').style.display = 'none';
      } else {
        contCat.innerHTML = CATEGORIAS.map(c => {
          const n = PRODUTOS.filter(p => categoriaDe(p).id === c.id).length;
          return `<label class="opcao-filtro">
            <input type="checkbox" value="${c.id}" data-grupo="categorias">
            ${c.nome} <span class="cont">(${n})</span>
          </label>`;
        }).join('');
      }
    }

    // marcas (ignora produtos sem marca definida)
    const marcas = [...new Set(PRODUTOS
      .filter(p => naCategoriaAtual(p) && p.marca)
      .map(p => p.marca))].sort();
    const contMarca = document.getElementById('filtro-marcas');
    if (contMarca) {
      contMarca.innerHTML = marcas.map(m => {
        const n = PRODUTOS.filter(p => p.marca === m && naCategoriaAtual(p)).length;
        return `<label class="opcao-filtro">
          <input type="checkbox" value="${escapeHTML(m)}" data-grupo="marcas">
          ${escapeHTML(m)} <span class="cont">(${n})</span>
        </label>`;
      }).join('');
    }

    // ofertas e novidades
    const contCupom = document.getElementById('filtro-cupons');
    if (contCupom) {
      contCupom.innerHTML = `
        <label class="opcao-filtro">
          <input type="checkbox" value="promo" data-grupo="cupons">
          Em promoção <span class="cont">(${PRODUTOS.filter(p => naCategoriaAtual(p) && p.promo).length})</span>
        </label>
        <label class="opcao-filtro">
          <input type="checkbox" value="novidades" data-grupo="cupons">
          Somente novidades <span class="cont">(${PRODUTOS.filter(p => naCategoriaAtual(p) && p.novidade).length})</span>
        </label>`;
    }

    // faixa de preço
    const contFaixa = document.getElementById('filtro-faixa');
    const rotuloFaixa = document.getElementById('faixa-valor');
    if (contFaixa) {
      contFaixa.max = String(FAIXAS_PRECO[FAIXAS_PRECO.length - 1].max);
      contFaixa.value = String(estado.faixa);
      if (rotuloFaixa) rotuloFaixa.textContent = `até ${formatarBRL(estado.faixa)}`;
      contFaixa.addEventListener('input', () => {
        estado.faixa = Number(contFaixa.value);
        if (rotuloFaixa) rotuloFaixa.textContent = `até ${formatarBRL(estado.faixa)}`;
        aplicar();
      });
    }
  }

  /* ---------- leitura dos checkboxes ---------- */
  function lerChecks() {
    if (!categoriaFixa) {
      estado.categorias = [...document.querySelectorAll('[data-grupo="categorias"]:checked')].map(i => i.value);
    }
    estado.marcas = [...document.querySelectorAll('[data-grupo="marcas"]:checked')].map(i => i.value);
    estado.cupons = [...document.querySelectorAll('[data-grupo="cupons"]:checked')].map(i => i.value);
  }

  document.addEventListener('change', e => {
    if (e.target.matches('[data-grupo]')) {
      lerChecks();
      aplicar();
    }
    if (e.target.id === 'ordenacao') {
      estado.ordenacao = e.target.value;
      aplicar();
    }
  });

  /* ---------- busca no topo do catálogo ---------- */
  const formBuscaTopo = document.getElementById('form-busca-topo');
  formBuscaTopo?.addEventListener('submit', e => {
    e.preventDefault();
    estado.busca = elBuscaTopo.value.trim();
    aplicar();
    const url = new URL(window.location);
    if (estado.busca) url.searchParams.set('busca', estado.busca);
    else url.searchParams.delete('busca');
    history.replaceState(null, '', url);
  });

  /* ---------- filtragem / ordenação ---------- */
  function produtosFiltrados() {
    let lista = [...PRODUTOS].filter(naCategoriaAtual);
    if (estado.categorias.length)
      lista = lista.filter(p => estado.categorias.includes(categoriaDe(p).id));
    if (estado.marcas.length) lista = lista.filter(p => estado.marcas.includes(p.marca));
    lista = lista.filter(p => p.preco <= estado.faixa);
    if (estado.cupons.includes('promo')) lista = lista.filter(p => p.promo);
    if (estado.cupons.includes('novidades')) lista = lista.filter(p => p.novidade);
    if (estado.busca) {
      const t = estado.busca.toLowerCase();
      lista = lista.filter(p =>
        p.nome.toLowerCase().includes(t) ||
        p.resumo.toLowerCase().includes(t) ||
        p.tags.some(g => g.toLowerCase().includes(t)) ||
        categoriaDe(p).nome.toLowerCase().includes(t) ||
        (p.marca || '').toLowerCase().includes(t)
      );
    }

    switch (estado.ordenacao) {
      case 'menor-preco': lista.sort((a, b) => a.preco - b.preco); break;
      case 'maior-preco': lista.sort((a, b) => b.preco - a.preco); break;
      case 'nome': lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); break;
      case 'novidades': lista.sort((a, b) => (b.novidade ? 1 : 0) - (a.novidade ? 1 : 0)); break;
      default: lista.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
    }
    return lista;
  }

  function renderChips() {
    if (!elChips) return;
    const chips = [];
    estado.categorias.forEach(id => {
      const c = CATEGORIAS.find(x => x.id === id);
      chips.push({ grupo: 'categorias', valor: id, rotulo: c ? c.nome : id });
    });
    estado.marcas.forEach(m => chips.push({ grupo: 'marcas', valor: m, rotulo: m }));
    estado.cupons.forEach(c => chips.push({
      grupo: 'cupons', valor: c,
      rotulo: c === 'promo' ? 'Em promoção' : 'Novidades'
    }));
    if (estado.busca) chips.push({ grupo: 'busca', valor: '', rotulo: `“${estado.busca}”` });
    if (estado.faixa < FAIXAS_PRECO[FAIXAS_PRECO.length - 1].max)
      chips.push({ grupo: 'faixa', valor: '', rotulo: `Até ${formatarBRL(estado.faixa)}` });

    elChips.innerHTML = chips.map(c => `
      <button class="chip-filtro" data-grupo="${c.grupo}" data-valor="${escapeHTML(c.valor)}">
        ${escapeHTML(c.rotulo)} ✕
      </button>`).join('');
    elChips.style.display = chips.length ? 'flex' : 'none';

    elChips.querySelectorAll('.chip-filtro').forEach(chip => {
      chip.addEventListener('click', () => {
        const { grupo, valor } = chip.dataset;
        if (grupo === 'busca') { estado.busca = ''; if (elBuscaTopo) elBuscaTopo.value = ''; }
        else if (grupo === 'faixa') {
          estado.faixa = FAIXAS_PRECO[FAIXAS_PRECO.length - 1].max;
          const contFaixa = document.getElementById('filtro-faixa');
          if (contFaixa) contFaixa.value = String(estado.faixa);
          const rot = document.getElementById('faixa-valor');
          if (rot) rot.textContent = `até ${formatarBRL(estado.faixa)}`;
        } else {
          const check = document.querySelector(`[data-grupo="${grupo}"][value="${CSS.escape(valor)}"]`);
          if (check) check.checked = false;
          lerChecks();
        }
        aplicar();
      });
    });
  }

  function aplicar() {
    const lista = produtosFiltrados();
    if (elContagem) {
      elContagem.innerHTML = `<strong>${lista.length}</strong> ${lista.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
    }
    renderChips();
    if (!lista.length) {
      elGrade.innerHTML = `
        <div class="vazio-estado" style="grid-column:1/-1">
          <div class="icone">🔎</div>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente remover alguns filtros ou buscar por outro termo.</p>
          <button class="btn btn-contorno" id="btn-limpar-tudo">Limpar filtros</button>
        </div>`;
      document.getElementById('btn-limpar-tudo')?.addEventListener('click', limparTudo);
      return;
    }
    renderizarGrade(elGrade, lista);
  }

  function limparTudo() {
    document.querySelectorAll('[data-grupo]').forEach(i => { if (i.type === 'checkbox') i.checked = false; });
    estado.marcas = []; estado.cupons = [];
    if (!categoriaFixa) estado.categorias = [];
    estado.busca = '';
    if (elBuscaTopo) elBuscaTopo.value = '';
    estado.faixa = FAIXAS_PRECO[FAIXAS_PRECO.length - 1].max;
    const contFaixa = document.getElementById('filtro-faixa');
    if (contFaixa) contFaixa.value = String(estado.faixa);
    const rot = document.getElementById('faixa-valor');
    if (rot) rot.textContent = `até ${formatarBRL(estado.faixa)}`;
    aplicar();
  }

  document.getElementById('btn-limpar-filtros')?.addEventListener('click', limparTudo);

  /* ---------- filtros mobile (gaveta) ---------- */
  const gaveta = document.getElementById('filtros-coluna');
  document.getElementById('btn-filtros-mobile')?.addEventListener('click', () => {
    gaveta.classList.add('aberto');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('btn-fechar-filtros')?.addEventListener('click', fecharGaveta);
  function fecharGaveta() {
    gaveta?.classList.remove('aberto');
    document.body.style.overflow = '';
  }

  /* ---------- grupos colapsáveis ---------- */
  document.querySelectorAll('.btn-toggle-filtro').forEach(btn => {
    btn.addEventListener('click', () => {
      const alvo = document.getElementById(btn.dataset.alvo);
      const aberto = alvo.classList.toggle('mostrar');
      btn.setAttribute('aria-expanded', String(aberto));
    });
  });

  /* ---------- início ---------- */
  montarFiltros();
  aplicar();
})();
