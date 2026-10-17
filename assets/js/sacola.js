/* =========================================================
   HiT Outlet — sacola de compras
   ========================================================= */

(function () {
  const elItens = document.getElementById('lista-sacola');
  const elVazio = document.getElementById('sacola-vazia');
  const elConteudo = document.getElementById('sacola-conteudo');

  function chaveDe(item) { return `${item.id}|${item.tamanho || ''}|${item.cor || ''}`; }

  function render() {
    const itens = lerSacola().filter(i => obterProduto(i.id));
    if (!itens.length) {
      elVazio.hidden = false;
      elConteudo.hidden = true;
      return;
    }
    elVazio.hidden = true;
    elConteudo.hidden = false;

    elItens.innerHTML = itens.map(item => {
      const p = obterProduto(item.id);
      const chave = chaveDe(item);
      const variantes = [
        item.tamanho ? `Tam. ${item.tamanho}` : '',
        item.cor ? `Cor: ${item.cor}` : '',
      ].filter(Boolean).join(' · ');
      const max = estoqueMaximo(p);
      const noMax = item.qtd >= max;
      return `
      <div class="item-sacola" data-chave="${escapeHTML(chave)}">
        <a class="foto" href="${linkProduto(p)}">
          <img src="${p.imagens[0]}" alt="${escapeHTML(p.nome)}">
        </a>
        <div class="info">
          <h3><a href="${linkProduto(p)}">${escapeHTML(p.nome)}</a></h3>
          ${variantes ? `<div class="variantes">${escapeHTML(variantes)}</div>` : ''}
          <div class="variantes">Unitário: ${formatarBRL(p.preco)}</div>
          <button class="btn-remover" data-acao="remover">Remover</button>
        </div>
        <div class="coluna-direita">
          <div class="qtd-controle qtd-controle-mini">
            <button data-acao="menos" aria-label="Diminuir quantidade">−</button>
            <input type="number" value="${item.qtd}" min="1" max="${max}" data-acao="qtd" aria-label="Quantidade de ${escapeHTML(p.nome)}">
            <button data-acao="mais" aria-label="Aumentar quantidade" ${noMax ? 'disabled' : ''}>+</button>
          </div>
          <div class="subtotal">${formatarBRL(p.preco * item.qtd)}</div>
        </div>
      </div>`;
    }).join('');

    // avisos de estoque (só quando o item realmente está no limite)
    const avisos = itens
      .filter(i => i.qtd >= estoqueMaximo(obterProduto(i.id)))
      .map(i => `<div>⚠️ Você atingiu o limite disponível de <strong>${escapeHTML(obterProduto(i.id).nome)}</strong> (${i.qtd} un.).</div>`)
      .join('');
    const elAviso = document.getElementById('aviso-estoque');
    elAviso.innerHTML = avisos;
    elAviso.style.display = avisos ? 'block' : 'none';

    atualizarResumo();
    atualizarContadorSacola();
  }

  /* ---------- interações ---------- */
  elItens.addEventListener('click', e => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    const linha = btn.closest('.item-sacola');
    const chave = linha.dataset.chave;
    const acao = btn.dataset.acao;
    if (acao === 'remover') {
      removerSacolaItem(chave);
      mostrarToast('Item removido da sacola.', '🗑️');
      render();
    } else if (acao === 'menos') {
      alterarQtdSacola(chave, -1);
      render();
    } else if (acao === 'mais') {
      alterarQtdSacola(chave, +1);
      render();
    }
  });

  elItens.addEventListener('change', e => {
    const input = e.target.closest('input[data-acao="qtd"]');
    if (!input) return;
    const linha = input.closest('.item-sacola');
    definirQtdSacola(linha.dataset.chave, Number(input.value));
    render();
  });

  /* ---------- cupom ---------- */
  const elAvisoCupom = document.getElementById('aviso-cupom');
  function refletirCupom() {
    const { ok, cupom, mensagem } = validarCupom(lerCupom());
    if (ok) {
      elAvisoCupom.textContent = `✓ Cupom ${cupom.codigo} aplicado${cupom.descontoPercentual ? `: ${cupom.descontoPercentual}% de desconto` : cupom.freteGratis ? ': frete grátis' : ''}.`;
      elAvisoCupom.className = 'aviso-cupom ok';
      const campo = document.getElementById('input-cupom');
      if (campo) campo.value = cupom.codigo;
    } else if (lerCupom()) {
      elAvisoCupom.textContent = mensagem;
      elAvisoCupom.className = 'aviso-cupom erro';
    }
  }

  document.getElementById('btn-aplicar-cupom')?.addEventListener('click', () => {
    const codigo = document.getElementById('input-cupom').value;
    const r = validarCupom(codigo);
    if (r.ok) {
      gravarCupom(r.cupom.codigo);
      mostrarToast(`Cupom ${r.cupom.codigo} aplicado!`);
    } else {
      gravarCupom('');
      elAvisoCupom.textContent = r.mensagem;
      elAvisoCupom.className = 'aviso-cupom erro';
    }
    render();
    refletirCupom();
  });

  /* ---------- frete ---------- */
  let freteValor = 0;
  let freteInfo = null;
  const formFrete = document.getElementById('form-frete-sacola');
  formFrete?.addEventListener('submit', e => {
    e.preventDefault();
    const cep = document.getElementById('input-cep').value.replace(/\D/g, '');
    const elRes = document.getElementById('resultado-frete-sacola');
    if (cep.length !== 8) {
      elRes.textContent = 'Digite um CEP válido com 8 dígitos.';
      elRes.className = 'frete-calculado';
      freteValor = 0; freteInfo = null;
      atualizarResumo();
      return;
    }
    const r = calcularFreteLocal(cep, subtotalSacola());
    if (r) {
      freteInfo = r;
      freteValor = r.valor;
      elRes.innerHTML = `Entrega: <strong>${escapeHTML(r.prazo)}</strong> — ${formatarBRL(r.valor)}${r.gratis ? ' (grátis!)' : ''}`;
      elRes.className = 'frete-calculado ok';
    } else {
      freteValor = 0; freteInfo = null;
      elRes.textContent = 'CEP fora da área de entrega estimada. Chame no WhatsApp.';
      elRes.className = 'frete-calculado';
    }
    atualizarResumo();
  });

  /* ---------- resumo ---------- */
  function atualizarResumo() {
    const itens = lerSacola();
    const subtotal = subtotalSacola(itens);
    const desconto = descontoCupom(subtotal);
    const total = Math.max(0, subtotal - desconto) + freteValor;
    document.getElementById('resumo-subtotal').textContent = formatarBRL(subtotal);
    const elDesc = document.getElementById('linha-desconto');
    if (desconto > 0) {
      elDesc.style.display = 'flex';
      document.getElementById('resumo-desconto').textContent = '− ' + formatarBRL(desconto);
    } else elDesc.style.display = 'none';
    document.getElementById('resumo-frete').textContent = freteInfo ? formatarBRL(freteValor) : 'Calcular';
    document.getElementById('resumo-total').textContent = formatarBRL(total);
  }

  /* ---------- finalizar ---------- */
  document.getElementById('btn-finalizar')?.addEventListener('click', () => {
    if (!lerSacola().length) return;
    // leva o CEP calculado junto, se houver
    if (freteInfo) {
      const cep = document.getElementById('input-cep').value.replace(/\D/g, '');
      sessionStorage.setItem('hit_cep', cep);
    }
    window.location.href = 'checkout.html';
  });

  document.getElementById('btn-continuar-comprando')?.addEventListener('click', () => {
    window.location.href = 'catalogo.html';
  });

  render();
  refletirCupom();
})();
