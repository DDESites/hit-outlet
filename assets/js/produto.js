/* =========================================================
   HiT Outlet — página do produto
   ========================================================= */

(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const produto = id ? obterProduto(id) : null;
  const raiz = document.getElementById('pagina-produto');

  if (!produto) {
    if (raiz) {
      raiz.innerHTML = `
        <div class="vazio-estado" style="grid-column:1/-1">
          <div class="icone">🛒</div>
          <h3>Produto não encontrado</h3>
          <p>O item que você procura pode ter saído de linha. Veja o catálogo completo.</p>
          <a class="btn btn-primario" href="catalogo.html">Ver catálogo</a>
        </div>`;
    }
    return;
  }

  document.title = `${produto.nome} | HiT Outlet`;
  const cat = categoriaDe(produto);

  const selo = document.querySelector('[data-selo-pagina]');
  if (selo) selo.textContent = cat.nome;

  const temDesconto = produto.precoAntigo && produto.precoAntigo > produto.preco;
  const percentual = temDesconto ? Math.round((1 - produto.preco / produto.precoAntigo) * 100) : 0;
  const { n, valor } = calcularParcelas(produto.preco);

  /* ---------- galeria ---------- */
  const fotoPrincipal = document.getElementById('foto-principal');
  const miniaturas = document.getElementById('miniaturas');
  if (fotoPrincipal) {
    fotoPrincipal.src = produto.imagens[0];
    fotoPrincipal.alt = `${produto.nome} — foto principal`;
  }
  if (miniaturas && produto.imagens.length > 1) {
    miniaturas.innerHTML = produto.imagens.map((img, i) => `
      <button class="miniatura ${i === 0 ? 'ativa' : ''}" data-img="${img}" aria-label="Ver foto ${i + 1} de ${produto.imagens.length}">
        <img src="${img}" alt="">
      </button>`).join('');
    miniaturas.querySelectorAll('.miniatura').forEach(b => {
      b.addEventListener('click', () => {
        fotoPrincipal.src = b.dataset.img;
        miniaturas.querySelectorAll('.miniatura').forEach(x => x.classList.remove('ativa'));
        b.classList.add('ativa');
      });
    });
  }

  /* ---------- infos básicas ---------- */
  document.getElementById('info-nome').textContent = produto.nome;
  document.getElementById('info-marca').textContent = produto.marca || cat.nome || LOJA.nome;
  document.getElementById('info-resumo').textContent = produto.resumo;

  const elEtiquetas = document.getElementById('info-etiquetas');
  elEtiquetas.innerHTML = [
    produto.promo ? `<span class="etiqueta etiqueta-promo">${percentual ? `${percentual}% OFF` : 'Promoção'}</span>` : '',
    produto.novidade ? `<span class="etiqueta etiqueta-novo">Novidade</span>` : '',
    !disponivel(produto) ? `<span class="etiqueta etiqueta-esgotado">Esgotado</span>` : '',
  ].join('');

  const elPrecos = document.getElementById('info-precos');
  elPrecos.innerHTML = `
    ${temDesconto ? `<span class="preco-antigo">${formatarBRL(produto.precoAntigo)}</span>` : ''}
    <span class="preco-atual ${temDesconto ? 'vermelho' : ''}">${formatarBRL(produto.preco)}</span>
    <span class="preco-parcela">ou ${n}x de ${formatarBRL(valor)} sem juros no cartão</span>
    ${LOJA.pixDescontoPercentual ? `<span class="selo-pix">⚡ ${LOJA.pixDescontoPercentual}% de desconto à vista no Pix</span>` : ''}`;

  /* ---------- variações ---------- */
  let corSelecionada = produto.cores?.[0] || '';
  let tamanhoSelecionado = '';

  const elCores = document.getElementById('info-cores');
  if (produto.cores?.length) {
    document.getElementById('bloco-cores').querySelector('.rotulo-var').textContent =
      `Cor: ${corSelecionada}`;
    elCores.innerHTML = produto.cores.map((c, i) =>
      `<button class="cor-opcao ${i === 0 ? 'ativa' : ''}" data-cor="${escapeHTML(c)}">${escapeHTML(c)}</button>`
    ).join('');
    elCores.querySelectorAll('.cor-opcao').forEach(b => {
      b.addEventListener('click', () => {
        corSelecionada = b.dataset.cor;
        elCores.querySelectorAll('.cor-opcao').forEach(x => x.classList.remove('ativa'));
        b.classList.add('ativa');
        document.querySelector('#bloco-cores .rotulo-var').textContent = `Cor: ${corSelecionada}`;
      });
    });
  } else {
    document.getElementById('bloco-cores').style.display = 'none';
  }

  const elTamanhos = document.getElementById('info-tamanhos');
  const avisoTamanho = document.getElementById('aviso-tamanho');
  elTamanhos.innerHTML = (produto.tamanhos || []).map(t => {
    const esgotado = (produto.esgotados || []).includes(t);
    return `<button class="btn-tamanho ${esgotado ? 'esgotado' : ''}" data-tam="${t}"
      ${esgotado ? 'disabled aria-disabled="true"' : ''}>${t}</button>`;
  }).join('');
  elTamanhos.querySelectorAll('.btn-tamanho:not(.esgotado)').forEach(b => {
    b.addEventListener('click', () => {
      tamanhoSelecionado = b.dataset.tam;
      elTamanhos.querySelectorAll('.btn-tamanho').forEach(x => x.classList.remove('ativa'));
      b.classList.add('ativa');
      avisoTamanho.textContent = '';
    });
  });

  /* ---------- quantidade ---------- */
  const inputQtd = document.getElementById('qtd-produto');
  const qtdMaxima = estoqueMaximo(produto);
  inputQtd.max = String(qtdMaxima);
  document.getElementById('qtd-menos')?.addEventListener('click', () => {
    inputQtd.value = Math.max(1, Number(inputQtd.value) - 1);
  });
  document.getElementById('qtd-mais')?.addEventListener('click', () => {
    inputQtd.value = Math.min(qtdMaxima, Number(inputQtd.value) + 1);
  });

  /* ---------- compra ---------- */
  const btnComprar = document.getElementById('btn-comprar');
  if (!disponivel(produto)) {
    btnComprar.textContent = 'Produto esgotado';
    btnComprar.classList.add('desabilitado');
  } else {
    btnComprar.addEventListener('click', () => {
      if (produto.tamanhos?.length && !tamanhoSelecionado) {
        avisoTamanho.textContent = 'Escolha um tamanho para continuar.';
        elTamanhos.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const qtd = Math.min(qtdMaxima, Math.max(1, Number(inputQtd.value) || 1));
      inputQtd.value = qtd;
      adicionarSacola(produto.id, tamanhoSelecionado, corSelecionada, qtd);
      mostrarToast(`${produto.nome} adicionado à sacola!`);
    });
  }

  document.getElementById('btn-whatsapp-produto')?.addEventListener('click', e => {
    e.currentTarget.href = linkWhatsAppProduto(produto, tamanhoSelecionado);
  });

  document.getElementById('btn-ver-sacola')?.addEventListener('click', () => {
    window.location.href = 'sacola.html';
  });

  /* ---------- abas ---------- */
  const botoesAba = document.querySelectorAll('.aba-btn');
  botoesAba.forEach(btn => {
    btn.addEventListener('click', () => {
      botoesAba.forEach(b => { b.classList.remove('ativa'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('ativa');
      btn.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.conteudo-aba').forEach(c => c.hidden = true);
      document.getElementById('aba-' + btn.dataset.aba).hidden = false;
    });
  });

  /* ---------- detalhes (objeto chave: valor → lista) ---------- */
  const elDetalhes = document.getElementById('lista-detalhes');
  if (elDetalhes) {
    const entradas = Object.entries(produto.detalhes || {});
    elDetalhes.innerHTML = entradas.length
      ? entradas.map(([chave, valor]) => `<li><strong>${escapeHTML(chave)}:</strong> ${escapeHTML(valor)}</li>`).join('')
      : '<li>Consulte características completas pelo WhatsApp.</li>';
  }

  /* ---------- descrição completa ---------- */
  const elDescricao = document.getElementById('texto-descricao');
  if (elDescricao) {
    elDescricao.textContent = produto.descricao || produto.resumo || '';
  }
  const abaZap = document.getElementById('aba-whatsapp');
  if (abaZap) abaZap.href = linkWhatsAppProduto(produto);

  /* ---------- relacionados (mesma categoria) ---------- */
  const relacionados = PRODUTOS
    .filter(p => p.categoria === produto.categoria && p.id !== produto.id)
    .slice(0, 4);
  const elRelacionados = document.getElementById('grade-relacionados');
  if (elRelacionados && relacionados.length) {
    renderizarGrade(elRelacionados, relacionados);
  } else {
    document.getElementById('secao-relacionados')?.remove();
  }

  /* ---------- entrega: frete ---------- */
  const formFrete = document.getElementById('form-frete-produto');
  formFrete?.addEventListener('submit', e => {
    e.preventDefault();
    const cep = document.getElementById('cep-produto').value.replace(/\D/g, '');
    const elRes = document.getElementById('resultado-frete-produto');
    if (cep.length !== 8) {
      elRes.textContent = 'Digite um CEP válido com 8 dígitos.';
      elRes.className = 'frete-calculado';
      return;
    }
    const r = calcularFreteLocal(cep, produto.preco);
    if (r) {
      elRes.innerHTML = `Entrega: <strong>${escapeHTML(r.prazo)}</strong> — ${formatarBRL(r.valor)}${r.gratis ? ' (frete grátis!)' : ''}`;
      elRes.className = 'frete-calculado ok';
    } else {
      elRes.textContent = 'Não conseguimos estimar o frete para esse CEP. Chame no WhatsApp!';
      elRes.className = 'frete-calculado';
    }
  });
})();
